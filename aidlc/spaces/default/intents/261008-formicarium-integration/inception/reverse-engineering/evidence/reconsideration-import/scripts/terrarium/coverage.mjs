import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, cp, symlink, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FIRST_PARTY_JS } from '../package/stage-package.mjs';
import { directoryIdentity, sha256 } from './evidence.mjs';

const require = createRequire(import.meta.url);
const { createInstrumenter } = require('istanbul-lib-instrument');
const { createCoverageMap } = require('istanbul-lib-coverage');
const ts = require('typescript');
const root = fileURLToPath(new URL('../../', import.meta.url));
export const U2_FILES = ['manifest', 'fixtures', 'resolver'].map((name) => `integration/terrarium/guest-distribution/${name}.mjs`);
export const U3_FILES = ['formicarium-session', 'catalog', 'terminal', 'session', 'index', 'npm'].map((name) => `terrarium/packages/terrarium/src/${name}.ts`).concat('terrarium/web/terminal.mjs');
export const FILES = Object.freeze([...FIRST_PARTY_JS, ...U2_FILES, ...U3_FILES]);
export const BROWSER_TITLES = Object.freeze([
  'latest aube ready fields, events and actual Worker version',
  'latest pitchfork uses common runtime actual Worker version',
  'nested cwd keeps /work sibling before and after actual guest',
  'empty fixture and empty command have no added exit event',
  'normal nonzero exit and unsupported syntax error once; queue recovers',
  'run attributes and concurrent calls retain serial command order',
  'keyboard focus deletion arrows history and Ctrl-C preserve terminal controls',
  'tool switch resets attributes and suppresses prior queued run notifications',
  'disconnect invalidates old work and reconnect creates independent session',
  'boot error rejects ready once without creating any guest Worker',
  ...['same-origin', 'cross-origin', 'missing-isolation'].map((condition) => `iframe condition ${condition}: exact origins and guest marker oracle`),
  'invalid opaque wildcard and unknown parent origins never connect or notify',
  'unapproved parent origin cannot run or receive notifications even when syntax is valid',
]);
const PROJECTS = ['chromium', 'firefox', 'webkit'];
const u1Inventory = JSON.parse(await readFile(new URL('../package/coverage-inventory.json', import.meta.url), 'utf8'));
export const REQUIRED_U1_REALMS = Object.freeze(['node-host',
  ...Array.from({ length: u1Inventory.node.workers }, (_, index) => `node-worker-${index + 1}`),
  ...PROJECTS.flatMap((project) => Object.entries(u1Inventory.browserCases).flatMap(([title, workers]) =>
    [`${project}:${title}:browser-host`, ...Array.from({ length: workers }, (_, index) => `${project}:${title}:browser-worker-${index + 1}`)]))]);
const save = (filename, value) => writeFile(filename, `${JSON.stringify(value, null, 2)}\n`);
const json = async (filename) => JSON.parse(await readFile(filename, 'utf8'));
function binding(inventory) {
  return { generation: inventory.generation, sourceIdentity: inventory.sourceIdentity, candidateSha256: inventory.candidate.sha256 };
}

function validateInventory(inventory) {
  if (JSON.stringify(inventory.files) !== JSON.stringify(FILES) || !inventory.generation ||
      inventory.sourceIdentity !== sha256(JSON.stringify(inventory.digests))) throw new Error('fixed inventory/source identity differs');
  for (const field of ['metadata', 'digests']) {
    if (!Array.isArray(inventory[field]) || inventory[field].length !== FILES.length ||
        new Set(inventory[field].map((row) => row.path)).size !== FILES.length ||
        !inventory[field].every((row) => FILES.includes(row.path))) throw new Error('fixed denominator differs');
  }
  for (const file of inventory.metadata) {
    if (Object.values(file.s).some((value) => value !== 0) || Object.values(file.f).some((value) => value !== 0) ||
        Object.values(file.b).some((values) => values.some((value) => value !== 0))) throw new Error('nonzero inventory seed');
    const row = inventory.digests.find((row) => row.path === file.path);
    if (row.statementMapSha256 !== sha256(JSON.stringify(file.statementMap))) throw new Error('statement map changed');
  }
}

