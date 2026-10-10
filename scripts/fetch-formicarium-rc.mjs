import { execFileSync } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RC_NAME,
  RC_TARBALL,
  RC_VERSION,
  verifyTarball,
} from './verify-formicarium-rc.mjs';

/** Fetch exact npm bytes into a directory created here; retain any existing pack until verification. */
export async function fetchRc(output = path.dirname(RC_TARBALL)) {
  const destination = path.resolve(output);
  await mkdir(destination, { recursive: true });
  if ((await lstat(destination)).isSymbolicLink())
    throw new Error('RC output directory must not be a symlink');
  const temporary = await mkdtemp(path.join(destination, '.npm-pack-'));
  const commands = [];
  const npm = (args) => {
    const argv = [
      ...args,
      '--registry=https://registry.npmjs.org',
      `--cache=${path.join(temporary, 'cache')}`,
    ];
    commands.push(['npm', ...argv]);
    return JSON.parse(
      execFileSync('npm', argv, {
        encoding: 'utf8',
        timeout: 120_000,
        maxBuffer: 4 * 1024 * 1024,
      }),
    );
  };
  try {
    const metadata = npm([
      'view',
      `${RC_NAME}@${RC_VERSION}`,
      'name',
      'version',
      'dist',
      '--json',
    ]);
    const target = path.join(destination, path.basename(RC_TARBALL));
    try {
      const info = await lstat(target);
      if (!info.isFile() || info.isSymbolicLink())
        throw new Error('RC tarball must be a regular file');
      return {
        ...verifyTarball(await readFile(target), metadata),
        target,
        source: 'verified existing npm pack',
        commands,
      };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const packed = npm([
      'pack',
      `${RC_NAME}@${RC_VERSION}`,
      '--json',
      '--ignore-scripts',
      `--pack-destination=${temporary}`,
    ]);
    if (packed.length !== 1 || packed[0].filename !== path.basename(RC_TARBALL))
      throw new Error('unexpected npm pack filename');
    const downloaded = path.join(temporary, packed[0].filename);
    const identity = verifyTarball(await readFile(downloaded), metadata);
    if (packed[0].integrity !== identity.integrity)
      throw new Error('npm pack integrity mismatch');
    await rename(downloaded, target);
    return {
      ...identity,
      target,
      source: 'npm registry acquisition',
      commands,
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--output'))
    throw new Error('usage: fetch-formicarium-rc.mjs [--output <directory>]');
  console.log(JSON.stringify(await fetchRc(args[1]), null, 2));
}
