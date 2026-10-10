import { afterEach, expect, test } from 'bun:test';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const api = await import(
  new URL('../../../scripts/candidate-transaction.mjs', import.meta.url).href
);
const { candidateTransaction: run, candidateInventory: inventory } = api;
const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});
async function setup(old = true) {
  const root = await mkdtemp(path.join(tmpdir(), 'candidate-test-'));
  roots.push(root);
  const destination = path.join(root, 'site');
  if (old) {
    await mkdir(destination);
    await writeFile(path.join(destination, 'old'), 'old');
    await mkdir(path.join(destination, 'empty'));
    await symlink('old', path.join(destination, 'link'));
  }
  const before = await inventory(destination);
  const build = async (work: string) => {
    await writeFile(path.join(work, 'new'), 'new');
    return 'result';
  };
  return { root, destination, before, build };
}
for (const old of [true, false]) {
  test(`successful candidate and repeated attempts retain history (old=${old})`, async () => {
    const input = await setup(old);
    const a = await run(input);
    const b = await run(input);
    expect(a.transaction.completion).toBe('completed_ready');
    expect(b.transaction.attempt_id).not.toBe(a.transaction.attempt_id);
    if (old)
      expect(await inventory(a.transaction.retained)).toEqual(input.before);
    expect(await readFile(path.join(input.destination, 'new'), 'utf8')).toBe(
      'new',
    );
  });
  for (const boundary of ['build', 'switch', 'before-switch']) {
    test(`failed ${boundary} preserves entire previous inventory (old=${old})`, async () => {
      const input = await setup(old);
      await expect(
        run({
          ...input,
          build: async (work: string) => {
            await input.build(work);
            if (boundary === 'build') throw new Error('write failed');
          },
          checkpoint: async (point: string) => {
            if (point === boundary) throw new Error('injected');
          },
        }),
      ).rejects.toThrow('candidate transaction failed');
      expect(await inventory(input.destination)).toEqual(input.before);
      const next = await run(input);
      expect(next.transaction.completion).toBe('completed_ready');
    });
  }
  for (const boundary of [
    'cleanup',
    'failure-cleanup',
    'record:completed_ready',
  ]) {
    test(`failed ${boundary} cannot be reported ready (old=${old})`, async () => {
      const input = await setup(old);
      await expect(
        run({
          ...input,
          build: async (work: string) => {
            await input.build(work);
            if (boundary === 'failure-cleanup') throw new Error('write failed');
          },
          checkpoint: async (point: string) => {
            if (point === boundary) throw new Error('injected');
          },
        }),
      ).rejects.toThrow('candidate transaction failed');
      await expect(run(input)).rejects.toThrow('unfinished');
    });
  }
}
test('failed restoration preserves retained candidate and prevents retry', async () => {
  const input = await setup();
  await expect(
    run({
      ...input,
      checkpoint: async (point: string) => {
        if (point === 'switch' || point === 'restore')
          throw new Error('injected');
      },
    }),
  ).rejects.toThrow('recovery/cleanup failed');
  const history = path.join(input.root, '.site.transactions');
  const [id] = await readdir(history);
  expect(await inventory(path.join(history, id!, 'retained'))).toEqual(
    input.before,
  );
  await expect(run(input)).rejects.toThrow('unfinished');
});
test('inventory rejects same-byte file/link substitution, changed link target and missing empty dir', async () => {
  for (const change of ['kind', 'target', 'directory']) {
    const input = await setup();
    const result = await run(input);
    const retained = result.transaction.retained;
    if (change === 'directory')
      await rm(path.join(retained, 'empty'), { recursive: true });
    else {
      await rm(path.join(retained, 'link'));
      if (change === 'kind')
        await writeFile(path.join(retained, 'link'), 'old');
      else await symlink('./old', path.join(retained, 'link'));
    }
    await expect(run(input)).rejects.toThrow('retained inventory mismatch');
  }
});
test('missing and corrupt record, undeclared remnant and incomplete attempts stop', async () => {
  for (const change of ['missing', 'corrupt', 'undeclared', 'incomplete']) {
    const input = await setup();
    const result = await run(input);
    if (change === 'missing') await rm(result.recordPath);
    if (change === 'corrupt') await writeFile(result.recordPath, '{');
    if (change === 'undeclared')
      await writeFile(
        path.join(path.dirname(result.recordPath), 'stray'),
        'stray',
      );
    if (change === 'incomplete')
      await writeFile(
        result.recordPath,
        JSON.stringify({ ...result.transaction, completion: 'incomplete' }),
      );
    await expect(run(input)).rejects.toThrow('candidate transaction failed');
  }
});
test('concurrent candidate mutation prevents switch', async () => {
  const input = await setup();
  await expect(
    run({
      ...input,
      build: async (work: string) => {
        await input.build(work);
        await writeFile(path.join(input.destination, 'external'), 'external');
      },
    }),
  ).rejects.toThrow('changed concurrently');
  expect(await readFile(path.join(input.destination, 'old'), 'utf8')).toBe(
    'old',
  );
  await expect(run(input)).rejects.toThrow('unfinished');
});
test('exclusive lock rejects a second writer without affecting first writer', async () => {
  const input = await setup();
  await run({
    ...input,
    build: async (work: string) => {
      await expect(run(input)).rejects.toThrow('in use or interrupted');
      await input.build(work);
    },
  });
});
test('protected source and preserved candidate aliases are rejected', async () => {
  const input = await setup();
  await expect(
    run({ ...input, protectedPaths: [input.destination] }),
  ).rejects.toThrow('protected candidate');
  await expect(
    run({ ...input, destination: path.resolve(import.meta.dir, '../../..') }),
  ).rejects.toThrow('protected source');
  const alias = path.join(input.root, 'alias');
  await symlink(input.destination, alias);
  await expect(run({ ...input, destination: alias })).rejects.toThrow(
    'symlink',
  );
});
test('completion-record failure leaves recovery evidence even when recording also fails', async () => {
  const input = await setup();
  await expect(
    run({
      ...input,
      checkpoint: async (point: string) => {
        if (
          point === 'record:completed_ready' ||
          point === 'record:recovery_required'
        )
          throw new Error('record unavailable');
      },
    }),
  ).rejects.toThrow('record failed');
  await expect(run(input)).rejects.toThrow('unfinished');
});
test('unsupported special files are refused before moving candidate', async () => {
  const input = await setup();
  const proc = Bun.spawn(['mkfifo', path.join(input.destination, 'pipe')]);
  expect(await proc.exited).toBe(0);
  await expect(run(input)).rejects.toThrow('unsupported candidate file kind');
  expect(await readFile(path.join(input.destination, 'old'), 'utf8')).toBe(
    'old',
  );
});
test('same-millisecond normal attempts use monotonic sequence instead of random identifier order', async () => {
  const input = await setup();
  const original = Date.now;
  Date.now = () => 1791417600000;
  try {
    const first = await run(input);
    const second = await run({
      ...input,
      build: async (work: string) => {
        await writeFile(path.join(work, 'second'), 'second');
      },
    });
    const third = await run(input);
    expect(second.transaction.sequence).toBe(first.transaction.sequence + 1);
    expect(third.transaction.sequence).toBe(3);
  } finally {
    Date.now = original;
  }
});
test('lock release failure returns identified recovery error and blocks next attempt', async () => {
  const input = await setup();
  await expect(
    run({
      ...input,
      checkpoint: async (point: string) => {
        if (point === 'unlock') throw new Error('lock release unavailable');
      },
    }),
  ).rejects.toThrow('lock release failed');
  await expect(run(input)).rejects.toThrow('in use or interrupted');
});
test('history namespace destinations and canonical aliases are refused before writes, preserving future normal attempts', async () => {
  const input = await setup();
  const first = await run(input);
  const history = path.dirname(path.dirname(first.recordPath));
  const before = await inventory(history);
  const targets = [
    history,
    path.dirname(first.recordPath),
    first.transaction.retained,
    path.join(path.dirname(first.recordPath), 'work'),
    `${history}.lock`,
    path.join(history, 'new', 'nested'),
  ];
  for (const [index, target] of targets.entries()) {
    await expect(run({ ...input, destination: target })).rejects.toThrow(
      'protected transaction namespace',
    );
    const alias = path.join(input.root, `alias-${index}`);
    await symlink(target, alias);
    await expect(
      run({ ...input, destination: path.join(alias, 'nested') }),
    ).rejects.toThrow();
    expect(await inventory(history)).toEqual(before);
  }
  await expect(run({ ...input, destination: input.root })).rejects.toThrow(
    'protected transaction namespace',
  );
  expect(await inventory(history)).toEqual(before);
  await run(input);
  expect(await inventory(first.transaction.retained)).toEqual(input.before);
});
test('reserved destinations create no parent or control areas and control symlink is rejected before mkdir', async () => {
  const input = await setup();
  const missingParent = path.join(input.root, 'absent');
  await expect(
    run({
      ...input,
      destination: path.join(missingParent, '.site.transactions', 'work'),
    }),
  ).rejects.toThrow('protected transaction namespace');
  await expect(readdir(missingParent)).rejects.toMatchObject({
    code: 'ENOENT',
  });
  const outside = path.join(input.root, 'outside');
  await mkdir(outside);
  const control = path.join(input.root, '.site.transactions');
  await symlink(outside, control);
  await expect(run(input)).rejects.toThrow(
    'protected transaction control alias',
  );
  expect(await readdir(outside)).toEqual([]);
  await expect(readdir(`${control}.lock`)).rejects.toMatchObject({
    code: 'ENOENT',
  });
  expect(await inventory(input.destination)).toEqual(input.before);
});
