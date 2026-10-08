import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { INPUT_ROOT, verifyInputs } from './prepare-formicarium.mjs';

export const RUNTIME_FILES = Object.freeze([
  'runtime/public.mjs',
  'runtime/errors.mjs',
  'runtime/validation.mjs',
  'runtime/state.mjs',
  'runtime/lifecycle.mjs',
  'runtime/protocol.mjs',
  'runtime/worker-execution.mjs',
  'runtime/core.mjs',
  'runtime/guest-io.mjs',
  'runtime/node/api.mjs',
  'runtime/node/package-worker.mjs',
  'runtime/web/api.mjs',
  'runtime/web/package-worker.mjs',
  'types/index.d.ts',
  'types/node.d.ts',
  'types/browser.d.ts',
  'assets/blink.mjs',
  'assets/blink.wasm',
  'assets/build-info.json',
  'LICENSE',
  'THIRD_PARTY_NOTICES.md',
  'README.md',
  'package.json',
]);
const MODULES = ['manifest.mjs', 'fixtures.mjs', 'resolver.mjs'];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = async (filename) => JSON.parse(await readFile(filename, 'utf8'));

async function regular(root, relative) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(`${path.resolve(root)}${path.sep}`))
    throw new Error('asset escapes root');
  if (!(await lstat(target)).isFile())
    throw new Error(`regular file required: ${relative}`);
  const resolved = await realpath(target);
  if (!resolved.startsWith(`${await realpath(root)}${path.sep}`))
    throw new Error('asset escapes canonical root');
  return readFile(target);
}

async function runtimeInputs(packageRoot, manifestPath) {
  const manifest = await json(manifestPath);
  if (
    manifest.package !== '@aletheia-works/formicarium' ||
    manifest.blinkSourceDirty !== false ||
    !Array.isArray(manifest.files) ||
    manifest.files.length !== RUNTIME_FILES.length
  )
    throw new Error('invalid package identity');
  const files = [];
  for (const relative of RUNTIME_FILES) {
    const matches = manifest.files.filter((entry) => entry.path === relative);
    const bytes = await regular(packageRoot, relative);
    if (matches.length !== 1 || matches[0].sha256 !== sha(bytes))
      throw new Error(`package digest mismatch: ${relative}`);
    files.push({ relative: `formicarium/${relative}`, bytes });
  }
  const packageInfo = JSON.parse(
    files.find((entry) => entry.relative === 'formicarium/package.json').bytes,
  );
  if (
    packageInfo.name !== manifest.package ||
    packageInfo.version !== manifest.version
  )
    throw new Error('installed version mismatch');
  const build = JSON.parse(
    files.find(
      (entry) => entry.relative === 'formicarium/assets/build-info.json',
    ).bytes,
  );
  if (
    build.blinkSourceDirty !== false ||
    build.blinkCommit !== manifest.blinkCommit ||
    build.assetDigests?.loaderSha256 !==
      sha(
        files.find((entry) => entry.relative === 'formicarium/assets/blink.mjs')
          .bytes,
      ) ||
    build.assetDigests?.wasmSha256 !==
      sha(
        files.find(
          (entry) => entry.relative === 'formicarium/assets/blink.wasm',
        ).bytes,
      )
  ) {
    throw new Error('core identity mismatch');
  }
  return { files, manifest };
}

async function guestInputs(guestSite, resolverRoot) {
  const tools = await json(path.join(guestSite, 'tools.json'));
  const manifest = await json(path.join(guestSite, 'dist/builds.json'));
  const modules = await Promise.all(
    MODULES.map(async (name) => ({
      relative: `formicarium-guest-distribution/${name}`,
      bytes: await regular(resolverRoot, name),
    })),
  );
  const { validateBuild, resolveAssetUrl } = await import(
    pathToFileURL(path.join(resolverRoot, 'manifest.mjs')).href
  );
  const { validateProvenance, validateGuestElf } = await import(
    pathToFileURL(path.join(resolverRoot, 'resolver.mjs')).href
  );
  const boundary = 'https://stage.invalid/web/';
  const files = new Map();
  for (const tool of ['aube', 'pitchfork']) {
    if (!tools[tool] || !manifest.builds?.[tool]?.[tools[tool].default])
      throw new Error(`missing default build: ${tool}`);
    for (const [ref, build] of Object.entries(manifest.builds[tool])) {
      validateBuild(build, { tool, ref, base: boundary });
      const assets = [
        build.guest,
        build.buildInfo,
        ...Object.values(build.fixtures),
      ];
      for (const asset of assets) {
        const relative = new URL(
          resolveAssetUrl(asset.url, boundary),
        ).pathname.slice('/web/'.length);
        const bytes = await regular(guestSite, relative);
        if (sha(bytes) !== asset.sha256)
          throw new Error(`guest digest mismatch: ${relative}`);
        files.set(relative, bytes);
      }
      const local = (asset) =>
        new URL(resolveAssetUrl(asset.url, boundary)).pathname.slice(
          '/web/'.length,
        );
      validateGuestElf(files.get(local(build.guest)));
      validateProvenance(JSON.parse(files.get(local(build.buildInfo))), build);
    }
  }
  return {
    tools,
    manifest,
    files: [...files].map(([relative, bytes]) => ({ relative, bytes })),
    modules,
  };
}

