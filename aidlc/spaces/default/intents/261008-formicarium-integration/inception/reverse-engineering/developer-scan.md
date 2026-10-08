## Developer Code Scan Results

2026-10-08、Minimal depth、Focused scan。対象は未登録の project-root `/Users/mutoakio/Documents/terrarium`。アプリケーション、既存 `.site`、兄弟 formicarium の原本には変更を加えず、テスト・ビルド・公開・push は実施していない。

ユーザーの選択（原文）：

> Focused scanでお願いします。formicarium統合の接続コード、端末・iframe、アセット配置、依存設定、関連テストを調査してください。既存の実装と検証証拠を保存し、現在のソースとの一致を確認してください。

### Scan Coverage

**Analyzed deeply**（ファイル単位。snapshot 許可パス内）：

- `packages/terrarium/src/formicarium-session.ts`
- `packages/terrarium/src/catalog.ts`
- `packages/terrarium/src/terminal.ts`
- `packages/terrarium/src/index.ts`
- `packages/terrarium/src/npm.ts`
- `packages/terrarium/package.json`
- `packages/terrarium/bun.lock`
- `packages/terrarium/jsr.json`
- `packages/terrarium/tsconfig.json`
- `packages/terrarium/tests/tsconfig.json`
- `packages/terrarium/tests/formicarium-session.test.ts`
- `packages/terrarium/tests/formicarium-catalog.test.ts`
- `packages/terrarium/tests/formicarium-assets.test.ts`
- `packages/terrarium/playwright.formicarium.config.ts`
- `packages/terrarium/e2e/formicarium-terminal.spec.ts`
- `packages/terrarium/e2e/formicarium-iframe.spec.ts`
- `packages/terrarium/e2e/formicarium-serve.ts`
- `packages/terrarium/e2e/host/formicarium/element.html`
- `packages/terrarium/e2e/host/formicarium/iframe.html`
- `scripts/stage-formicarium.mjs`
- `scripts/assemble-pages.sh`
- `web/terminal.mjs`
- `mise.toml`
- `.github/workflows/test-terrarium.yml`
- `.github/workflows/test-e2e.yml`

**Skimmed only**（初回の周辺把握として保持。今回の25 exact paths の深い再調査・freshness 認証対象外）：`runtime/`、`fixtures/`、その他 `scripts/`、`packages/terrarium/src/session.ts`、既存テスト、`web/index.html`、`web/tools.json`、その他 `.github/workflows/`。生成 CSS はハッシュだけ確認。兄弟 formicarium の runtime と resolver 実装はこの調査の深い coverage に含めない。旧 CodeKB は UNVERIFIED のため、この一覧外の旧深い coverage を継承しない。

今回の有効 snapshot は [revision-snapshot.json](evidence/revision-snapshot.json)。前回 exact snapshot は [exact-scope-snapshot.json](evidence/exact-scope-snapshot.json)。上記 deep coverage の25ファイルだけを対象とし、source fingerprint は `tree:2ed309925418cce2a885b5828323813c57cd3d3921f04b29140b5bc8ea31d998`、今回の store generation は `sha256:e93df109fd65ee48b34f1fe29779047fdb5023bc5cd0d1c6e7454480b2ca132c`（前回 `sha256:4d205ab2d1234dbeede10c16e16d6bf03e1d4fbbe712587d2d897ec310f57a21`）。snapshot 取得後に25ファイルをすべて再読し、接続・端末・iframe・staging・依存・テスト・CI の記述を再確認した。[exact-scope-rescan-verification.json](evidence/exact-scope-rescan-verification.json) の raw SHA-256 は保存済み before/after と25/25一致。取り込んだソース20件・候補44件も再比較し64/64一致した。旧 handoff は [developer-scan-prior.md](evidence/developer-scan-prior.md) に保存した。

