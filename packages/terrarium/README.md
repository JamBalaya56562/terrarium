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

## Common runtime integration (public RC)

The aube and pitchfork builds advertising a static-musl guest use the public
formicarium Session API. Catalogues without a guest retain the legacy Session.
The existing exported `Session` and `Tool` remain available for legacy callers.
Guest executables and fixtures are served separately by tool/ref; they are not
part of the formicarium package. Explicit unknown refs and invalid fixture or
asset digests fail rather than silently falling back.

The dependency is pinned to npm `@aletheia-works/formicarium@0.1.0-rc.1`.
The tarball SHA256 is
`8334d7f14c31109e5be3ec90147aa02105d8d839c4c79eccc1c25cb88eabbb3a`.
Supply the complete validated public RC inputs before building the site:

```sh
FORMICARIUM_INPUTS_ROOT=<absolute-public-RC-input-directory> mise run terrarium:formicarium-build
FORMICARIUM_INPUTS_ROOT=<absolute-public-RC-input-directory> mise run terrarium:formicarium-unit
mise run terrarium:formicarium-e2e
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
mise run terrarium:rc:prepare
cd packages/terrarium
mise exec -- bun install --frozen-lockfile
```

archive は descriptor に記載した16 regular filesをその相対pathで含むgzip ustarです。リンク、余分/不足ファイル、digest違いは配置前に拒否します。入力はignored `.vendor/formicarium-inputs` に配置します。prepare receiptの `normalizedDescriptorSha256` はJSONを正規化したdigestで、descriptor raw bytesのdigestとは区別します。既存入力は同じ16 bytes集合のときのみ再利用します。

`mise run ci:terrarium` と `mise run ci:e2e` は `FORMICARIUM_INPUTS_DIR` を明示し、prepareをinstallより先に実行します。miseのenter hookによる自動installは無効です。単独のbuild/test tasksも先に上記prepare/installが必要です。CIの4workflow（`test-terrarium.yml`、`test-e2e.yml`、`pages.yml`、`publish-terrarium.yml`）は repository variable `FORMICARIUM_INPUTS_URL` に現在の固定16ファイルを含むHTTPS archiveのURLを明示する必要があります。未設定・空値はprepareおよびinstallの前に拒否し、旧archiveへのfallbackはありません。取得後に `integration/formicarium-inputs.json` の全16ファイルのpath・size・SHA-256を検証します。ローカルの正しい入力は検証済みですが、この現在入力の遠隔配布先・供給・到達性と遠隔CIの受入れは未検証です。配布URLや公開済みpackageをこの文書で仮定しません。

legacy Wasmとformicarium guestは別のcatalog/siteで検証します。`scripts/assemble-pages.sh OUTPUT legacy` はstaged `web/dist`を維持し、default/formicarium modeは固定guestを配置します。browser configは `TERRARIUM_BUN` と絶対 `TERRARIUM_SITE_DIR` を必須とし、legacy terminal/pitchfork と専用45 casesを分けます。`site:build`の既定出力は従来の`.site`です。既存候補を保存する検証では別出力を使い、必要なら `TERRARIUM_PROTECTED_SITE` に保存対象の絶対pathを指定します。

`pages.yml`と`publish-terrarium.yml`もinstall前に同じ固定入力を準備します。lint workflowsは依存installを行いません。現在の固定16ファイルを含む明示URLを必須とし、未供給時に拒否します。実Pages/実Safari受入れはローカル検証の対象外です。

### 公開RCの同一性と受入れ

公開RCはnpm registryからversion固定で取得します。同versionのlocal packが既存のnode_modulesにある場合、通常のBun installはそのbytesを再利用することがあります。`scripts/verify-formicarium-rc.mjs`は実導入24ファイルをtarball全ファイルと比較し、version、SHA256、npm integrity、lockfileVersion 1のregistry解決を照合します。不一致なら受入れは失敗です。今回の再導入では`bun install --force`で解消しました。

```sh
mise run terrarium:rc:prepare
mise exec -- node scripts/verify-formicarium-rc.mjs
```

