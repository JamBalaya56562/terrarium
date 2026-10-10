import { createHash } from 'node:crypto';
import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { archiveFiles } from './prepare-formicarium.mjs';

export const RC_VERSION = '0.1.0-rc.1';
export const RC_SHA256 =
  '8334d7f14c31109e5be3ec90147aa02105d8d839c4c79eccc1c25cb88eabbb3a';
export const RC_NAME = '@aletheia-works/formicarium';
export const RC_INTEGRITY =
  'sha512-SIFbXU1QkxXDATkE0M1Prm65Kq+Q2SkwnDyBwRf/ejEd3mADZT5uueETF+r0AAl4nuDRqbbSkBc7K/fHclwICA==';
const digest = (bytes, algorithm = 'sha256', encoding = 'hex') =>
  createHash(algorithm).update(bytes).digest(encoding);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RC_TARBALL = path.join(
  root,
  '.vendor/formicarium-rc-acceptance/aletheia-works-formicarium-0.1.0-rc.1.tgz',
);
export const RC_PACKAGE = path.join(
  root,
  'packages/terrarium/node_modules',
  RC_NAME,
);

/** Verify compressed published bytes before installation or test preparation. */
export function verifyTarball(tarball, metadata) {
  if (metadata.name !== RC_NAME || metadata.version !== RC_VERSION)
    throw new Error('RC version mismatch');
  const tarballSha256 = digest(tarball);
  if (tarballSha256 !== RC_SHA256) throw new Error('tarball SHA256 mismatch');
  const integrity = `sha512-${digest(tarball, 'sha512', 'base64')}`;
  if (metadata.dist.integrity !== integrity || integrity !== RC_INTEGRITY)
    throw new Error('tarball integrity mismatch');
  return {
    name: metadata.name,
    version: metadata.version,
    tarballSha256,
    integrity,
    tarballUrl: metadata.dist.tarball,
  };
}

/** Compare published bytes, registry identity, exact dependency/lock and every installed file. */
export function verifyIdentity({
  tarball,
  metadata,
  installedFiles,
  dependency,
  lock,
}) {
  if (dependency !== RC_VERSION) throw new Error('RC version mismatch');
  const { tarballSha256, integrity } = verifyTarball(tarball, metadata);
  const lockRows = [
    ...lock.matchAll(/^ {4}"@aletheia-works\/formicarium": (\[[^\n]+\]),?$/gm),
  ];
  const resolution = lockRows.length === 1 ? JSON.parse(lockRows[0][1]) : [];
  if (
    resolution[0] !== `${RC_NAME}@${RC_VERSION}` ||
    resolution[1] !== '' ||
    resolution.at(-1) !== integrity ||
    !lock.includes('"lockfileVersion": 1')
  )
    throw new Error('RC lock resolution mismatch');
  const packed = archiveFiles(tarball);
  const rows = [];
  for (const [name, bytes] of packed) {
    if (!name.startsWith('package/'))
      throw new Error('unexpected tarball root');
    const relative = name.slice('package/'.length);
    const installed = installedFiles.get(relative);
    if (!installed || digest(installed) !== digest(bytes))
      throw new Error(`installed file mismatch: ${relative}`);
    rows.push({ path: relative, size: bytes.length, sha256: digest(bytes) });
  }
  if (installedFiles.size !== rows.length)
    throw new Error('installed file set mismatch');
  const info = JSON.parse(installedFiles.get('package.json'));
  if (info.name !== RC_NAME || info.version !== RC_VERSION)
    throw new Error('installed version mismatch');
  return {
    name: info.name,
    version: info.version,
    integrity,
    tarballSha256,
    tarballUrl: metadata.dist.tarball,
    fileCount: rows.length,
    files: rows,
  };
}

export async function installedFilesAt(directory = RC_PACKAGE) {
  const files = new Map();
  async function walk(prefix = '') {
    for (const name of await readdir(path.join(directory, prefix))) {
      const relative = prefix ? `${prefix}/${name}` : name;
      const filename = path.join(directory, relative);
      const info = await lstat(filename);
      if (info.isSymbolicLink())
        throw new Error(`installed symlink: ${relative}`);
      if (info.isDirectory()) await walk(relative);
      else if (info.isFile()) files.set(relative, await readFile(filename));
      else throw new Error(`installed special file: ${relative}`);
    }
  }
  await walk();
  return files;
}

export async function verifyInstalledRc({
  metadata,
  packageRoot = RC_PACKAGE,
  tarballPath = RC_TARBALL,
} = {}) {
  if (!metadata) {
    const response = await fetch(
      `https://registry.npmjs.org/${RC_NAME}/${RC_VERSION}`,
      { signal: AbortSignal.timeout(30_000) },
    );
    if (!response.ok) throw new Error(`registry HTTP ${response.status}`);
    metadata = await response.json();
  }
  const packageInfo = JSON.parse(
    await readFile(path.join(root, 'packages/terrarium/package.json')),
  );
  return verifyIdentity({
    tarball: await readFile(tarballPath),
    metadata,
    installedFiles: await installedFilesAt(packageRoot),
    dependency: packageInfo.dependencies[RC_NAME],
    lock: await readFile(
      path.join(root, 'packages/terrarium/bun.lock'),
      'utf8',
    ),
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  console.log(JSON.stringify(await verifyInstalledRc(), null, 2));
