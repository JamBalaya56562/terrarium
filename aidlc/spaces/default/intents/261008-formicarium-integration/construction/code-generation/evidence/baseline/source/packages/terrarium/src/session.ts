// A terminal session over one CLI tool, shared by the browser terminal and
// the Node.js runner.
//
// The disk belongs to the session, not to the tool. Every tool command is a
// fresh instance of the tool — a new process — whose in-memory filesystem is
// seeded from the disk and written back to it when the tool exits, symlinks
// and hard links included. A few commands a reproduction needs (cd, ls, cat,
// rm, pwd) are built into the session.

/** The part of Emscripten's `FS` the session uses. */
export interface EmscriptenFS {
  mkdirTree(path: string): void;
  writeFile(path: string, data: Uint8Array): void;
  link(existing: string, path: string): void;
  symlink(target: string, path: string): void;
  chdir(path: string): void;
  readdir(path: string): string[];
  lstat(path: string): { mode: number };
  isLink(mode: number): boolean;
  isDir(mode: number): boolean;
  readlink(path: string): string;
  lookupPath(path: string, options: { follow: boolean }): { node: object };
  readFile(path: string): Uint8Array;
}

/** The module object handed to an Emscripten `MODULARIZE` factory. */
export interface ToolInstance {
  arguments: string[];
  stdin: () => number | null;
  stdout: (byte: number | null) => void;
  stderr: (byte: number | null) => void;
  preRun: Array<() => void>;
  onExit: (code: number) => void;
  instantiateWasm?: (
    imports: WebAssembly.Imports,
    done: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void,
  ) => object;
  locateFile?: (path: string, prefix: string) => string;
  mainScriptUrlOrBlob?: string | Blob;
  /** Set by the factory before `preRun` runs. */
  FS?: EmscriptenFS;
  /** Set by the factory before `preRun` runs. */
  ENV?: Record<string, string>;
}

/** A CLI compiled with Emscripten (`-sMODULARIZE -sEXPORTED_RUNTIME_METHODS=FS,ENV`). */
export interface Tool {
  /** The command that runs the tool, e.g. `aube`. */
  name: string;
  /** The Emscripten `MODULARIZE` factory. */
  factory: (instance: ToolInstance) => unknown;
  /** A compiled module reused by every run, instead of fetching it each time. */
  wasmModule?: WebAssembly.Module;
  locateFile?: (path: string, prefix: string) => string;
  mainScriptUrlOrBlob?: string | Blob;
}

/** One path on the session's disk. Files that share an inode are hard links. */
export type DiskEntry =
  | { kind: 'dir' }
  | { kind: 'file'; data: Uint8Array; inode: number }
  | { kind: 'symlink'; target: string };

export interface SessionOptions {
  tool: Tool;
  /** Receives everything the session and the tool print. */
  write: (text: string) => void;
  /** The starting directory (default: `/work`). */
  cwd?: string;
  /** Environment variables set in every run of the tool. */
  env?: Record<string, string>;
}

const SKIP = new Set(['/dev', '/proc', '/tmp']);

const posix = {
  resolve(cwd: string, p: string): string {
    const parts = (p.startsWith('/') ? p : `${cwd}/${p}`).split('/');
    const out: string[] = [];
    for (const part of parts) {
      if (part === '' || part === '.') continue;
      if (part === '..') out.pop();
      else out.push(part);
    }
    return `/${out.join('/')}`;
  },
  dirname(p: string): string {
    const i = p.lastIndexOf('/');
    return i <= 0 ? '/' : p.slice(0, i);
  },
  basename(p: string): string {
    return p.slice(p.lastIndexOf('/') + 1);
  },
};

/** Split a command line into arguments, honouring single and double quotes. */
export function splitArgs(line: string): string[] {
  const args: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  for (let m = re.exec(line); m; m = re.exec(line)) {
    args.push(m[1] ?? m[2] ?? m[3] ?? '');
  }
  return args;
}

export class Session {
  tool: Tool;
  write: (text: string) => void;
  cwd: string;
  env: Record<string, string>;
  disk: Map<string, DiskEntry> = new Map([['/work', { kind: 'dir' }]]);
  #nextInode = 1;

  constructor({ tool, write, cwd = '/work', env = {} }: SessionOptions) {
    this.tool = tool;
    this.write = write;
    this.cwd = cwd;
    this.env = env;
  }

