# 品質・検証状況

## Evidence

検証済み（この workflow の親エージェントの既存観測を引継ぎ、新規再実行なし）:

- `packages/terrarium` の直接 Bun `test tests`: **25 pass、0 fail、57 expect、2 files**。Catalog/Session の fake FS/tool tests。coverage % は未計測。
- `TERRARIUM_CWD=app node runtime/run-node.mjs C:/Users/Jam/.tem-pf/wasm32-unknown-emscripten/release/pitchfork.js fixtures/pitchfork-basic fixtures/sessions/pitchfork-basic.txt`: runner exit 0、version 2.29.0、api/worker、add db/remove worker 後の config、status api available、interval set/get 5s を出力。

runner exit 0 は各コマンド成功を保証しない。`runtime/run-node.mjs` の読取根拠: 非ゼロを表示するがプロセス終了コードへ伝搬しない。後続検証は各終了コードと期待出力を照合する。

## Test Coverage

ドキュメント根拠: `tests/` は Catalog と Session、`e2e/` は同一 origin、別 origin 要素、非隔離 error、iframe を対象とする。`rg -n 'test\\(|pitchfork|aube' packages/terrarium/e2e/terminal.spec.ts` のスキャン結果は aube の6宣言、pitchfork 専用なし。`ci:e2e` も v2.6.1 のみ取得する。

## Linting and CI/CD

ドキュメント根拠: Biome、mise の JS/TOML/Markdown/shell/actions checks。package/E2E/lint/autofix/Pages/publish/release/infra workflow が存在する。Pages 以外は一覧中心。完全 lint、型検査、build、CI 実行は未検証。

## Documentation Quality

root/package README、共有 design と API コメントが存在する（読取／一覧根拠）。古い portability/design の未完了記述は、今回の Node 観測や project.md の後日の pitchfork 決定とは時点が異なる。

## Technical Debt and Follow-up

1. pitchfork のブラウザ page・要素・iframe で pthread/service-worker を実測し、既存 aube 回帰を確認する。Node 証拠だけではブラウザを保証しない。
2. clean build と CI、`lint:all`、`ci:terrarium`、`ci:e2e` の合否を記録する。
3. 新規 `build-pitchfork.sh` の executable bit を jj で確認／必要時修正する（親の前回観測 100644）。
4. tool patch の別 ref 互換、途中パッチ適用からの再開の冪等性は未検証。今回の対象 v2.29.0 に限定する。
5. AI-DLC 設定追加を別変更とする。Biome は aidlc/.claude を除外するが新規 .codex/.agents の lint 影響は未検証。

スーパーバイザー実装・ネットワーク対応・汎用ランタイム拡張は今回の追加修正に含めない。
