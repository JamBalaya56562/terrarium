# コンポーネント一覧

## Formicarium command adapter

terrariumコマンド、queue/output、public Session lifecycleを所有。C3 resolverと外部browser APIに依存。

## Build catalog

ToolInfo/BuildInfo/Catalog/Choiceとtool/ref選択を所有。adapter/elementにChoiceを渡す。

## Legacy Session compatibility boundary

既存Session public APIとlegacy FS/cwd/env/command互換を所有。Emscripten Tool/FSへ依存。

## Terrarium terminal element

xterm UI、transcript/events、generationと切替/disconnectを所有。catalogとadapter/legacyに依存。

## Standalone and iframe bridge

query/選択UIとexact-parent iframe通信を所有。elementに依存。

## Formicarium asset staging

24固定package filesとC3 modules、guest/fixture/provenanceの検証・配置を所有。installed inputsに依存。

## Site assembly

legacy/formicarium候補ディレクトリとcatalog/runtime組立を所有。staging出力に依存。

## Formicarium integration tests

unit/public負例と3browser受入れspecを所有。fake Sessionと専用候補に依存。

## Package build and test configuration

exports、相対tarball、strict tsc、Bun/build/mise接続を所有。配布受入れとは区別。

## Fixed integration input descriptor

16filesの固定path/size/SHA入力契約を所有。prepare/staging/CIが消費。

## Package and E2E CI integration

固定prepare、package checks、legacy/formicarium別browser候補を所有。SHA-pinned Actionsとmiseに依存。


根拠: [開発者引継ぎ](../../intents/261008-formicarium-integration-2/inception/reverse-engineering/developer-scan.md)。深い解析の個別23pathは[解析時点](reverse-engineering-timestamp.md)、証跡の適用性は[品質](code-quality-assessment.md)。

## Preserved Prior Store (historical; not current verification)

以下は前storeの文章を保存した履歴。今回範囲外の深い解析はshallowへ降格した。「現行」「確認済み」等は元intent時点の表現で、今回のfresh合格・承認を意味しない。上の今回評価を優先する。

# コンポーネント一覧（現行 focus）

## Catalog

所有: tool/ref/build metadata と選択。adapter に Choice を渡す。型・拒否テストは直前の実行証拠が現行bytesに適用できる。

## Formicarium Session

所有: terrarium コマンド境界、queue、output decoding、public Session lifecycle。Guest Resolver と外部 browser API に依存。at-risk: local 配布入力条件。

## Terminal Element

所有: xterm UI、transcript/events、接続世代、切替/disconnect。Catalog と adapter/legacy Session に依存。at-risk: 実 host の隔離条件は未検証。

## Page Adapter

所有: URL/選択 UI と exact-origin iframe 入出力。要素に依存。ローカル受入れ確認済み: Firefox/WebKit cross-origin refusal は仕様どおり。実Pages受入れは別条件。

## Asset Staging

所有: package 23 file と resolver 3 module、全 advertised guest/provenance/fixture と配置 receipt。installed package・兄弟 manifest/resolver・guest site に依存。at-risk: CI 入力欠落、途中 I/O rollback なし。

## Integration Verification

所有: adapter/catalog/assets tests、dedicated browser tests/server/hosts/config。public API fake と local candidate に依存。ローカル受入れ確認済み、U3 collector/binding 懸念は解消。combined CI/Pages/実Safariは別の受入れ条件。

## Package Configuration

所有: npm/JSR exports、dependency/lock、TS 設定と mise tasks。at-risk: 絶対 tarball path による portable checkout 制約。

旧コンポーネントも以下に保持する。重複名の旧評価は歴史記述として読み、fresh analyzed.components は上記の七つのみ。

根拠: [開発者スキャン](../../intents/261008-formicarium-integration/inception/reverse-engineering/developer-scan.md)。現在の深い解析範囲は [解析時点](reverse-engineering-timestamp.md)、検証証拠と制約は [品質](code-quality-assessment.md)。

再調査根拠: exact25 snapshot 後の全25ファイル再読・raw SHA25/25一致、直前のimported source/candidate再比較64/64一致。[再調査記録](../../intents/261008-formicarium-integration/inception/reverse-engineering/evidence/exact-scope-rescan-verification.json)。今回新規テスト実行なし。

## Prior Knowledge (historical, shallow outside current focus)

以下は `261004-pitchfork-continuation` の記述を保持したもの。旧 deep coverage は UNVERIFIED のため今回の verified deep 範囲に継承しない。現行 focus については上の記述を優先する。

## コンポーネント一覧

ドキュメント根拠: 開発者スキャン。状態はテスト合否ではなく、読取範囲からのリスク評価（推測）。深い解析対象の名前は timestamp と一致させる。

### Catalog

所有: ツール／ビルド選択メタデータ。`src/catalog.ts`。ページ・要素が消費する。評価 healthy: 単体証拠あり、詳細は quality。

### Session

所有: セッションディスク・cwd/env・コマンド処理。`src/session.ts`。Tool/FS アダプターへ依存。評価 healthy: 単体証拠あり。

### Page Adapter

所有: URL、選択 UI、iframe メッセージ。`web/terminal.mjs`、`web/tools.json`。要素と Catalog に依存。評価 at-risk: pitchfork ブラウザ証拠不足。

### Build Distribution

所有: ツールの ref/commit、コンパイル、パッチ適用、配布成果物メタデータ。`scripts/` と Pages workflow。評価 at-risk: clean build、別 ref 互換、実行ビット未確認。

### Node Runner

所有: Node での fixture／記録コマンドの駆動。`runtime/run-node.mjs`。Session に依存。評価 at-risk: runner exit と各コマンド exit の相違。

### Terminal Element

所有: 端末 UI、ツール読込、公開イベント。`src/terminal.ts`（浅い読取）。Catalog/Session/xterm に依存。評価未確定。

### Runtime Extensions

所有: 不足 syscall と MEMFS 補完。`runtime/`（一覧中心）。Emscripten に依存。評価未確定。

### Verification Fixtures

所有: fixture と記録セッション、unit/E2E。`fixtures/`、`tests/`、`e2e/`（浅い読取）。評価 at-risk: aube 中心の browser suite。

### Repository Infrastructure

所有: リポジトリ設定、公開・release workflow、AI-DLC 記録。`infra/` と関連設定（一覧のみ）。評価未確定、今回再設計しない。
