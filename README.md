# terrarium

> Run one CLI tool in the browser — no emulator, no kernel, just the
> system calls that tool needs.
> Part of [`aletheia-works`](https://github.com/aletheia-works).

## Why

[Vivarium](https://github.com/aletheia-works/vivarium) reproduces bugs
in the browser so anyone can check a claim without installing anything.
For a library, a reproduction script that imports it and prints the
result is the natural shape. For a CLI tool, it is not: people meet a
CLI in a terminal, so the reproduction should be a terminal session —
type `aube install`, see what aube actually prints.

Browser Linux environments such as [WebVM](https://webvm.io/) already
feel like a real server, but they carry a whole distribution and an x86
JIT to get there. terrarium goes the other way: it gives up generality
to run **one specific CLI**, compiled to WebAssembly, on top of only the
system calls that CLI uses. The bet is that a runtime this narrow can
start faster and ship smaller than a general one.

## Status

The first target is [aube](https://github.com/aubepkg/aube), a Node.js
package manager written in Rust: an offline `aube install` of a project
with only local (`file:` / `link:`) dependencies, run from a terminal in
the browser.

aube builds for `wasm32-unknown-emscripten` without changes to its own
code, and its CLI runs in a browser terminal at
<https://aletheia-works.github.io/terrarium/>. Builds are made by GitHub
Actions: aube's `main` every day, and any branch, tag, commit or pull
request on demand.

Showing a bug next to its fix is [Vivarium](https://github.com/aletheia-works/vivarium)'s
job, not terrarium's: Vivarium embeds two terrarium terminals, one per build.

## Use it

There are three ways in: a link to the page, an HTML element in your own
page, or the page in an iframe. All three take the same settings:

| Setting | Meaning | Default |
| ------- | ------- | ------- |
| `ref` | the build: `main`, a tag such as `v2.6.1`, `pr-<number>`, or a commit's first 12 characters | `main` |
| `run` | commands to type once the terminal is ready | none |
| `fixture` | the sample project preloaded into `/work`; empty for none | `aube-local-deps` |
| `cwd` | the starting directory | `/work/app` with the fixture, `/work` without |
| `tool` | the CLI | `aube` |

The published builds are listed in
[`web/dist/builds.json`](https://aletheia-works.github.io/terrarium/web/dist/builds.json).
The tool uses threads, so every way needs a cross-origin isolated page
(COOP/COEP headers, or a service worker such as `web/coi-serviceworker.js`).

### A link

<https://aletheia-works.github.io/terrarium/> with the settings as query
parameters, `run` repeated for several commands:
`?ref=pr-1645&run=aube%20install&run=aube%20list`.

### An element

```html
<script type="module" src="https://aletheia-works.github.io/terrarium/web/terrarium.mjs"></script>

<terrarium-terminal ref="pr-1645" run="aube install
aube list"></terrarium-terminal>
```

The same element is packaged as
[`@aletheia-works/terrarium`](packages/terrarium) (`import
'@aletheia-works/terrarium'`, not published to npm yet), which loads the
builds from the site above.

The settings are attributes (`run` has one command per line), read when
the element is added to the page. `base` points it at another copy of
terrarium's `web/` directory, for a site that serves the builds itself.

```js
const terminal = document.querySelector('terrarium-terminal');
const { tool, ref, commit } = await terminal.ready;
const { code, output } = await terminal.run('aube list');
terminal.addEventListener('terrarium-exit', (e) => console.log(e.detail));
```

`run()` types the command and resolves when it exits; `terrarium-ready`,
`terrarium-exit` and `terrarium-error` events carry the same details,
and `transcript` holds everything printed. The element loads the tool
from terrarium's origin (GitHub Pages allows it with CORS) and runs its
threads from a `blob:` URL, so it works from any origin; it is
JavaScript in your page, with your page's rights.

### An iframe

```html
<iframe src="https://aletheia-works.github.io/terrarium/web/?embed&ref=pr-1645"
        allow="cross-origin-isolated" credentialless></iframe>
```

`embed` hides the header. The page posts `{ type: 'terrarium:ready', tool, ref, commit }`
and, after each command, `{ type: 'terrarium:exit', command, code, output }`
to its parent's origin only, and runs `{ type: 'terrarium:run', command }`
messages from it. Pass `origin=` when the browser does not tell the page
its parent's origin.

In a cross-origin isolated page an iframe from another origin needs
`allow="cross-origin-isolated"`, and must either be served with
`Cross-Origin-Resource-Policy: cross-origin` (GitHub Pages cannot set
it) or be a `credentialless` iframe, which only Chromium supports so
far. The element has neither limit.

To build another aube, run the **Pages** workflow with a `ref` (a branch,
a tag, a commit, or `pr-<number>`). The build appears as `?ref=<name>`
when the workflow finishes.

See [the design notes](aidlc/spaces/default/knowledge/aidlc-shared/design.md) for the plan and the open
questions.

## License

Apache License 2.0
