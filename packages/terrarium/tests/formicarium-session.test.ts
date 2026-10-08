import { describe, expect, test } from 'bun:test';
import type {
  FsEntry,
  RunOptions,
  RunResult,
  Session,
  SessionOptions,
} from '@aletheia-works/formicarium';
import {
  commandArgs,
  FormicariumSession,
  type FormicariumSessionOptions,
} from '../src/formicarium-session.ts';
import {
  Session as LegacySession,
  splitArgs,
  type Tool,
} from '../src/session.ts';

const encode = (text: string) => new TextEncoder().encode(text);
const error = (code: string) => Object.assign(new Error(code), { code });
const seed: FsEntry[] = [
  { path: '/work', type: 'dir', mode: 0o755 },
  { path: '/root', type: 'dir', mode: 0o700 },
  { path: '/work/app', type: 'dir', mode: 0o755 },
  { path: '/work/app/empty', type: 'dir', mode: 0o755 },
  { path: '/work/app/deep', type: 'dir', mode: 0o755 },
  {
    path: '/work/app/deep/child',
    type: 'file',
    mode: 0o600,
    inodeId: 'deep',
    data: encode('child'),
  },
  {
    path: '/work/app/file',
    type: 'file',
    mode: 0o640,
    inodeId: 'shared',
    data: encode('hello'),
  },
  {
    path: '/work/peer',
    type: 'file',
    mode: 0o640,
    inodeId: 'shared',
    data: encode('hello'),
  },
  {
    path: '/work/outside',
    type: 'file',
    mode: 0o600,
    inodeId: 'outside',
    data: encode('sibling'),
  },
  { path: '/work/app/link', type: 'symlink', target: 'file' },
];
const copy = (entry: FsEntry): FsEntry =>
  entry.type === 'file'
    ? { ...entry, data: new Uint8Array(entry.data) }
    : { ...entry };

function fixture(run?: (options: RunOptions) => Promise<RunResult>) {
  let entries: FsEntry[] = [];
  let initial: FsEntry[] = [];
  let cwd = '';
  let disposed = false;
  let options: SessionOptions | undefined;
  const calls: string[] = [];
  const writes: string[] = [];
  const check = (path: string) => {
    if (disposed) throw error('DISPOSED');
    if (
      !(
        path === '/work' ||
        path.startsWith('/work/') ||
        path === '/root' ||
        path.startsWith('/root/')
      )
    )
      throw error('INVALID_INPUT');
  };
  const runtime: Session = {
    async run(request) {
      check(cwd);
      calls.push('run');
      if (run) return run(request);
      request.onOutput?.({
        runId: 'r',
        sequence: 0,
        stream: 'stdout',
        bytes: encode('hello'),
      });
      return {
        runId: 'r',
        exitCode: 0,
        stdout: encode('hello'),
        stderr: new Uint8Array(),
        elapsedMs: 1,
      };
    },
    async readFile(path) {
      check(path);
      calls.push(`read:${path}`);
      const entry = entries.find((item) => item.path === path);
      if (!entry) throw error('NOT_FOUND');
      if (entry.type !== 'file') throw error('NOT_FILE');
      return new Uint8Array(entry.data);
    },
    async listEntries(path = cwd) {
      check(path);
      calls.push(`list:${path}`);
      const entry = entries.find((item) => item.path === path);
      if (!entry) throw error('NOT_FOUND');
      if (entry.type !== 'dir') return [];
      return entries
        .filter(
          (item) => item.path.slice(0, item.path.lastIndexOf('/')) === path,
        )
        .map(copy);
    },
    async remove(path) {
      check(path);
      calls.push(`remove:${path}`);
      if (path === '/work' || path === '/root') throw error('INVALID_INPUT');
      entries = entries.filter(
        (item) => item.path !== path && !item.path.startsWith(`${path}/`),
      );
    },
    async setCwd(path) {
      check(path);
      calls.push(`cwd:${path}`);
      const entry = entries.find((item) => item.path === path);
      if (!entry) throw error('NOT_FOUND');
      if (entry.type !== 'dir') throw error('NOT_FILE');
      cwd = path;
    },
    async reset() {
      entries = initial.map(copy);
      cwd = '/work';
    },
    async dispose() {
      disposed = true;
      calls.push('dispose');
    },
  };
  const create = async (input: SessionOptions) => {
    options = input;
    entries = (input.entries ?? []).map(copy);
    initial = entries.map(copy);
    cwd = input.cwd ?? '/work';
    return runtime;
  };
  const open = () =>
    FormicariumSession.create({
      tool: 'aube',
      guest: new Uint8Array([1, 2]),
      entries: seed,
      cwd: '/work/app',
      write: (text) => writes.push(text),
      create,
    });
  return { open, runtime, calls, writes, options: () => options };
}

