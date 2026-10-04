// A terminal session over one CLI tool, shared by the browser terminal and
// the Node.js runner.
//
// The disk belongs to the session, not to the tool. Every tool command is a
// fresh instance of the tool — a new process — whose in-memory filesystem is
// seeded from the disk and written back to it when the tool exits, symlinks
// and hard links included. A few commands a reproduction needs (cd, ls, cat,
// rm, pwd, clear) are built into the session.

const SKIP = new Set(['/dev', '/proc', '/tmp']);

const posix = {
  resolve(cwd, p) {
    const parts = (p.startsWith('/') ? p : `${cwd}/${p}`).split('/');
    const out = [];
    for (const part of parts) {
      if (part === '' || part === '.') continue;
      if (part === '..') out.pop();
      else out.push(part);
    }
    return `/${out.join('/')}`;
  },
  dirname(p) {
    const i = p.lastIndexOf('/');
    return i <= 0 ? '/' : p.slice(0, i);
  },
  basename(p) {
    return p.slice(p.lastIndexOf('/') + 1);
  },
};

export function splitArgs(line) {
  const args = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  for (let m = re.exec(line); m; m = re.exec(line)) {
    args.push(m[1] ?? m[2] ?? m[3]);
  }
  return args;
}

export class Session {
  // tool: { name, factory, wasmModule? } — factory is the Emscripten
  // MODULARIZE function; wasmModule, when given, is reused for every run.
  // write(text) receives everything the session and the tool print.
  constructor({ tool, write, cwd = '/work', env = {} }) {
    this.tool = tool;
    this.write = write;
    this.cwd = cwd;
    this.env = env;
    // path -> { kind: 'dir' } | { kind: 'file', data, inode }
    //       | { kind: 'symlink', target }; files sharing an inode are hard links.
    this.disk = new Map([['/work', { kind: 'dir' }]]);
    this.nextInode = 1;
  }

  // files: [path relative to /work, Uint8Array | string]
  seed(files) {
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
      this.disk.set(p, { kind: 'file', data, inode: this.nextInode++ });
    }
  }

  async run(line) {
    const [command, ...args] = splitArgs(line);
    if (!command) return 0;
    if (command === this.tool.name) return this.#runTool(args);
    return this.#builtin(command, args);
  }

  #load(FS) {
    const linked = new Map();
    const paths = [...this.disk.keys()].sort();
    for (const p of paths) {
      if (this.disk.get(p).kind === 'dir') FS.mkdirTree(p);
    }
    for (const p of paths) {
      const entry = this.disk.get(p);
      if (entry.kind === 'file') {
        const first = linked.get(entry.inode);
        if (first) {
          FS.link(first, p);
        } else {
          FS.writeFile(p, entry.data);
          linked.set(entry.inode, p);
        }
      } else if (entry.kind === 'symlink') {
        FS.symlink(entry.target, p);
      }
    }
  }

  #save(FS) {
    const disk = new Map();
    const inodes = new Map();
    const walk = (dir) => {
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
          if (!inodes.has(node)) inodes.set(node, this.nextInode++);
          disk.set(p, {
            kind: 'file',
            data: FS.readFile(p),
            inode: inodes.get(node),
          });
        }
      }
    };
    walk('/');
    this.disk = disk;
  }

  #runTool(args) {
    const decoders = { out: new TextDecoder(), err: new TextDecoder() };
    const sink = (stream) => (byte) => {
      if (byte !== null) {
        this.write(
          decoders[stream].decode(new Uint8Array([byte]), { stream: true }),
        );
      }
    };
    return new Promise((resolve) => {
      const instance = {
        arguments: args,
        stdin: () => null,
        stdout: sink('out'),
        stderr: sink('err'),
        preRun: [
          () => {
            if (Object.keys(this.env).length)
              Object.assign(instance.ENV, this.env);
            this.#load(instance.FS);
            instance.FS.chdir(this.cwd);
          },
        ],
        onExit: (code) => {
          this.#save(instance.FS);
          resolve(code);
        },
      };
      if (this.tool.wasmModule) {
        instance.instantiateWasm = (imports, done) => {
          WebAssembly.instantiate(this.tool.wasmModule, imports).then((wasm) =>
            done(wasm, this.tool.wasmModule),
          );
          return {};
        };
      }
      if (this.tool.locateFile) instance.locateFile = this.tool.locateFile;
      if (this.tool.mainScriptUrlOrBlob)
        instance.mainScriptUrlOrBlob = this.tool.mainScriptUrlOrBlob;
      this.tool.factory(instance);
    });
  }

  #builtin(command, args) {
    const at = (p) => posix.resolve(this.cwd, p);
    const print = (text) => this.write(`${text}\n`);
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
        const names = [...this.disk.keys()]
          .filter((p) => posix.dirname(p) === dir)
          .map((p) => {
            const entry = this.disk.get(p);
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
