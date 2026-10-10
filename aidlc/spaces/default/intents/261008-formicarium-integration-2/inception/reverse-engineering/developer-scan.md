## Developer Code Scan Results

Focused scan / Minimal depth、2026-10-08。対象は既存formicarium npm統合と検証証跡。アプリコード変更、テスト再実行、公開、push、PR作成は実施していない。旧intentの承認と証跡は保持する。今回の正式レビューは未実施であり、この調査はレビュー合格を意味しない。

### Scan Coverage

**Analyzed deeply**（snapshot内の実際に読んだ個別pathのみ。ディレクトリ全体を深掘りしたとは主張しない）:

- `packages/terrarium/src/formicarium-session.ts`
- `packages/terrarium/src/catalog.ts`
- `packages/terrarium/src/session.ts`
- `packages/terrarium/src/terminal.ts`
- `packages/terrarium/src/index.ts`
- `packages/terrarium/src/npm.ts`
- `packages/terrarium/package.json`
- `packages/terrarium/tsconfig.json`
- `packages/terrarium/tests/tsconfig.json`
- `packages/terrarium/README.md`
- `packages/terrarium/tests/formicarium-session.test.ts`
- `packages/terrarium/tests/formicarium-catalog.test.ts`
- `packages/terrarium/tests/formicarium-assets.test.ts`
- `packages/terrarium/e2e/formicarium-terminal.spec.ts`
- `packages/terrarium/e2e/formicarium-iframe.spec.ts`
- `packages/terrarium/playwright.formicarium.config.ts`
- `scripts/stage-formicarium.mjs`
- `scripts/assemble-pages.sh`
- `integration/formicarium-inputs.json`
- `web/terminal.mjs`
- `mise.toml`
- `.github/workflows/test-terrarium.yml`
- `.github/workflows/test-e2e.yml`

**Components analyzed deeply**:

- Formicarium command adapter
- Build catalog
- Legacy Session compatibility boundary
- Terrarium terminal element
- Standalone and iframe bridge
- Formicarium asset staging
- Site assembly
- Formicarium integration tests
- Package build and test configuration
- Fixed integration input descriptor
- Package and E2E CI integration

**Skimmed only**（ファイル列挙、import、過去記録からの所在確認。最新深掘りの対象外）:

- `packages/terrarium/e2e/host/`
- `packages/terrarium/src/generated/`
- `runtime/`
- `patches/`
- `fixtures/`
- `infra/`
- `scripts/`（上記2ファイル以外。prepare-formicariumの実装は未読）
- `.github/workflows/`（上記2ファイル以外）
- `web/`（terminal.mjs以外）

既存知識の深掘りはfingerprintなしで未検証。今回deepに挙げたpathだけを新しいverified coverageにし、他領域の既存文章は保持しつつshallowへ降格する。旧intentのhandoff、pre-pr/resolution、final-resultsとログdigest、ci-remediationの3記録を別途読んだ。これらは証跡・履歴でありapplication analyzed.pathsへ追加しない。

### Packages Found

`@aletheia-works/terrarium` 0.1.0はTypeScript製browser Custom ElementとDOM-free legacy Session。npm rootはnpm.ts、JSR向けrootはindex.ts、`/session`は既存session.tsを保持。内部formicarium-session.tsは公開rootからre-exportしない。外部 `@aletheia-works/formicarium` は0.1.0-rc.1の相対file tarball依存であり公開RC受入れではない。

### Build System

Bunで依存とunit、tscでstrict型検査・declaration生成、Bunでbrowser bundle。gen-cssでxterm stylesheetを埋め込む。miseのNodeは26.9.0、Bunや各linterはlatest。ci:terrarium/ci:e2eは固定入力prepareをfrozen installより前に要求し、enter hookは空。package exportsはrootと/session、build出力distを配布する。file tarball依存は`.vendor/formicarium-inputs-repair-v1/...tgz`を参照するため、registry packageとしてそのまま公開できる状態とは判断しない。

`stage-formicarium.mjs` はinstalled packageの24固定files、manifest identity、Blink loader/wasm digest、全advertised refsのguest/fixture/build-info digest・ELF/provenanceを検証してから出力を書く。C3 manifest.js/fixtures.js/resolver.jsはbytesをコピーして別配信する。unrelated tool metadataを保持。assemblyのformicarium modeはlegacy staged webをコピーした後に検証済みcatalog/runtimeを配置、legacy modeは旧catalogを維持。別outputを消して組立てるため後続検証は保存候補を指定せず専用出力を使う。

### APIs Discovered

