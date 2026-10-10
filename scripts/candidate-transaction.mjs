import { createHash, randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const exists = async (name) => {
  try {
    return await fs.lstat(name);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
};

/** Inventory records links themselves, including dangling links, never their targets. */
export async function candidateInventory(root) {
  const stat = await exists(root);
  if (!stat) return null;
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error(`candidate must be a directory: ${root}`);
  const rows = [];
  async function walk(directory, prefix = '') {
    for (const name of (await fs.readdir(directory)).sort()) {
      const relative = prefix ? `${prefix}/${name}` : name;
      const filename = path.join(directory, name);
      const info = await fs.lstat(filename);
      if (info.isSymbolicLink())
        rows.push({
          path: relative,
          kind: 'symlink',
          target: await fs.readlink(filename),
        });
      else if (info.isDirectory()) {
        rows.push({ path: relative, kind: 'directory' });
        await walk(filename, relative);
      } else if (info.isFile()) {
        const bytes = await fs.readFile(filename);
        rows.push({
          path: relative,
          kind: 'file',
          size: bytes.length,
          digest: digest(bytes),
        });
      } else throw new Error(`unsupported candidate file kind: ${relative}`);
    }
  }
  await walk(root);
  return rows;
}

async function canonical(name) {
  const absolute = path.resolve(name);
  const info = await exists(absolute);
  if (info) return fs.realpath(absolute);
  if (absolute === path.dirname(absolute)) return absolute;
  return path.join(
    await canonical(path.dirname(absolute)),
    path.basename(absolute),
  );
}
const overlaps = (a, b) =>
  a === b || a.startsWith(`${b}${path.sep}`) || b.startsWith(`${a}${path.sep}`);

const transactionNamespace = (name) =>
  /^\..+\.transactions(?:\.lock)?$/.test(name);
const containsTransactionNamespace = (name) =>
  path.resolve(name).split(path.sep).some(transactionNamespace);

async function nestedTransactionNamespace(directory) {
  const info = await exists(directory);
  if (!info?.isDirectory() || info.isSymbolicLink()) return false;
  for (const name of await fs.readdir(directory)) {
    if (transactionNamespace(name)) return true;
    if (await nestedTransactionNamespace(path.join(directory, name)))
      return true;
  }
  return false;
}

/** Fail closed around protected source paths, canonical aliases and nested outputs. */
export async function candidateDestination(destination, protectedPaths = []) {
  const absolute = path.resolve(destination);
  const resolved = await canonical(absolute);
  if ((await exists(absolute))?.isSymbolicLink())
    throw new Error('candidate destination is a symlink');
  if (resolved === ROOT || ROOT.startsWith(`${resolved}${path.sep}`))
    throw new Error('protected source root');
  for (const source of [
    'web',
    'scripts',
    'packages',
    'runtime',
    'aidlc',
    '.git',
    '.jj',
    '.codex',
    '.agents',
  ]) {
    if (
      resolved === path.join(ROOT, source) ||
      resolved.startsWith(`${path.join(ROOT, source)}${path.sep}`)
    )
      throw new Error('protected source directory');
  }
  if (
    containsTransactionNamespace(absolute) ||
    containsTransactionNamespace(resolved) ||
    (await nestedTransactionNamespace(resolved))
  )
    throw new Error('protected transaction namespace');
  const history = path.join(
    path.dirname(resolved),
    `.${path.basename(resolved)}.transactions`,
  );
  if ((await exists(history))?.isSymbolicLink())
    throw new Error('protected transaction control alias');
  for (const name of protectedPaths.filter(Boolean))
    if (overlaps(resolved, await canonical(name)))
      throw new Error(`protected candidate: ${name}`);
  return resolved;
}

async function verifyHistory(history, destination) {
  let latest;
  const sequences = new Set();
  for (const id of (await fs.readdir(history)).sort()) {
    if (!/^[0-9]{13}-[a-f0-9-]{36}$/.test(id))
      throw new Error(
        `undeclared transaction remnant: ${path.join(history, id)}`,
      );
    const directory = path.join(history, id);
    if (!(await fs.lstat(directory)).isDirectory())
      throw new Error(`invalid attempt directory: ${directory}`);
    const record = JSON.parse(
      await fs.readFile(path.join(directory, 'record.json'), 'utf8'),
    );
    if (
      record.attempt_id !== id ||
      record.destination !== destination ||
      !['completed_ready', 'completed_failed'].includes(record.completion)
    )
      throw new Error(`unfinished or inconsistent attempt: ${directory}`);
    if (!(await fs.lstat(path.join(directory, 'record.json'))).isFile())
      throw new Error(`invalid record: ${directory}`);
    const names = (await fs.readdir(directory)).sort();
    const expected = record.retained
      ? ['record.json', 'retained']
      : ['record.json'];
    if (!equal(names, expected))
      throw new Error(`undeclared transaction remnant: ${directory}`);
    if (
      record.retained &&
      (record.retained !== path.join(directory, 'retained') ||
        !equal(
          await candidateInventory(record.retained),
          record.previous_inventory,
        ))
    )
      throw new Error(`retained inventory mismatch: ${directory}`);
    if (
      !Array.isArray(record.output_inventory) &&
      record.output_inventory !== null
    )
      throw new Error(`missing output inventory: ${directory}`);
    if (
      record.completion === 'completed_ready' &&
      !Array.isArray(record.output_inventory)
    )
      throw new Error(`missing ready inventory: ${directory}`);
    if (
      !Number.isSafeInteger(record.sequence) ||
      record.sequence < 1 ||
      sequences.has(record.sequence)
    )
      throw new Error(`invalid attempt sequence: ${directory}`);
    sequences.add(record.sequence);
    if (!latest || record.sequence > latest.sequence) latest = record;
  }
  if (
    latest &&
    !equal(await candidateInventory(destination), latest.output_inventory)
  )
    throw new Error(
      `current candidate differs from latest completed attempt: ${destination}`,
    );
  return latest;
}

/** Require each output component to stay inside the work tree without following links. */
export async function candidateFile(root, relative) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(`${path.resolve(root)}${path.sep}`))
    throw new Error('candidate file escapes work tree');
  const parts = path.relative(root, target).split(path.sep);
  let parent = root;
  for (const part of parts.slice(0, -1)) {
    parent = path.join(parent, part);
    const info = await exists(parent);
    if (info && (!info.isDirectory() || info.isSymbolicLink()))
      throw new Error(`unsafe candidate output parent: ${parent}`);
    if (!info) await fs.mkdir(parent);
  }
  const info = await exists(target);
  if (info && (!info.isFile() || info.isSymbolicLink()))
    throw new Error(`unsafe candidate output file: ${target}`);
  return target;
}

