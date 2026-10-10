import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyInputs } from './prepare-formicarium.mjs';
import {
  RC_PACKAGE,
  RC_TARBALL,
  verifyInstalledRc,
} from './verify-formicarium-rc.mjs';

const _root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index].slice(2);
  if (
    !['from', 'descriptor', 'output'].includes(key) ||
    !process.argv[index + 1] ||
    key in args
  )
    throw new Error(
      'usage: prepare-formicarium-rc-inputs.mjs --from <verified old inputs> --descriptor <old descriptor.json> --output <new directory>',
    );
  args[key] = path.resolve(process.argv[index + 1]);
}
if (!args.from || !args.descriptor || !args.output)
  throw new Error('explicit --from, --descriptor and --output required');
const source = args.from;
const output = args.output;
const descriptor = JSON.parse(await readFile(args.descriptor));
await verifyInputs(source, descriptor);
const identity = await verifyInstalledRc();
const build = JSON.parse(
  await readFile(path.join(RC_PACKAGE, 'assets/build-info.json')),
);
const manifest = {
  schemaVersion: 1,
  package: identity.name,
  version: identity.version,
  blinkCommit: build.blinkCommit,
  blinkSourceDirty: build.blinkSourceDirty,
  files: identity.files.map(({ path: filename, sha256 }) => ({
    path: filename,
    sha256,
  })),
  publishedRc: {
    integrity: identity.integrity,
    tarballSha256: identity.tarballSha256,
    tarballUrl: identity.tarballUrl,
  },
};
const values = new Map();
for (const row of descriptor.files) {
  values.set(
    row.path,
    row.path === descriptor.tarball
      ? await readFile(RC_TARBALL)
      : row.path === descriptor.packageManifest
        ? Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`)
        : await readFile(path.join(source, row.path)),
  );
}
const updated = {
  ...descriptor,
  publishedRc: manifest.publishedRc,
  files: [...values].map(([filename, bytes]) => ({
    path: filename,
    size: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  })),
};
for (const [filename, bytes] of values) {
  const target = path.join(output, filename);
  await mkdir(path.dirname(target), { recursive: true });
  try {
    if (!(await readFile(target)).equals(bytes))
      throw new Error(`existing input differs: ${filename}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeFile(target, bytes, { flag: 'wx' });
  }
}
await verifyInputs(output, updated);
console.log(JSON.stringify(updated, null, 2));
