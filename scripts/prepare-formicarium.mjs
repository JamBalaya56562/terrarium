import { createHash } from 'node:crypto';
import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
export const INPUT_ROOT = path.join(ROOT, '.vendor/formicarium-inputs');
export const DESCRIPTOR = path.join(
  ROOT,
  'integration/formicarium-inputs.json',
);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (message) => {
  throw new Error(`formicarium inputs: ${message}`);
};
const safePath = (name) =>
  typeof name === 'string' &&
  name.length > 0 &&
  !name.includes('\\') &&
  !name.includes('\0') &&
  !path.posix.isAbsolute(name) &&
  !name.split('/').some((part) => part === '..' || part === '.' || !part);

export async function descriptorAt(filename = DESCRIPTOR) {
  const descriptor = JSON.parse(await readFile(filename, 'utf8'));
  return validateDescriptor(descriptor);
}

function validateDescriptor(descriptor) {
  if (
    descriptor.schemaVersion !== 1 ||
    !Array.isArray(descriptor.files) ||
    !descriptor.files.length ||
    new Set(descriptor.files.map((row) => row.path)).size !==
      descriptor.files.length ||
    descriptor.files.some(
      (row) =>
        !safePath(row.path) ||
        !/^[a-f0-9]{64}$/.test(row.sha256) ||
        !Number.isSafeInteger(row.size) ||
        row.size < 0,
    )
  )
    fail('invalid fixed descriptor');
  for (const name of [descriptor.tarball, descriptor.packageManifest]) {
    if (!safePath(name) || !descriptor.files.some((row) => row.path === name))
      fail('missing package identity');
  }
  for (const name of [descriptor.resolver, descriptor.guestSite])
    if (!safePath(name)) fail('invalid input directory');
  if (
    descriptor.distribution &&
    !/^[a-f0-9]{64}$/.test(descriptor.distribution.archiveSha256)
  )
    fail('invalid archive digest');
  return descriptor;
}

async function directoryFiles(root) {
  const canonical = await realpath(root);
  const files = new Map();
  async function walk(directory, prefix = '') {
    for (const name of await readdir(directory)) {
      const relative = prefix ? `${prefix}/${name}` : name;
      if (!safePath(relative)) fail(`unsafe path: ${relative}`);
      const filename = path.join(directory, name);
      const info = await lstat(filename);
      if (info.isSymbolicLink()) fail(`symlink is forbidden: ${relative}`);
      if (!(await realpath(filename)).startsWith(`${canonical}${path.sep}`))
        fail(`path escapes input: ${relative}`);
      if (info.isDirectory()) await walk(filename, relative);
      else if (info.isFile()) files.set(relative, await readFile(filename));
      else fail(`special file is forbidden: ${relative}`);
    }
  }
  await walk(canonical);
  return files;
}

/** Read a bounded ustar tar.gz without extracting paths or following links. */
export function archiveFiles(archive) {
  const bytes = gunzipSync(archive, { maxOutputLength: 512 * 1024 * 1024 });
  const files = new Map();
  const field = (header, start, size) =>
    header
      .subarray(start, start + size)
      .toString()
      .split('\0')[0];
  let offset = 0;
  for (; offset + 512 <= bytes.length; ) {
    const header = bytes.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      if (bytes.subarray(offset).some((byte) => byte !== 0))
        fail('nonzero trailing archive data');
      return files;
    }
    const checksum = Number.parseInt(field(header, 148, 8).trim(), 8);
    const actual = header.reduce(
      (sum, byte, index) => sum + (index >= 148 && index < 156 ? 32 : byte),
      0,
    );
    if (checksum !== actual) fail('archive header checksum mismatch');
    const prefix = field(header, 345, 155);
    const leaf = field(header, 0, 100);
    const name = (prefix ? `${prefix}/${leaf}` : leaf).replace(/\/$/u, '');
    if (!safePath(name)) fail(`unsafe archive path: ${name}`);
    const type = field(header, 156, 1);
    const sizeText = field(header, 124, 12).trim();
    if (!/^[0-7]+$/.test(sizeText)) fail(`invalid archive size: ${name}`);
    const size = Number.parseInt(sizeText, 8);
    if (!Number.isSafeInteger(size) || offset + 512 + size > bytes.length)
      fail(`truncated archive: ${name}`);
    if (type === '5') {
      if (size !== 0) fail(`invalid archive directory: ${name}`);
    } else if (type === '0' || type === '') {
      if (files.has(name)) fail(`duplicate archive path: ${name}`);
      files.set(name, bytes.subarray(offset + 512, offset + 512 + size));
    } else fail(`archive links/special entries forbidden: ${name}`);
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  fail('archive terminator missing');
}

