// A static server for the browser tests: bun e2e/serve.ts <root> <port>
//
// Like GitHub Pages it sends CORS headers and no Cross-Origin-Resource-Policy,
// so the tests find out if something needs one. Unlike GitHub Pages it sends
// COOP/COEP itself instead of relying on coi-serviceworker's reload, except
// under /plain/, which stands for a page that is not cross-origin isolated.

import { join, normalize } from 'node:path';
import { file } from 'bun';

const [root = '.', port = '8780'] = process.argv.slice(2);

Bun.serve({
  port: Number(port),
  async fetch(request) {
    const { pathname } = new URL(request.url);
    let path = normalize(join(root, decodeURIComponent(pathname)));
    if (pathname.endsWith('/')) path = join(path, 'index.html');
    // CORS on every response, 404s included, as GitHub Pages does: without
    // it a missing file looks like a network error to another origin.
    const headers: Record<string, string> = {
      'access-control-allow-origin': '*',
    };
    // Serve the iframe host on the site's origin without browser interception.
    const body =
      pathname === '/pitchfork-iframe.html'
        ? file(new URL('./host/pitchfork-iframe.html', import.meta.url))
        : file(path);
    if (!(await body.exists())) {
      return new Response('not found', { status: 404, headers });
    }
    if (!pathname.startsWith('/plain/')) {
      headers['cross-origin-opener-policy'] = 'same-origin';
      headers['cross-origin-embedder-policy'] = 'require-corp';
    }
    return new Response(body, { headers });
  },
});
console.log(`serving ${root} on http://localhost:${port}/`);