/** Import old component coverage explicitly; never pretend it ran in this generation. */
export function componentImport(inventory, report, reportSha256) {
  if (report.candidateSha256 !== inventory.tarballSha256 || report.threshold !== 80 || !report.passed ||
      !Array.isArray(report.realmNames) || new Set(report.realmNames).size !== report.realmNames.length) throw new Error('U1 component evidence identity differs');
  for (const prefix of ['node-host', 'node-worker-', ...PROJECTS.map((project) => `${project}:`)]) {
    if (!report.realmNames.some((name) => name.startsWith(prefix))) throw new Error('U1 component realm missing');
  }
  if (JSON.stringify([...report.realmNames].sort()) !== JSON.stringify([...REQUIRED_U1_REALMS].sort())) throw new Error('U1 planned realm inventory differs');
  if (report.files.length !== FIRST_PARTY_JS.length || new Set(report.files.map((file) => file.path)).size !== FIRST_PARTY_JS.length) throw new Error('U1 denominator differs');
  const coverage = {};
  for (const path of FIRST_PARTY_JS) {
    const file = structuredClone(inventory.metadata.find((row) => row.path === path));
    const source = inventory.digests.find((row) => row.path === path);
    const old = report.digests.find((row) => row.path === path);
    const counts = report.files.find((row) => row.path === path)?.lines;
    if (!old || !counts || old.sourceSha256 !== source.sourceSha256 || old.statementMapSha256 !== source.statementMapSha256) throw new Error('U1 component source changed');
    for (const [key, statement] of Object.entries(file.statementMap)) {
      const count = counts[String(statement.start.line)];
      if (!Number.isInteger(count) || count < 0) throw new Error('U1 component line counter missing');
      file.s[key] = count;
    }
    coverage[path] = file;
  }
  return { kind: 'immutable-component-import', originalReportSha256: reportSha256, originalGeneration: 'u1-coverage-v9',
    originalSourceIdentity: sha256(JSON.stringify(report.digests)), originalTarballSha256: report.candidateSha256,
    originalRealmNames: report.realmNames, originalCommandFamily: 'U1 fixed-inventory Node/three-browser coverage; original native report retained', coverage };
}

export function mergeMeasurements(inventory, rows, component) {
  validateInventory(inventory);
  const expected = binding(inventory);
  for (const row of rows) {
    if (Object.keys(expected).some((key) => row[key] !== expected[key])) throw new Error('stale generation/source/candidate receipt');
    if (row.status !== 'passed' || (row.realm === 'browser-host' && row.expectedStatus !== 'passed')) throw new Error('unsuccessful or skipped measurement');
  }
  if (rows.filter((row) => row.realm === 'node-host').length !== 1) throw new Error('Node realm missing or duplicate');
  for (const project of PROJECTS) for (const title of BROWSER_TITLES) {
    if (rows.filter((row) => row.realm === 'browser-host' && row.project === project && row.title === title).length !== 1) throw new Error(`browser realm missing or duplicate: ${project}/${title}`);
  }
  if (rows.length !== 1 + PROJECTS.length * BROWSER_TITLES.length) throw new Error('unexpected measurement receipt');
  if (!component || component.kind !== 'immutable-component-import') throw new Error('U1 Worker component import missing');
  const map = createCoverageMap({});
  for (const file of inventory.metadata) map.addFileCoverage(structuredClone(file));
  for (const measurement of [...rows, component]) {
    for (const [path, file] of Object.entries(measurement.coverage ?? {})) {
      const expected = inventory.metadata.find((row) => row.path === path);
      if (!expected || JSON.stringify(expected.statementMap) !== JSON.stringify(file.statementMap)) throw new Error('measurement source map differs');
      map.merge({ [path]: file });
    }
  }
  const lines = map.getCoverageSummary().lines;
  return { map, lines, passed: lines.pct >= 80, files: FILES.map((path) => ({ path, lines: map.fileCoverageFor(path).toSummary().lines })) };
}