  /** Add files to the disk; paths are relative to `/work`. */
  seed(files: Iterable<[string, Uint8Array | string]>): void {
    const encoder = new TextEncoder();
    for (const [rel, content] of files) {
      const p = posix.resolve('/work', rel);
      for (
        let d = posix.dirname(p);
        d !== '/' && !this.disk.has(d);
        d = posix.dirname(d)
      ) {
        this.disk.set(d, { kind: 'dir' });
      }
      const data =
        typeof content === 'string' ? encoder.encode(content) : content;
      this.disk.set(p, { kind: 'file', data, inode: this.#nextInode++ });
    }
  }

  /** Run one command line; resolves with its exit code. */
  async run(line: string): Promise<number> {
    const [command, ...args] = splitArgs(line);
    if (!command) return 0;
    if (command === this.tool.name) return this.#runTool(args);
    return this.#builtin(command, args);
  }

  #load(FS: EmscriptenFS): void {
    const linked = new Map<number, string>();
    const paths = [...this.disk.keys()].sort();
    for (const p of paths) {
      if (this.disk.get(p)?.kind === 'dir') FS.mkdirTree(p);
    }
    for (const p of paths) {
      const entry = this.disk.get(p);
      if (entry?.kind === 'file') {
        const first = linked.get(entry.inode);
        if (first) {
          FS.link(first, p);
        } else {
          FS.writeFile(p, entry.data);
          linked.set(entry.inode, p);
        }
      } else if (entry?.kind === 'symlink') {
        FS.symlink(entry.target, p);
      }
    }
  }

  #save(FS: EmscriptenFS): void {
    const disk = new Map<string, DiskEntry>();
    const inodes = new Map<object, number>();
    const walk = (dir: string) => {
      for (const name of FS.readdir(dir)) {
        if (name === '.' || name === '..') continue;
        const p = dir === '/' ? `/${name}` : `${dir}/${name}`;
        if (SKIP.has(p)) continue;
        const stat = FS.lstat(p);
        if (FS.isLink(stat.mode)) {
          disk.set(p, { kind: 'symlink', target: FS.readlink(p) });
        } else if (FS.isDir(stat.mode)) {
          disk.set(p, { kind: 'dir' });
          walk(p);
        } else {
          const node = FS.lookupPath(p, { follow: false }).node;
          let inode = inodes.get(node);
          if (inode === undefined) {
            inode = this.#nextInode++;
            inodes.set(node, inode);
          }
          disk.set(p, { kind: 'file', data: FS.readFile(p), inode });
        }
      }
    };
    walk('/');
    this.disk = disk;
  }

  #runTool(args: string[]): Promise<number> {
    const decoders = { out: new TextDecoder(), err: new TextDecoder() };
    const sink = (stream: 'out' | 'err') => (byte: number | null) => {
      if (byte !== null) {
        this.write(
          decoders[stream].decode(new Uint8Array([byte]), { stream: true }),
        );
      }
    };
    return new Promise((resolve) => {
      const instance: ToolInstance = {
        arguments: args,
        stdin: () => null,
        stdout: sink('out'),
        stderr: sink('err'),
        preRun: [
          () => {
            const FS = instance.FS;
            if (!FS) throw new Error(`${this.tool.name} does not export FS`);
            if (Object.keys(this.env).length && instance.ENV) {
              Object.assign(instance.ENV, this.env);
            }
            this.#load(FS);
            FS.chdir(this.cwd);
          },
        ],
        onExit: (code) => {
          if (instance.FS) this.#save(instance.FS);
          resolve(code);
        },
      };
      const { wasmModule } = this.tool;
      if (wasmModule) {
        instance.instantiateWasm = (imports, done) => {
          WebAssembly.instantiate(wasmModule, imports).then((wasm) =>
            done(wasm, wasmModule),
          );
          return {};
        };
      }
      if (this.tool.locateFile) instance.locateFile = this.tool.locateFile;
      if (this.tool.mainScriptUrlOrBlob) {
        instance.mainScriptUrlOrBlob = this.tool.mainScriptUrlOrBlob;
      }
      this.tool.factory(instance);
    });
  }

  #builtin(command: string, args: string[]): number {
    const at = (p: string) => posix.resolve(this.cwd, p);
    const print = (text: string) => this.write(`${text}\n`);
    switch (command) {
      case 'cd': {
        const target = at(args[0] ?? '/work');
        if (this.disk.get(target)?.kind !== 'dir') {
          print(`cd: ${args[0]}: no such directory`);
          return 1;
        }
        this.cwd = target;
        return 0;
      }
      case 'pwd':
        print(this.cwd);
        return 0;
      case 'rm':
        for (const target of args.filter((a) => !a.startsWith('-')).map(at)) {
          for (const p of [...this.disk.keys()]) {
            if (p === target || p.startsWith(`${target}/`)) this.disk.delete(p);
          }
        }
        return 0;
      case 'ls': {
        const dir = at(args.find((a) => !a.startsWith('-')) ?? '.');
        const names = [...this.disk]
          .filter(([p]) => posix.dirname(p) === dir)
          .map(([p, entry]) => {
            const name = posix.basename(p);
            if (entry.kind === 'dir') return `${name}/`;
            if (entry.kind === 'symlink') return `${name} -> ${entry.target}`;
            return name;
          })
          .sort();
        if (names.length) print(names.join('\n'));
        return 0;
      }
      case 'cat': {
        const entry = this.disk.get(at(args[0] ?? ''));
        if (entry?.kind !== 'file') {
          print(`cat: ${args[0]}: no such file`);
          return 1;
        }
        this.write(new TextDecoder().decode(entry.data));
        return 0;
      }
      default:
        print(
          `${command}: command not found — this terminal runs ${this.tool.name} and cd, ls, cat, rm, pwd`,
        );
        return 127;
    }
  }
}
