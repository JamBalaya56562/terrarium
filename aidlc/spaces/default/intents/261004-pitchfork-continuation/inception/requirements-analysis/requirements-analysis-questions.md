# pitchfork 継続作業の要件確認

## Sources

- [desc] Initial description: 中断した pitchfork v2.29.0 の追加作業を引き継ぎ、スーパーバイザーを要しないコマンドに限定して既存パッチ・ビルド・fixture・ツール選択画面を仕上げ、ブラウザ実行、lint、CI/E2Eを検証してPRを作成する。AI-DLC設定の追加は別の変更として保持する。
- [intent] `../../ideation/intent-capture/intent-statement.md`。承認済みの対象利用者・目的・範囲。
- [project] `../../../../memory/project.md` の Decided / Tech Stack / Deployment。既決事項。
- [re] `../../../../codekb/terrarium/`。承認済み調査結果。品質文書の未検証項目は後続で検証する。
- [fixture] `fixtures/sessions/pitchfork-basic.txt`。既存の具体的な対象セッション。
- [agents] ルート `AGENTS.md`。jj、変更範囲、検証・PR規約。

## Requirements Completeness Analysis

深度は Minimal。既決事項と承認済み調査で六つの観点が明確なため、追加の一般質問は作らない。実装の詳細は後続の調査・検証で決め、ユーザーの判断が必要な未決要件として扱わない。

| 観点 | 既に判明している条件と扱い |
| --- | --- |
| Functional requirements | v2.29.0、スーパーバイザー不要コマンド、fixture、ビルド・カタログ・ツール選択。[desc][project][fixture] |
| Non-functional requirements | ブラウザ内実行、既存の隔離・埋め込み契約の維持、lint・CI/E2E合格。起動時間の新しい数値目標は追加しない。[project][agents] |
| User scenarios | 公開ページ、カスタム要素、iframe。記録セッションのコマンドを順に実行し、設定保持を確認する。[intent][project][fixture] |
| Business context | 公開・埋め込み利用者がCLIを試せる状態とレビュー可能なPR。意思決定者はユーザー。[intent] |
| Technical context | 既存Emscripten、共通Session、ツール・クレートパッチ、Pages配布。新規アーキテクチャは採用しない。[project][re] |
| Quality attributes | 既存aube回帰、コマンドごとの合否と期待出力、再現手順。AI-DLC設定追加は別変更。[desc][re][agents] |

## Assumptions & Open Questions

None.

ビルド・ブラウザ・lintの成否は未検証であり、要件が曖昧なことを意味しない。対象外コマンドの追加対応、別バージョン対応、速度目標は要求しない。

## Consolidated Summary Confirmation

- pitchfork v2.29.0の既存追加作業を完了する。対象はスーパーバイザーを要しないコマンドのみ。[desc][project]
- `pitchfork-basic` の記録セッションを受入シナリオにする。`--version` は2.29.0、daemonsは初期api/workerを表示し、db追加・worker削除後のconfigはapi/dbを保持する。`status api` はavailable、interval設定の取得値は5sとする。各対象コマンドの終了結果と出力を照合し、runner全体の終了コード0だけでは判定しない。[fixture][re]
- 公開ページ、カスタム要素、iframeでpitchforkの選択・実行を検証する。ツール切替、セッション内ファイル保持、既存の隔離・埋め込み契約を維持する。配布カタログの選択と既存aubeの動作も検証する。[intent][project][re]
- v2.29.0のパッチ適用、Emscriptenコンパイル、stagingの成功をログで裏付ける。ビルド成果物はmainにコミットしない。必要なスクリプトの実行権限を確認する。[desc][project][agents]
- `mise run lint:all`、`mise run ci:terrarium`、`mise run ci:e2e` の合格を完了条件にする。E2Eは既存構成のChromium・Firefox・WebKitを対象とし、pitchforkの検証を追加する。[desc][re][agents]
- jjで適切な区切りにコミットし、レビュー可能なPRを作成する。AI-DLC設定追加はpitchfork実装と別変更にする。PR作成はリリースタグの発行やパッケージ公開を含めない。[desc][agents]
- デーモンの起動・監視、ネットワークアクセス、Node.jsライフサイクルスクリプト、汎用シェル、別CLI追加、別pitchforkバージョン対応、速度目標の新設は対象外。[project][re]

Does this all look correct before I generate the requirements artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