function validateFiles(files, descriptor) {
  if (
    files.size !== descriptor.files.length ||
    [...files.keys()].some(
      (name) => !descriptor.files.some((row) => row.path === name),
    )
  )
    fail('exact input file set differs');
  for (const row of descriptor.files) {
    const bytes = files.get(row.path);
    if (!bytes) fail(`missing file: ${row.path}`);
    if (bytes.length !== row.size || sha(bytes) !== row.sha256)
      fail(`digest mismatch: ${row.path}`);
  }
}

export async function verifyInputs(
  root = INPUT_ROOT,
  suppliedDescriptor = undefined,
) {
  const descriptor = validateDescriptor(
    suppliedDescriptor ?? (await descriptorAt()),
  );
  const files = await directoryFiles(root);
  validateFiles(files, descriptor);
  return {
    root: path.resolve(root),
    normalizedDescriptorSha256: sha(Buffer.from(JSON.stringify(descriptor))),
    files: descriptor.files,
  };
}

export async function prepareInputs({
  from,
  archive,
  url,
  output = INPUT_ROOT,
  descriptor,
} = {}) {
  descriptor = validateDescriptor(descriptor ?? (await descriptorAt()));
  if ([from, archive, url].filter(Boolean).length !== 1)
    fail('provide exactly one --from, --archive or --url');
  let files;
  if (from) files = await directoryFiles(from);
  else {
    let bytes;
    if (url) {
      const address = new URL(url);
      if (address.protocol !== 'https:' || address.username || address.password)
        fail('input URL must be HTTPS without credentials');
      const response = await fetch(address, {
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) fail(`download HTTP ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
    } else bytes = await readFile(archive);
    if (bytes.length > 256 * 1024 * 1024) fail('archive too large');
    if (
      descriptor.distribution &&
      sha(bytes) !== descriptor.distribution.archiveSha256
    )
      fail('archive digest mismatch');
    files = archiveFiles(bytes);
  }
  validateFiles(files, descriptor);
  const destination = path.resolve(output);
  if (
    destination === ROOT ||
    ROOT.startsWith(`${destination}${path.sep}`) ||
    destination === path.join(ROOT, '.site')
  )
    fail('protected output path');
  try {
    return await verifyInputs(destination, descriptor);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = await mkdtemp(
    path.join(path.dirname(destination), '.formicarium-prepare-'),
  );
  try {
    for (const [relative, bytes] of files) {
      const filename = path.join(temporary, relative);
      await mkdir(path.dirname(filename), { recursive: true });
      await writeFile(filename, bytes);
    }
    await rename(temporary, destination);
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
  return verifyInputs(destination, descriptor);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  const input = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index].slice(2);
    if (
      !args[index].startsWith('--') ||
      !['from', 'archive', 'url', 'output'].includes(key) ||
      !args[index + 1] ||
      key in input
    )
      fail(
        'usage: prepare-formicarium.mjs --from <directory> | --archive <ustar.tar.gz> | --url <HTTPS archive> [--output <directory>]',
      );
    input[key] = args[index + 1];
  }
  console.log(JSON.stringify(await prepareInputs(input)));
}
