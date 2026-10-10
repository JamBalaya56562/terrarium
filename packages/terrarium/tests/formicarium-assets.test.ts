import { afterEach, describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const stageUrl = new URL(
  '../../../scripts/stage-formicarium.mjs',
  import.meta.url,
);
interface StageInput {
  webRoot: string;
  packageRoot: string;
  packageManifest: string;
  guestSite: string;
  resolverRoot: string;
  checkpoint?: (point: string) => Promise<void>;
}
interface StageReceipt {
  installedVersion: string;
  guests: unknown[];
  files: { path: string; sha256: string }[];
}
const { RUNTIME_FILES, stageFormicarium } = (await import(stageUrl.href)) as {
  RUNTIME_FILES: readonly string[];
  stageFormicarium(input: StageInput): Promise<StageReceipt>;
};

const sha = (bytes: Uint8Array | string) =>
  createHash('sha256').update(bytes).digest('hex');
const dirs: string[] = [];
afterEach(async () => {
  for (const dir of dirs.splice(0))
    await rm(dir, { recursive: true, force: true });
});
const save = async (filename: string, value: string | Uint8Array) => {
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, value);
};
const json = (value: unknown) => `${JSON.stringify(value)}\n`;
const elf = () => {
  const bytes = new Uint8Array(120);
  bytes.set([127, 69, 76, 70, 2, 1, 1]);
  const h = new DataView(bytes.buffer);
  h.setUint16(16, 2, true);
  h.setUint16(18, 62, true);
  h.setUint32(20, 1, true);
  h.setBigUint64(32, 64n, true);
  h.setUint16(52, 64, true);
  h.setUint16(54, 56, true);
  h.setUint16(56, 1, true);
  h.setUint32(64, 1, true);
  return bytes;
};

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'terrarium-assets-'));
  dirs.push(root);
  const packageRoot = path.join(root, 'package');
  const guestSite = path.join(root, 'guests');
  const webRoot = path.join(root, 'web');
  const packageManifest = path.join(root, 'package-manifest.json');
  const files: { path: string; sha256: string }[] = [];
  for (const relative of RUNTIME_FILES as readonly string[]) {
    let bytes = 'export {};\n';
    if (relative === 'package.json')
      bytes = json({
        name: '@aletheia-works/formicarium',
        version: '0.1.0-rc.1',
      });
    if (relative === 'assets/build-info.json')
      bytes = json({
        blinkCommit: 'a'.repeat(40),
        blinkSourceDirty: false,
        assetDigests: {
          loaderSha256: sha('export {};\n'),
          wasmSha256: sha('export {};\n'),
        },
      });
    await save(path.join(packageRoot, relative), bytes);
    files.push({ path: relative, sha256: sha(bytes) });
  }
  await save(
    packageManifest,
    json({
      package: '@aletheia-works/formicarium',
      version: '0.1.0-rc.1',
      blinkCommit: 'a'.repeat(40),
      blinkSourceDirty: false,
      files,
    }),
  );
  const builds: Record<string, Record<string, unknown>> = {
    aube: {},
    pitchfork: {},
  };
  for (const [tool, ref] of [
    ['aube', 'v2.7.0'],
    ['aube', 'v2.6.1'],
    ['pitchfork', 'v2.30.1'],
  ] as const) {
    const source = {
      url: `https://source.invalid/${tool}`,
      ref,
      commit: 'b'.repeat(40),
    };
    const built_at = '2026-10-08T00:00:00Z';
    const guest = elf();
    const info = json({
      schemaVersion: 1,
      tool,
      ref,
      source,
      built_at,
      target: 'x86_64-unknown-linux-musl',
      linkage: 'static',
      libc: 'musl',
      patch_sha256:
        '1e307ed8c3009ead22a08c5615fda5b30ac42cdc79726bbb722e10b5426dbac6',
    });
    const dir = `dist/${tool}/${ref}`;
    await save(path.join(guestSite, dir, 'guest'), guest);
    await save(path.join(guestSite, dir, 'build-info.json'), info);
    builds[tool]![ref!] = {
      schemaVersion: 1,
      tool,
      ref,
      source,
      built_at,
      guest: {
        url: `${dir}/guest`,
        sha256: sha(guest),
        format: 'static-musl-x86_64',
      },
      fixtures: {},
      buildInfo: { url: `${dir}/build-info.json`, sha256: sha(info) },
    };
  }
  await save(
    path.join(guestSite, 'tools.json'),
    json({ aube: { default: 'v2.7.0' }, pitchfork: { default: 'v2.30.1' } }),
  );
  await save(
    path.join(guestSite, 'dist/builds.json'),
    json({ schemaVersion: 1, builds }),
  );
  const resolverRoot = path.join(
    process.env.FORMICARIUM_INPUTS_ROOT ??
      path.resolve(import.meta.dir, '../../../.vendor/formicarium-inputs'),
    'resolver',
  );
  return {
    root,
    packageRoot,
    guestSite,
    webRoot,
    packageManifest,
    resolverRoot,
  };
}