既存の検証済みguest/resolverから別ディレクトリへ公開RC入力を作る場合、旧入力を固定したdescriptorを指定します。scriptは旧16ファイルを検証し、tarballとpackage manifestだけを公開RC由来へ更新します。標準出力の新descriptorを`integration/formicarium-inputs.json`と照合してください。

`terrarium:rc:prepare`は新環境で出力ディレクトリを作成し、npm registryへのexact versionの`npm view`／`npm pack --ignore-scripts`でtarballを取得します。圧縮tarballのSHA256とregistry integrityを照合してから配置し、不一致の既存tarballは上書きせず失敗します。npm cacheは一時ディレクトリ内で完結します。`ci:terrarium`と`ci:e2e`はこの取得を準備に含み、packageの`bun run test`も`test:prepare`を先に実行します。直接`bun test tests/formicarium-rc-identity.test.ts`を実行する場合も、先にこのtaskを実行してください。

```sh
mise exec -- node scripts/prepare-formicarium-rc-inputs.mjs --from <old-inputs> --descriptor <old-descriptor.json> --output <new-inputs>
mise exec -- node scripts/accept-formicarium-node.mjs --inputs <new-inputs> --output <node-report.json>
```

2026-10-10の受入れ結果はNode 6/6、Chromium／Firefox／WebKit各15/15、skip 0です。実guestはaube v2.7.0とpitchfork v2.30.0で、version、seed/nested cwd、設定ファイル永続化、非zero exit後の回復、disposeを確認しました。browserのDOM/event/iframe/origin契約は既存45ケースで確認しました。コマンド・環境version・出力・差分は`aidlc/spaces/default/intents/261010-formicarium-rc-acceptanc/construction/code-generation/evidence/`に記録しています。これはローカル受入れで、遠隔CI・Pages・実Safariの結果は未検証です。

### 最新pitchforkのCI対象

E2E CIはGitHubの最新安定リリースを実行ごとに一度解決し、そのtagとfull commit SHAをbuild/cache/staging/ブラウザ検証へ渡します。API取得や最新ソースのbuildに失敗した場合は旧版へfallbackしません。解決した版の専用patchがあればそれを使い、なければ最新patchの適用を試みて不一致を失敗として報告します。

ローカルの`ci:e2e`も最新安定版を要求します。事前にそのcommitを`build-pitchfork.sh`でbuildし、`TERRARIUM_PITCHFORK_BUILD`で出力を渡してください。CI用legacy候補のdefaultとversion期待値は解決した版を使います。公開サイトのdefault設定と、digest固定のformicarium検証入力は別に保持します。

### ローカル候補の確定と復旧

staging と site assembly は入力を検証し、出力先と同じ filesystem の専用作業領域で候補全体を完成させてから切り替えます。既存候補は `.<output-name>.transactions/<attempt_id>/retained` に履歴として保持します。`record.json` は入力 identity、全 inventory（種類、file size/digest、symlink のリンク先文字列）、順序番号と完了状態を記録します。リンク先は追跡しません。候補の専有には sibling の `.transactions.lock` を使います。

`completed_ready` だけが今回の成功です。通常の途中失敗は旧候補を保持または復旧し、今回の work を清掃して `completed_failed` にします。正常履歴は削除せず再実行できます。履歴保持物は各試行の旧 inventory、現在候補は最新の順序番号の output inventory と照合します。

清掃・復旧・完了記録・lock 解除の失敗、強制終了後の未完了記録、記録欠落・不整合は成功にしません。診断にある candidate、attempt、retained、work、lock と inventory を確認して、人が復旧してください。保持物を自動削除しません。旧候補を戻す場合は、対象が存在しないことと保持物の種類・内容が previous inventory に一致することを先に確認します。完全な新候補が残っても今回の受入れ済みとは扱いません。未解決の試行・lock を証跡付きで別名に保全し、選択した候補を確認してから、新しい出力先で検証をやり直してください。公開環境の無停止切替や電源断時の自動復旧は保証しません。
