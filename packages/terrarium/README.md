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

The aube and pitchfork builds advertising a static-musl guest use the public
formicarium Session API. Catalogues without a guest retain the legacy Session.
The existing exported `Session` and `Tool` remain available for legacy callers.
Guest executables and fixtures are served separately by tool/ref; they are not
part of the formicarium package. Explicit unknown refs and invalid fixture or
asset digests fail rather than silently falling back.

This development dependency is a local `0.1.0-rc.1` tarball, not acceptance of a
published release candidate. Supply the complete validated guest site before
building the site:

```sh
FORMICARIUM_INPUTS_DIR=<absolute-fixed-input-directory> mise run terrarium:inputs
FORMICARIUM_INPUTS_DIR=<absolute-fixed-input-directory> mise run ci:terrarium
mise run terrarium:formicarium-build
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

## 固定formicarium入力の準備

`integration/formicarium-inputs.json` が tarball、package manifest、resolver 3 modules、guest catalog と広告した全3 refsのアセットを固定します。隣接checkoutを暗黙には使用しません。リポジトリrootから先に入力を準備します。

```sh
mise exec -- bun scripts/prepare-formicarium.mjs --archive /path/to/inputs.tar.gz
# または --from /path/to/input-directory
cd packages/terrarium
mise exec -- bun install --frozen-lockfile
```

archive は descriptor に記載した16 regular filesをその相対pathで含むgzip ustarです。リンク、余分/不足ファイル、digest違いは配置前に拒否します。入力はignored `.vendor/formicarium-inputs` に配置します。prepare receiptの `normalizedDescriptorSha256` はJSONを正規化したdigestで、descriptor raw bytesのdigestとは区別します。既存入力は同じ16 bytes集合のときのみ再利用します。

`mise run ci:terrarium` と `mise run ci:e2e` は `FORMICARIUM_INPUTS_DIR` を明示し、prepareをinstallより先に実行します。miseのenter hookによる自動installは無効です。単独のbuild/test tasksも先に上記prepare/installが必要です。CIは`integration/formicarium-inputs.json`に記録したコミットSHA固定の公開archiveを既定値として取得し、16ファイルのdigestを検証します。repository variable `FORMICARIUM_INPUTS_URL`で同じ固定入力の別配布先を指定できます。未設定でも既定archiveを使うため、clone/forkごとの変数設定は不要です。入力は公開forkの専用ブランチに保存し、mainへビルド成果物を追加しません。formicariumのリポジトリは公開済みですが、npm/JSR packageをリリースしたものではありません。

legacy Wasmとformicarium guestは別のcatalog/siteで検証します。`scripts/assemble-pages.sh OUTPUT legacy` はstaged `web/dist`を維持し、default/formicarium modeは固定guestを配置します。browser configは `TERRARIUM_BUN` と絶対 `TERRARIUM_SITE_DIR` を必須とし、legacy terminal/pitchfork と専用45 casesを分けます。`site:build`の既定出力は従来の`.site`です。既存候補を保存する検証では別出力を使い、必要なら `TERRARIUM_PROTECTED_SITE` に保存対象の絶対pathを指定します。

`pages.yml`と`publish-terrarium.yml`もinstall前に同じ固定入力を準備します。lint workflowsは依存installを行いません。同じコミットSHA固定のarchiveを既定値として使います。公開RC/実Pages/実Safari受入れはローカル検証の対象外です。

### 最新pitchforkのCI対象

E2E CIはGitHubの最新安定リリースを実行ごとに一度解決し、そのtagとfull commit SHAをbuild/cache/staging/ブラウザ検証へ渡します。API取得や最新ソースのbuildに失敗した場合は旧版へfallbackしません。解決した版の専用patchがあればそれを使い、なければ最新patchの適用を試みて不一致を失敗として報告します。

ローカルの`ci:e2e`も最新安定版を要求します。事前にそのcommitを`build-pitchfork.sh`でbuildし、`TERRARIUM_PITCHFORK_BUILD`で出力を渡してください。CI用legacy候補のdefaultとversion期待値は解決した版を使います。公開サイトのdefault設定と、digest固定のformicarium検証入力は別に保持します。