- **C1 adapter**: `FormicariumSession.create/run/reset/dispose`、cwd、lastResult。createSessionを`@aletheia-works/formicarium/browser`から使い、Session public APIだけでrun/readFile/listEntries/remove/setCwd/reset/disposeを行う。initial entriesを/workでseedした後にnested cwdへ切替。guest bytesはcopy、runはpromise queueで直列化、600000ms default timeout、AbortSignalとdispose abort。stdout/stderrは別TextDecoder、callback sequence増加を確認しcallbackだけを表示源とする。builtins cd/ls/cat/rm/pwdとunknown=127を維持。
- **C3 boundary**: guest宣言なしはlegacy、static-musl-x86_64だけformicarium。clean HTTP(S) base、resolved tool/ref/commitとChoice同一性を確認。fixture undefinedと空文字を区別、cwd overrideはpath正規化。resolverの内容とruntime内部は今回深掘りしていない。
- **Element**: ready/run/transcript/focus、ready/exit/error custom events（bubbles/composed）。bootにcrossOriginIsolatedが必要。generationでdisconnect/reconnect/tool変更の旧結果を抑止、formicarium sessionをdispose。tool変更時ref/fixture/cwd/runを除去。空runはexit eventを増やさず、run失敗後queueを復旧する。
- **Iframe**: web/terminal.mjsがqueryからelementを設定。terrarium:runは実parentのsourceとexact originを両方確認。notify targetは同originのみ。null/wildcard/opaque/invalid parent、isolation不足はpreflight失敗。cross-origin credentialless非対応browserはerrorを示す。same-origin Worker assetsはweb/formicarium以下。
- **Data models**: ToolInfo/BuildInfo/Catalog/Choice、SelectedGuest、FsEntry public union、CommandResultとReadyDetail/ExitDetail/ErrorDetail。DB・server endpointの新設は見られない。

### Frameworks & Libraries

package declared ranges: @xterm/xterm ^6.0.0、@xterm/addon-fit ^0.11.0、@playwright/test ^1.63.0、@types/bun ^1.4.2、TypeScript ^7.0.2。resolved lock versionは今回未精査。Web platform Custom Elements/Shadow DOM/Worker/SABを使用。formicarium Blink runtimeはexternal boundaryとして扱う。旧Emscripten CLI factory pathは残る。

### Test Coverage

Bun testsはtests/、Playwrightはe2e/。今回読んだ3unit filesはpublic fake Session、catalog/resolver injection、実stage functionを使い、nested cwd、quoting adjacency、partial output、UTF-8、queue recovery、identity/digest拒否とassets preservationを検証する。compile-only @ts-expect-errorはpublic API負例。専用browser configはChromium/Firefox/WebKit、workers1/retries0、実explicit site/bun必須、Service Worker block、failure trace保持。2 dedicated spec filesは15cases×3browser、実guest version、keyboard/lifecycle、parent originとguest marker oracle、unsupported/missing-isolationの非実行を検証。coverage percentage/thresholdは今回読んだ設定にない。

**証跡の区別**:

1. pre-pr/evidence/final-results.json と紐づく10filesのSHA-256を今回再計算し全一致。raw tailはunit85/0fail、専用45pass、legacy34pass/2existing skips、lint exit0を示す。CT-1はtraceability18/18/missing0で解消記録。これらは当時の実行結果。
2. 同source-inventoryの74filesのうち現在25filesが異なる。従って85/45/34+2を現在ソースの合格として転記しない。今回テスト実行はゼロ。次のBuild and Testは現在source/candidate/inputs inventoryを結び直し、新しいraw logとcommand/cwd/env/exitを保存する必要がある。
3. 後続ci-remediation/input-delivery.mdは公開固定archiveの同一性確認と91unit/typecheck/build/lint成功を記録。latest-pitchfork.mdは89unit等と2.30.1 identity、latest-locked-crates.mdはremote run37721681248のmio1.2.4失敗後3cratesのforward dry-run成功を記録する。これらは履歴記載であり、本scanによるfresh testやremote修正後CI合格ではない。

**25 source drift paths**:

- `.github/workflows/pages.yml`
- `.github/workflows/publish-terrarium.yml`
- `.github/workflows/test-e2e.yml`
- `.github/workflows/test-terrarium.yml`
- `integration/formicarium-inputs.json`
- `mise.toml`
- `packages/terrarium/README.md`
- `packages/terrarium/bun.lock`
- `packages/terrarium/e2e/formicarium-iframe.spec.ts`
- `packages/terrarium/e2e/formicarium-terminal.spec.ts`
- `packages/terrarium/e2e/host/pitchfork-element.html`
- `packages/terrarium/e2e/host/pitchfork-iframe.html`
- `packages/terrarium/e2e/pitchfork.spec.ts`
- `packages/terrarium/package.json`
- `packages/terrarium/src/formicarium-session.ts`
- `packages/terrarium/tests/formicarium-assets.test.ts`
- `packages/terrarium/tests/formicarium-catalog.test.ts`
- `packages/terrarium/tests/formicarium-inputs.test.ts`
- `packages/terrarium/tests/pitchfork-runtime.test.ts`
- `scripts/assemble-pages.sh`
- `scripts/build-pitchfork.sh`
- `scripts/prepare-formicarium.mjs`
- `scripts/prepare-pitchfork-e2e.sh`
- `scripts/resolve-ref.sh`
- `scripts/stage-formicarium.mjs`

### Code Quality Indicators

明確なC1/C3 adapter boundary、generation guard、typed contracts、happy/negative path testsがある。strict/noUncheckedIndexedAccess/noImplicitOverrideが有効。Biome/Tombi/rumdl/ShellCheck/actionlintをmise taskで実行。読んだCIはSHA-pinned actions、read permissions、checkout persist-credentials false、固定archive入力prepare、別legacy/formicarium候補を組立て3browserを検証。immutable provenance descriptorは16filesのpath/size/SHAを保持。READMEはlocal candidateとpublished acceptanceを区別し、公開archive既定とlatest pitchforkのCI責務を追記する。

### Technical Debt Signals

- package README冒頭やterminal ready文言はCLIをWebAssemblyへcompileした表現、formicarium guest branchはstatic musl ELF実行なので採用方針・利用者説明との整合は正式レビューで確認する。AGENTSのno emulator方針からの正式採用変更は人の判断。
- local file dependencyとfixed archiveは開発入力。公開npm/JSR RC受入れ、実Pages/service-worker reload、実Safariは未検証。専用configはserviceWorkers:blockなので実deployの証拠にならない。
- pre-pr/resolutionのarchive未配備という過去記載は後続input-deliveryで更新済み。現コードにcommit-pinned公開URL既定がある。現在の到達性はこのscanではnetwork照会していない。
- prepare-formicarium.mjs、runtime internals、new crate patchesとlatest pitchfork build実装はsnapshot深掘り範囲外。正式レビューまたは次段階で必要なら別の証拠を取得する。
- stageFormicariumは全validation後にファイルを逐次書く。write途中失敗のatomic output保証は見られず、完成receiptのない出力を候補成功と扱わない。

### Fresh snapshot recheck

親担当が23個別pathsで取得した新しいpre-scan snapshotの後、上記23ファイルをすべて再読した。取得時刻: 2026-10-08T09:44:35.318071+00:00

- Snapshot source: `tree:8ff69ea5e637caf4590b54e8fae90c2a82b651084be9b32cfca81e3d293d110c`
- Snapshot store generation: `sha256:2ba3cefe4b5821a588fe0a4f3deead33b19d9324cccb67252dba1db15c24f3fc`
- 再読結果: C1/C3境界、legacy分岐、16入力、24runtime files、専用15cases×3browser、file依存とCI固定URLの分析に変更なし。歴史証拠と現在source driftの区別も維持する。テスト再実行なし。
- Directory shorthandではなく、上記23個別ファイルをverified deep scopeとする。

再読時点の個別bytes SHA-256:

- `packages/terrarium/src/formicarium-session.ts`: `10ddff46882843453a7d35e5231bdc307a272bab41b4a3640d8fd1a61d3002a2`
- `packages/terrarium/src/catalog.ts`: `452b007bd46c51f9ca3ac1a11557a09a3bb15cbd1235973a75018e243c430904`
- `packages/terrarium/src/session.ts`: `39f0d1800ecc391633fbf68cc37b0134dce0fe6d2ff34d92561105dee8bb1d9c`
- `packages/terrarium/src/terminal.ts`: `1f22e8081a647fb9abe4b4fbb58114b9841c3df16c3fa7cb206fa7c902cef8a7`
- `packages/terrarium/src/index.ts`: `893f931912430ad3459a76ccf2fe66f511112c6274409092616efce4ddb78c47`
- `packages/terrarium/src/npm.ts`: `8d8e7549b8eaf08404f48cb40edf73fbf5fcd99b1de8f13ce7cf47922f4a5aff`
- `packages/terrarium/package.json`: `080f30e4725d2254a15e87108a43a05623008711e7c62b1204625e9a42b128cd`
- `packages/terrarium/tsconfig.json`: `9d8d458cf9eca294df1f0302fa85f74aacb7534327c1dbbf8250dc58c81906b8`
- `packages/terrarium/tests/tsconfig.json`: `5bf6fd0243b94250276ef3950299a3ae7966096d69b483b19c419552e3c8e5f6`
- `packages/terrarium/README.md`: `788c239c6ad7a2a2229bce05eb4bad317588ed71cd2f563eb6486a3c2dcce787`
- `packages/terrarium/tests/formicarium-session.test.ts`: `0189cf498658964d1af592805d9c8b87d39d0099b47fa8e7c80ffb10cf77bffb`
- `packages/terrarium/tests/formicarium-catalog.test.ts`: `77e15e46ae76e80caf5513beb7542156579754814e79fd6fe53499f891f3f8d7`
- `packages/terrarium/tests/formicarium-assets.test.ts`: `7ae1f5529334c7577fd5f19cba483e5d613b3a3ec1c210db7a9f47836b64d4cb`
- `packages/terrarium/e2e/formicarium-terminal.spec.ts`: `982f0e75eac3103e398c08dee22ccc9f8849fc7429345ea4f4dd03d1d227cbd1`
- `packages/terrarium/e2e/formicarium-iframe.spec.ts`: `51687aa30a69c4e4a2975edf922bfb712a66af839fe7ec179a6222bf3307b114`
- `packages/terrarium/playwright.formicarium.config.ts`: `6bf3a0bbfe327536efee30f83db75a189febac83466af79d4b1136a98832f9a1`
- `scripts/stage-formicarium.mjs`: `2e6681c5ecc8925fd191f9a2d80ad5676a99a6c21dbc398d6ba64adb3253b7af`
- `scripts/assemble-pages.sh`: `5a6be702b1f7b0560b0a48c9dc2c0a19523c3fb53567c76cba723080982d317c`
- `integration/formicarium-inputs.json`: `3af5b67cd5ae9e6d78b3335571d68d20bf746e4daab64316f2ddfab3b3721be3`
- `web/terminal.mjs`: `c492bbefc5128bb37bfb0118abbf024f00194c31dd8264f3c0662af0bbb22c12`
- `mise.toml`: `b96b54e32a21a2773f42fb465a61936b281cb2e922d9f9166e12bb0088a87ce1`
- `.github/workflows/test-terrarium.yml`: `9fb315569ccc350bcc19f3b12e0a9e2700b8fb7634c5ba48096a50b866dc52a6`
- `.github/workflows/test-e2e.yml`: `f54671e0a65508bf014dc28e83a45a04c4bc634745e453c9ba6256bb08461094`

## Handoff Summary

- **Intent-relevant finding**: 現在の統合はC1 public SessionとC3 guest resolverを内部adapterで接続し、guest宣言のないlegacyを維持する（src/terminal.ts `isFormicariumBuild`分岐、src/formicarium-session.ts `create`/`resolveChoice`/`#runGuest`、stage-formicarium.mjs `runtimeInputs`/`guestInputs`）。旧85/45/34+2証跡のdigestは健全だが現在25sourceがdriftしている。正式レビューと新検証なしに現在のU3完了を返さない。
- **Risks / follow-up**: 人の明示指示は正式レビュー必須、結果をformicarium U3へ返す、公開・push・PR禁止。古いhandoffのpush許可は現指示に優先しない。既存9knowledge artifactsの他領域を保持し、今回23個別sourceだけをverified deepとしてpartial mergeする。CT-1旧FAIL履歴は残し、その後18/18解消記録を引用する。U3への結果はintent/現在source/inputs/candidate/レビュー識別子と新検証の有無を区別する。

### Repository repair snapshot confirmation

2026-10-08T09:50:45.970036+00:00 — リポジトリ修復後の新pre-scan snapshotを受領し、上記23個別sourceをすべて再読した。個別bytes SHA-256は先の23行と全一致、分析の変更なし。

- Latest snapshot source: `git:6cbeaedce987b9631bd8735fbfaeb62afb58d23b`
- Latest snapshot store generation: `sha256:2ba3cefe4b5821a588fe0a4f3deead33b19d9324cccb67252dba1db15c24f3fc`
- 前のtree表現snapshotによるCASは成立していない。この最新git表現snapshotを今回の再読と後続synthesisに対応させる。deep coverageは同じ23個別path。新しいテスト結果やレビュー合格は追加していない。
