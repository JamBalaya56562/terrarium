# 機能設計の確認

## 確定済みの条件

- 要件書 FR1–FR8 / NFR1–NFR5 は利用者が Approve 済み。
- 既存の public Session / resolver 接続、legacy、要素・iframe を維持する。
- 現在ソースで再検証し、識別可能な結果を formicarium U3 へ返す。
- 公開・push・PR 作成は行わず、runtime 採用の戦略判断は含めない。
- units-generation / domain-design は今回対象外。既存 CodeKB の責務境界を設計の基礎とする。

## Q1: 配置途中の失敗時の扱い

正式レビュー R-01 に対応し、既存候補の有無で終了状態を明確にする。現行 staging は検証後に配置先へ順に書き込むため、書込み途中の失敗について追加の設計と負例が必要。

A. 失敗時に候補を公開しない — 既存候補があればその内容を保持し、なければ有効な候補を残さない。今回処理の一時配置物は通常の失敗で清掃する。強制終了や清掃・復旧自体の失敗は成功扱いせず、残存物と復旧手順を報告する。
B. 詳細を指定する — 必要な終了状態や復旧条件を自由記述する。
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

- 既存の public Session / resolver 接続、legacy 互換、要素・iframe の動作を維持し、既存 CodeKB の責務境界を設計の基礎にする。
- 配置途中で失敗した場合、既存候補があればその内容を保持し、なければ不完全な候補を有効として残さない。
- 通常の失敗では今回処理の一時配置物を清掃する。強制終了、清掃・復旧自体の失敗は成功扱いせず、残存物と復旧手順を報告する。
- 既存候補あり・なし、検証失敗、書込み途中の失敗、清掃・復旧の失敗について、設計で終了状態と負例の期待値を明記する。
- FR1–FR8 / NFR1–NFR5 から設計規則・検証への対応を保ち、現在ソース・固定入力・候補・正式レビュー・検証証跡を結び付けて formicarium U3 へ返す。
- 過去の記録と候補は保持する。公開・push・PR 作成は行わず、runtime 採用の戦略判断と実配布環境の未検証事項をローカル検証と区別する。

Does this all look correct before I generate the artifact?

Looks correct
Request changes

[Answer]: Looks correct
