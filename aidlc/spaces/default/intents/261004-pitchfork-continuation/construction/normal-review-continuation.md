# 通常レビュー・CIでの継続

2026-10-06、ユーザーが「通常のレビュー・CI検証で続ける」と明示選択した。応答しないAI-DLCレビュー記録コマンドを中止し、承認済み要件の実装・通常レビュー・CI検証・PR提出を続ける。既存AI-DLCの状態・承認・成果物を保持し、ステージ完了やレビュー受領の記録を代作しない。

## 検証の引き継ぎ

- 検証済み: U1の固定commitからの新規ビルドexit0とChromium基本受入exit0。詳細は `u1-pitchfork-runtime/code-generation/verification-evidence.md`。
- 最新単体テストはexit1、7pass/7fail。失敗7件は30秒timeout。以前の14passで置き換えない。
- 推測: CPU負荷がtimeoutの原因である可能性は高いが、因果関係は未検証。
- 未検証: 公開ページ・カスタム要素・iframeの全受入、全3ブラウザ、全pre-PR task。

## 継続する範囲

承認済みU1/U2/U3の要件を維持する。通常の独立コードレビューを行い、具体的な指摘を修正して再検証する。生成JS/Wasmはコミットしない。AI-DLC設定の追加とpitchfork実装を分離し、jjでコミットしてPRを作る。

## 通常手順での実装・レビュー

U1のLinux用gh stub実行権限を明示し、Windowsのテスト用PATHをGit Bash内で変換する。vendorは一時ディレクトリでpatchして成功後に確定し、build scriptはvendor成功後にだけCargo.tomlの完了印を記録する。通常の独立レビューでこの2指摘の修正を確認した。これはAI-DLCのレビュー受領記録ではない。

U2はpitchforkのカタログ単体テストと、公開ページ・カスタム要素・同一origin iframeの8コマンド、設定保持、終了通知、切替リセット、隔離エラー、source/origin拒否のブラウザテストを追加した。U3は固定commitからのCIビルドと成果物の3ブラウザへの配布、ローカル成果物の再利用を追加した。

## PR準備時の具体的な結果

| 確認 | 結果と根拠 |
| --- | --- |
| `mise run lint:all` | 検証済み: exit0。`.vendor/u1-pf/lint-all-normal-final.log`。Biome、TOML、Markdown、ShellCheck、actionlintすべて合格 |
| パッチ失敗後のvendor再試行 | 検証済み: 1pass、0fail、4assertions。`.vendor/u1-pf/patch-retry-check.log` |
| build scriptのvendor失敗後再試行 | 検証済み: 単独1pass、0fail、17assertions。`.vendor/u1-pf/build-retry-fixed.log`。SDK・Cargoは一時stub、実shellと実patchを利用 |
| `mise run ci:terrarium` | 未合格: 最新全体は41pass、1fail、123assertions、exit1。`.vendor/u1-pf/ci-terrarium-normal-retry.log`。新build再試行testのcleanupにEBUSY。元の失敗とCPU負荷の因果は未確定 |
| Chromiumの初回全体 | 中断・未合格: 新規public/element/iframeの8コマンドと既存aubeの6ケースは合格。切替testのaube出力期待値と動的plain fixtureの2ケースが失敗。`.vendor/u1-pf/ci-e2e-normal.log` |
| Chromiumの修正2ケース | 検証済み: 2pass、exit0。`.vendor/u1-pf/e2e-fixed-chromium.log`。aube実出力は`2.6.1 emscripten-wasm32 ...`。plainは実serverのstatic fixtureへ変更 |
| Linux fresh build・Firefox・WebKit・全体CI | 未検証。PRのCIで確認する。ローカルの失敗や中断を合格として置き換えない |

ログはmachine-localのignored領域で保持する。合否の要約はここに記録し、CIで取得できた具体的な結果を追記する。`aidlc-state.md`はcode-generation/Runningのまま保持しており、AI-DLCのステージ完了を宣言しない。