async function optionalJson(filename, fallback) {
  try {
    return await json(filename);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return fallback;
  }
}

/** Validate every advertised ref and the exact installed pack before writing. */
export async function stageFormicarium({
  webRoot,
  packageRoot,
  packageManifest,
  guestSite,
  resolverRoot,
}) {
  const runtime = await runtimeInputs(packageRoot, packageManifest);
  const guests = await guestInputs(guestSite, resolverRoot);
  const oldTools = await optionalJson(path.join(webRoot, 'tools.json'), {});
  const oldBuilds = await optionalJson(path.join(webRoot, 'dist/builds.json'), {
    builds: {},
  });
  // Preserve metadata for unrelated tools. Target tools use the complete verified catalogue.
  const tools = { ...oldTools, ...guests.tools };
  const builds = {
    ...oldBuilds,
    ...guests.manifest,
    builds: { ...oldBuilds.builds, ...guests.manifest.builds },
  };
  const files = [
    ...runtime.files,
    ...guests.modules,
    ...guests.files,
    {
      relative: 'tools.json',
      bytes: Buffer.from(`${JSON.stringify(tools, null, 2)}\n`),
    },
    {
      relative: 'dist/builds.json',
      bytes: Buffer.from(`${JSON.stringify(builds, null, 2)}\n`),
    },
  ];
  for (const entry of files) {
    const target = path.join(webRoot, entry.relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, entry.bytes);
  }
  const receipt = {
    schemaVersion: 1,
    installedVersion: runtime.manifest.version,
    packageManifestSha256: sha(await readFile(packageManifest)),
    files: files.map(({ relative, bytes }) => ({
      path: relative,
      sha256: sha(bytes),
    })),
    guests: Object.entries(guests.manifest.builds).flatMap(([tool, refs]) =>
      Object.entries(refs).map(([ref, build]) => ({
        tool,
        ref,
        commit: build.source.commit,
        guestSha256: build.guest.sha256,
      })),
    ),
    status: 'local-pack-only; published RC acceptance unverified',
  };
  await writeFile(
    path.join(webRoot, 'formicarium-stage.json'),
    `${JSON.stringify(receipt, null, 2)}\n`,
  );
  return receipt;
}

export async function explicitInputs() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const inputs = process.env.FORMICARIUM_INPUTS_ROOT ?? INPUT_ROOT;
  await verifyInputs(inputs);
  const descriptor = await json(
    path.join(root, 'integration/formicarium-inputs.json'),
  );
  const options = {
    packageRoot: path.join(
      root,
      'packages/terrarium/node_modules/@aletheia-works/formicarium',
    ),
    packageManifest: path.join(inputs, descriptor.packageManifest),
    guestSite: path.join(inputs, descriptor.guestSite),
    resolverRoot: path.join(inputs, descriptor.resolver),
  };
  // All validation occurs before assembly removes or writes its output.
  await runtimeInputs(options.packageRoot, options.packageManifest);
  await guestInputs(options.guestSite, options.resolverRoot);
  return options;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const options = await explicitInputs();
  if (process.argv[2] === '--check')
    console.log('formicarium inputs and installed package verified');
  else {
    if (!process.argv[2])
      throw new Error('usage: stage-formicarium.mjs --check | <site/web>');
    console.log(
      JSON.stringify(
        await stageFormicarium({
          ...options,
          webRoot: path.resolve(process.argv[2]),
        }),
      ),
    );
  }
}
