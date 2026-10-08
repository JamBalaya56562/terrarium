import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FILES, BROWSER_TITLES, REQUIRED_U1_REALMS, mergeMeasurements, prepareCoverage, componentImport, finalizeNodeMeasurement, nodePreloadSource } from '../../scripts/terrarium/coverage.mjs';
import { sha256 } from '../../scripts/terrarium/evidence.mjs';
const require = createRequire(import.meta.url);
const { createInstrumenter } = require('istanbul-lib-instrument');
function fixture() {
  const metadata = FILES.map((path) => {
    const instrumenter = createInstrumenter({ esModules: true });
    instrumenter.instrumentSync('export function unused(){return 1;}\n', path); return instrumenter.lastFileCoverage();
  });
  const digests = metadata.map((file) => ({ path: file.path, sourceSha256: 'a'.repeat(64), statementMapSha256: sha256(JSON.stringify(file.statementMap)) }));
  const inventory = { files: FILES, generation: 'fresh-generation', digests, metadata,
    sourceIdentity: sha256(JSON.stringify(digests)), candidate: { sha256: 'b'.repeat(64) }, tarballSha256: 'c'.repeat(64) };
  const bind = { generation: inventory.generation, sourceIdentity: inventory.sourceIdentity, candidateSha256: inventory.candidate.sha256 };
  const rows = [{ ...bind, realm: 'node-host', status: 'passed', coverage: {} }];
  for (const project of ['chromium', 'firefox', 'webkit']) for (const title of BROWSER_TITLES) rows.push({ ...bind, realm: 'browser-host', project, title, status: 'passed', expectedStatus: 'passed', coverage: {} });
  return { inventory, rows, component: { kind: 'immutable-component-import', coverage: {} } };
}
test('fixed23 preserves U1 thirteen U2 three and all seven U3 modules; never imported files stay zero', () => {
  const f = fixture(), result = mergeMeasurements(f.inventory, f.rows, f.component);
  assert.equal(FILES.length, 23); assert.equal(result.files.length, 23); assert.equal(result.lines.pct, 0); assert.equal(result.passed, false);
});
test('old generation receipts are refused even when source and statement layout are identical', () => {
  const f = fixture(); f.rows[0].generation = 'old-generation';
  assert.throws(() => mergeMeasurements(f.inventory, f.rows, f.component), /stale generation/);
});
test('same-length source or candidate replacement invalidates old receipts', () => {
  for (const field of ['sourceIdentity', 'candidateSha256']) {
    const f = fixture(); f.rows[0][field] = 'd'.repeat(64);
    assert.throws(() => mergeMeasurements(f.inventory, f.rows, f.component), /stale generation/);
  }
});
test('missing node/browser or skipped measurement fails closed', () => {
  const f = fixture(); assert.throws(() => mergeMeasurements(f.inventory, f.rows.slice(1), f.component), /Node realm/);
  assert.throws(() => mergeMeasurements(f.inventory, f.rows.slice(0, -1), f.component), /browser realm/);
  f.rows[1].status = 'skipped'; assert.throws(() => mergeMeasurements(f.inventory, f.rows, f.component), /skipped/);
});
test('duplicate realms inventory shrink and nonzero seed are rejected', () => {
  const f = fixture(); assert.throws(() => mergeMeasurements(f.inventory, [...f.rows, f.rows[0]], f.component), /duplicate/);
  const smaller = structuredClone(f.inventory); smaller.files.pop(); assert.throws(() => mergeMeasurements(smaller, f.rows, f.component), /inventory/);
  const dirty = structuredClone(f.inventory); dirty.metadata[0].s['0'] = 1; assert.throws(() => mergeMeasurements(dirty, f.rows, f.component), /nonzero/);
});
test('missing Worker component import and altered statement map fail', () => {
  const f = fixture(); assert.throws(() => mergeMeasurements(f.inventory, f.rows), /Worker component/);
  const file = structuredClone(f.inventory.metadata[0]); file.statementMap['0'].start.line = 999;
  f.rows[0].coverage = { [file.path]: file }; assert.throws(() => mergeMeasurements(f.inventory, f.rows, f.component), /source map/);
});
test('re-prepare refuses existing measurement output before touching a receipt', async (t) => {
  const out = await mkdtemp(join(tmpdir(), 'u3-generation-')); t.after(() => rm(out, { recursive: true, force: true }));
  await writeFile(join(out, 'old-receipt.json'), 'preserve');
  await assert.rejects(prepareCoverage({ out }), { code: 'EEXIST' });
});
test('immutable U1 import preserves original realm names and rejects wrong pack/source/missing realm', () => {
  const f = fixture(); const runtime = f.inventory.metadata.slice(0, 13);
  const report = { candidateSha256: f.inventory.tarballSha256, threshold: 80, passed: true,
    realmNames: [...REQUIRED_U1_REALMS], digests: f.inventory.digests.slice(0, 13),
    files: runtime.map((file) => ({ path: file.path, lines: Object.fromEntries(Object.values(file.statementMap).map((statement) => [String(statement.start.line), 1])) })) };
  const imported = componentImport(f.inventory, report, 'e'.repeat(64));
  assert.equal(imported.kind, 'immutable-component-import'); assert.equal(imported.originalGeneration, 'u1-coverage-v9');
  assert.deepEqual(imported.originalRealmNames, report.realmNames);
  assert.throws(() => componentImport(f.inventory, { ...report, candidateSha256: 'wrong' }, ''), /identity/);
  assert.throws(() => componentImport(f.inventory, { ...report, realmNames: report.realmNames.slice(0, -1) }, ''), /realm inventory/);
  const changed = structuredClone(report); changed.digests[0].sourceSha256 = 'wrong';
  assert.throws(() => componentImport(f.inventory, changed, ''), /source changed/);
});

test('node raw hook requires fresh attempt and parent observed exit', () => {
  const {inventory}=fixture();
  const raw={generation:inventory.generation,sourceIdentity:inventory.sourceIdentity,candidateSha256:inventory.candidate.sha256,attempt:'fresh',coverage:{}};
  assert.throws(()=>finalizeNodeMeasurement(inventory,undefined,'fresh',0),/raw hook/);
  assert.throws(()=>finalizeNodeMeasurement(inventory,raw,'old',0),/binding/);
  assert.throws(()=>finalizeNodeMeasurement(inventory,raw,'fresh',null),/observed/);
  assert.equal(finalizeNodeMeasurement(inventory,raw,'fresh',1).status,'failed');
  assert.equal(finalizeNodeMeasurement(inventory,raw,'fresh',0).status,'passed');
  const hook=nodePreloadSource(inventory,'/tmp/current-generation');
  assert.match(hook,/import \{afterAll\} from 'bun:test'/);
  assert.doesNotMatch(hook,/status:|process.on\('exit'/);
});