describe('public C1 command adapter', () => {
  test('permitted literal quote adjacency preserves baseline splitArgs tokens', () => {
    const commands = [
      'cat "file"tail',
      "cat 'file'tail",
      'aube "one""two"',
      "aube 'one''two'",
      `aube "one"'two'`,
      'aube pre"quoted word"tail',
      'aube ""tail',
      'aube "a b" plain',
    ];
    for (const command of commands)
      expect(commandArgs(command)).toEqual(splitArgs(command));
  });
  test('seeds /work before selected nested cwd and preserves sibling and modes', async () => {
    const f = fixture();
    const session = await f.open();
    expect(f.options()?.cwd).toBe('/work');
    expect(f.options()?.home).toBe('/root');
    expect(f.calls[0]).toBe('cwd:/work/app');
    expect((await session.run('cat ../outside')).output).toBe('sibling');
    const peer = (await session.runtime.listEntries('/work')).find(
      (entry) => entry.path === '/work/peer',
    );
    expect(peer?.type === 'file' && peer.mode).toBe(0o640);
    await session.run('aube --version');
    expect((await session.run('cat ../outside')).output).toBe('sibling');
  });
  test('passes guest args env timeout and retains raw result without duplicate display', async () => {
    let received: RunOptions | undefined;
    const f = fixture(async (request) => {
      received = request;
      request.onOutput?.({
        runId: 'r',
        sequence: 0,
        stream: 'stderr',
        bytes: encode('warning'),
      });
      return {
        runId: 'r',
        exitCode: 7,
        stdout: encode('raw'),
        stderr: encode('warning'),
        elapsedMs: 1,
      };
    });
    const session = await f.open();
    const result = await session.run('aube "a b" \'$literal\'');
    expect(received?.args).toEqual(['a b', '$literal']);
    expect(received?.guest).toEqual(new Uint8Array([1, 2]));
    expect(received?.timeoutMs).toBe(600_000);
    expect(result.code).toBe(7);
    expect(result.output).toBe('warning');
    expect(session.lastResult?.stdout).toEqual(encode('raw'));
    expect(f.writes.join('')).toBe('warning');
  });
  test('decodes split UTF8 separately in callback sequence', async () => {
    const f = fixture(async (request) => {
      const chunks = [
        encode('日').slice(0, 1),
        encode('!'),
        encode('日').slice(1),
      ];
      chunks.forEach((bytes, sequence) => {
        request.onOutput?.({
          runId: 'r',
          sequence,
          stream: sequence === 1 ? 'stderr' : 'stdout',
          bytes,
        });
      });
      return {
        runId: 'r',
        exitCode: 0,
        stdout: encode('日'),
        stderr: encode('!'),
        elapsedMs: 1,
      };
    });
    expect((await (await f.open()).run('aube')).output).toBe('!日');
  });
  test('failed-run partial output appears once and queue accepts next command', async () => {
    const f = fixture(async (request) => {
      request.onOutput?.({
        runId: 'r',
        sequence: 0,
        stream: 'stdout',
        bytes: encode('partial'),
      });
      throw Object.assign(error('TIMEOUT'), { stdout: encode('partial') });
    });
    const session = await f.open();
    await expect(session.run('aube')).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
    expect(f.writes.join('')).toBe('partial');
    expect((await session.run('pwd')).output).toBe('/work/app\n');
  });
  test('empty unknown literal quoting and unsupported shell syntax', async () => {
    const f = fixture();
    const session = await f.open();
    expect(await session.run('  ')).toEqual({
      command: '  ',
      code: 0,
      output: '',
    });
    expect((await session.run('whoami')).code).toBe(127);
    expect(commandArgs('aube "" \'a b\' c')).toEqual(['aube', '', 'a b', 'c']);
    for (const command of [
      'aube | cat',
      'aube > x',
      'aube $HOME',
      'aube "$(pwd)"',
      'aube;pwd',
      'aube "open',
    ]) {
      await expect(session.run(command)).rejects.toMatchObject({
        code: 'INVALID_INPUT',
      });
    }
    expect(f.calls.filter((call) => call === 'run')).toEqual([]);
  });
  test('ls default option path empty direct children file symlink and missing', async () => {
    const session = await fixture().open();
    expect((await session.run('ls')).output).toBe(
      'deep/\nempty/\nfile\nlink -> file\n',
    );
    expect((await session.run('ls -al deep')).output).toBe('child\n');
    for (const path of ['empty', 'file', 'link', 'missing'])
      expect((await session.run(`ls ${path}`)).output).toBe('');
    await expect(session.run('ls /etc')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
  });
  test('rm removes dir recursively and link only, preserves hardlink peer, rejects roots', async () => {
    const session = await fixture().open();
    await session.run('rm -rf deep link missing');
    expect((await session.run('cat file')).output).toBe('hello');
    expect((await session.run('ls deep')).output).toBe('');
    await session.run('rm file');
    expect((await session.run('cat ../peer')).output).toBe('hello');
    await expect(session.run('rm /work')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
    await expect(session.run('rm /etc/passwd')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
    expect((await session.run('rm -rf')).code).toBe(0);
  });
  test('cd/cat missing failures retain baseline output and keep cwd synchronized', async () => {
    const session = await fixture().open();
    expect(await session.run('cd missing')).toEqual({
      command: 'cd missing',
      code: 1,
      output: 'cd: missing: no such directory\n',
    });
    expect((await session.run('cat link')).output).toBe(
      'cat: link: no such file\n',
    );
    await session.run('cd ..');
    expect((await session.run('pwd')).output).toBe('/work\n');
    await session.run('cd');
    expect(session.cwd).toBe('/work');
  });
  test('copy changes are isolated reset restores seed and selected cwd sessions independent', async () => {
    const session = await fixture().open();
    const other = await fixture().open();
    const entries = await session.runtime.listEntries('/work/app');
    const file = entries.find((entry) => entry.type === 'file');
    if (file?.type === 'file') file.data.fill(0);
    expect((await session.run('cat file')).output).toBe('hello');
    await session.run('rm file');
    await session.run('cd ..');
    expect((await other.run('cat file')).output).toBe('hello');
    await session.reset();
    expect((await session.run('cat file')).output).toBe('hello');
    expect(session.cwd).toBe('/work/app');
    await session.dispose();
    await expect(session.run('pwd')).rejects.toMatchObject({
      code: 'DISPOSED',
    });
  });
  test('legacy exported Session and Tool remain usable', async () => {
    const tool: Tool = { name: 'old', factory: () => {} };
    const session = new LegacySession({ tool, write: () => {} });
    expect(await session.run('pwd')).toBe(0);
    expect(session.cwd).toBe('/work');
  });
});

// Compiled by tests/tsconfig.json, never invoked: TS2578 catches accidentally
// accepted invalid inputs when the public adapter or C1 declarations change.
function publicApiTypeContract(adapter: FormicariumSession, runtime: Session) {
  const options: FormicariumSessionOptions = {
    tool: 'aube',
    guest: new Uint8Array(),
    entries: [],
    write: () => {},
  };
  const adapterResult: Promise<{
    command: string;
    code: number;
    output: string;
  }> = adapter.run('pwd');
  const publicResult: Promise<RunResult> = runtime.run({
    guest: new Uint8Array(),
    args: ['--version'],
    env: { AUBE_NO_UPDATE_CHECK: '1' },
  });
  const oldTool: Tool = { name: 'legacy', factory: () => {} };
  const oldSession: LegacySession = new LegacySession({
    tool: oldTool,
    write: () => {},
  });
  void adapterResult;
  void publicResult;
  void oldSession;
  // @ts-expect-error Command API accepts a literal string, not an object.
  adapter.run({ command: 'pwd' });
  // @ts-expect-error Guest bytes are required; a filename is not an ELF payload.
  FormicariumSession.create({ ...options, guest: 'guest.elf' });
  FormicariumSession.create({
    ...options,
    // @ts-expect-error C1 filesystem entries use the public tagged shape.
    entries: [{ path: '/work/file', kind: 'file' }],
  });
  // @ts-expect-error C1 environment values must be strings.
  runtime.run({ guest: new Uint8Array(), env: { KEY: 1 } });
  // @ts-expect-error C1 setCwd requires a path string.
  runtime.setCwd(123);
  // @ts-expect-error Legacy chdir is not part of the public common Session.
  runtime.chdir('/work');
}
void publicApiTypeContract;
