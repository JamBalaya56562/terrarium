import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifyInputs } from './prepare-formicarium.mjs';
import { RC_PACKAGE, verifyInstalledRc } from './verify-formicarium-rc.mjs';

const _root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const decode = (bytes) => new TextDecoder().decode(bytes);
export function assessRun(
  result,
  { exitCode = 0, stdout, nonzero = false } = {},
) {
  const actual = {
    exitCode: result.exitCode,
    stdout: decode(result.stdout),
    stderr: decode(result.stderr),
    runId: result.runId,
    elapsedMs: result.elapsedMs,
  };
  const passed =
    (nonzero ? actual.exitCode !== 0 : actual.exitCode === exitCode) &&
    (stdout === undefined || actual.stdout === stdout);
  return {
    passed,
    expected: { exitCode: nonzero ? 'nonzero' : exitCode, stdout },
    actual,
  };
}
export async function acceptNode({ inputs, output, packageRoot = RC_PACKAGE }) {
  const identity = await verifyInstalledRc({ packageRoot });
  const inputIdentity = await verifyInputs(inputs);
  const { createSession } = await import(
    pathToFileURL(path.join(packageRoot, 'runtime/node/api.js')).href
  );
  const { convertFixture } = await import(
    pathToFileURL(path.join(inputs, 'resolver/fixtures.js')).href
  );
  const tools = JSON.parse(
    await readFile(path.join(inputs, 'guests/tools.json')),
  );
  const catalogue = JSON.parse(
    await readFile(path.join(inputs, 'guests/dist/builds.json')),
  );
  const cases = [];
  const guests = {};
  const sessions = [];
  async function check(id, details, action) {
    try {
      const result = await action();
      cases.push({
        id,
        ...details,
        ...result,
        status: result?.passed === false ? 'fail' : 'pass',
      });
    } catch (error) {
      cases.push({
        id,
        ...details,
        status: 'fail',
        error: { message: error.message, code: error.code },
      });
    }
    console.log(`${id}: ${cases.at(-1).status}`);
  }
  async function load(tool) {
    const config = tools[tool];
    const build = catalogue.builds[tool][config.default];
    const guest = new Uint8Array(
      await readFile(path.join(inputs, 'guests', build.guest.url)),
    );
    assert.equal(
      createHash('sha256').update(guest).digest('hex'),
      build.guest.sha256,
    );
    const fixture = JSON.parse(
      await readFile(
        path.join(inputs, 'guests', build.fixtures[config.fixture].url),
      ),
    );
    const session = await createSession({
      cwd: '/work',
      entries: convertFixture(fixture, { cwd: '/work' }),
    });
    sessions.push(session);
    guests[tool] = {
      ref: build.ref,
      source: build.source,
      sha256: build.guest.sha256,
      fixture: build.fixtures[config.fixture],
      cwd: config.cwd,
    };
    return { guest, session, config };
  }
  try {
    const aube = await load('aube');
    const pitchfork = await load('pitchfork');
    const execute = (target, args) =>
      target.session.run({ guest: target.guest, args, timeoutMs: 600_000 });
    await check(
      'N4',
      {
        tool: 'aube',
        api: 'readFile/setCwd/listEntries',
        expected: 'fixture sibling unchanged; /work/app selected',
      },
      async () => {
        const filename = '/work/outside/linked/package.json';
        const before = decode(await aube.session.readFile(filename));
        assert.match(before, /"linked"/);
        await aube.session.setCwd('/work/app');
        await pitchfork.session.setCwd('/work/app');
        assert(
          (await aube.session.listEntries('/work/app')).some(
            (entry) => entry.path === '/work/app/package.json',
          ),
        );
        return { passed: true, before, cwd: '/work/app' };
      },
    );
    await check('N1', { tool: 'aube', args: ['--version'] }, async () => {
      const result = assessRun(await execute(aube, ['--version']), {
        stdout: '2.7.0 linux-x64 (2026-10-07)\n',
      });
      assert.equal(
        decode(
          await aube.session.readFile('/work/outside/linked/package.json'),
        ),
        cases.find((row) => row.id === 'N4')?.before,
      );
      return result;
    });
    await check('N2', { tool: 'pitchfork', args: ['--version'] }, async () =>
      assessRun(await execute(pitchfork, ['--version']), {
        stdout: 'pitchfork 2.30.0\n',
      }),
    );
    await check(
      'N3',
      {
        tool: 'pitchfork',
        args: ['daemons', 'add', 'db', '--run', 'postgres -D data'],
        api: 'readFile',
        expectedFile: '/work/app/pitchfork.toml',
      },
      async () => {
        const result = assessRun(
          await execute(pitchfork, [
            'daemons',
            'add',
            'db',
            '--run',
            'postgres -D data',
          ]),
        );
        const contents = decode(
          await pitchfork.session.readFile('/work/app/pitchfork.toml'),
        );
        assert.match(contents, /\[daemons\.db\]/);
        assert.match(contents, /postgres -D data/);
        assert.match(contents, /\[daemons\.api\]/);
        return { ...result, contents };
      },
    );
    await check(
      'N5',
      { tool: 'pitchfork', args: ['--terrarium-invalid-argument'] },
      async () => {
        const result = await execute(pitchfork, [
          '--terrarium-invalid-argument',
        ]);
        const accepted = assessRun(result, { nonzero: true });
        assert.equal(
          assessRun(result).passed,
          false,
          'success-only aggregation must reject nonzero exit',
        );
        return accepted;
      },
    );
    await check(
      'N6',
      {
        tool: 'pitchfork',
        args: ['--version'],
        api: 'run/dispose/readFile',
        expectedDisposedCode: 'DISPOSED',
      },
      async () => {
        const result = assessRun(await execute(pitchfork, ['--version']), {
          stdout: 'pitchfork 2.30.0\n',
        });
        await pitchfork.session.dispose();
        await assert.rejects(
          pitchfork.session.readFile('/work/app/pitchfork.toml'),
          { code: 'DISPOSED' },
        );
        await pitchfork.session.dispose();
        return { ...result, disposed: true, repeatedDispose: true };
      },
    );
  } finally {
    for (const session of sessions) await session.dispose();
  }
  const report = {
    environment: 'Node',
    nodeVersion: process.version,
    identity,
    inputIdentity,
    guests,
    cases,
    pass: cases.filter((row) => row.status === 'pass').length,
    fail: cases.filter((row) => row.status === 'fail').length,
    skip: 0,
    browserOnly:
      'DOM/event/iframe/source/origin/isolation contracts are tested by the browser suite',
    command: process.argv,
    cwd: process.cwd(),
  };
  if (output) {
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const options = {};
  for (let index = 2; index < process.argv.length; index += 2) {
    const key = process.argv[index].slice(2);
    if (
      !['inputs', 'output', 'packageRoot'].includes(key) ||
      !process.argv[index + 1] ||
      key in options
    )
      throw new Error(
        'usage: accept-formicarium-node.mjs --inputs <verified directory> --output <report.json> [--packageRoot <installed package>]',
      );
    options[key] = path.resolve(process.argv[index + 1]);
  }
  if (!options.inputs || !options.output)
    throw new Error('explicit --inputs and --output required');
  const result = await acceptNode(options);
  console.log(
    JSON.stringify({ pass: result.pass, fail: result.fail, skip: result.skip }),
  );
  if (result.fail || result.cases.length !== 6) process.exitCode = 1;
}
