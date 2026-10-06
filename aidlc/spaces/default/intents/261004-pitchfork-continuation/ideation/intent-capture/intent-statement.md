# pitchfork 追加作業の引き継ぎ

## Problem Statement

中断した pitchfork v2.29.0 の追加作業を完了し、terrarium のブラウザ端末で利用できる状態にする。既存のパッチ・ビルド・fixture・ツール選択画面を引き継ぐ。[desc]

## Target Customer

terrarium の公開ページや埋め込み端末で pitchfork を試す人が対象となる。[Q1]

## Success Metrics

- スーパーバイザーを要しない対象コマンドをブラウザ端末で実行し、具体的な出力と終了結果を記録できる。[desc]
- 必要な lint、CI、E2E の検証結果を記録し、既存変更をレビュー可能なPRにまとめる。[desc]
- AI-DLC設定の追加を別の変更として保持する。[desc]

## Initiative Trigger

中断した pitchfork 追加作業を引き継ぎ、完了させる依頼がきっかけとなる。[desc]

## Initial Scope Signal

- workflow-selected scope: `pitchfork-continuation`。[scope]
- ユーザーが確認した対象は pitchfork v2.29.0 の追加作業。スーパーバイザーを必要としないコマンドに限定する。[desc]
- 範囲と優先順位の判断はユーザーが行う。[Q2]

## Assumptions & Open Questions

None.