describe('candidate assets staging', () => {
  test('copies exact installed package worker loader wasm build-info and all advertised refs', async () => {
    const input = await fixture();
    const receipt = await stageFormicarium(input);
    expect(receipt.installedVersion).toBe('0.1.0-rc.1');
    expect(receipt.guests).toHaveLength(3);
    for (const entry of receipt.files)
      expect(sha(await readFile(path.join(input.webRoot, entry.path)))).toBe(
        entry.sha256,
      );
    expect(
      await readFile(path.join(input.webRoot, 'dist/aube/v2.6.1/guest')),
    ).toEqual(Buffer.from(elf()));
    expect(
      receipt.files.filter((entry: { path: string }) =>
        entry.path.startsWith('formicarium/runtime/'),
      ),
    ).toHaveLength(14);
  });
  test('preserves unrelated tools and legacy source/upstream_pr/built_at metadata', async () => {
    const input = await fixture();
    const legacy = {
      source: {
        type: 'git',
        url: 'https://source.invalid/old',
        ref: 'main',
        commit: null,
      },
      upstream_pr: 'https://source.invalid/pr',
      built_at: 'old-time',
    };
    await save(
      path.join(input.webRoot, 'tools.json'),
      json({ old: { default: 'main' } }),
    );
    await save(
      path.join(input.webRoot, 'dist/builds.json'),
      json({ builds: { old: { main: legacy } } }),
    );
    await stageFormicarium(input);
    const builds = JSON.parse(
      await readFile(path.join(input.webRoot, 'dist/builds.json'), 'utf8'),
    );
    expect(builds.builds.old.main).toEqual(legacy);
  });
  test('missing installed worker rejects before staged output exists', async () => {
    const input = await fixture();
    await rm(path.join(input.packageRoot, 'runtime/web/package-worker.js'));
    await expect(stageFormicarium(input)).rejects.toThrow();
    await expect(
      readFile(path.join(input.webRoot, 'formicarium-stage.json')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });
  test('changed installed package digest rejects', async () => {
    const input = await fixture();
    await save(path.join(input.packageRoot, 'runtime/core.js'), 'modified');
    await expect(stageFormicarium(input)).rejects.toThrow(
      'package digest mismatch',
    );
  });
  test('missing retained ref asset rejects rather than advertise a broken old ref', async () => {
    const input = await fixture();
    await rm(path.join(input.guestSite, 'dist/aube/v2.6.1/guest'));
    await expect(stageFormicarium(input)).rejects.toThrow();
  });
  test('guest hash mismatch rejects before output', async () => {
    const input = await fixture();
    await save(
      path.join(input.guestSite, 'dist/pitchfork/v2.30.1/guest'),
      'bad',
    );
    await expect(stageFormicarium(input)).rejects.toThrow(
      'guest digest mismatch',
    );
  });
  test('dirty package and mismatched installed version reject', async () => {
    const input = await fixture();
    const manifest = JSON.parse(await readFile(input.packageManifest, 'utf8'));
    await save(
      input.packageManifest,
      json({ ...manifest, blinkSourceDirty: true }),
    );
    await expect(stageFormicarium(input)).rejects.toThrow(
      'invalid package identity',
    );
    await save(
      input.packageManifest,
      json({ ...manifest, version: 'different' }),
    );
    await expect(stageFormicarium(input)).rejects.toThrow(
      'installed version mismatch',
    );
  });
  test('copied resolver modules retain exact frozen source bytes', async () => {
    const input = await fixture();
    await stageFormicarium(input);
    for (const name of ['manifest.js', 'fixtures.js', 'resolver.js']) {
      expect(
        await readFile(
          path.join(input.webRoot, 'formicarium-guest-distribution', name),
        ),
      ).toEqual(await readFile(path.join(input.resolverRoot, name)));
    }
  });
});

for (const old of [true, false]) {
  test(`partial asset write fails without changing candidate (old=${old})`, async () => {
    const input = await fixture();
    const { candidateInventory } = await import(
      new URL('../../../scripts/candidate-transaction.mjs', import.meta.url)
        .href
    );
    if (old) await save(path.join(input.webRoot, 'preserved'), 'old candidate');
    const before = await candidateInventory(input.webRoot);
    await expect(
      stageFormicarium({
        ...input,
        checkpoint: async (point) => {
          if (point === 'stage-write') throw new Error('partial stage write');
        },
      }),
    ).rejects.toThrow('partial stage write');
    expect(await candidateInventory(input.webRoot)).toEqual(before);
    await stageFormicarium(input);
  });
}
test('existing output symlink cannot redirect staging writes outside candidate', async () => {
  const input = await fixture();
  const { symlink } = await import('node:fs/promises');
  const outside = path.join(input.root, 'outside');
  await mkdir(outside);
  await save(path.join(outside, 'package.json'), 'outside');
  await mkdir(input.webRoot);
  await symlink(outside, path.join(input.webRoot, 'formicarium'));
  await expect(stageFormicarium(input)).rejects.toThrow(
    'unsafe candidate output parent',
  );
  expect(await readFile(path.join(outside, 'package.json'), 'utf8')).toBe(
    'outside',
  );
});
