# 品質・検証状況（現行 focus）

## Evidence

今回はテスト・build・lint を再実行していない。historical-current-comparison は source inventory 20 file と `.site` candidate 44 file の raw SHA-256 を比較し **64/64一致、欠落0、不一致0**。source-before/after は **31/31一致**。これは記録済み検証を現行 bytes に関連づける証拠であり新規実行成功ではない。[保存 manifest](../../intents/261008-formicarium-integration/inception/reverse-engineering/evidence/historical-evidence-manifest.json) に原本 path/size/SHA、JSON/MD/TSV コピーを保持し binary tarball は原本 SHA のみ保持する。

## Test Coverage

現行の設計: adapter11＋catalog7＋assets8 = 26 unit cases、element10＋iframe5 を3 browserで実行する専用 suite。fake public API、filesystem modes/links、queue/UTF-8/quotes、型の expect-error、lifecycle、guest version/marker、unknown ref の未起動を検証対象とする。Firefox/WebKit の cross-origin iframe は refusal を期待する。serviceWorkers:block と専用 COOP/COEP/CORP server のため実 Pages service-worker 経路ではない。

保存した歴史 report は fixed 23 files、1567 lines /1283 covered /skipped0 = **81.87%**、passed:true、46 freshReceipts（Node1＋browser45）。legacy Session 個別15.82%、terminal79.46%で全file80%ではない。旧 layer1-2 25 pass、quotes Red10/1 → Green11/0、combined26/0、latest pitchfork v2.30.1 commit `1054549e85470b08d9507e2c82c850959a4b3914` の native/public Worker version一致も歴史証拠。今回の結果と混同しない。

## Linting and CI/CD

Biome/Tombi/rumdl/ShellCheck/actionlint tasks、strict/noUncheckedIndexedAccess/noImplicitOverride。既存 workflows は SHA-pinned checkout/mise、typecheck/unit/build/旧 Emscripten E2E を実行するが dedicated formicarium Playwright config を指定しない。絶対 tarball/兄弟入力/guest-site が供給されず、combined CI 成功を確認していない。

## Documentation Quality

README は local candidate と same-origin Worker 条件を記述。旧 project memory の Emscripten/no-emulator と current blink/static-musl 接続との差は architecture に明示する。catch suppression により失敗/cleanup を運用観測できるか未確認。

## Technical Debt and Follow-up

clean clone/CI 配布入力、公開 RC、実 Pages headers/service-worker、実 Safari、combined CI、兄弟 U2 review R-01/R-02 Major は未解決/未検証のまま。方針差は人の確認が必要でこの調査で戦略を変更しない。

親の後続観測: escalated jj root/status は成功、working copy `tysyuvwr 617cfc66`、parent `8cd2624e main`。historical inventory コピー1,124,886 bytes は既定1MiB制限で jj snapshot 対象外、disk には保存済み。全証拠が追跡済みとは主張せず、commit/push は行わない。下記 developer handoff の sandbox status failure はこの後続成功以前の観測。

根拠: [開発者スキャン](../../intents/261008-formicarium-integration/inception/reverse-engineering/developer-scan.md)。現在の深い解析範囲は [解析時点](reverse-engineering-timestamp.md)、検証証拠と制約は [品質](code-quality-assessment.md)。

再調査根拠: exact25 snapshot 後の全25ファイル再読・raw SHA25/25一致、旧source/candidate再比較64/64一致。[再調査記録](../../intents/261008-formicarium-integration/inception/reverse-engineering/evidence/exact-scope-rescan-verification.json)。今回新規テスト実行なし。

## Prior Knowledge (historical, shallow outside current focus)

以下は `261004-pitchfork-continuation` の記述を保持したもの。旧 deep coverage は UNVERIFIED のため今回の verified deep 範囲に継承しない。現行 focus については上の記述を優先する。

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
