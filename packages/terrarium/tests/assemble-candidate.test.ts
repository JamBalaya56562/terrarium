import { afterEach, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const { assembleCandidate } = await import(
  new URL('../../../scripts/assemble-candidate.mjs', import.meta.url).href
);
const { candidateInventory } = await import(
  new URL('../../../scripts/candidate-transaction.mjs', import.meta.url).href
);
const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});
async function setup(old = true) {
  const root = await mkdtemp(path.join(tmpdir(), 'assembly-test-'));
  roots.push(root);
  const sourceRoot = path.join(root, 'source');
  await mkdir(path.join(sourceRoot, 'web/dist'), { recursive: true });
  await writeFile(path.join(sourceRoot, 'LICENSE'), 'license');
  await writeFile(
    path.join(sourceRoot, 'web/dist/builds.json'),
    '{"builds":{}}',
  );
  await writeFile(path.join(sourceRoot, 'web/tools.json'), '{}');
  await writeFile(
    path.join(sourceRoot, 'web/index.html'),
    '<script src="terminal.mjs"></script>',
  );
  await writeFile(
    path.join(sourceRoot, 'web/terminal.mjs'),
    "import {} from './terrarium.mjs';",
  );
  const destination = path.join(root, 'site');
  if (old) {
    await mkdir(destination);
    await writeFile(path.join(destination, 'old'), 'old candidate');
  }
  const before = await candidateInventory(destination);
  return {
    destination,
    sourceRoot,
    before,
    mode: 'legacy',
    version: 'test-version',
    bundle: async (work: string) => {
      await writeFile(path.join(work, 'web/terrarium.mjs'), 'export {};');
    },
  };
}
test('assembly creates bundle stamps root entry and completed candidate', async () => {
  const input = await setup();
  const result = await assembleCandidate(input);
  expect(result.transaction.completion).toBe('completed_ready');
  expect(
    await readFile(path.join(input.destination, 'web/index.html'), 'utf8'),
  ).toContain('terminal.mjs?v=test-version');
  expect(
    await readFile(path.join(input.destination, 'web/terminal.mjs'), 'utf8'),
  ).toContain('terrarium.mjs?v=test-version');
  expect(
    await readFile(path.join(input.destination, 'index.html'), 'utf8'),
  ).toContain("location.replace('web/'");
  expect(await candidateInventory(result.transaction.retained)).toEqual(
    input.before,
  );
});
for (const old of [true, false]) {
  for (const boundary of [
    'assembly-copy',
    'assembly-bundle',
    'assembly-stamp',
    'assembly-root',
  ]) {
    test(`assembly failure after ${boundary} preserves candidate (old=${old})`, async () => {
      const input = await setup(old);
      await expect(
        assembleCandidate({
          ...input,
          checkpoint: async (point: string) => {
            if (point === boundary)
              throw new Error('injected assembly failure');
          },
        }),
      ).rejects.toThrow('injected assembly failure');
      expect(await candidateInventory(input.destination)).toEqual(input.before);
    });
  }
}
test('missing stamp and bundle failure cannot replace previous candidate', async () => {
  const input = await setup();
  await expect(
    assembleCandidate({
      ...input,
      bundle: async () => {
        throw new Error('bundle failed');
      },
    }),
  ).rejects.toThrow('bundle failed');
  expect(await candidateInventory(input.destination)).toEqual(input.before);
  await writeFile(path.join(input.sourceRoot, 'web/index.html'), 'wrong entry');
  await expect(assembleCandidate(input)).rejects.toThrow(
    'assembly stamp missing',
  );
  expect(await candidateInventory(input.destination)).toEqual(input.before);
});
test('formicarium whole-site assembly includes verified receipt and rejects partial stage write', async () => {
  const input = await setup();
  const result = await assembleCandidate({ ...input, mode: 'formicarium' });
  const receipt = JSON.parse(
    await readFile(
      path.join(input.destination, 'web/formicarium-stage.json'),
      'utf8',
    ),
  );
  expect(receipt.guests).toHaveLength(3);
  expect(result.transaction.input_identity).toMatch(/^[a-f0-9]{64}$/);
  const before = await candidateInventory(input.destination);
  await expect(
    assembleCandidate({
      ...input,
      mode: 'formicarium',
      checkpoint: async (point: string) => {
        if (point === 'stage-write') throw new Error('stage boundary failed');
      },
    }),
  ).rejects.toThrow('stage boundary failed');
  expect(await candidateInventory(input.destination)).toEqual(before);
});
test('legacy explicit ref updates a normal tools file inside the candidate', async () => {
  const input = await setup();
  const original = process.env.TERRARIUM_PITCHFORK_REF;
  try {
    process.env.TERRARIUM_PITCHFORK_REF = 'chosen';
    await writeFile(
      path.join(input.sourceRoot, 'web/dist/builds.json'),
      JSON.stringify({ builds: { pitchfork: { chosen: {} } } }),
    );
    await writeFile(
      path.join(input.sourceRoot, 'web/tools.json'),
      JSON.stringify({ pitchfork: { default: 'old' } }),
    );
    await assembleCandidate(input);
    expect(
      JSON.parse(
        await readFile(path.join(input.destination, 'web/tools.json'), 'utf8'),
      ).pitchfork.default,
    ).toBe('chosen');
  } finally {
    if (original === undefined) delete process.env.TERRARIUM_PITCHFORK_REF;
    else process.env.TERRARIUM_PITCHFORK_REF = original;
  }
});
for (const boundary of ['file', 'parent']) {
  test(`legacy explicit ref rejects ${boundary} symlink without external or previous-candidate writes`, async () => {
    const input = await setup();
    const original = process.env.TERRARIUM_PITCHFORK_REF;
    const { rename, symlink } = await import('node:fs/promises');
    const outside = path.join(path.dirname(input.sourceRoot), 'outside');
    await mkdir(outside);
    const outsideFile = path.join(outside, 'tools.json');
    try {
      process.env.TERRARIUM_PITCHFORK_REF = 'chosen';
      await writeFile(
        path.join(input.sourceRoot, 'web/dist/builds.json'),
        JSON.stringify({ builds: { pitchfork: { chosen: {} } } }),
      );
      await writeFile(
        path.join(input.sourceRoot, 'web/tools.json'),
        JSON.stringify({ pitchfork: { default: 'old' } }),
      );
      if (boundary === 'file') {
        await writeFile(
          outsideFile,
          JSON.stringify({ pitchfork: { default: 'old' } }),
        );
        await rm(path.join(input.sourceRoot, 'web/tools.json'));
        await symlink(
          outsideFile,
          path.join(input.sourceRoot, 'web/tools.json'),
        );
      } else {
        await rm(outside, { recursive: true });
        await rename(path.join(input.sourceRoot, 'web'), outside);
        await symlink(outside, path.join(input.sourceRoot, 'web'));
      }
      const externalBefore = await candidateInventory(outside);
      await expect(assembleCandidate(input)).rejects.toThrow(
        'unsafe candidate output',
      );
      expect(await candidateInventory(outside)).toEqual(externalBefore);
      expect(
        JSON.parse(await readFile(outsideFile, 'utf8')).pitchfork.default,
      ).toBe('old');
      expect(await candidateInventory(input.destination)).toEqual(input.before);
    } finally {
      if (original === undefined) delete process.env.TERRARIUM_PITCHFORK_REF;
      else process.env.TERRARIUM_PITCHFORK_REF = original;
    }
  });
}