export async function prepareCoverage({ out, site, terrarium, packageRoot, tarball, u1Report }) {
  // EEXIST is intentional: old results can never be adopted by re-preparing.
  out = resolve(out); await mkdir(out);
  const candidate = await directoryIdentity(site);
  const metadata = [], digests = [];
  const instrumentedSite = join(out, 'site'); await cp(site, instrumentedSite, { recursive: true });
  const workspace = join(out, 'terrarium/packages/terrarium');
  await mkdir(workspace, { recursive: true });
  for (const name of ['src', 'tests', 'e2e']) await cp(join(terrarium, 'packages/terrarium', name), join(workspace, name), { recursive: true });
  await cp(join(terrarium, 'scripts'), join(out, 'terrarium/scripts'), { recursive: true });
  await symlink(join(terrarium, 'packages/terrarium/node_modules'), join(workspace, 'node_modules'));
  await cp(join(terrarium, 'packages/terrarium/package.json'), join(workspace, 'package.json'));
  for (const path of FILES) {
    const original = path.startsWith('terrarium/') ? join(terrarium, path.slice('terrarium/'.length))
      : U2_FILES.includes(path) ? join(root, path) : join(packageRoot, path);
    const bytes = await readFile(original);
    const compiled = path.endsWith('.ts') ? ts.transpileModule(bytes.toString(), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText : bytes.toString();
    const instrumenter = createInstrumenter({ esModules: true, compact: false, coverageGlobalScope: 'globalThis', coverageGlobalScopeFunc: false });
    const text = instrumenter.instrumentSync(compiled, path); const file = instrumenter.lastFileCoverage();
    metadata.push(file); digests.push({ path, original, sourceSha256: sha256(bytes), compiledSha256: sha256(compiled), statementMapSha256: sha256(JSON.stringify(file.statementMap)) });
    if (U3_FILES.includes(path) && path.endsWith('.ts')) await writeFile(join(out, path), text);
    else if (U3_FILES.includes(path)) await writeFile(join(instrumentedSite, 'web/terminal.mjs'), text);
    else if (U2_FILES.includes(path)) await writeFile(join(instrumentedSite, 'web/formicarium-guest-distribution', path.split('/').at(-1)), text);
    // U1 maps stay zero until the immutable same-pack component evidence is imported.
  }
  const inventory = { schemaVersion: 1, generation: randomUUID(), files: FILES, metadata, digests,
    sourceIdentity: sha256(JSON.stringify(digests)), candidate, tarballSha256: sha256(await readFile(tarball)), u1Report: resolve(u1Report),
    exclusions: { thirdParty: 'xterm and generated blink loader/wasm, verified separately', tests: 'verification-only', scripts: 'development-only', types: 'declarations checked separately', guests: 'external ELF verified/executed separately' } };
  const componentBytes = await readFile(u1Report);
  inventory.u1ReportSha256 = sha256(componentBytes);
  componentImport(inventory, JSON.parse(componentBytes), sha256(componentBytes));
  await save(join(out, 'inventory.json'), inventory);
  await mkdir(join(out, 'receipts'));
  const identity = JSON.stringify(binding(inventory));
  await writeFile(join(out, 'node-preload.mjs'), nodePreloadSource(inventory, out));
  const assetTest = join(workspace, 'tests/formicarium-assets.test.ts');
  await writeFile(assetTest, (await readFile(assetTest, 'utf8')).replace("path.resolve(import.meta.dir, '../../../../formicarium/integration/terrarium/guest-distribution')", JSON.stringify(join(root, 'integration/terrarium/guest-distribution'))));
  for (const name of ['formicarium-terminal.spec.ts', 'formicarium-iframe.spec.ts']) {
    const filename = join(workspace, 'e2e', name), source = await readFile(filename, 'utf8');
    await writeFile(filename, `import {writeFile as u3CoverageWrite} from 'node:fs/promises';\n${source}\ntest.afterEach(async({page},info)=>{const coverage={};for(const frame of page.frames()){const measured=await frame.evaluate(()=>globalThis.__coverage__??{});for(const [path,file]of Object.entries(measured)){if(coverage[path])throw Error('duplicate measured module realm; separate merging required');coverage[path]=file;}}await u3CoverageWrite(info.outputPath('coverage-realms.json'),JSON.stringify({...${identity},realm:'browser-host',project:info.project.name,title:info.title,status:info.status,expectedStatus:info.expectedStatus,coverage}));});\n`);
  }
  const config = await readFile(join(terrarium, 'packages/terrarium/playwright.formicarium.config.ts'), 'utf8');
  await writeFile(join(workspace, 'playwright.formicarium.config.ts'), config.replace("testDir: 'e2e'", `outputDir: ${JSON.stringify(join(out, 'browser-results'))}, testDir: 'e2e'`).replaceAll('../../.site', instrumentedSite));
  return { out, workspace, instrumentedSite, generation: inventory.generation,
    mainBundleRequired: `Bun build ${join(workspace, 'src/index.ts')} --outfile ${join(instrumentedSite, 'web/terrarium.mjs')} --format esm --target browser --define __TERRARIUM_VERSION__=\"u3-coverage\"`,
    mainNodeTests: 'Node scripts/terrarium/coverage.mjs node <out> <absolute-Bun-executable>',
    status: 'prepared, measurements/threshold/CI unverified' };
}

export function nodePreloadSource(inventory, out) {
  return `import {afterAll} from 'bun:test';\nimport {writeFileSync} from 'node:fs';\nafterAll(()=>{if(!process.env.U3_NODE_ATTEMPT)throw Error('main collector attempt missing');writeFileSync(${JSON.stringify(join(out, 'node-raw.json'))},JSON.stringify({...${JSON.stringify(binding(inventory))},attempt:process.env.U3_NODE_ATTEMPT,coverage:globalThis.__coverage__??{}}));});\n`;
}
export function finalizeNodeMeasurement(inventory, raw, attempt, exitCode) {
  if (!raw || raw.attempt !== attempt || Object.entries(binding(inventory)).some(([key,value])=>raw[key]!==value)) throw new Error('fresh raw hook missing or binding differs');
  if (!Number.isInteger(exitCode)) throw new Error('observed process exit missing');
  return {...binding(inventory),realm:'node-host',status:exitCode===0?'passed':'failed',attempt,exitCode,coverage:raw.coverage};
}
export async function collectNodeMeasurement(out, executable) {
  out=resolve(out); const inventory=await json(join(out,'inventory.json'));validateInventory(inventory);
  const attempt=randomUUID();
  // Refresh the hook for this generation; only a new observed run can finalize it.
  await writeFile(join(out,'node-preload.mjs'),nodePreloadSource(inventory,out));
  const workspace=join(out,'terrarium/packages/terrarium');
  const args=['test','--preload',join(out,'node-preload.mjs'),...['session','catalog','assets'].map(name=>join(workspace,`tests/formicarium-${name}.test.ts`))];
  const exitCode=await new Promise((accept,reject)=>{const child=spawn(executable,args,{stdio:'inherit',env:{...process.env,U3_NODE_ATTEMPT:attempt}});child.once('error',reject);child.once('exit',code=>accept(code));});
  let raw;try{raw=await json(join(out,'node-raw.json'));}catch{throw new Error('fresh raw hook missing');}
  const receipt=finalizeNodeMeasurement(inventory,raw,attempt,exitCode);
  await save(join(out,'receipts/node.json'),{...receipt,command:[executable,...args]});
  if(exitCode!==0)throw new Error(`Node measurement child failed: ${exitCode}`);
  return receipt;
}

async function receipts(directory) {
  const rows = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...await receipts(filename));
    else if (entry.name === 'coverage-realms.json' || entry.name === 'node.json') rows.push(await json(filename));
  }
  return rows;
}
export async function reportCoverage(out) {
  out = resolve(out); const inventory = await json(join(out, 'inventory.json')); validateInventory(inventory);
  if ((await directoryIdentity(inventory.candidate.root)).sha256 !== inventory.candidate.sha256) throw new Error('candidate changed after preparation');
  for (const row of inventory.digests) if (sha256(await readFile(row.original)) !== row.sourceSha256) throw new Error('source changed after preparation');
  const componentBytes = await readFile(inventory.u1Report);
  if (sha256(componentBytes) !== inventory.u1ReportSha256) throw new Error('immutable U1 component report changed');
  const component = componentImport(inventory, JSON.parse(componentBytes), sha256(componentBytes));
  const rows = [...await receipts(join(out, 'receipts')), ...await receipts(join(out, 'browser-results'))];
  const result = mergeMeasurements(inventory, rows, component);
  await save(join(out, 'coverage-final.json'), result.map.toJSON());
  await save(join(out, 'report.json'), { ...binding(inventory), lines: result.lines, files: result.files, passed: result.passed,
    fixedInventory: FILES, freshReceipts: rows.map(({ coverage, ...identity }) => identity),
    componentImport: { ...component, coverage: undefined }, exclusions: inventory.exclusions,
    ci: 'unverified; U4 must execute before integration', pages: 'local Pages-like host only; real Pages unverified' });
  if (!result.passed) throw new Error(`fixed23 line coverage ${result.lines.pct}% is below unchanged 80%`);
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, input] = process.argv.slice(2);
  if (command === 'prepare' && input) console.log(JSON.stringify(await prepareCoverage(await json(input))));
  else if (command === 'node' && input && process.argv[4]) { const { coverage, ...receipt } = await collectNodeMeasurement(input, process.argv[4]); console.log(JSON.stringify(receipt)); }
  else if (command === 'report' && input) { const { lines, passed } = await reportCoverage(input); console.log(JSON.stringify({ lines, passed })); }
  else throw new Error('usage: coverage.mjs prepare <input.json> | node <fresh-output-dir> <absolute-Bun> | report <fresh-output-dir>');
}
