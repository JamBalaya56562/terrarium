import { readFile, writeFile, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { validateBuild } from '../../integration/terrarium/guest-distribution/manifest.mjs';
import { validateProvenance, validateGuestElf } from '../../integration/terrarium/guest-distribution/resolver.mjs';
import { convertFixture } from '../../integration/terrarium/guest-distribution/fixtures.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const localBase = 'https://distribution.invalid/';

async function readAsset(path, target) {
  if (typeof path !== 'string' || !path) throw new Error(`${target}: missing input path`);
  try { return new Uint8Array(await readFile(path)); } catch {
    throw new Error(`${target}: input asset unavailable`, { cause: new Error('file read failed') });
  }
}

function parseInfo(bytes) {
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch {
    throw new Error('build-info: input must be provenance JSON');
  }
}

async function prepareBuild(input, existing, tools) {
  if (!input || !['aube', 'pitchfork'].includes(input.tool) || typeof input.ref !== 'string' || !input.ref) {
    throw new Error('producer: invalid tool/ref');
  }
  if (!Object.hasOwn(tools, input.tool)) throw new Error('producer: unknown tool');
  const infoBytes = await readAsset(input.buildInfoPath, 'build-info');
  const info = parseInfo(infoBytes);
  const source = { ...existing?.source, ...info.source };
  const dir = `dist/${input.tool}/${hash(Buffer.from(input.ref))}`;
  const files = new Map();
  const add = (name, bytes) => {
    const url = `${dir}/${name}`;
    files.set(url, bytes);
    return { url, sha256: hash(bytes) };
  };
  const guest = validateGuestElf(await readAsset(input.guestPath, 'guest'));
  const build = { ...existing, schemaVersion: 1, tool: input.tool, ref: input.ref, source,
    built_at: info.built_at, guest: { ...add('guest', guest), format: 'static-musl-x86_64' },
    fixtures: {}, buildInfo: add('build-info.json', infoBytes) };
  validateProvenance(info, build);
  for (const [name, path] of Object.entries(input.fixturePaths ?? {})) {
    const bytes = await readAsset(path, 'fixture');
    convertFixture(parseInfo(bytes), { cwd: tools[input.tool].cwd ?? '/work' });
    Object.defineProperty(build.fixtures, name, { value: add(`fixture-${hash(Buffer.from(name))}.json`, bytes),
      enumerable: true, configurable: true, writable: true });
  }
  validateBuild(build, { tool: input.tool, ref: input.ref, base: localBase });
  return { build, files };
}

function inputCatalog(input) {
  if (!input || !input.tools || typeof input.tools !== 'object' || Array.isArray(input.tools) ||
    !input.manifest || typeof input.manifest !== 'object' || Array.isArray(input.manifest) ||
    !Array.isArray(input.builds) || input.builds.length === 0) throw new Error('producer: invalid input catalogue');
  const manifest = structuredClone(input.manifest);
  manifest.builds ??= {};
  if (typeof manifest.builds !== 'object' || Array.isArray(manifest.builds)) throw new Error('producer: invalid builds');
  return manifest;
}

/** Stage validated inputs once; no builds, downloads, publishing or npm writes. */
export async function stageDistribution(input, output) {
  const manifest = inputCatalog(input);
  const files = new Map();
  const selected = new Set();
  for (const item of input.builds) {
    const key = `${item?.tool}\0${item?.ref}`;
    if (selected.has(key)) throw new Error('producer: duplicate tool/ref');
    selected.add(key);
    const prior = manifest.builds[item.tool]?.[item.ref];
    const prepared = await prepareBuild(item, prior, input.tools);
    manifest.builds[item.tool] ??= {};
    Object.defineProperty(manifest.builds[item.tool], item.ref, { value: prepared.build,
      enumerable: true, configurable: true, writable: true });
    for (const [path, bytes] of prepared.files) files.set(path, bytes);
  }
  files.set('tools.json', json(input.tools));
  files.set('dist/builds.json', json(manifest));
  if (typeof output !== 'string' || !output) throw new Error('producer: missing output directory');
  const destination = resolve(output);
  await mkdir(dirname(destination), { recursive: true });
  const temporary = await mkdtemp(join(dirname(destination), '.guest-stage-'));
  try {
    for (const [path, bytes] of files) {
      const target = join(temporary, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes);
    }
    // rename refuses a nonempty existing destination; existing candidates remain intact.
    await rename(temporary, destination);
  } catch (cause) {
    await rm(temporary, { recursive: true, force: true });
    throw new Error('producer: candidate staging failed', { cause });
  }
  return { output: destination, manifest, files: [...files].map(([path, bytes]) => ({ path, sha256: hash(bytes) })) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [inputPath, output, ...extra] = process.argv.slice(2);
  if (!inputPath || !output || extra.length) throw new Error('usage: stage.mjs <input.json> <output-directory>');
  const input = JSON.parse(await readFile(inputPath, 'utf8'));
  const result = await stageDistribution(input, output);
  console.log(JSON.stringify({ output: result.output, files: result.files }));
}
