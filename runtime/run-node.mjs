// Run a terminal session against a terrarium-built CLI under Node.js, with the
// same Session the browser terminal uses.
//
//   node runtime/run-node.mjs <tool.js> <fixture-dir> <session-file>
//
// Lines of the session file starting with `$ ` are typed into the terminal;
// everything else is ignored. TERRARIUM_CWD picks the starting directory
// inside the fixture; TERRARIUM_TIMING prints how long each command took.

import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Session } from './session.mjs';

const [toolPath, fixtureDir, sessionFile] = process.argv.slice(2);
const require = createRequire(import.meta.url);

function fixtureFiles(dir, rel = '') {
  return readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap((entry) => {
    const child = rel ? `${rel}/${entry.name}` : entry.name;
    return entry.isDirectory()
      ? fixtureFiles(dir, child)
      : [[child, readFileSync(path.join(dir, child))]];
  });
}

const session = new Session({
  tool: {
    name: path.basename(toolPath, '.js'),
    factory: require(path.resolve(toolPath)),
    wasmModule: new WebAssembly.Module(readFileSync(toolPath.replace(/\.js$/, '.wasm'))),
  },
  write: (text) => process.stdout.write(text),
  cwd: `/work/${process.env.TERRARIUM_CWD ?? ''}`.replace(/\/$/, ''),
});
session.seed(fixtureFiles(fixtureDir));

for (const line of readFileSync(sessionFile, 'utf8').split(/\r?\n/)) {
  if (!line.startsWith('$ ')) continue;
  process.stdout.write(`\n${line}\n`);
  const started = performance.now();
  const code = await session.run(line.slice(2));
  if (code !== 0) process.stdout.write(`[exit ${code}]\n`);
  if (process.env.TERRARIUM_TIMING) {
    process.stdout.write(`[${((performance.now() - started) / 1000).toFixed(2)} s]\n`);
  }
}
