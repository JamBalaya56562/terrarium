import { afterEach, describe, expect, test } from 'bun:test';
import {
  type Catalog,
  catalog,
  choose,
  describe as describeBuild,
  fetchJson,
  versioned,
} from '../src/catalog.ts';

const CATALOG: Catalog = {
  tools: {
    aube: { default: 'main', fixture: 'aube-local-deps', cwd: '/work/app' },
    other: {},
  },
  builds: {
    aube: {
      'v2.6.1': { source: { ref: 'v2.6.1', commit: 'bd94e42f54d3b5e3' } },
      main: { source: { ref: 'main', commit: '259cd05f560d7b20' } },
      'pr-1645': {
        source: { ref: 'refs/pull/1645/head', commit: '8b56aa1ef2d12052' },
        upstream_pr: 'https://github.com/aubepkg/aube/pull/1645',
      },
    },
  },
};

describe('choose', () => {
  test('selects pitchfork with its own default, fixture and build', () => {
    const all: Catalog = {
      tools: {
        ...CATALOG.tools,
        pitchfork: {
          default: 'v2.29.0',
          fixture: 'pitchfork-basic',
          cwd: '/work/app',
        },
      },
      builds: {
        ...CATALOG.builds,
        pitchfork: { 'v2.29.0': { source: { commit: 'pitchfork-commit' } } },
      },
    };
    const choice = choose(all, { tool: 'pitchfork' });
    expect(choice.toolName).toBe('pitchfork');
    expect(choice.ref).toBe('v2.29.0');
    expect(choice.tool.fixture).toBe('pitchfork-basic');
    expect(choice.tool.cwd).toBe('/work/app');
    expect(choice.build.source?.commit).toBe('pitchfork-commit');
    expect(() => choose(all, { tool: 'pitchfork', ref: 'main' })).toThrow(
      'no build "main" of pitchfork; published: v2.29.0',
    );
    expect(choose(all, { tool: 'aube' }).ref).toBe('main');
  });

  test('defaults to the first tool and its default build, listed first', () => {
    const choice = choose(CATALOG);
    expect(choice.toolName).toBe('aube');
    expect(choice.ref).toBe('main');
    expect(choice.names).toEqual(['main', 'pr-1645', 'v2.6.1']);
    expect(choice.catalog).toBe(CATALOG);
  });

  test('picks the build asked for', () => {
    expect(choose(CATALOG, { ref: 'pr-1645' }).build.upstream_pr).toBe(
      'https://github.com/aubepkg/aube/pull/1645',
    );
  });

  test('falls back to the first build when the default is not published', () => {
    const { main: _, ...rest } = CATALOG.builds.aube ?? {};
    expect(choose({ ...CATALOG, builds: { aube: rest } }).ref).toBe('pr-1645');
  });

  test('names the published builds when the one asked for is missing', () => {
    expect(() => choose(CATALOG, { ref: 'nope' })).toThrow(
      'no build "nope" of aube; published: main, pr-1645, v2.6.1',
    );
  });

  test('refuses an unknown tool', () => {
    expect(() => choose(CATALOG, { tool: 'npm' })).toThrow(
      'unknown tool "npm"; known: aube, other',
    );
  });

  test('says so when a tool has no builds yet', () => {
    expect(() => choose(CATALOG, { tool: 'other' })).toThrow(
      'no builds of other are published yet',
    );
  });
});

describe('describe', () => {
  test('adds the short commit when there is one', () => {
    expect(
      describeBuild('main', { source: { commit: '259cd05f560d7b20' } }),
    ).toBe('main (259cd05f)');
    expect(describeBuild('local', {})).toBe('local');
  });
});

describe('versioned', () => {
  test('adds ?v= only when there is a version', () => {
    expect(versioned('https://example.org/a.json', '20261004')).toBe(
      'https://example.org/a.json?v=20261004',
    );
    expect(versioned('https://example.org/a.json', null)).toBe(
      'https://example.org/a.json',
    );
  });
});

describe('catalog', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  function serve(files: Record<string, unknown>) {
    const requested: string[] = [];
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = String(input);
      requested.push(url);
      const path = new URL(url).pathname;
      const body = files[path];
      return body === undefined
        ? new Response('missing', { status: 404 })
        : Response.json(body);
    }) as typeof fetch;
    return requested;
  }

  test('reads tools.json and dist/builds.json under base, with the version', async () => {
    const requested = serve({
      '/web/tools.json': CATALOG.tools,
      '/web/dist/builds.json': { schema_version: 1, builds: CATALOG.builds },
    });
    const result = await catalog('https://one.example/web/', '7');
    expect(result).toEqual(CATALOG);
    expect(requested.sort()).toEqual([
      'https://one.example/web/dist/builds.json?v=7',
      'https://one.example/web/tools.json?v=7',
    ]);
  });

  test('fetches each URL once', async () => {
    const requested = serve({ '/once.json': { a: 1 } });
    await fetchJson('https://two.example/once.json');
    await fetchJson('https://two.example/once.json');
    expect(requested).toEqual(['https://two.example/once.json']);
  });

  test('reports a failed fetch, and tries again next time', async () => {
    const requested = serve({});
    const url = 'https://three.example/missing.json';
    await expect(fetchJson(url)).rejects.toThrow(`${url}: HTTP 404`);
    await expect(fetchJson(url)).rejects.toThrow('HTTP 404');
    expect(requested).toEqual([url, url]);
  });
});
