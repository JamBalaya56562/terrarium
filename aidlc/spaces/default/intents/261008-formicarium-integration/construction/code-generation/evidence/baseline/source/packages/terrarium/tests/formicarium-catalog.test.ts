import { describe, expect, test } from 'bun:test';
import { choose, describe as describeBuild, type Catalog } from '../src/catalog.ts';
import { formicariumAssets, resolveChoice, usesFormicarium, type GuestRequest, type SelectedGuest } from '../src/formicarium-session.ts';

const all: Catalog = {
  tools: { aube: { default: 'v2.7.0', fixture: 'project', cwd: '/work/app' }, pitchfork: { default: 'v2.30.1' }, old: { default: 'main' } },
  builds: {
    aube: { 'v2.6.1': { source: { commit: 'b'.repeat(40) } }, 'v2.7.0': { source: { type: 'repository', url: 'https://source.invalid/aube', ref: 'v2.7.0', commit: 'a'.repeat(40) }, upstream_pr: 'https://source.invalid/pr/1', built_at: '2026-10-08T00:00:00Z' } },
    pitchfork: { 'v2.30.1': { source: { commit: 'c'.repeat(40) } } }, old: { main: { source: { commit: null } } },
  },
};
const resolve = async (request: GuestRequest): Promise<SelectedGuest> => ({
  build: { tool: request.tool, ref: request.ref, source: { commit: all.builds[request.tool]?.[request.ref]?.source?.commit ?? '' } },
  guest: new Uint8Array([1]), entries: [], cwd: request.fixture === '' ? '/work' : '/work/app',
});

describe('catalogue to C3 boundary', () => {
  test('default-first latest choices preserve Choice fields and old metadata', async () => {
    const choice = choose(all, { tool: 'aube' });
    expect(choice.names).toEqual(['v2.7.0', 'v2.6.1']);
    const latest = all.builds.aube?.['v2.7.0'];
    if (!latest) throw new Error('latest aube fixture is missing');
    expect(choice.build).toBe(latest);
    expect(describeBuild(choice.ref, choice.build)).toBe('v2.7.0 (aaaaaaaa)');
    expect((await resolveChoice(choice, { base: 'https://site.invalid/web/' }, resolve)).build.ref).toBe('v2.7.0');
    expect(choice.build.source?.type).toBe('repository'); expect(choice.build.upstream_pr).toBe('https://source.invalid/pr/1');
  });
  test('latest pitchfork and explicit old aube ref retain identity', async () => {
    for (const selection of [{ tool: 'pitchfork' }, { tool: 'aube', ref: 'v2.6.1' }]) {
      const choice = choose(all, selection);
      const selected = await resolveChoice(choice, { base: 'https://site.invalid/web/' }, resolve);
      expect(selected.build.ref).toBe(choice.ref);
      const commit = choice.build.source?.commit;
      if (typeof commit !== 'string') throw new Error('fixture source commit is missing');
      expect(selected.build.source.commit).toBe(commit);
    }
  });
  test('explicit unknown ref and unknown tool fail without fallback', () => {
    expect(() => choose(all, { tool: 'aube', ref: 'missing' })).toThrow('no build');
    expect(() => choose(all, { tool: 'unknown' })).toThrow('unknown tool');
  });
  test('undefined and empty fixture stay distinct; explicit cwd overrides only cwd', async () => {
    const choice = choose(all, { tool: 'aube' }); const requests: GuestRequest[] = [];
    const capture = async (request: GuestRequest) => { requests.push(request); return resolve(request); };
    expect((await resolveChoice(choice, { base: 'https://site.invalid/web' }, capture)).cwd).toBe('/work/app');
    expect((await resolveChoice(choice, { base: 'https://site.invalid/web/', fixture: '' }, capture)).cwd).toBe('/work');
    const selected = await resolveChoice(choice, { base: 'https://site.invalid/web/', cwd: '/work/../work/app' }, capture);
    expect(selected.cwd).toBe('/work/app'); expect(requests.map((request) => request.fixture)).toEqual([undefined, '', undefined]);
    expect(requests[0]?.base).toBe('https://site.invalid/web/');
  });
  test('guest/ref/commit mismatch and resolver failure propagate', async () => {
    const choice = choose(all, { tool: 'aube' });
    for (const change of [{ tool: 'pitchfork' }, { ref: 'old' }, { source: { commit: 'd'.repeat(40) } }]) {
      await expect(resolveChoice(choice, { base: 'https://site.invalid/web/' }, async (request) => ({ ...(await resolve(request)), build: { ...(await resolve(request)).build, ...change } }))).rejects.toThrow('identity differ');
    }
    for (const reason of ['fixture: unknown', 'guest: SHA-256 mismatch', 'guest: HTTP 404']) {
      await expect(resolveChoice(choice, { base: 'https://site.invalid/web/' }, async () => { throw new Error(reason); })).rejects.toThrow(reason);
    }
  });
  test('legacy tools stay available without forced migration and invalid base fails', async () => {
    expect(choose(all, { tool: 'old' }).ref).toBe('main'); expect(usesFormicarium('old')).toBe(false);
    await expect(resolveChoice(choose(all, { tool: 'old' }), { base: 'https://site.invalid/' }, resolve)).rejects.toThrow('no formicarium');
    for (const base of ['file:///web/', 'https://site.invalid/web/?x=1', 'https://u:p@site.invalid/web/', 'https://site.invalid/web/#x']) {
      await expect(resolveChoice(choose(all, { tool: 'aube' }), { base }, resolve)).rejects.toThrow('clean HTTP');
    }
  });
  test('public assets reference actual same-site worker and a coherent installed package', () => {
    const assets = formicariumAssets('https://site.invalid/web/');
    expect(String(assets.workerURL)).toBe('https://site.invalid/web/formicarium/runtime/web/package-worker.mjs');
    expect(String(assets.loaderURL)).toBe('https://site.invalid/web/formicarium/assets/blink.mjs');
    expect(String(assets.wasmURL)).toBe('https://site.invalid/web/formicarium/assets/blink.wasm');
    expect(String(assets.buildInfoURL)).toBe('https://site.invalid/web/formicarium/assets/build-info.json');
  });
});