/**
 * Local candidate switch; no uninterrupted reads or crash recovery is promised.
 * checkpoint is an injectable I/O boundary for tests, never an environment trigger.
 */
export async function candidateTransaction({
  destination,
  inputIdentity = null,
  protectedPaths = [],
  build,
  seedExisting = false,
  checkpoint = async () => {},
}) {
  destination = await candidateDestination(destination, protectedPaths);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const history = path.join(
    path.dirname(destination),
    `.${path.basename(destination)}.transactions`,
  );
  const lock = `${history}.lock`;
  try {
    await fs.mkdir(lock);
  } catch (error) {
    throw new Error(
      `candidate is in use or interrupted: ${lock}; inspect owner and remnants before recovery`,
      { cause: error },
    );
  }
  let completed;
  let failure;
  let record;
  let directory;
  let movedOld = false;
  let switched = false;
  const recovery = (error) => {
    const details = {
      destination,
      attempt: directory,
      retained: record?.retained,
      work: directory && path.join(directory, 'work'),
      completion: record?.completion,
      original_error: error.message,
      recovery:
        'Do not remove retained history. Inspect record and inventories; restore retained to the absent destination only after checking its identity. Preserve unresolved attempt/lock before retrying.',
    };
    const failure = new Error(
      `candidate transaction failed: ${JSON.stringify(details)}`,
      { cause: error },
    );
    failure.details = details;
    return failure;
  };
  async function save(completion) {
    await checkpoint(`record:${completion}`, { destination, directory });
    const next = { ...record, completion };
    const temporary = path.join(directory, 'record.json.tmp');
    await fs.writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, {
      flag: 'wx',
    });
    await fs.rename(temporary, path.join(directory, 'record.json'));
    record = next;
  }
  try {
    await fs.mkdir(history, { recursive: true });
    if (
      !(await fs.lstat(history)).isDirectory() ||
      (await fs.lstat(history)).isSymbolicLink()
    )
      throw new Error('invalid transaction history');
    const latest = await verifyHistory(history, destination);
    const previous = await candidateInventory(destination);
    const attempt_id = `${Date.now()}-${randomUUID()}`;
    directory = path.join(history, attempt_id);
    await fs.mkdir(directory);
    record = {
      schemaVersion: 1,
      sequence: (latest?.sequence ?? 0) + 1,
      attempt_id,
      destination,
      input_identity: inputIdentity,
      previous_inventory: previous,
      output_inventory: null,
      retained: null,
      completion: 'incomplete',
    };
    await save('incomplete');
    const work = path.join(directory, 'work');
    await fs.mkdir(work);
    if (seedExisting && previous)
      await fs.cp(destination, work, {
        recursive: true,
        dereference: false,
        verbatimSymlinks: true,
      });
    const result = await build(work);
    const next = await candidateInventory(work);
    await checkpoint('before-switch', { destination, directory, work });
    if (!equal(await candidateInventory(destination), previous))
      throw new Error('candidate changed concurrently');
    if (previous) {
      record.retained = path.join(directory, 'retained');
      await save('incomplete');
      await fs.rename(destination, record.retained);
      movedOld = true;
    }
    await checkpoint('switch', { destination, directory, work });
    await fs.rename(work, destination);
    switched = true;
    await checkpoint('cleanup', { destination, directory, work });
    await fs.rm(work, { recursive: true, force: true });
    if (
      !equal(await candidateInventory(destination), next) ||
      (movedOld && !equal(await candidateInventory(record.retained), previous))
    )
      throw new Error('candidate inventory changed during switch');
    record.output_inventory = next;
    await save('completed_ready');
    completed = {
      result,
      transaction: record,
      recordPath: path.join(directory, 'record.json'),
    };
  } catch (originalError) {
    let error = originalError;
    if (record) {
      try {
        // A fully switched candidate is retained for diagnosis if final cleanup or recording failed.
        if (!switched && movedOld) {
          await checkpoint('restore', { destination, directory });
          await fs.rename(record.retained, destination);
          movedOld = false;
          record.retained = null;
        }
        await checkpoint('failure-cleanup', { destination, directory });
        await fs.rm(path.join(directory, 'work'), {
          recursive: true,
          force: true,
        });
        await fs.rm(path.join(directory, 'record.json.tmp'), { force: true });
        record.output_inventory = await candidateInventory(destination);
        if (
          switched ||
          !equal(record.output_inventory, record.previous_inventory)
        )
          await save('recovery_required');
        else await save('completed_failed');
      } catch (cleanupError) {
        record.completion = 'recovery_required';
        error = new Error(
          `${error.message}; recovery/cleanup failed: ${cleanupError.message}`,
          { cause: error },
        );
        try {
          await fs.rm(path.join(directory, 'record.json.tmp'), { force: true });
          await save('recovery_required');
        } catch (recordError) {
          error = new Error(
            `${error.message}; record failed: ${recordError.message}`,
            { cause: error },
          );
        }
      }
    }
    failure = recovery(error);
  }
  try {
    await checkpoint('unlock', { destination, directory, lock });
    await fs.rmdir(lock);
  } catch (error) {
    failure = recovery(
      new Error(
        `lock release failed: ${lock}; ${error.message}; previous error: ${failure?.message ?? 'none'}`,
        {
          cause: error,
        },
      ),
    );
  }
  if (failure) throw failure;
  return completed;
}
