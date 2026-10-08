import { resolve, sep } from 'node:path';
import { file } from 'bun';

const [rootArg = '../../.site', portArg = '8880'] = process.argv.slice(2);
const root = resolve(rootArg);
const fixtureRoot = resolve(import.meta.dir, 'host/formicarium');
Bun.serve({
  hostname: '127.0.0.1',
  port: Number(portArg),
  async fetch(request) {
    const url = new URL(request.url);
    const plain = url.pathname.startsWith('/plain/');
    const pathname = plain ? url.pathname.slice('/plain'.length) : url.pathname;
    // Permit the child document to load under a cross-origin parent's COEP.
    // /plain still omits COOP/COEP so it remains a genuine non-isolated fixture.
    const headers: Record<string, string> = {
      'access-control-allow-origin': '*',
      'cross-origin-resource-policy': 'cross-origin',
    };
    if (!plain) {
      headers['cross-origin-opener-policy'] = 'same-origin';
      headers['cross-origin-embedder-policy'] = 'require-corp';
    }
    const host = ['/element.html', '/iframe.html'].includes(pathname);
    const boundary = host ? fixtureRoot : root;
    let target: string;
    try {
      target = resolve(boundary, `.${decodeURIComponent(pathname)}`);
    } catch {
      return new Response('bad path', { status: 400, headers });
    }
    if (!target.startsWith(`${boundary}${sep}`))
      return new Response('forbidden', { status: 403, headers });
    if (pathname.endsWith('/')) target = resolve(target, 'index.html');
    const body = file(target);
    if (!(await body.exists()))
      return new Response('not found', { status: 404, headers });
    return new Response(body, { headers });
  },
});
console.log(`U3 test server http://127.0.0.1:${portArg}`);
