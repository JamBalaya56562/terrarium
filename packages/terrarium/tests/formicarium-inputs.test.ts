import { afterEach, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';

const { prepareInputs, archiveFiles } = await import(
  new URL('../../../scripts/prepare-formicarium.mjs', import.meta.url).href
);
const sha = (bytes: Uint8Array | string) =>
  createHash('sha256').update(bytes).digest('hex');
const temporary: string[] = [];
afterEach(async () => {
  for (const root of temporary.splice(0))
    await rm(root, { recursive: true, force: true });
});
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'terrarium-inputs-'));
  temporary.push(root);
  const from = path.join(root, 'input');
  const output = path.join(root, 'prepared');
  const values = {
    'pack.tgz': 'pack',
    'manifest.json': 'manifest',
    'resolver/resolver.mjs': 'resolver',
    'guests/guest': 'guest',
  };
  for (const [name, value] of Object.entries(values)) {
    await mkdir(path.dirname(path.join(from, name)), { recursive: true });
    await writeFile(path.join(from, name), value);
  }
  const descriptor = {
    schemaVersion: 1,
    tarball: 'pack.tgz',
    packageManifest: 'manifest.json',
    resolver: 'resolver',
    guestSite: 'guests',
    files: Object.entries(values).map(([name, value]) => ({
      path: name,
      size: value.length,
      sha256: sha(value),
    })),
  };
  return { root, from, output, descriptor };
}
function tar(name: string, kind = '0') {
  const header = Buffer.alloc(512);
  header.write(name);
  header.write('0000644\0', 100);
  header.write('0000000\0', 108);
  header.write('0000000\0', 116);
  header.write('00000000000\0', 124);
  header.write('00000000000\0', 136);
  header.fill(32, 148, 156);
  header.write(kind, 156);
  header.write('ustar\0', 257);
  const checksum = header
    .reduce((sum, byte) => sum + byte, 0)
    .toString(8)
    .padStart(6, '0');
  header.write(`${checksum}\0 `, 148);
  return gzipSync(Buffer.concat([header, Buffer.alloc(1024)]));
}
test('explicit input happy path is reproducible and retains verified bytes', async () => {
  const f = await fixture();
  const result = await prepareInputs(f);
  expect(result.files).toHaveLength(4);
  expect(await readFile(path.join(f.output, 'pack.tgz'), 'utf8')).toBe('pack');
  expect(await prepareInputs(f)).toEqual(result);
});
test('missing explicit input refuses without creating an output', async () => {
  const f = await fixture();
  await expect(
    prepareInputs({ output: f.output, descriptor: f.descriptor }),
  ).rejects.toThrow('exactly one');
  await expect(readFile(path.join(f.output, 'pack.tgz'))).rejects.toMatchObject(
    { code: 'ENOENT' },
  );
});
test('tarball manifest and resolver digest corruption refuse before output', async () => {
  for (const name of ['pack.tgz', 'manifest.json', 'resolver/resolver.mjs']) {
    const f = await fixture();
    await writeFile(path.join(f.from, name), 'changed');
    await expect(prepareInputs(f)).rejects.toThrow(`digest mismatch: ${name}`);
    await expect(
      readFile(path.join(f.output, 'pack.tgz')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  }
});
test('missing advertised asset and unexpected file fail the exact file set', async () => {
  const f = await fixture();
  await rm(path.join(f.from, 'guests/guest'));
  await expect(prepareInputs(f)).rejects.toThrow('file set');
  await writeFile(path.join(f.from, 'guests/guest'), 'guest');
  await writeFile(path.join(f.from, 'unadvertised'), 'extra');
  await expect(prepareInputs(f)).rejects.toThrow('file set');
});
test('input symlink cannot escape the supplied directory', async () => {
  const f = await fixture();
  await rm(path.join(f.from, 'pack.tgz'));
  await symlink(
    path.join(f.from, 'manifest.json'),
    path.join(f.from, 'pack.tgz'),
  );
  await expect(prepareInputs(f)).rejects.toThrow('symlink');
});
test('archive path traversal links duplicates and corrupted headers are rejected without extraction', () => {
  for (const name of ['../outside', '/outside', 'a/../../outside'])
    expect(() => archiveFiles(tar(name))).toThrow('unsafe archive');
  for (const type of ['1', '2'])
    expect(() => archiveFiles(tar('link', type))).toThrow('links/special');
  const raw = gunzipSync(tar('file'));
  raw[0] = 90;
  expect(() => archiveFiles(gzipSync(raw))).toThrow('checksum');
  const header = gunzipSync(tar('same')).subarray(0, 512);
  expect(() =>
    archiveFiles(gzipSync(Buffer.concat([header, header, Buffer.alloc(1024)]))),
  ).toThrow('duplicate');
  expect(() => archiveFiles(Buffer.from('not gzip'))).toThrow();
});
test('plain ustar archive happy path reads only regular files', () => {
  expect(archiveFiles(tar('empty')).get('empty')).toEqual(Buffer.alloc(0));
});

test('assembly preflight preserves an existing output when fixed inputs are missing', async () => {
  const f = await fixture();
  await mkdir(f.output);
  await writeFile(path.join(f.output, 'baseline'), 'preserved');
  const script = new URL('../../../scripts/assemble-pages.sh', import.meta.url)
    .pathname;
  const result = Bun.spawnSync(['bash', script, f.output], {
    env: {
      ...process.env,
      FORMICARIUM_INPUTS_ROOT: path.join(f.root, 'missing'),
    },
  });
  expect(result.exitCode).not.toBe(0);
  expect(result.stderr.toString()).toContain(path.join(f.root, 'missing'));
  expect(await readFile(path.join(f.output, 'baseline'), 'utf8')).toBe(
    'preserved',
  );
});
test('a supplied archive with a different compressed digest is refused before placement', async () => {
  const f = await fixture();
  const archive = path.join(f.root, 'inputs.tar.gz');
  await writeFile(archive, tar('pack.tgz'));
  await expect(
    prepareInputs({
      archive,
      output: f.output,
      descriptor: {
        ...f.descriptor,
        distribution: { archiveSha256: '0'.repeat(64) },
      },
    }),
  ).rejects.toThrow('archive digest mismatch');
  await expect(readFile(path.join(f.output, 'pack.tgz'))).rejects.toMatchObject(
    { code: 'ENOENT' },
  );
});

test('four workflows pin the verified input URL and guard supply before installation', async () => {
  for (const name of [
    'test-terrarium.yml',
    'test-e2e.yml',
    'pages.yml',
    'publish-terrarium.yml',
  ]) {
    const source = await readFile(
      new URL(`../../../.github/workflows/${name}`, import.meta.url),
      'utf8',
    );
    expect(source).toContain(
      "vars.FORMICARIUM_INPUTS_URL || 'https://raw.githubusercontent.com/Marukome0743/terrarium/74baa1101ebf6d8fc310ea70de3ddc071a87c01f/inputs.tar.gz'",
    );
    expect(
      source.indexOf('node scripts/fetch-formicarium-rc.mjs'),
    ).toBeGreaterThan(source.indexOf('prepare-formicarium.mjs --url'));
    expect(
      source.indexOf('node scripts/fetch-formicarium-rc.mjs'),
    ).toBeLessThan(source.indexOf('bun install --frozen-lockfile'));
    const guard = source
      .split('\n')
      .find((line) => line.includes('FORMICARIUM_INPUTS_URL:?'))
      ?.trim();
    expect(guard).toBeDefined();
    const env = { ...process.env };
    delete env.FORMICARIUM_INPUTS_URL;
    for (const value of [
      undefined,
      '',
      'https://inputs.invalid/fixed.tar.gz',
    ]) {
      const supplied =
        value === undefined ? env : { ...env, FORMICARIUM_INPUTS_URL: value };
      const result = Bun.spawnSync(
        ['bash', '-c', `${guard}\nprintf 'supply-accepted'`],
        { env: supplied },
      );
      if (value) {
        expect(result.exitCode).toBe(0);
        expect(result.stdout.toString()).toBe('supply-accepted');
      } else {
        expect(result.exitCode).not.toBe(0);
        expect(result.stderr.toString()).toContain(
          'Configure the fixed formicarium input archive URL',
        );
        expect(result.stdout.toString()).toBe('');
      }
    }
    expect(source.indexOf('FORMICARIUM_INPUTS_URL:?')).toBeLessThan(
      source.indexOf('prepare-formicarium.mjs --url'),
    );
  }
});

test('the current sixteen-file explicit supply is accepted and changed resolver bytes are refused', async () => {
  const f = await fixture();
  const from =
    process.env.FORMICARIUM_INPUTS_ROOT ??
    path.resolve(import.meta.dir, '../../../.vendor/formicarium-inputs');
  const accepted = await prepareInputs({ from, output: f.output });
  expect(accepted.files).toHaveLength(16);
  await writeFile(
    path.join(f.output, 'resolver/resolver.js'),
    'changed resolver',
  );
  await expect(
    prepareInputs({ from: f.output, output: path.join(f.root, 'second') }),
  ).rejects.toThrow('digest mismatch: resolver/resolver.js');
  await expect(
    readFile(path.join(f.root, 'second', 'resolver/resolver.js')),
  ).rejects.toMatchObject({ code: 'ENOENT' });
});

test('old resolver-extension archive is rejected by the current exact sixteen-file contract', async () => {
  const f = await fixture();
  const archive = path.join(f.root, 'old-inputs.tar.gz');
  const bytes = tar('resolver/resolver.mjs');
  await writeFile(archive, bytes);
  const descriptor = JSON.parse(
    await readFile(
      new URL('../../../integration/formicarium-inputs.json', import.meta.url),
      'utf8',
    ),
  );
  // Match this fixture's archive digest to exercise the independent file-set guard.
  descriptor.distribution = { archiveSha256: sha(bytes) };
  await expect(
    prepareInputs({ archive, output: f.output, descriptor }),
  ).rejects.toThrow('exact input file set differs');
  await expect(
    readFile(path.join(f.output, 'resolver/resolver.mjs')),
  ).rejects.toMatchObject({ code: 'ENOENT' });
});

test('CI verifies fixed inputs before install and retains separate three-browser suites', async () => {
  for (const name of [
    'test-terrarium.yml',
    'test-e2e.yml',
    'pages.yml',
    'publish-terrarium.yml',
  ]) {
    const source = await readFile(
      new URL(`../../../.github/workflows/${name}`, import.meta.url),
      'utf8',
    );
    expect(source).toContain('FORMICARIUM_INPUTS_URL:?');
    expect(source.indexOf('prepare-formicarium.mjs --url')).toBeLessThan(
      source.indexOf('bun install --frozen-lockfile'),
    );
    if (name === 'test-e2e.yml') {
      expect(source).toContain('browser: [chromium, firefox, webkit]');
      expect(source).toContain('site-legacy legacy');
      expect(source).toContain('playwright.formicarium.config.ts');
    }
  }
});
