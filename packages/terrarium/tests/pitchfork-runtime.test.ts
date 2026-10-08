import {
  afterEach,
  beforeEach,
  describe,
  expect,
  setDefaultTimeout,
  test,
} from 'bun:test';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';

const workspace = resolve(import.meta.dir, '../../..');
const bash =
  process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const sha = '0123456789abcdef0123456789abcdef01234567';
const temporaryParent = resolve(tmpdir());

// Each case starts real external shells; allow Windows process startup time.
setDefaultTimeout(30_000);

function toolPath(tool: string): string {
  if (process.platform !== 'win32') return process.env.PATH ?? '';
  const installs = join(process.env.LOCALAPPDATA ?? '', 'mise/installs', tool);
  const paths = [...new Bun.Glob(`**/${tool}.exe`).scanSync(installs)].sort();
  const executable = paths.at(-1);
  if (!executable) throw new Error(`missing ${tool} under ${installs}`);
  return dirname(join(installs, executable));
}

let root: string;
let environment: Record<string, string | undefined>;

function write(path: string, contents: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), contents);
}

function run(script: string, args: string[] = []) {
  const invocation = [
    join(root, 'scripts', script).replaceAll('\\', '/'),
    ...args.map((arg) => arg.replaceAll('\\', '/')),
  ];
  const result = Bun.spawnSync({
    cmd:
      process.platform === 'win32'
        ? [
            bash,
            '-c',
            'export PATH="/usr/bin:/bin:$PATH"; export PATH="$(cygpath -u -p "$TERRARIUM_TEST_PATH"):/usr/bin:/bin"; exec bash "$@"',
            'terrarium-test',
            ...invocation,
          ]
        : [bash, ...invocation],
    cwd: root,
    env: environment,
    timeout: 30_000,
  });
  return {
    code: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

function metadata(text: string): Record<string, string> {
  return Object.fromEntries(
    text
      .trim()
      .split('\n')
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

beforeEach(() => {
  root = mkdtempSync(join(temporaryParent, 'terrarium-pitchfork-'));
  mkdirSync(join(root, 'scripts'));
  for (const script of [
    'resolve-ref.sh',
    'stage-web.sh',
    'prepare-pitchfork-e2e.sh',
    'vendor-patched.sh',
  ]) {
    cpSync(join(workspace, 'scripts', script), join(root, 'scripts', script));
  }
  write(
    'web/tools.json',
    readFileSync(join(workspace, 'web/tools.json'), 'utf8'),
  );
  write(
    'fixtures/pitchfork-basic/app/pitchfork.toml',
    '[daemons.api]\nrun="api"\n',
  );
  write(
    'bin/gh',
    `#!/usr/bin/env bash
printf '%s\\n' "$@" >> "$GH_CALLS"
if [[ "$GH_FAIL" == 1 ]]; then echo 'API failure' >&2; exit 1; fi
if [[ "$2" == */releases/latest ]]; then echo "$GH_LATEST_TAG"; else echo '${sha}'; fi
`,
  );
  environment = {
    ...process.env,
    PATH: [
      join(root, 'bin'),
      toolPath('jq'),
      toolPath('node'),
      process.platform === 'win32' ? 'C:/Program Files/Git/usr/bin' : '',
      process.env.PATH,
    ]
      .filter(Boolean)
      .join(delimiter),
    GH_CALLS: join(root, 'gh-calls').replaceAll('\\', '/'),
    GH_FAIL: '0',
    GH_LATEST_TAG: 'v2.30.1',
    TERRARIUM_PITCHFORK_REF: '',
    TERRARIUM_PITCHFORK_COMMIT: '',
    TERRARIUM_PITCHFORK_BUILD: '',
    CARGO_HOME: join(root, 'cargo').replaceAll('\\', '/'),
  };
  // Windows may retain an inherited Path instead of the supplied PATH key.
  // Pass the intended search path separately and convert it inside Git Bash.
  environment.TERRARIUM_TEST_PATH = environment.PATH;
  chmodSync(join(root, 'bin/gh'), 0o755);
});

afterEach(() => {
  // Delete only the directory this test created directly under the temp root.
  if (dirname(resolve(root)) !== temporaryParent)
    throw new Error('unsafe test root');
  rmSync(root, { recursive: true, force: true });
});

describe('pitchfork ref resolution', () => {
  test('resolves the registered default version', () => {
    const result = run('resolve-ref.sh', ['pitchfork']);
    expect(result.code).toBe(0);
    expect(metadata(result.stdout)).toMatchObject({
      tool: 'pitchfork',
      repo: 'jdx/pitchfork',
      name: 'v2.29.0',
      ref: 'v2.29.0',
      commit: sha,
      pr: '',
    });
    expect(readFileSync(join(root, 'gh-calls'), 'utf8')).toContain(
      'repos/jdx/pitchfork/commits/v2.29.0',
    );
  });

  test('resolves the latest stable release to a full commit without using the old default', () => {
    const result = run('resolve-ref.sh', ['pitchfork', 'latest']);
    expect(result.code).toBe(0);
    expect(metadata(result.stdout)).toMatchObject({
      name: 'v2.30.1',
      ref: 'v2.30.1',
      commit: sha,
    });
    const calls = readFileSync(join(root, 'gh-calls'), 'utf8');
    expect(calls).toContain('repos/jdx/pitchfork/releases/latest');
    expect(calls).toContain('repos/jdx/pitchfork/commits/v2.30.1');
    expect(calls).not.toContain('commits/v2.29.0');
  });

  test('refuses an invalid latest release rather than falling back to the old version', () => {
    environment.GH_LATEST_TAG = 'main';
    const result = run('resolve-ref.sh', ['pitchfork', 'latest']);
    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('invalid latest stable release');
  });

  test('resolves an explicit branch and names its directory safely', () => {
    const result = run('resolve-ref.sh', ['pitchfork', 'feature/one']);
    expect(result.code).toBe(0);
    expect(metadata(result.stdout)).toMatchObject({
      name: 'feature-one',
      ref: 'feature/one',
    });
  });

  test('uses the full resolved commit and a short SHA directory', () => {
    const result = run('resolve-ref.sh', ['pitchfork', sha.slice(0, 8)]);
    expect(result.code).toBe(0);
    expect(metadata(result.stdout)).toMatchObject({
      name: sha.slice(0, 12),
      commit: sha,
    });
  });

  for (const ref of [
    'pr-42',
    '#42',
    'https://github.com/jdx/pitchfork/pull/42',
  ]) {
    test(`resolves ${ref} through its head endpoint`, () => {
      const result = run('resolve-ref.sh', ['pitchfork', ref]);
      expect(result.code).toBe(0);
      expect(metadata(result.stdout)).toMatchObject({
        name: 'pr-42',
        ref: 'refs/pull/42/head',
        pr: 'https://github.com/jdx/pitchfork/pull/42',
      });
      expect(readFileSync(join(root, 'gh-calls'), 'utf8')).toContain(
        'repos/jdx/pitchfork/pulls/42',
      );
    });
  }

  test('rejects unknown tools without invoking the API', () => {
    const result = run('resolve-ref.sh', ['unknown']);
    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('unknown tool: unknown');
    expect(existsSync(join(root, 'gh-calls'))).toBe(false);
  });

  test('rejects unsafe names and reports API failures', () => {
    const unsafe = run('resolve-ref.sh', ['pitchfork', '..']);
    expect(unsafe.code).not.toBe(0);
    expect(unsafe.stderr).toContain('cannot name a build');
    environment.GH_FAIL = '1';
    const failed = run('resolve-ref.sh', ['pitchfork']);
    expect(failed.code).not.toBe(0);
    expect(failed.stderr).toContain('API failure');
  });
});

describe('pitchfork staging', () => {
  function artifacts() {
    write('out/pitchfork.js', 'javascript');
    write('out/pitchfork.wasm', 'wasm');
    return join(root, 'out');
  }

  test('stages both artifacts and fixture metadata while preserving aube', () => {
    write(
      'web/dist/builds.json',
      JSON.stringify({
        schema_version: 1,
        builds: {
          aube: { 'v2.6.1': { source: { commit: 'old' } } },
        },
      }),
    );
    environment.TERRARIUM_REF = 'v2.29.0';
    environment.TERRARIUM_COMMIT = sha;
    const result = run('stage-web.sh', ['pitchfork', 'v2.29.0', artifacts()]);
    expect(result.code, result.stderr).toBe(0);
    expect(
      readFileSync(
        join(root, 'web/dist/pitchfork/v2.29.0/pitchfork.js'),
        'utf8',
      ),
    ).toBe('javascript');
    expect(
      readFileSync(
        join(root, 'web/dist/pitchfork/v2.29.0/pitchfork.wasm'),
        'utf8',
      ),
    ).toBe('wasm');
    const manifest = JSON.parse(
      readFileSync(join(root, 'web/dist/builds.json'), 'utf8'),
    );
    expect(manifest.builds.aube['v2.6.1'].source.commit).toBe('old');
    expect(manifest.builds.pitchfork['v2.29.0'].source).toEqual({
      type: 'git',
      url: 'https://github.com/jdx/pitchfork',
      ref: 'v2.29.0',
      commit: sha,
    });
    expect(manifest.builds.pitchfork['v2.29.0'].built_at).toMatch(/^\d{4}-/);
    const fixture = JSON.parse(
      readFileSync(
        join(root, 'web/dist/fixtures/pitchfork-basic.json'),
        'utf8',
      ),
    );
    expect(fixture['app/pitchfork.toml']).toContain('[daemons.api]');
  });

  test('stages fixtures alone without a build argument', () => {
    expect(run('stage-web.sh').code).toBe(0);
    expect(
      existsSync(join(root, 'web/dist/fixtures/pitchfork-basic.json')),
    ).toBe(true);
  });

  test('rejects an unknown tool before creating distribution output', () => {
    const result = run('stage-web.sh', ['unknown', 'v2.29.0', artifacts()]);
    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('unknown tool');
    expect(existsSync(join(root, 'web/dist'))).toBe(false);
  });

  test('rejects path traversal names before writing', () => {
    for (const name of ['../escape', '.', '..']) {
      const result = run('stage-web.sh', ['pitchfork', name, artifacts()]);
      expect(result.code).not.toBe(0);
      expect(result.stderr).toContain('bad build name');
      expect(existsSync(join(root, 'web/dist'))).toBe(false);
    }
  });

  test('rejects missing artifacts and incomplete input without partial output', () => {
    write('out/pitchfork.js', 'javascript');
    const result = run('stage-web.sh', [
      'pitchfork',
      'v2.29.0',
      join(root, 'out'),
    ]);
    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('missing build artifact');
    expect(existsSync(join(root, 'web/dist'))).toBe(false);
    expect(run('stage-web.sh', ['pitchfork']).code).not.toBe(0);
  });
});

describe('latest pitchfork E2E staging', () => {
  test('stages the resolved latest identity and records it for local CI without resolving again', () => {
    write('out/pitchfork.js', 'javascript');
    write('out/pitchfork.wasm', 'wasm');
    environment.TERRARIUM_PITCHFORK_REF = 'v2.30.1';
    environment.TERRARIUM_PITCHFORK_COMMIT = sha;
    environment.TERRARIUM_PITCHFORK_BUILD = join(root, 'out');
    const result = run('prepare-pitchfork-e2e.sh');
    expect(result.code).toBe(0);
    expect(existsSync(join(root, 'gh-calls'))).toBe(false);
    expect(
      JSON.parse(
        readFileSync(join(root, '.vendor/pitchfork-e2e.json'), 'utf8'),
      ),
    ).toEqual({ ref: 'v2.30.1', commit: sha });
    const manifest = JSON.parse(
      readFileSync(join(root, 'web/dist/builds.json'), 'utf8'),
    );
    expect(manifest.builds.pitchfork['v2.30.1'].source.commit).toBe(sha);
    expect(manifest.builds.pitchfork['v2.29.0']).toBeUndefined();
  });

  test('does not accept an older staged build as the latest release', () => {
    write('web/dist/pitchfork/v2.29.0/pitchfork.js', 'javascript');
    write('web/dist/pitchfork/v2.29.0/pitchfork.wasm', 'wasm');
    const result = run('prepare-pitchfork-e2e.sh');
    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('Build pitchfork v2.30.1');
    expect(existsSync(join(root, '.vendor/pitchfork-e2e.json'))).toBe(false);
  });
});

describe('locked crate patching', () => {
  function crate(version: string) {
    write(
      `cargo/registry/src/index.crates.io-test/dirs-${version}/value.txt`,
      'before\n',
    );
    write(
      `patches/dirs-${version}.patch`,
      '--- a/value.txt\n+++ b/value.txt\n@@ -1 +1 @@\n-before\n+after\n',
    );
    return `[[package]]\nname = "dirs"\nversion = "${version}"\n`;
  }

  test('applies the locked version and emits its Cargo reference', () => {
    write('source/Cargo.lock', crate('6.0.0'));
    const result = run('vendor-patched.sh', [join(root, 'source')]);
    expect(result.code).toBe(0);
    expect(
      readFileSync(join(root, '.vendor/dirs-6.0.0/value.txt'), 'utf8'),
    ).toBe('after\n');
    expect(result.stdout).toContain('[patch.crates-io]');
    expect(result.stdout).toContain('dirs = { path = ');
  });

  test('applies both locked versions with distinct Cargo keys', () => {
    write('source/Cargo.lock', crate('6.0.0') + crate('7.0.0'));
    const result = run('vendor-patched.sh', [join(root, 'source')]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('dirs-7-0-0 = { package = "dirs", path = ');
    for (const version of ['6.0.0', '7.0.0']) {
      expect(
        readFileSync(join(root, `.vendor/dirs-${version}/value.txt`), 'utf8'),
      ).toBe('after\n');
    }
  });

  test('does not cache a failed patch and applies it on retry', () => {
    write('source/Cargo.lock', crate('6.0.0'));
    const registryFile =
      'cargo/registry/src/index.crates.io-test/dirs-6.0.0/value.txt';
    write(registryFile, 'unexpected\n');
    const failed = run('vendor-patched.sh', [join(root, 'source')]);
    expect(failed.code).not.toBe(0);
    expect(existsSync(join(root, '.vendor/dirs-6.0.0'))).toBe(false);
    write(registryFile, 'before\n');
    const repeated = run('vendor-patched.sh', [join(root, 'source')]);
    expect(repeated.code).toBe(0);
    expect(
      readFileSync(join(root, '.vendor/dirs-6.0.0/value.txt'), 'utf8'),
    ).toBe('after\n');
  });

  test('does not apply a version absent from the lockfile and can rerun', () => {
    write('source/Cargo.lock', crate('6.0.0'));
    crate('7.0.0');
    expect(run('vendor-patched.sh', [join(root, 'source')]).code).toBe(0);
    expect(existsSync(join(root, '.vendor/dirs-7.0.0'))).toBe(false);
    const repeated = run('vendor-patched.sh', [join(root, 'source')]);
    expect(repeated.code).toBe(0);
    expect(
      readFileSync(join(root, '.vendor/dirs-6.0.0/value.txt'), 'utf8'),
    ).toBe('after\n');
  });
});
