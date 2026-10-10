import { spawn } from 'node:child_process';
import { cp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  candidateFile,
  candidateTransaction,
} from './candidate-transaction.mjs';
import { explicitInputs, prepareFormicarium } from './stage-formicarium.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function command(program, args, cwd) {
  await new Promise((resolve, reject) => {
    const child = spawn(program, args, { cwd, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) =>
      code === 0
        ? resolve()
        : reject(
            new Error(`${program} failed: exit ${code}, signal ${signal}`),
          ),
    );
  });
}

/** Assemble all web assets, bundle, stamps and root entry before one candidate switch. */
export async function assembleCandidate({
  destination,
  mode = 'formicarium',
  version = new Date().toISOString().replace(/\D/g, ''),
  protectedPaths = [],
  checkpoint = async () => {},
  inputs,
  sourceRoot = ROOT,
  bundle,
} = {}) {
  if (!['formicarium', 'legacy'].includes(mode))
    throw new Error(`unknown assembly mode: ${mode}`);
  if (!/^[a-zA-Z0-9_.-]+$/.test(version))
    throw new Error('invalid version stamp');
  const prepared =
    mode === 'formicarium'
      ? await prepareFormicarium(inputs ?? (await explicitInputs()))
      : null;
  if (mode === 'legacy') {
    const builds = JSON.parse(
      await readFile(path.join(sourceRoot, 'web/dist/builds.json'), 'utf8'),
    );
    if (
      process.env.TERRARIUM_PITCHFORK_REF &&
      !builds.builds?.pitchfork?.[process.env.TERRARIUM_PITCHFORK_REF]
    )
      throw new Error('missing explicit legacy pitchfork ref');
  }
  return candidateTransaction({
    destination,
    protectedPaths: [
      sourceRoot,
      ...protectedPaths,
      process.env.TERRARIUM_PROTECTED_SITE,
    ].filter((name) => name && path.resolve(name) !== ROOT),
    inputIdentity: prepared?.inputIdentity,
    checkpoint,
    build: async (work) => {
      await cp(path.join(sourceRoot, 'web'), path.join(work, 'web'), {
        recursive: true,
        dereference: false,
        verbatimSymlinks: true,
      });
      await cp(path.join(sourceRoot, 'LICENSE'), path.join(work, 'LICENSE'));
      await writeFile(await candidateFile(work, '.nojekyll'), '');
      await checkpoint('assembly-copy', { work });
      if (prepared) await prepared.stage(path.join(work, 'web'), checkpoint);
      if (mode === 'legacy' && process.env.TERRARIUM_PITCHFORK_REF) {
        const filename = await candidateFile(work, 'web/tools.json');
        const tools = JSON.parse(await readFile(filename, 'utf8'));
        tools.pitchfork.default = process.env.TERRARIUM_PITCHFORK_REF;
        await writeFile(filename, `${JSON.stringify(tools, null, 2)}\n`);
      }
      await candidateFile(work, 'web/terrarium.mjs');
      if (bundle) await bundle(work, version);
      else {
        const packageRoot = path.join(ROOT, 'packages/terrarium');
        await command('bun', ['run', 'gen'], packageRoot);
        await command(
          'bun',
          [
            'build',
            path.join(packageRoot, 'src/index.ts'),
            '--outfile',
            path.join(work, 'web/terrarium.mjs'),
            '--format',
            'esm',
            '--target',
            'browser',
            '--minify',
            '--define',
            `__TERRARIUM_VERSION__=${JSON.stringify(version)}`,
          ],
          packageRoot,
        );
      }
      await checkpoint('assembly-bundle', { work });
      for (const [relative, from, to] of [
        [
          'web/index.html',
          'src="terminal.mjs"',
          `src="terminal.mjs?v=${version}"`,
        ],
        [
          'web/terminal.mjs',
          "from './terrarium.mjs'",
          `from './terrarium.mjs?v=${version}'`,
        ],
      ]) {
        const filename = await candidateFile(work, relative);
        const text = await readFile(filename, 'utf8');
        if (!text.includes(from))
          throw new Error(`assembly stamp missing: ${relative}`);
        await writeFile(filename, text.replace(from, to));
      }
      await checkpoint('assembly-stamp', { work });
      await writeFile(
        await candidateFile(work, 'index.html'),
        `<!doctype html>\n<meta charset="utf-8" />\n<script>location.replace('web/' + location.search);</script>\n<meta http-equiv="refresh" content="0; url=web/" />\n<title>terrarium</title>\n<a href="web/">terrarium</a>\n`,
      );
      await checkpoint('assembly-root', { work });
      return { version, mode };
    },
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (!process.argv[2])
    throw new Error(
      'usage: assemble-candidate.mjs <site dir> [formicarium|legacy]',
    );
  const result = await assembleCandidate({
    destination: process.argv[2],
    mode: process.argv[3] ?? 'formicarium',
    version: process.env.TERRARIUM_VERSION,
  });
  console.log(
    JSON.stringify({
      ...result.result,
      attempt_id: result.transaction.attempt_id,
      recordPath: result.recordPath,
    }),
  );
}
