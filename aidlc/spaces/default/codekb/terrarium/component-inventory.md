# コンポーネント一覧

ドキュメント根拠: 開発者スキャン。状態はテスト合否ではなく、読取範囲からのリスク評価（推測）。深い解析対象の名前は timestamp と一致させる。

## Catalog

所有: ツール／ビルド選択メタデータ。`src/catalog.ts`。ページ・要素が消費する。評価 healthy: 単体証拠あり、詳細は quality。

## Session

所有: セッションディスク・cwd/env・コマンド処理。`src/session.ts`。Tool/FS アダプターへ依存。評価 healthy: 単体証拠あり。

## Page Adapter

所有: URL、選択 UI、iframe メッセージ。`web/terminal.mjs`、`web/tools.json`。要素と Catalog に依存。評価 at-risk: pitchfork ブラウザ証拠不足。

## Build Distribution

所有: ツールの ref/commit、コンパイル、パッチ適用、配布成果物メタデータ。`scripts/` と Pages workflow。評価 at-risk: clean build、別 ref 互換、実行ビット未確認。

## Node Runner

所有: Node での fixture／記録コマンドの駆動。`runtime/run-node.mjs`。Session に依存。評価 at-risk: runner exit と各コマンド exit の相違。

## Terminal Element

所有: 端末 UI、ツール読込、公開イベント。`src/terminal.ts`（浅い読取）。Catalog/Session/xterm に依存。評価未確定。

## Runtime Extensions

所有: 不足 syscall と MEMFS 補完。`runtime/`（一覧中心）。Emscripten に依存。評価未確定。

## Verification Fixtures

所有: fixture と記録セッション、unit/E2E。`fixtures/`、`tests/`、`e2e/`（浅い読取）。評価 at-risk: aube 中心の browser suite。

## Repository Infrastructure

所有: リポジトリ設定、公開・release workflow、AI-DLC 記録。`infra/` と関連設定（一覧のみ）。評価未確定、今回再設計しない。
