import { expect, test } from 'bun:test';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

for (const guest of [
  undefined,
  { format: 'static-musl-x86_64', url: 'guest' },
]) {
  test(`fetch-builds stages Emscripten metadata from ${guest ? 'guest' : 'legacy'} catalogue`, async () => {
    const root = await mkdtemp(join(tmpdir(), 'terrarium-fetch-builds-'));
    const source = {
      url: 'https://example.test/aube',
      ref: 'v2.6.1',
      commit: 'abc',
    };
    const entry = { source, upstream_pr: null, built_at: '2026-10-08', guest };
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        switch (new URL(request.url).pathname) {
          case '/dist/builds.json':
            return Response.json({ builds: { aube: { 'v2.6.1': entry } } });
          case '/dist/aube/v2.6.1/aube.js':
            return new Response('legacy-js');
          case '/dist/aube/v2.6.1/aube.wasm':
            return new Response('legacy-wasm');
          default:
            return new Response('missing', { status: 404 });
        }
      },
    });
    try {
      await mkdir(join(root, 'scripts'));
      await mkdir(join(root, 'web/dist'), { recursive: true });
      const existing = { source: { commit: 'pitchfork' } };
      await writeFile(
        join(root, 'web/dist/builds.json'),
        JSON.stringify({
          schema_version: 1,
          builds: { pitchfork: { 'v2.30.1': existing } },
        }),
      );
      await copyFile(
        resolve(import.meta.dir, '../../../scripts/fetch-builds.sh'),
        join(root, 'scripts/fetch-builds.sh'),
      );
      const child = Bun.spawn({
        cmd: [
          process.platform === 'win32'
            ? 'C:/Program Files/Git/bin/bash.exe'
            : 'bash',
          join(root, 'scripts/fetch-builds.sh'),
          'v2.6.1',
        ],
        env: {
          ...process.env,
          TERRARIUM_SITE: server.url.href.replace(/\/$/, ''),
        },
        stdout: 'pipe',
        stderr: 'pipe',
      });
      const [code, stderr] = await Promise.all([
        child.exited,
        new Response(child.stderr).text(),
      ]);
      expect(code, stderr).toBe(0);
      const manifest = JSON.parse(
        await readFile(join(root, 'web/dist/builds.json'), 'utf8'),
      );
      expect(manifest.builds.aube['v2.6.1']).toEqual({
        source,
        upstream_pr: null,
        built_at: entry.built_at,
      });
      expect(manifest.builds.pitchfork['v2.30.1']).toEqual(existing);
      expect(
        await readFile(join(root, 'web/dist/aube/v2.6.1/aube.js'), 'utf8'),
      ).toBe('legacy-js');
      expect(
        await readFile(join(root, 'web/dist/aube/v2.6.1/aube.wasm'), 'utf8'),
      ).toBe('legacy-wasm');
    } finally {
      server.stop(true);
      await rm(root, { recursive: true, force: true });
    }
  });
}