初回 directory scope fingerprint `tree:76efb44aefed2e76a08d778719bb86e84c822aaf9fc6261de591e000fb3e8423` は広いディレクトリ群を対象としていた。今回の exact-file scope fingerprint は対象集合が異なるため別値となる。履歴 collector の sourceIdentity も対象・算出方式が別である。これらの値の相違はソース変更の証拠ではなく、raw file hash の比較では変更0件。公開比較には今回の exact snapshot と25 paths をそのまま使用し、ディレクトリ coverage を広げない。

### Packages Found

- `@aletheia-works/terrarium` 0.1.0：TypeScript、カスタム要素と既存 Session の npm/JSR パッケージ。npm は `dist/npm.js` と `/session`、JSR は `src/index.ts` と `/session`。公開エクスポートは既存 Session を維持し、formicarium adapter 自体は内部接続。
- `@aletheia-works/formicarium` 0.1.0-rc.1：通常 dependency としてローカル tarball を参照。`/browser` の createSession とルートの公開型を利用。公開済み RC とする根拠はない。

### Build System

Bun＋TypeScript＋mise。`package.json` の build/typecheck/test は CSS 生成を伴うため今回は未実行。`mise.toml:119-131` に formicarium 単体・組立・3 browser の専用 task。`scripts/assemble-pages.sh:11-19` は出力サイトを削除後に web をコピーし、必ず stage-formicarium を呼ぶ。staging は全入力の検証後に package 23 ファイル、resolver 3 モジュール、全 advertised ref の guest/provenance/fixtures を配置し receipt を書く（`scripts/stage-formicarium.mjs:25-103`）。書き込み途中の I/O failure について atomic rollback はない。

依存連鎖：terminal → catalog と FormicariumSession → 公開 formicarium/browser Session。resolver は `base/formicarium-guest-distribution/resolver.mjs` を動的 import。staging → installed package＋兄弟 package manifest＋明示 guest site＋兄弟 resolver。legacy loadTool 分岐は aube/pitchfork 以外に残る。

### APIs Discovered

- Catalog：catalog/choose/describe が tools.json と dist/builds.json を読み、未知 tool/ref を拒否。default は既存の default-first 選択。
- Distribution：usesFormicarium は aube/pitchfork のみ（adapter:15）。resolveChoice は clean HTTP(S) base を検証し、tool/ref/source.commit を resolver 結果と照合（adapter:20-36）。fixture 未指定と空指定を区別し cwd だけ override。
- Session adapter：create/run/reset/dispose。/work に seed 後 public setCwd で nested cwd を選び、guest bytes、args、env、timeout、AbortSignal と callback output を public run に渡す。出力は sequence 単調性と stdout/stderr ごとの UTF-8 decoder を使用し raw result を二重表示しない。pwd/cd/cat/ls/rm と指定 CLI のみ。引用は既存 splitArgs の境界を維持し shell expansion を拒否（adapter:62-80）。network/server 実行を追加していない。
- Element：ready/run/transcript/focus と terrarium-ready/exit/error。接続世代で切替・disconnect の古い結果を抑止し formicarium session を dispose（terminal:196-234、298-314）。tool attribute 変更時 ref/fixture/cwd/run を消す。
- iframe：terrarium:run 入力と ready/exit/error 通知。exactOrigin、parent source/origin の両照合、起動前隔離チェック、cross-origin credentialless 対応チェック（web/terminal.mjs:31-65、141-181）。未知・opaque・wildcard origin は接続しない。
- assets：worker、loader、wasm、build-info の URL は base 以下の formicarium/。Worker は利用ページと同一 origin に配置する条件が必要。単に別 origin の base を渡して動くとは検証されていない。

### Frameworks & Libraries

lockfile の解決値：xterm 6.0.0、addon-fit 0.11.0、Playwright 1.63.0、TypeScript 7.0.2、Bun 型 1.4.2。Web Components と browser Worker が接続面。mise tools は latest 指定で厳密な project pin ではない。バージョンの新旧評価・脆弱性調査は今回行っていない。

### Test Coverage

tests の 11 adapter＋7 catalog＋8 staging の 26 cases。injected fake public Session によるファイルモード、sibling、hardlink peer、queue recovery、UTF-8、quotes、invalid syntax、reset/dispose と TS expect-error 契約。assets suite は temp directory を書き、兄弟 resolver を import するため純粋な独立 checkout テストではない。

