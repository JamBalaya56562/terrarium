import { expect, test } from 'bun:test';
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

test('vendor failure leaves no Cargo marker and retries an already applied tool patch', () => {
  const parent = resolve(tmpdir());
  const root = mkdtempSync(join(parent, 'terrarium-pitchfork-build-'));
  if (dirname(resolve(root)) !== parent) throw new Error('unsafe test root');
  const workspace = resolve(import.meta.dir, '../../..');
  const native = (path: string) => path.replaceAll('\\', '/');
  const write = (path: string, contents: string, executable = false) => {
    const destination = join(root, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, contents);
    if (executable) chmodSync(destination, 0o755);
  };
  const originalManifest =
    '[package]\nname = "retry-fixture"\nversion = "0.0.0"\n';
  let failure: unknown;
  let hasFailure = false;
  try {
    mkdirSync(join(root, 'scripts'));
    cpSync(
      join(workspace, 'scripts/build-pitchfork.sh'),
      join(root, 'scripts/build-pitchfork.sh'),
    );
    write('source/Cargo.toml', originalManifest);
    write('source/value.txt', 'before\n');
    write(
      'patches/tools/pitchfork-2.29.0.patch',
      '--- a/value.txt\n+++ b/value.txt\n@@ -1 +1 @@\n-before\n+after\n',
    );
    write('patches/toolchain/rust-std-retry-fixture.patch', '');
    write('vendor-fail', '');
    write(
      'scripts/emscripten-env.sh',
      '[[ "$TERRARIUM_THREADS" == 1 ]] || exit 91\nprintf "%s\\n" "$TERRARIUM_THREADS" >> "$BUILD_ENV_LOG"\n',
    );
    write('scripts/patch-rust-src.sh', '#!/usr/bin/env bash\nexit 0\n', true);
    write(
      'scripts/vendor-patched.sh',
      `#!/usr/bin/env bash
echo '[patch.crates-io]'
if [[ -e "$BUILD_VENDOR_FAIL" ]]; then
  echo 'incomplete = {}'
  echo 'controlled vendor failure' >&2
  exit 42
fi
echo 'retry_dep = { path = "fixture-dependency" }'
`,
      true,
    );
    write(
      'bin/cargo',
      `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$2" >> "$BUILD_CARGO_LOG"
case "$2" in
  fetch) ;;
  build)
    grep -q '^# terrarium-patches$' Cargo.toml
    grep -q '^retry_dep = ' Cargo.toml
    mkdir -p "$CARGO_TARGET_DIR/wasm32-unknown-emscripten/release"
    echo 'fresh-js' > "$CARGO_TARGET_DIR/wasm32-unknown-emscripten/release/pitchfork.js"
    echo 'fresh-wasm' > "$CARGO_TARGET_DIR/wasm32-unknown-emscripten/release/pitchfork.wasm"
    ;;
  *) exit 92 ;;
esac
`,
      true,
    );
    const environment = {
      ...process.env,
      PATH: [
        process.platform === 'win32' ? 'C:/Program Files/Git/usr/bin' : '',
        process.env.PATH,
      ]
        .filter(Boolean)
        .join(delimiter),
      EMSDK: native(join(root, 'unused-sdk')),
      CARGO: native(join(root, 'bin/cargo')),
      CARGO_TARGET_DIR: native(join(root, 'target')),
      BUILD_CARGO_LOG: native(join(root, 'cargo.log')),
      BUILD_ENV_LOG: native(join(root, 'env.log')),
      BUILD_VENDOR_FAIL: native(join(root, 'vendor-fail')),
    };
    const run = () =>
      Bun.spawnSync({
        cmd: [
          process.platform === 'win32'
            ? 'C:/Program Files/Git/bin/bash.exe'
            : 'bash',
          '-c',
          'export PATH="/usr/bin:/bin:$PATH"; exec "$BASH" "$@"',
          'build-retry-test',
          native(join(root, 'scripts/build-pitchfork.sh')),
          native(join(root, 'source')),
          native(join(root, 'out')),
        ],
        cwd: root,
        env: environment,
        timeout: 30_000,
      });
    const failed = run();
    expect(failed.exitCode, failed.stderr.toString()).toBe(42);
    expect(failed.stderr.toString()).toContain('controlled vendor failure');
    expect(readFileSync(join(root, 'source/Cargo.toml'), 'utf8')).toBe(
      originalManifest,
    );
    expect(readFileSync(join(root, 'source/value.txt'), 'utf8')).toBe(
      'after\n',
    );
    expect(readFileSync(join(root, 'cargo.log'), 'utf8')).toBe('fetch\n');
    expect(existsSync(join(root, 'out/pitchfork.js'))).toBe(false);

    rmSync(join(root, 'vendor-fail'));
    const retried = run();
    expect(retried.exitCode, retried.stderr.toString()).toBe(0);
    const manifest = readFileSync(join(root, 'source/Cargo.toml'), 'utf8');
    expect(manifest.match(/^# terrarium-patches$/gm)).toHaveLength(1);
    expect(manifest.match(/^\[patch\.crates-io\]$/gm)).toHaveLength(1);
    expect(manifest).toContain('retry_dep = { path = "fixture-dependency" }');
    expect(manifest).not.toContain('incomplete');
    expect(readFileSync(join(root, 'source/value.txt'), 'utf8')).toBe(
      'after\n',
    );
    expect(existsSync(join(root, 'source/value.txt.rej'))).toBe(false);
    expect(readFileSync(join(root, 'cargo.log'), 'utf8')).toBe(
      'fetch\nfetch\nbuild\n',
    );
    expect(readFileSync(join(root, 'env.log'), 'utf8')).toBe('1\n1\n');
    expect(readFileSync(join(root, 'out/pitchfork.js'), 'utf8')).toBe(
      'fresh-js\n',
    );
    expect(readFileSync(join(root, 'out/pitchfork.wasm'), 'utf8')).toBe(
      'fresh-wasm\n',
    );
  } catch (error) {
    failure = error;
    hasFailure = true;
  }
  try {
    if (dirname(resolve(root)) !== parent) throw new Error('unsafe test root');
    rmSync(root, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
  } catch (error) {
    if (hasFailure) {
      console.error('build retry test cleanup also failed:', error);
    } else {
      failure = error;
      hasFailure = true;
    }
  }
  if (hasFailure) throw failure;
}, 70_000);
