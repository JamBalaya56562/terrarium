import { createHash } from 'node:crypto';
import { lstat, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  candidateFile,
  candidateTransaction,
} from './candidate-transaction.mjs';
import { INPUT_ROOT, verifyInputs } from './prepare-formicarium.mjs';
import {
  RC_NAME,
  RC_TARBALL,
  RC_VERSION,
  verifyInstalledRc,
} from './verify-formicarium-rc.mjs';

export const RUNTIME_FILES = Object.freeze([
  'runtime/contracts.js',
  'runtime/public.js',
  'runtime/errors.js',
  'runtime/validation.js',
  'runtime/state.js',
  'runtime/lifecycle.js',
  'runtime/protocol.js',
  'runtime/worker-execution.js',
  'runtime/core.js',
  'runtime/guest-io.js',
  'runtime/node/api.js',
  'runtime/node/package-worker.js',
  'runtime/web/api.js',
  'runtime/web/package-worker.js',
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
const MODULES = ['manifest.js', 'fixtures.js', 'resolver.js'];
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
  if (manifest.publishedRc) {
    const identity = await verifyInstalledRc({
      packageRoot,
      tarballPath: path.join(
        path.dirname(manifestPath),
        path.basename(RC_TARBALL),
      ),
      metadata: {
        name: RC_NAME,
        version: RC_VERSION,
        dist: {
          integrity: manifest.publishedRc.integrity,
          tarball: manifest.publishedRc.tarballUrl,
        },
      },
    });
    if (manifest.publishedRc.tarballSha256 !== identity.tarballSha256)
      throw new Error('published RC manifest tarball mismatch');
  }
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
    pathToFileURL(path.join(resolverRoot, 'manifest.js')).href
  );
  const { validateProvenance, validateGuestElf } = await import(
    pathToFileURL(path.join(resolverRoot, 'resolver.js')).href
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
    const info = await lstat(filename);
    if (!info.isFile() || info.isSymbolicLink())
      throw new Error(`regular metadata file required: ${filename}`);
    return await json(filename);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return fallback;
  }
}

/** Validate every advertised ref and the exact installed pack before writing. */
export async function prepareFormicarium({
  packageRoot,
  packageManifest,
  guestSite,
  resolverRoot,
  fixedInputIdentity,
}) {
  const runtime = await runtimeInputs(packageRoot, packageManifest);
  const guests = await guestInputs(guestSite, resolverRoot);
  const packageManifestSha256 = sha(await readFile(packageManifest));
  return {
    inputIdentity:
      fixedInputIdentity ??
      sha(
        Buffer.from(
          JSON.stringify({
            packageManifestSha256,
            files: [...runtime.files, ...guests.modules, ...guests.files]
              .map(({ relative, bytes }) => ({
                path: relative,
                sha256: sha(bytes),
              }))
              .sort((a, b) => a.path.localeCompare(b.path)),
            tools: guests.tools,
            builds: guests.manifest,
          }),
        ),
      ),
    async stage(webRoot, checkpoint = async () => {}) {
      const oldTools = await optionalJson(path.join(webRoot, 'tools.json'), {});
      const oldBuilds = await optionalJson(
        path.join(webRoot, 'dist/builds.json'),
        {
          builds: {},
        },
      );
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
        const target = await candidateFile(webRoot, entry.relative);
        await writeFile(target, entry.bytes);
        await checkpoint('stage-write', { target });
      }
      const receipt = {
        schemaVersion: 1,
        installedVersion: runtime.manifest.version,
        packageManifestSha256,
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
        publishedRc: runtime.manifest.publishedRc,
        status: runtime.manifest.publishedRc
          ? 'published RC staged; execution acceptance recorded separately'
          : 'local-pack-only; published RC acceptance unverified',
      };
      await writeFile(
        await candidateFile(webRoot, 'formicarium-stage.json'),
        `${JSON.stringify(receipt, null, 2)}\n`,
      );
      return receipt;
    },
  };
}

export async function stageFormicarium(options) {
  const prepared = await prepareFormicarium(options);
  const completed = await candidateTransaction({
    destination: options.webRoot,
    protectedPaths: [
      process.env.TERRARIUM_PROTECTED_SITE,
      options.packageRoot,
      options.guestSite,
      options.resolverRoot,
    ],
    inputIdentity: prepared.inputIdentity,
    seedExisting: true,
    checkpoint: options.checkpoint,
    build: (work) => prepared.stage(work, options.checkpoint),
  });
  return completed.result;
}

export async function explicitInputs() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const inputs = process.env.FORMICARIUM_INPUTS_ROOT ?? INPUT_ROOT;
  const verified = await verifyInputs(inputs);
  const descriptor = await json(
    path.join(root, 'integration/formicarium-inputs.json'),
  );
  const options = {
    fixedInputIdentity: verified.normalizedDescriptorSha256,
    packageRoot: path.join(
      root,
      'packages/terrarium/node_modules/@aletheia-works/formicarium',
    ),
    packageManifest: path.join(inputs, descriptor.packageManifest),
    guestSite: path.join(inputs, descriptor.guestSite),
    resolverRoot: path.join(inputs, descriptor.resolver),
  };
  if (descriptor.publishedRc) {
    const manifest = await json(options.packageManifest);
    if (
      JSON.stringify(manifest.publishedRc) !==
      JSON.stringify(descriptor.publishedRc)
    )
      throw new Error('published RC manifest identity mismatch');
  }
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
