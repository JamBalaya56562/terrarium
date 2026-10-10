# 要件整理の確認

## 確定済みの条件

- 既存formicarium統合差分と検証証跡を保持する。
- 正式レビューと現在ソースに対応する再検証を完了してから、識別可能な結果をformicariumのU3へ返す。
- 公開・push・PR作成は行わない。アーキテクチャ採用の変更を自動承認しない。
- Reverse Engineeringは2026-10-08のユーザー入力`Approve`で承認済み。

## Q1: 正式レビューを有効にする手順

現在のexpressは`review_cap: none`であり、review overrideでレビューを有効にできない。既存intentを保持し、レビュー可能な手順へ変更する必要がある。strictの保護設定は維持する。

A. refactor — 既存挙動の維持を設計確認し、構築の指摘修正と再レビューまで行う。
B. bugfix — 特定不具合の修正として進める。レビューは単回のadvisory上限で、指摘の判断は承認時に行う。
X. Other (please specify)

[Answer]: refactor

## Consolidated Summary Confirmation

- 既存の統合差分を対象に、public formicarium Session/C3 resolverとの接続、legacy互換、資産の同一性、端末・iframeの挙動を確認する。新機能やアーキテクチャ採用の変更は含めない。
- `refactor`、Minimal、strictを維持し、正式レビューを実施する。指摘は修正・再確認または人の明示判断で処理し、レビュー識別子と対象ソースを記録する。
- 現在のソース、固定入力、組立候補を識別し、型検査・unit・build・lintと専用/legacyの3ブラウザ検証を実施する。過去の成功ログは履歴として保持し、今回の合格証明に転記しない。既存skipと新しい失敗を区別する。
- 既存の完了intent・承認履歴・保存候補を保持する。修正が必要なら影響範囲と計画を提示し、承認を経て変更する。
- terrarium側の結果を、intent `261006-npm-terrarium-release`のU3へ、レビュー・ソース・入力・候補・検証証跡の識別子と残件を含めて返す。formicarium側の承認やU3完了を代行しない。
- 公開・push・PR作成、公開tag、実配備は行わない。公開RC、実Pages/service-worker、実Safari、remote Linux CIなど、今回確認しない条件は未検証として残す。

Does this all look correct before I generate the artifact?

Looks correct
Request changes

[Answer]: Looks correct