e2e は element 10 scenarios＋iframe 5 scenarios を Chromium/Firefox/WebKit で走らせる設計。実 guest version、fixture/cwd、events、keyboard/history、switch/disconnect、未知 ref の Worker 未起動、guest marker を使った不正 message の非実行を確認する。Firefox/WebKit の cross-origin iframe は明示 refusal を期待し、成功実行を期待しない。専用 server は COOP/COEP/CORP を返し、plain は COOP/COEP を外す。serviceWorkers:block のため実 Pages service-worker 経路を立証しない。

今回は新しい test pass を主張しない。保存した直前に生成された imported report に fixed 23 files、1567 lines / 1283 covered / skipped0 = 81.87%、passed:true と46 freshReceipts（Node1＋browser45）が記録される。これは formicarium で直前に実行された結果であり、今回の terrarium チャットで再実行した結果ではない。現行 bytes への適用性は今回独立に検証した。legacy Session 個別 coverage は15.82%、terminal は79.46%；全ファイル80%とは解釈しない。

### Evidence & Current-source Comparison

[evidence/source-before.json](evidence/source-before.json) と [source-after.json](evidence/source-after.json) は31 file の raw SHA-256。読み取り期間の31/31が一致、ソース変更なし。[historical-current-comparison.json](evidence/historical-current-comparison.json) は最新の source inventory の terrarium 20 file と最新の candidate identity の `.site` 44 file を現状と比較し64/64一致、欠落0、不一致0。

[historical-evidence-manifest.json](evidence/historical-evidence-manifest.json) は兄弟の code-generation/verification、summary/traceability、identity、package manifest/tarball、coverage inventory/report/raw/receipts の原本パス・size・SHA-256。JSON/Markdown/TSV のコピーは evidence/historical/ 以下に保存。binary tarball はコピーせず原本の SHA を保存した。ソース・候補の原本はその場に保持している。

保持する識別子：local tarball SHA-256 `969e9fab854d4499da1d38087bd601b65042b6d50b086c8fc8ddaefd0752f810`、package manifest `ba2f4ced257067a4c2aa64c9841b04a04f332e4812bcd369bab0d2807b310aef`、candidate `3e3401c5a93bca5c7635d2ba0761bd72125b3421319c6ce054b178e011602983`。旧 identity.json の4-source identity は `aee272eb2b52f2ed0eac662271c2ca2905a7a415760ab06929fbf80c658e8eda`。coverage generation `47181b67-22c6-4eff-9993-4488e2c103ed` の sourceIdentity は `10e59a2ce434302860783e7d0436efda25e21ab2d5a22354d0a06f6f9c23b9f6`。対象・計算法の異なる両 identity を潰して置換しない。

旧 layer1-2 は25 pass、後続 quote-regression は Red10/1 → Green11/0、combined26/0 を記録。latest-pitchfork は v2.30.1 commit `1054549e85470b08d9507e2c82c850959a4b3914` の native/public Worker version一致を記録する。これらは直前に生成された imported evidence であり、今回再実行していない。

### Code Quality Indicators

mise は Biome、Tombi、rumdl、ShellCheck、actionlint の read-only/fix tasks を定義。package TS は strict/noUncheckedIndexedAccess/noImplicitOverride。既存 PR workflows は SHA-pinned checkout/mise を使用し typecheck/unit/build と旧 Emscripten E2E を実行する。専用 formicarium Playwright config は現行 test-e2e.yml の実行コマンドでは指定されない。今回 lint/CI は未実行。

README の formicarium 節は local candidate と same-origin worker 条件を明記。静的型・identity/digest validation と queue isolation は意図が明示される。一方 catch suppression は UI boundary や stale/dispose などにあり、失敗と cleanup 完了を運用観測できるとは確認していない。

### Technical Debt Signals

