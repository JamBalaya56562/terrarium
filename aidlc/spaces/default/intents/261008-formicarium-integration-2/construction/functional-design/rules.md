# 統合・検証規則

```yaml
rules:
  - id: BR1.1
    statement: 選択と解決結果の identity を一致させる
    category: validation
    applies_to: CHOICE
    trigger: 起動
    logic: IF guest 宣言がある THEN tool/ref/source_commit を照合して public 接続を使う ELSE legacy 接続を使う
    violation_behaviour: 起動失敗を通知し実行しない
    source: [FR1, FR2]
  - id: BR1.2
    statement: 実行は直列にし現在世代の出力のみ表示する
    category: constraint
    applies_to: RUN
    trigger: 実行要求・出力・切替・disconnect
    logic: IF 現在世代の実行 THEN 順序付き出力を一度だけ表示し終了を通知する ELSE 古い結果を抑止する
    violation_behaviour: 実行失敗を通知し後続実行を阻害しない
    source: [FR1, FR3]
  - id: BR1.3
    statement: 親の送信元と origin を厳密に確認する
    category: authorization
    applies_to: RUN
    trigger: iframe メッセージ
    logic: IF source と origin が許可された親と一致 THEN 既存メッセージ契約で処理する ELSE 拒否する
    violation_behaviour: 不正要求で CLI を起動しない
    source: [FR3, NFR2]
  - id: BR2.1
    statement: 配置前に全入力を検証する
    category: validation
    applies_to: INPUT_SET
    trigger: 候補組立
    logic: IF identity/digest/provenance が全件一致 THEN 隔離された作業候補へ配置する ELSE 既存候補を変更せず失敗する
    violation_behaviour: 非成功終了と不一致箇所を報告する
    source: [FR4, NFR2]
  - id: BR2.2
    statement: 完全な候補のみ確定し失敗時は旧候補を保全する
    category: policy
    applies_to: CANDIDATE
    trigger: 配置・組立・検証・確定の失敗
    logic: IF 全工程と完了記録の確定が成功 THEN 完全な候補と正常履歴を識別する ELSE 旧候補を保持または復旧し旧候補なしでは有効候補を残さず今回の一時配置物を清掃する。次回は完了記録と種類・内容を含む inventory が一致する正常履歴を保持して開始し、未完了または不整合な残存物だけは復旧案内で停止する
    violation_behaviour: 清掃・復旧失敗は recovery_required とし残存物と復旧手順を報告する
    source: [FR4, NFR4]
  - id: BR3.1
    statement: 必要な修正のみ計画・承認・正式レビューを経る
    category: policy
    applies_to: EVIDENCE
    trigger: 修正と段階完了
    logic: IF 修正が必要 THEN terrarium 所有範囲の影響と計画を提示し必要な承認を得て変更し正式レビューを実施する
    violation_behaviour: 未承認の範囲変更は実施せず指摘を人の判断へ戻す
    source: [FR5, FR7, NFR3]
  - id: BR3.2
    statement: 現在の対象に結び付く検証だけを今回の合格とする
    category: validation
    applies_to: EVIDENCE
    trigger: 検証・引継ぎ
    logic: IF ソース・入力・候補と実行結果が結び付く THEN 今回の結果として記録する ELSE 履歴または未検証とする
    violation_behaviour: 失敗や新しい skip を成功に数えない
    source: [FR6, NFR1, NFR5]
  - id: BR3.3
    statement: 履歴を保持して U3 へ結果を返す
    category: policy
    applies_to: EVIDENCE
    trigger: 最終引継ぎ
    logic: IF ローカル作業の結果が確定 THEN 識別子・レビュー・検証・制限を U3 へ返し過去記録を保持する
    violation_behaviour: U3 承認・完了の代行と公開・push・PR 作成を行わない
    source: [FR8, NFR4]
```

| 規則 | 意味 |
| --- | --- |
| BR1.1 | 接続 identity と legacy 分岐 |
| BR1.2 | 実行順、世代、出力、終了 |
| BR1.3 | iframe の信頼境界 |
| BR2.1 | 入力全件の配置前検証 |
| BR2.2 | 完全な候補の確定と失敗時の保全 |
| BR3.1 | 修正計画と正式レビュー |
| BR3.2 | 現在対象の検証証跡 |
| BR3.3 | 履歴保全と U3 引継ぎ |
