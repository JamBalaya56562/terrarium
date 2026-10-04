import { describe, expect, test } from 'bun:test';
import { Session, splitArgs } from '../src/session.ts';
import { fakeTool } from './fake-tool.ts';

function session(tool = fakeTool('tool', () => 0), cwd?: string) {
  let output = '';
  const s = new Session({
    tool,
    write: (text) => {
      output += text;
    },
    cwd,
  });
  return {
    s,
    tool,
    output: () => output,
    reset: () => {
      output = '';
    },
  };
}

describe('splitArgs', () => {
  test('splits on whitespace and keeps quoted arguments whole', () => {
    expect(splitArgs(`aube install  --filter "a b" 'c d' e`)).toEqual([
      'aube',
      'install',
      '--filter',
      'a b',
      'c d',
      'e',
    ]);
  });

  test('returns nothing for a blank line', () => {
    expect(splitArgs('   ')).toEqual([]);
  });

  test('keeps an empty quoted argument', () => {
    expect(splitArgs(`echo ""`)).toEqual(['echo', '']);
  });
});

describe('built-in commands', () => {
  const seeded = () => {
    const t = session(undefined, '/work/app');
    t.s.seed([
      ['app/package.json', '{"name":"app"}'],
      ['app/node_modules/a/index.js', 'a'],
      ['outside/linked/package.json', new TextEncoder().encode('linked')],
    ]);
    return t;
  };

  test('seed creates the parent directories', () => {
    const { s } = seeded();
    expect(s.disk.get('/work/app')).toEqual({ kind: 'dir' });
    expect(s.disk.get('/work/app/node_modules/a')).toEqual({ kind: 'dir' });
    expect(s.disk.get('/work/outside/linked/package.json')?.kind).toBe('file');
  });

  test('ls lists a directory, sorted, with a slash after directories', async () => {
    const t = seeded();
    expect(await t.s.run('ls')).toBe(0);
    expect(t.output()).toBe('node_modules/\npackage.json\n');
  });

  test('cat prints a file, and fails on a missing one', async () => {
    const t = seeded();
    expect(await t.s.run('cat package.json')).toBe(0);
    expect(t.output()).toBe('{"name":"app"}');
    t.reset();
    expect(await t.s.run('cat nope.json')).toBe(1);
    expect(t.output()).toBe('cat: nope.json: no such file\n');
  });

  test('cd and pwd move around, and cd refuses a missing directory', async () => {
    const t = seeded();
    expect(await t.s.run('cd ../outside/linked')).toBe(0);
    await t.s.run('pwd');
    expect(t.output()).toBe('/work/outside/linked\n');
    t.reset();
    expect(await t.s.run('cd /nowhere')).toBe(1);
    expect(t.output()).toBe('cd: /nowhere: no such directory\n');
    expect(t.s.cwd).toBe('/work/outside/linked');
  });

  test('rm -rf removes a directory and everything under it', async () => {
    const t = seeded();
    expect(await t.s.run('rm -rf node_modules')).toBe(0);
    expect(
      [...t.s.disk.keys()].filter((p) => p.includes('node_modules')),
    ).toEqual([]);
    expect(t.s.disk.has('/work/app/package.json')).toBe(true);
  });

  test('an unknown command exits 127 and names the commands there are', async () => {
    const t = seeded();
    expect(await t.s.run('npm install')).toBe(127);
    expect(t.output()).toContain('npm: command not found');
    expect(t.output()).toContain('runs tool and cd, ls, cat, rm, pwd');
  });

  test('a blank line does nothing', async () => {
    const t = seeded();
    expect(await t.s.run('  ')).toBe(0);
    expect(t.output()).toBe('');
  });
});

describe('running the tool', () => {
  test('passes the arguments, the cwd and the environment, and returns the exit code', async () => {
    let seen: unknown;
    const tool = fakeTool('tool', ({ args, fs, env }) => {
      seen = { args, cwd: fs.cwd, env: { ...env } };
      return 3;
    });
    const s = new Session({
      tool,
      write: () => {},
      cwd: '/work',
      env: { CI: '1' },
    });
    expect(await s.run('tool install --frozen-lockfile')).toBe(3);
    expect(seen).toEqual({
      args: ['install', '--frozen-lockfile'],
      cwd: '/work',
      env: { CI: '1' },
    });
  });

  test('streams output byte by byte without breaking multi-byte characters', async () => {
    const t = session(
      fakeTool('tool', ({ stdout }) => {
        stdout('✓ installed 1 package\n');
      }),
    );
    await t.s.run('tool');
    expect(t.output()).toBe('✓ installed 1 package\n');
  });

  test('loads the disk into the tool and saves what the tool leaves', async () => {
    const tool = fakeTool('tool', ({ fs, args }) => {
      if (args[0] === 'write') {
        fs.mkdirTree('/work/app/node_modules');
        fs.writeFile('/work/app/node_modules/store', 'contents');
        fs.link('/work/app/node_modules/store', '/work/app/node_modules/hard');
        fs.symlink('../../outside', '/work/app/node_modules/soft');
        fs.unlink('/work/app/old.txt');
      }
    });
    const { s } = session(tool, '/work/app');
    s.seed([
      ['app/package.json', '{}'],
      ['app/old.txt', 'old'],
    ]);

    await s.run('tool write');
    const store = s.disk.get('/work/app/node_modules/store');
    const hard = s.disk.get('/work/app/node_modules/hard');
    expect(store?.kind).toBe('file');
    expect(hard?.kind === 'file' && store?.kind === 'file' && hard.inode).toBe(
      store?.kind === 'file' ? store.inode : -1,
    );
    expect(s.disk.get('/work/app/node_modules/soft')).toEqual({
      kind: 'symlink',
      target: '../../outside',
    });
    expect(s.disk.has('/work/app/old.txt')).toBe(false);
    expect(s.disk.has('/tmp/scratch')).toBe(false);

    await s.run('tool read');
    const second = tool.runs[1];
    expect(second?.text('/work/app/node_modules/store')).toBe('contents');
    expect(second?.links).toEqual([
      ['/work/app/node_modules/hard', '/work/app/node_modules/store'],
    ]);
    expect(second?.readlink('/work/app/node_modules/soft')).toBe(
      '../../outside',
    );
    expect(second?.text('/work/app/package.json')).toBe('{}');
  });

  test('each run starts from the disk, not from the previous run', async () => {
    const tool = fakeTool('tool', ({ fs, args }) => {
      if (args[0] === 'touch') fs.writeFile('/work/made', 'x');
    });
    const t = session(tool);
    await t.s.run('tool touch');
    await t.s.run('rm made');
    await t.s.run('tool');
    expect(() => tool.runs[1]?.readFile('/work/made')).toThrow('ENOENT');
  });
});
