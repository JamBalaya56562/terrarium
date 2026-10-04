// A stand-in for an Emscripten build: an in-memory FS with the calls Session
// makes, and a factory that runs a JavaScript "program" against it.

import type { EmscriptenFS, Tool, ToolInstance } from '../src/session.ts';

type Node =
  | { type: 'dir'; children: Map<string, Node> }
  | { type: 'file'; data: Uint8Array }
  | { type: 'link'; target: string };

const DIR = 0o040000;
const FILE = 0o100000;
const LINK = 0o120000;

export class FakeFS implements EmscriptenFS {
  root: Node = { type: 'dir', children: new Map() };
  cwd = '/';
  /** Every call to link(), as [existing, path]. */
  links: Array<[string, string]> = [];

  #abs(path: string): string {
    return path.startsWith('/') ? path : `${this.cwd}/${path}`;
  }

  #split(path: string): string[] {
    return this.#abs(path).split('/').filter(Boolean);
  }

  #get(path: string): Node | undefined {
    let node: Node | undefined = this.root;
    for (const part of this.#split(path)) {
      if (node?.type !== 'dir') return undefined;
      node = node.children.get(part);
    }
    return node;
  }

  #parent(path: string): [Map<string, Node>, string] {
    const parts = this.#split(path);
    const name = parts.pop();
    const dir = this.#get(`/${parts.join('/')}`);
    if (!name || dir?.type !== 'dir') throw new Error(`ENOENT: ${path}`);
    return [dir.children, name];
  }

  mkdirTree(path: string): void {
    let node = this.root;
    for (const part of this.#split(path)) {
      if (node.type !== 'dir') throw new Error(`ENOTDIR: ${path}`);
      let next = node.children.get(part);
      if (!next) {
        next = { type: 'dir', children: new Map() };
        node.children.set(part, next);
      }
      node = next;
    }
  }

  writeFile(path: string, data: Uint8Array | string): void {
    const [children, name] = this.#parent(path);
    const bytes =
      typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const existing = children.get(name);
    if (existing?.type === 'file') existing.data = bytes;
    else children.set(name, { type: 'file', data: bytes });
  }

  link(existing: string, path: string): void {
    const node = this.#get(existing);
    if (node?.type !== 'file') throw new Error(`ENOENT: ${existing}`);
    const [children, name] = this.#parent(path);
    children.set(name, node);
    this.links.push([existing, path]);
  }

  symlink(target: string, path: string): void {
    const [children, name] = this.#parent(path);
    children.set(name, { type: 'link', target });
  }

  unlink(path: string): void {
    const [children, name] = this.#parent(path);
    children.delete(name);
  }

  chdir(path: string): void {
    if (this.#get(path)?.type !== 'dir') throw new Error(`ENOTDIR: ${path}`);
    this.cwd = this.#abs(path);
  }

  readdir(path: string): string[] {
    const node = this.#get(path);
    if (node?.type !== 'dir') throw new Error(`ENOTDIR: ${path}`);
    return ['.', '..', ...node.children.keys()];
  }

  lstat(path: string): { mode: number } {
    const node = this.#get(path);
    if (!node) throw new Error(`ENOENT: ${path}`);
    return {
      mode: node.type === 'dir' ? DIR : node.type === 'link' ? LINK : FILE,
    };
  }

  isLink(mode: number): boolean {
    return mode === LINK;
  }

  isDir(mode: number): boolean {
    return mode === DIR;
  }

  readlink(path: string): string {
    const node = this.#get(path);
    if (node?.type !== 'link') throw new Error(`EINVAL: ${path}`);
    return node.target;
  }

  lookupPath(path: string): { node: object } {
    const node = this.#get(path);
    if (!node) throw new Error(`ENOENT: ${path}`);
    return { node };
  }

  readFile(path: string): Uint8Array {
    const node = this.#get(path);
    if (node?.type !== 'file') throw new Error(`ENOENT: ${path}`);
    return node.data;
  }

  /** Text of a file, for assertions. */
  text(path: string): string {
    return new TextDecoder().decode(this.readFile(path));
  }
}

export interface Run {
  args: string[];
  fs: FakeFS;
  env: Record<string, string>;
  stdout: (text: string) => void;
}

/**
 * A tool named `name` whose every run is `program`, against a fresh FakeFS as
 * an Emscripten instance would have. `runs` records each run's FS.
 */
export function fakeTool(
  name: string,
  program: (run: Run) => number | undefined,
): Tool & { runs: FakeFS[] } {
  const runs: FakeFS[] = [];
  return {
    name,
    runs,
    factory(instance: ToolInstance) {
      const fs = new FakeFS();
      fs.mkdirTree('/tmp');
      fs.writeFile('/tmp/scratch', 'not saved');
      runs.push(fs);
      instance.FS = fs;
      instance.ENV = {};
      queueMicrotask(() => {
        for (const hook of instance.preRun) hook();
        const env = instance.ENV ?? {};
        const stdout = (text: string) => {
          for (const byte of new TextEncoder().encode(text)) {
            instance.stdout(byte);
          }
          instance.stdout(null);
        };
        const code = program({ args: instance.arguments, fs, env, stdout });
        instance.onExit(code ?? 0);
      });
    },
  };
}
