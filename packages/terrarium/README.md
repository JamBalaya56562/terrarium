# @aletheia-works/terrarium

A browser terminal that runs one CLI compiled to WebAssembly, on only the
system calls it needs. Part of [terrarium](https://github.com/aletheia-works/terrarium).

The package has the `<terrarium-terminal>` element and the `Session` behind
it. The builds of the CLI (one `.wasm` of about 20 MB each) are not in the
package: the element loads them from terrarium's GitHub Pages site, or from
another copy of it named by `base`.

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
| `ref` | the build: `main`, a tag such as `v2.6.1`, `pr-<number>`, or a commit's first 12 characters | the tool's default, `main` for aube |
| `run` | commands to type once the terminal is ready, one per line | none |
| `fixture` | the sample project preloaded into `/work`; empty for none | the tool's |
| `cwd` | the starting directory | the tool's, or `/work` |
| `tool` | the CLI | `aube` |
| `base` | where terrarium's `web/` directory is served from | `https://aletheia-works.github.io/terrarium/web/` |

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