1. `package.json:49` と lockfile の絶対 Mac tarball path、assets tests の兄弟 resolver、staging の default sibling path により clean clone / Linux CI は必要入力を持たない。既存 CI は formicarium tarball/manifest/resolver/guest site を供給しない。今の入力条件のまま CI が成功するとは主張できない。
2. assemble-pages が常時 formicarium staging を行い FORMICARIUM_GUEST_SITE 必須。既存 site:build と旧 E2E workflow はこの環境変数を指定していない。旧 build catalog は Emscripten .js/.wasm、formicarium は static-musl guest と digest/provenance を期待する。暗黙に互換とは扱わない。
3. project memory/旧 README の architecture は no emulator/Emscripten を決定済み。一方現行 local integration は blink asset と static-musl guest を使用する。この差は既存実装の事実であり、新しい戦略変更をこの調査で承認・確定しない。人の方針確認が必要な事項として残す。
4. 公開 RC、実 GitHub Pages headers/service-worker、実 Safari、combined CI は兄弟 summary でも未検証。U2 review R-01/R-02 は対象を限定して下記再検討で扱う。U3 の直前の成功証拠に機械的に未解消扱いを波及させない。
5. 初回 jj status は snapshot 書込みで拒否されたが、今回 `jj --ignore-working-copy root` / `log -r @` / `status` はすべて読取り成功。現 working-copy commit は `617cfc66a9cc18bb485d31f4632aa34ed9d5fd93`、親は `8cd2624e`。これで repository inspection の障害は解消した。取り込んだ証拠の baselineCommit `60dd0dc448f3a67d226dc8a3c6b3afcf4709823d` は記録済み baseline metadata として保持し、現 HEAD の代用にしない。

### Reconsideration of Fresh Evidence & Open Items

ユーザーの追加依頼（原文）：

> 未解決の点とか鮮度確認ですね。未解決の点は解決できそうなら解決して欲しいし、鮮度はさっきのformicariumからのデータは最新というかさっきやったばかりです。
> この辺りを再調査じゃないですけど、再検討してみて下さい。

前回「履歴」と呼んだ取り込みデータは、古い検証という意味ではなく、formicarium で直前に生成された実行証拠である。今回コピー済みデータだけに依存せず、兄弟の現在の inventory/report/receipts/identity と collector を読み直し、以下を独立に照合した。source/candidate を変更するテスト・ビルドは実施していない。

- 25 exact path の前後 raw SHA、前回と今回の source tree fingerprint が一致。ソース変更0件。
- source inventory の20ファイルと candidate identity の44ファイルは現行 bytes と64/64一致。候補全ファイル集合の欠落・余剰0件。JSON 配列から候補 digest を独立に再計算し `3e3401c5a93bca5c7635d2ba0761bd72125b3421319c6ce054b178e011602983` と一致。
- coverage inventory の fixed23 の全 original source bytes は23/23一致。digests 配列から sourceIdentity を独立に再計算し `10e59a2ce434302860783e7d0436efda25e21ab2d5a22354d0a06f6f9c23b9f6` と一致。
- 原本から46 receipts（Node1＋browser45）を読み、generation/sourceIdentity/candidateSha256/status を全件照合。installed package23ファイルも manifest digest と一致。U1 immutable component report の原本 SHA も inventory と一致。
- receipt 原本の filesystem mtime は2026-10-08 09:54:50〜09:57:24 JST。これはファイル時刻であり認証済み実行時刻ではないが、人の「さっきやったばかり」という説明と矛盾せず、bytes と binding の一致が現行 applicability を証明する。直前の imported execution evidence を現在の実装に使える。再実行していないことと証拠が古いことを混同しない。

具体的証拠は [reconsideration-proof.json](evidence/reconsideration-proof.json)、原本 SHA と mtime は [reconsideration-latest-evidence.json](evidence/reconsideration-latest-evidence.json)。直前の原本コピーは evidence/reconsideration-import/、前回 handoff は [reconsideration-prior-handoff.md](evidence/reconsideration-prior-handoff.md)。旧証拠と candidate/hash は保持した。

