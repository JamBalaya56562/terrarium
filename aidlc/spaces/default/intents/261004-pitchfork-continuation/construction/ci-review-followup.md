# 通常レビュー・CIの追跡

2026-10-06の通常手順での続き。`normal-review-continuation.md`の結果はPR準備時の記録として保持し、以後の観測をこのファイルへ記録する。AI-DLCの状態・承認・ステージの受領記録を代作しない。

## PRの分割と決定の整合

- [PR #21](https://github.com/aletheia-works/terrarium/pull/21)はpitchfork本体、パッチ、テスト、CIと利用説明。`project.md`では旧非ゴールの「aube以外のツール」を外し、2026-10-04のユーザー決定としてスーパーバイザーを要しないpitchforkコマンドを対象に加えている。検証済み: `jj diff --from main@upstream --to codex/pitchfork-browser --git aidlc/spaces/default/memory/project.md`でこの変更を確認した。
- [PR #20](https://github.com/aletheia-works/terrarium/pull/20)はCodex AI-DLC設定と承認・作業記録。本体の決定変更を含むPR #21を先に取り込む。PR #20のAGENTS.mdはAI-DLCブロックの追加だけにし、pitchforkの利用説明は本体へ移した。旧非ゴールと新しい記録を同時に残さないための取り込み順序であり、新たなスコープ決定ではない。

## レビューとCIで見つかった修正

- vendorのpatch失敗時は一時ディレクトリを破棄し、成功後に確定する。build scriptはvendor成功後だけCargo.tomlに完了印を記録する。実shell・実patchの再試行テストを追加した。
- Linux lintの実観測は`scripts/resolve-ref.sh is not executable`。`jj file chmod x`で実行属性を変更し、差分の`100644 -> 100755`を確認した。
- READMEをtool別の既定ref・fixture、pitchforkの対応範囲、切替、Pages workflowのtool指定へ更新した。
- CIは固定commitと`patches/**`・`runtime/**`・`scripts/**`・workflowのハッシュでJS/Wasmをキャッシュし、Cargoのregistry/targetも復元・保存する。キャッシュhitによるビルド省略は設定根拠で、実行観測はまだない。
- WebKitの最初のCIはiframeの最初のコマンドにexit通知が来ず、再試行でも失敗。ready通知とコマンド表示はトレースで確認した。テストページをPlaywrightのresponse差し替えから実HTTPサーバー配信へ変更した。8コマンドとsource/origin拒否のassertionは維持した。

## 具体的な検証結果

この表の本体headは`94d575d25ffa6c2cacb3fe139aab876b7490fdc3`。状態は成功の観測があるものだけを合格とする。

| 確認 | 結果と具体物 |
| --- | --- |
| 本体Linux lint | 検証済み: [run 37400717434](https://github.com/aletheia-works/terrarium/actions/runs/37400717434)がsuccess |
| 本体Linuxパッケージ | 検証済み: [job 112067060278](https://github.com/aletheia-works/terrarium/actions/runs/37400717322/job/112067060278)がsuccess。型チェック・単体・build。ログは42pass、0fail、139expect |
| 本体Linuxビルド・3ブラウザ | 検証済み: [run 37400717391](https://github.com/aletheia-works/terrarium/actions/runs/37400717391)がsuccess。fresh build、Chromium 12passed、Firefox 11passed/1skipped、WebKit 11passed/1skipped。skipは既存のChromium専用credentialless iframe |
| 修正後のローカルWebKit iframe | 検証済み: `bun run test:e2e -- --project=webkit --grep 'same-origin iframe'`、1passed、exit0。`.vendor/u1-pf/e2e-webkit-static.log` |
| 修正後のローカル全lint | 検証済み: `mise run lint:all`、exit0。`.vendor/u1-pf/lint-all-review-followup.log` |
| cleanup修正後のbuild再試行単独 | 検証済み: 1pass、0fail、17assertions。`.vendor/u1-pf/build-retry-cleanup-check.log` |
| AI-DLC設定PRのCI | 検証済み: head `e7a1a49ae1cf651421e690e8bd270472d20b4d74`のlint [37400717478](https://github.com/aletheia-works/terrarium/actions/runs/37400717478)、package [37400717492](https://github.com/aletheia-works/terrarium/actions/runs/37400717492)、既存3ブラウザ [37400717542](https://github.com/aletheia-works/terrarium/actions/runs/37400717542)がsuccess |

## キャッシュパスの補修

run 37400717391は全ジョブsuccessだが、ビルドログのSDK/Cargoキャッシュに`Invalid pattern .../../target`と`Invalid pattern .../../emsdk`、`Relative pathing '.' and '..' is not allowed`の警告があり、この2つは保存されていなかった。JS/Wasmキャッシュの保存はログで確認した。

本体head `d9507c5571564e42d10bef98d61b66c3ddd535b9`では、新設CIジョブのSDK/targetを`RUNNER_TEMP`の配下へ置き、実行stepから`GITHUB_ENV`へ設定する形に修正した。`mise run actions:check`はexit0（`.vendor/u1-pf/actions-cache-path-check.log`）。最終の[build job 112071591457](https://github.com/aletheia-works/terrarium/actions/runs/37402178380/job/112071591457)のログはCargo、emsdk、pitchfork成果物の3キーで`Cache saved with key`を記録し、`Invalid pattern`警告はない。cache hit経路は未検証。

## 最終headのCI

検証済み: head `d9507c5571564e42d10bef98d61b66c3ddd535b9`で以下がすべてsuccess。E2EログにflakyやRetryの報告はない。

| 確認 | 具体物と結果 |
| --- | --- |
| lint | [run 37402178414](https://github.com/aletheia-works/terrarium/actions/runs/37402178414)がsuccess |
| 型チェック・全単体・package build | [job 112071591908](https://github.com/aletheia-works/terrarium/actions/runs/37402178317/job/112071591908)がsuccess。42pass、0fail、139expect |
| 固定commitのfresh release build・キャッシュ保存 | [job 112071591457](https://github.com/aletheia-works/terrarium/actions/runs/37402178380/job/112071591457)がsuccess |
| Chromium | [job 112073689037](https://github.com/aletheia-works/terrarium/actions/runs/37402178380/job/112073689037)がsuccess。12passed |
| Firefox | [job 112073689045](https://github.com/aletheia-works/terrarium/actions/runs/37402178380/job/112073689045)がsuccess。11passed、既存1skipped |
| WebKit | [job 112073689041](https://github.com/aletheia-works/terrarium/actions/runs/37402178380/job/112073689041)がsuccess。11passed、既存1skipped |

監査ログのローカルrebase競合は、保存済みrevision `a6cd10eb`のログを復元し、競合後に実際に生成された追記を保持した。検証済み: 復元時の行単位比較で`Historical audit prefix preserved: 6175 lines; current: 6275 lines`を確認した。競合した原文はignoredの`.vendor/u1-pf/audit-conflict-before-resolution.md`に保全した。

## 失敗履歴と限界

初回本体CIの[run 37396959443](https://github.com/aletheia-works/terrarium/actions/runs/37396959443)ではfresh build、Chromium、Firefoxが合格し、WebKitは10passed、1failed、1skipped。失敗はiframeのexit待ちで、120秒timeoutが再試行でも起きた。この失敗をPCのCPU負荷だけで説明することはできない。

最新ローカル全単体の41pass/1failとEBUSYは保存する。cleanupは元のエラーを隠さない形に直し、単独テストは合格したが、元の失敗原因とCPU負荷の因果は未検証。Linux全単体42passを、Windowsの因果関係を証明したものとは扱わない。

`aidlc-state.md`は`code-generation / Running`のまま保持する。通常CIの合格は、停止したAI-DLC記録コマンドが直ったという意味ではない。

## 残ったAIレビュー指摘の追跡（2026-10-06）

ユーザーの「未検証とか対応出来そうなものは対応して下さい」に従って通常レビュー・CI検証を継続した。

- 本体head `dbc46f7c1a9dc4452a7666d7367a2b056efa1736`で、成果物キャッシュの入力を`patches/**`、`runtime/syscalls.c`、`runtime/libterrarium.js`、`scripts/build-pitchfork.sh`、`scripts/emscripten-env.sh`、`scripts/patch-rust-src.sh`、`scripts/vendor-patched.sh`、E2E workflowへ限定した。無関係なfetch・staging・lintスクリプトを外した。ドキュメント根拠: `build-pitchfork.sh:21,22,31`の呼出しと`emscripten-env.sh:37,38`のリンカー入力。パッチ・ツールチェーン・SDK・workflow設定の変更による無効化は保持する。
- 検証済み: `mise run actions:check`がexit0（`.vendor/u1-pf/actions-cache-inputs-check.log`）。[最新AIレビュー](https://github.com/aletheia-works/terrarium/pull/21#issuecomment-6008676596)はblockingなし。
- 検証済み: `gh api repos/jdx/pitchfork/commits/v2.29.0 --jq .sha`は`cfdea79f1d52b8449c0b99b29a03d9e771cd8ec3`を返した。タグとE2Eの固定コミットは今回の観測で一致する。
- 検証済み: 修正済み本体のWindows上で`bun run test`が42pass、0fail、139assertions、exit0（`.vendor/u1-pf/unit-review-followup-windows-corrected.log`）。vendor失敗・再試行のテストを含めて合格し、今回EBUSYは再現しなかった。最初の`bun test`はPlaywrightのE2Eまで収集して2errorsになったため、全単体の合格根拠には用いない。
- 未検証: 過去のEBUSYでディレクトリをロックしたプロセスとCPU負荷の因果。当時のロック保持者はログにない。今回の合格を過去の原因確定とは扱わず、追加のコード修正は行わない。
- ドキュメント根拠: `fetch-builds.sh`のaube専用処理は現行aube E2Eの用途。pitchforkは専用ビルド成果物をstageするため、このスクリプトの一般化は今回の不具合修正には不要。[最新AIレビュー](https://github.com/aletheia-works/terrarium/pull/21#issuecomment-6008676596)も将来の観察事項としている。
- PR #20の取り込み順序は維持する。PR #21を先に取り込むまでDraftとし、旧方針との整合性を単独ブランチで解決済みとは主張しない。
- 検証済み: head `dbc46f7c1a9dc4452a7666d7367a2b056efa1736`のlint [37408677936](https://github.com/aletheia-works/terrarium/actions/runs/37408677936)、package [37408677953](https://github.com/aletheia-works/terrarium/actions/runs/37408677953)、E2E [37408677963 attempt 1](https://github.com/aletheia-works/terrarium/actions/runs/37408677963/attempts/1)はすべてsuccess。E2Eは34passed、既存2skipped。buildログはSDKとCargoの`Cache restored successfully`、新しいJS/Wasmキーの`Cache saved with key`を記録した。
- 検証済み: `gh run rerun 37408677963 --job 112091938892`で同じhead・同じキャッシュキーを再実行した。[attempt 2のbuild job 112094056992](https://github.com/aletheia-works/terrarium/actions/runs/37408677963/job/112094056992)はsuccess。`gh run view 37408677963 --json attempt,jobs`の応答はattempt 2、`Cache the fixed pitchfork build: success`、`Build: skipped`、`Check the build artifacts: success`。キャッシュhitによるビルド省略と復元成果物の存在確認を実観測した。PR用キャッシュの検証であり、mainへマージした後のキャッシュ共有まで証明したとは扱わない。
