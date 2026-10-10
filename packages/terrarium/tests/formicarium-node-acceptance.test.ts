import { expect, test } from 'bun:test';

const { assessRun } = await import(
  new URL('../../../scripts/accept-formicarium-node.mjs', import.meta.url).href
);
const result = {
  exitCode: 0,
  stdout: new TextEncoder().encode('version\n'),
  stderr: new Uint8Array(),
  runId: 'test-run',
  elapsedMs: 1,
};
test('successful output and exit aggregate as pass', () => {
  expect(assessRun(result, { stdout: 'version\n' }).passed).toBe(true);
});
test('nonzero exit fails the successful command contract', () => {
  expect(
    assessRun({ ...result, exitCode: 2 }, { stdout: 'version\n' }).passed,
  ).toBe(false);
});
test('unexpected output fails even with exit zero', () => {
  expect(assessRun(result, { stdout: 'another version\n' }).passed).toBe(false);
});
