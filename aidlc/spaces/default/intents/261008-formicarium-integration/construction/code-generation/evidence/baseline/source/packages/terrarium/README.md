# @aletheia-works/terrarium

A browser terminal that runs one CLI compiled to WebAssembly, on only the
system calls it needs. Part of [terrarium](https://github.com/aletheia-works/terrarium).

The package has the `<terrarium-terminal>` element and the `Session` behind
it. The builds of the CLI (one `.wasm` of about 20 MB each) are not in the
package: the element loads them from terrarium's GitHub Pages site, or from
another copy of it named by `base`.

## Install

```sh
npm install @aletheia-works/terrarium   # or bun add, pnpm add
npx jsr add @aletheia-works/terrarium   # or deno add jsr:@aletheia-works/terrarium
```

The package root is for browsers: it defines the element, and xterm.js
needs a DOM. Under Node.js or Bun, import `@aletheia-works/terrarium/session`.

## The element

```js
import '@aletheia-works/terrarium';
```

```html
<terrarium-terminal ref="pr-1645" run="aube install
aube list"></terrarium-terminal>
```

| Attribute | Meaning | Default |
| --------- | ------- | ------- |
| `ref` | the build: `main`, a tag such as `v2.6.1`, `pr-<number>`, or a commit's first 12 characters | the tool's default: `main` for aube, `v2.29.0` for pitchfork |
| `run` | commands to type once the terminal is ready, one per line | none |
| `fixture` | the sample project preloaded into `/work`; empty for none | the tool's |
| `cwd` | the starting directory | the tool's, or `/work` |
| `tool` | the CLI: `aube` or `pitchfork` | `aube` |
| `base` | where terrarium's `web/` directory is served from | `https://aletheia-works.github.io/terrarium/web/` |

For pitchfork v2.29.0, use `<terrarium-terminal tool="pitchfork">`.
Its `pitchfork-basic` fixture starts in `/work/app`; version, daemon
configuration and status, and settings work without a supervisor.

```js
const terminal = document.querySelector('terrarium-terminal');
const { tool, ref, commit } = await terminal.ready;
const { code, output } = await terminal.run('aube list');
terminal.addEventListener('terrarium-exit', (e) => console.log(e.detail));
```

The tool uses threads, so the page must be cross-origin isolated (COOP/COEP
headers, or a service worker such as
[coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker)).

The published builds are listed in
[`builds.json`](https://aletheia-works.github.io/terrarium/web/dist/builds.json).

## The session

`@aletheia-works/terrarium/session` has `Session` alone, with no DOM, for
running a CLI built by terrarium under Node.js or Bun:

```js
import { Session } from '@aletheia-works/terrarium/session';

const session = new Session({ tool, write: (text) => process.stdout.write(text) });
session.seed([['app/package.json', '{"name":"app"}']]);
await session.run('aube install');
```

`tool` is `{ name, factory, wasmModule? }`, where `factory` is the Emscripten
`MODULARIZE` function of the CLI's build.

## License

Apache License 2.0


## Common runtime integration (local candidate)

The aube and pitchfork terminal paths use the public formicarium Session API.
The existing exported `Session` and `Tool` remain available for legacy callers.
Guest executables and fixtures are served separately by tool/ref; they are not
part of the formicarium package. Explicit unknown refs and invalid fixture or
asset digests fail rather than silently falling back.

This development dependency is a local `0.1.0-rc.1` tarball, not acceptance of a
published release candidate. Supply the complete validated guest site before
building the site:

```sh
FORMICARIUM_GUEST_SITE=<absolute-complete-guest-site> mise run terrarium:formicarium-build
mise run terrarium:formicarium-unit
TERRARIUM_BUN=<resolved-mise-bun-executable> mise run terrarium:formicarium-e2e
```

The assembled page serves the installed Worker, loader, wasm and build-info as
one verified set at `web/formicarium/`, and the C3 resolver modules at
`web/formicarium-guest-distribution/`. The browser Worker URL must be same-origin
with the page that owns it. Use the iframe entry for a page on another origin.
The guest binary has no network or daemon capability.

An iframe accepts `terrarium:run` only from its actual parent and exact approved
origin, and sends notifications to that same exact origin. `null`, `*`, invalid
or unknown origins are rejected. Same-origin use needs COOP/COEP isolation for
parent, iframe and assets. Cross-origin use also needs `credentialless` and
`allow="cross-origin-isolated"`; Firefox/WebKit currently report unsupported
instead of running the guest. Missing isolation reports its cause and prevents
execution. A local Pages-like test host does not verify the actual Pages deploy
or service-worker reload path. The local iframe test server explicitly serves
`Cross-Origin-Resource-Policy: cross-origin` so a parent using COEP can load the
child document before its compatibility check reports an error. `/plain/` omits
COOP/COEP on both parent and child for the missing-isolation test. Actual Pages
response headers and the ability to configure them remain unverified; local
header behavior is not evidence of a working Pages deployment.

The terminal supports literal quoted arguments and `cd`, `ls`, `cat`, `rm`,
`pwd`. Pipes, redirection and shell expansion are explicitly rejected. Builtin
filesystem operations use the public Session boundary, and a nested initial
cwd preserves other `/work` fixture directories.
