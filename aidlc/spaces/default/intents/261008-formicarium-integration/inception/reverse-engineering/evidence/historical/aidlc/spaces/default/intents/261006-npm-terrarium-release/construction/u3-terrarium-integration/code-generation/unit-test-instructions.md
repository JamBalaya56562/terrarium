# Unit Test Instructions — U3 Terrarium Integration

## Test Framework Setup and Configuration

既存terrariumは Bun test + TypeScript + Playwright。mainのNode24.21.0は /Users/mutoakio/.local/share/mise/installs/node/24/bin/node。mise shims/execを使用せず、承認後mainで mise ls からBun実体を確定して実コマンドを記録する。未検証のBunパスを発明しない。runner readinessは /Users/mutoakio/Documents/terrarium/packages/terrarium をcwdに実体Bunで `bun test tests/catalog.test.ts` を実行、ログへ絶対実行pathを残す。

Step1で mise.toml にunit専用 `terrarium:formicarium-unit`、`terrarium:formicarium-build`、`terrarium:formicarium-e2e` を定義する。unitタスクは下記3fileだけ、e2eタスクは下記2specだけを選択。runner準備は最初のテスト実行前に完了。browser configはworkers1/retries0、既定の旧guest fetch taskを呼ばない。

## Unit-scoped Commands

全commandをmainで逐次実行。新規タスクは実装前は未定義であり未検証。Step1で実行可能にして実体pathと出力を保存する。

cwd: /Users/mutoakio/Documents/terrarium
- `mise run terrarium:formicarium-unit`: Bun test packages/terrarium/tests/formicarium-session.test.ts packages/terrarium/tests/formicarium-catalog.test.ts packages/terrarium/tests/formicarium-assets.test.ts。新規adapter/selection/asset境界のみ。
- `mise run terrarium:formicarium-build`: package型checkとU3 assets/site組立。型negative consumerもcompileし、wrong API型を拒否。
- `mise run terrarium:formicarium-e2e`: Playwright --config packages/terrarium/playwright.formicarium.config.ts packages/terrarium/e2e/formicarium-terminal.spec.ts packages/terrarium/e2e/formicarium-iframe.spec.ts --workers=1 --retries=0。Chromium/Firefox/WebKit全3project。

cwd: /Users/mutoakio/Documents/formicarium
- `/Users/mutoakio/.local/share/mise/installs/node/24/bin/node --test tests/terrarium/adapter.test.mjs tests/terrarium/assets.test.mjs tests/terrarium/coverage.test.mjs`
- `/Users/mutoakio/.local/share/mise/installs/node/24/bin/node node_modules/@playwright/test/cli.js test --config tests/terrarium/playwright.config.mjs tests/terrarium/consumer.spec.mjs --workers=1 --retries=0`

coverage prepare/report CLIの引数はStep10でgeneration/source/candidateを検証するschemaを固定し、正確な実コマンドを記録する。元U2 collectorの再prepareで古いresultsが残る問題を使って成功を作らない。欠落/不一致/既存outputdirを必ず拒否する。

## Test Cases and Volume

標準5–8件/componentを最低とし、要件に必要なiframe/端末scenarioを追加。
- adapter8件以上: 正常/非0/失敗、split UTF8/順序、empty/unknown/shell拒否、public FS操作のC1/C4表、hardlink/mode/link/copy、nestedcwdで/work sibling保持、queue回復/dispose。
- catalog/assets各5–8件: 最新2toolと旧aube ref、explicit欠落拒否、default/fixture空/undefined、commit/hash、配置されたworker/core組、旧metadata保持、型negative。
- frontend8scenario以上×3browser: ready/events/transcript/run/keyboard/focus/switch/切断、実guestversionと連続操作、初期化/実行失敗と次run。
- iframe9セル＋各条件未承認親: C5の全条件、event.source/origin/type/command型、null/*/unknown origin、不正親へ通知なし。実行監視とmarker oracleを必須にする。

## Expected Coverage Targets

第一者配布JS全体で行80%以上、統合前CI。U1固定13 + U2固定3を残し、実際のU3配布JSを事前固定して追加。未import0%、realm欠落/旧receipt/source不一致は失敗または未検証。生成core/wasm、第三者xterm、guest、types、tests/demoは理由付き別検証。全体判定/CIはU4所有で、U3局所結果だけで合格を宣言しない。

## Mocking and Stubbing Guidance

unitはC1公開interfaceとfetchをstubして通知/失敗/FS翻訳を固定。Session内部stateやcore factoryを模倣して実互換成功と呼ばない。integration/browserは実tarball・実Worker・実最新版guestで確認する。iframe否定ケースは監視だけでなくguest marker副作用不在と組み合わせる。ローカルPages相当と実外部Pages配信結果を別statusにする。

## Test Data Management

U2 .artifacts/u2-guest-distribution/site-v2 の完全11fileとdigestsを使用。aube2.7.0 / pitchfork2.30.0を主対象、aube2.6.1はref互換確認のみ。run開始前公式latestを再確認、変更時は新candidate/identityで検証し旧結果を混ぜない。native基準は同一guest/fixture/sourceで生成しstdout-onlyとstderr/code/raw bytesを別artifactにする。秘密データをfixtureに含めない。

probe600秒、aube browser840秒、pitchfork browser600秒/Node120秒、1worker/retry0、wasm1GBを維持。WebKitは実機Safariの証拠ではない。localpackは公開済みRC受入れではない。通常test-after、不具合は再現Red→同じテストGreenをmain出力で記録する。