| 項目 | 再検討後の状態 | 根拠と残る範囲 |
| --- | --- | --- |
| 直前の formicarium データの現ソースへの適用性 | 解決 | 同じ exact tree、64/64 raw bytes、fixed23 sources、46 binding、候補 digest 独立再計算。古いデータだから再試験が必要とはしない |
| 公開 Session と端末/iframe のローカル受入れ | 直前の実行証拠により確認済み | 26 Node cases、45 browser cases、fixed23 81.87%。今回の再実行とは記載しない。Firefox/WebKit cross-origin refusal は仕様どおりで失敗の未解決項目ではない |
| U2 R-01 の collector reuse 問題をU3にも適用した懸念 | U3について解決 | 現U3 prepareCoverage は existing output を mkdir/EEXIST で拒否。mergeMeasurements は generation/source/candidate を照合。現9負例は generation、same-length source/candidate、missing/skipped、denominator、reprepare、immutable import、raw attempt を対象。U2旧collectorそのものの修正を証明するものではない |
| U2 R-02 の retained ref assets 欠落 | 今回候補について解決、producer一般問題は follow-up | 現 candidate44全件一致、現 stageFormicarium は全advertised refsのassetsを検証して配置する。site-v3では旧aube v2.6.1も存在。兄弟 producer は input.builds のみ書くため、将来既存manifestへ増分追加する一般問題は別の修正が可能 |
| jj status 読取り失敗 | 解決 | --ignore-working-copy の root/log/status が成功。ソースを snapshot commit に書き込む必要なし |
| CodeKB の fingerprint:unknown | ツール記録上は未解決、実ソース鮮度は上記で確認済み | 正規 stage 手順の codekb-scope-diff --mint --paths exact25 は unknown。snapshot は同範囲 tree を計算できる。help はengineのworkspace verbsのみ提供し、ローカル docs/reference と docs/guide は存在しない。git read-only rev-parse もroot/HEADを返すため「repoなし」とは断定しない。実装調査やmarker手書きでCURRENTを作らず、この差を明記する |
| clean-clone/CIの絶対 tarball、sibling modules、guest site 入力 | 技術的に修正可能な次段階 | supplied immutable assetsをCI入力として定義し、依存と専用configを接続する実装が必要。直前のローカル検証を否定する問題ではない。現ソース保持のため、この段階でpackage/CIを変更しない |
| staging書込途中の原子性、cleanup failure観測 | 技術的に修正可能な次段階 | receipt作成前に全入力検証は済むがI/O atomic replacementではない。再現した機能障害はなく、改修するならconstructionで最小変更を検討 |
| 公開RC受入れ、実Pages/service-worker、実Safari、combined CI | 実行環境または公開作業が必要 | ローカル証拠の適用性では解消できない別の受入れ条件。publish/pushをこの依頼から推定して行わない |
| Emscripten/no-emulator決定と現Blink/static-musl統合の差 | 人の戦略決定が必要 | 現実装の採用を黙示のarchitecture承認へ変換しない。既存統合は保存し差を記録する |

今回の再検討では、解決できる証拠上の問題をbytes/binding/現在のcollector確認で解決した。残る技術的修正はConstructionで具体化可能であり、公開・戦略事項とは区別する。CodeKB自動判定UNVERIFIEDは保存markerの欠落を指し、直前の検証が古い、または現ソースと不一致という結論ではない。

## Handoff Summary

- **Intent-relevant finding**：公開 Session API を使う adapter、共通 terminal/iframe、23 package file＋3 resolver modules の検証配置、local tarball dependency が現行ソースに存在する。source inventory 20件と candidate 44件は現行 SHA-256 と一致し、直前に取り込んだ検証を現行 bytes に関連づけられる。
- **Risks / follow-up**：直前の imported execution evidence は現ソース/候補に適用できる。U3 collector と今回 retained-ref 候補の懸念は上記で解消した。残る項目はCodeKB markerのツール制約、Constructionで修正可能なCI供給/一般producer問題、公開環境の受入れ、人のarchitecture判断に分ける。新規テスト実行とは混同せず、source/candidate/hashと旧証拠を保持してarchitectへ渡す。
