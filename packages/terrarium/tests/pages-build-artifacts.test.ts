import { expect, test } from 'bun:test';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const workspace = resolve(import.meta.dir, '../../..');
const workflow = readFileSync(
  join(workspace, '.github/workflows/pages.yml'),
  'utf8',
);
const selection = workflow
  .match(
    /^ {10}shopt -s nullglob\r?\n[\s\S]*?(?=^ {10}git config user.name)/m,
  )?.[0]
  .replace(/^ {10}/gm, '');
if (!selection) throw new Error('Pages store artifact selection was not found');

for (const layout of ['single', 'multiple', 'none'] as const) {
  test(`Pages store finds ${layout} downloaded build artifacts`, () => {
    const temporary = resolve(tmpdir());
    const root = mkdtempSync(join(temporary, 'terrarium-pages-artifacts-'));
    if (dirname(resolve(root)) !== temporary)
      throw new Error('unsafe test root');
    const native = (path: string) => path.replaceAll('\\', '/');
    const base = join(root, 'builds');
    const expected =
      layout === 'single'
        ? [base]
        : layout === 'multiple'
          ? [
              join(base, 'build-aube-main'),
              join(base, 'build-pitchfork-v2.29.0'),
            ]
          : [];
    try {
      mkdirSync(base, { recursive: true });
      for (const directory of expected) {
        mkdirSync(directory, { recursive: true });
        const tool = directory.endsWith('build-aube-main')
          ? 'aube'
          : 'pitchfork';
        writeFileSync(join(directory, 'build.json'), JSON.stringify({ tool }));
        writeFileSync(join(directory, `${tool}.js`), 'build-js\n');
        writeFileSync(join(directory, `${tool}.wasm`), 'build-wasm\n');
      }
      const result = Bun.spawnSync({
        cmd: [
          process.platform === 'win32'
            ? 'C:/Program Files/Git/bin/bash.exe'
            : 'bash',
          '-c',
          `export PATH="/usr/bin:/bin:$PATH"\n${selection}\nprintf '%s\\n' "\${dirs[@]}"`,
        ],
        env: { ...process.env, RUNNER_TEMP: native(root) },
        timeout: 30_000,
      });
      expect(result.exitCode, result.stderr.toString()).toBe(0);
      const output = result.stdout.toString().trim();
      if (layout === 'none') {
        expect(output).toBe('no build succeeded');
      } else {
        expect(
          output.split('\n').map((path) => path.replace(/\/$/, '')),
        ).toEqual(expected.map(native));
      }
    } finally {
      rmSync(root, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    }
  }, 70_000);
}
