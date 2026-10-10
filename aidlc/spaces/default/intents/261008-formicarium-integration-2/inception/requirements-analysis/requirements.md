# formicarium 統合のレビュー・再検証要件

## Intent analysis

正式な初期依頼: 既存のformicarium npm統合差分と最新の検証証跡をterrarium側の所有範囲で正式レビューし、必要な修正と検証を完了してformicariumのintent 261006-npm-terrarium-releaseのU3へ識別可能な結果を返す。既存の完了intentと承認履歴を保持し、公開・push・PR作成は行わない。

利用者は、既存統合が現在のソースで成立するかを判断できる結果を必要としている。新規機能ではなく、terrarium が所有する接続・配布入力・互換動作のレビューと必要な修正が対象。refactor / Minimal、strict、正式レビュー、要件に基づく検証を適用する。過去の合格記録は保持するが、今回の合格には代用しない。

## Functional requirements

| ID | 要件・受入れ条件 | 根拠 |
| --- | --- | --- |
| FR1 | public formicarium Session と C3 resolver への既存接続を対象にする。tool/ref/source commit の選択、fixture/cwd、args/env/timeout/AbortSignal、出力・終了の接続契約について現在の実装と対応テストを照合し、違反があれば修正する。 | business-overview、architecture |
| FR2 | guest 宣言なしの legacy 経路と既存公開 API の互換性を保持する。型検査と legacy のブラウザ検証が成功し、既存 skip は理由と従来との差を記録する。新しい失敗や skip の増加は未解決として扱う。 | business-overview、code-structure、確認済み要約 |
| FR3 | 要素と iframe の既存契約を維持する。初期化、実行順、出力の重複防止、切替・disconnect 時の古い結果抑止と破棄、iframe の source/origin 照合を対応する unit / E2E で確認する。 | architecture |
| FR4 | 固定された配布入力から候補を組み立てる。入力・resolver・guest・asset の identity、digest、provenance の照合と不正入力の拒否を対応テストで確認し、使用入力と候補の識別情報を保存する。失敗時の配置の完全性は設計で具体化し検証する。 | architecture、code-structure |
| FR5 | terrarium 所有差分に必要な修正を限定する。修正前に影響範囲・計画を提示し必要な承認を得る。正式レビューで見つかった問題は修正・再検証するか、人の明示判断と未解決事項として記録する。 | 初期依頼、Q1、確認済み要約 |
| FR6 | 現在のソースを識別して型検査、unit、build、適用する lint、formicarium 専用と legacy の Chromium / Firefox / WebKit 検証を実行する。各コマンド・終了値・件数・ログ・使用入力・候補の識別情報を結び付け、変更後の古い証拠を今回の合格としない。 | 確認済み要約 |
| FR7 | 適用各段階の独立した正式レビューを実施し、レビュー識別子、対象、指摘、判断、修正後の検証を追跡可能にする。段階の承認は人が行う。 | Q1: refactor、初期依頼 |
| FR8 | 完了時に formicarium intent `261006-npm-terrarium-release` の U3 へ結果を返す。ソース・固定入力・候補・レビュー・検証記録の参照、未解決事項、配布受入れの制限を含め、U3 の承認・完了は代行しない。 | 初期依頼、確認済み要約 |

## Non-functional requirements

| ID | 要件・判定方法 |
| --- | --- |
| NFR1 | 証拠の再現性: 実行日時、ツール環境、入力および候補の digest、検証対象のソース一覧と識別情報を記録し、引継ぎ先が合格対象を特定できること。 |
| NFR2 | 信頼境界: 配布入力の不一致と iframe の不正な送信元を受け入れないことを負例で確認する。資格情報や秘密を成果物・ログに記載しない。 |
| NFR3 | 保守性: 修正は既存責務境界内に限定し、要件から設計・変更・検証への対応を記録する。本 intent の FR/NFR ID は後続で変更しない。 |
| NFR4 | 記録の保全: 既存完了 intent、承認履歴、候補と検証証跡を削除・書換えず、新しい評価を別記録として追加する。古い文書の公開許可を今回の許可に流用しない。 |
| NFR5 | 性能・拡張性・アクセシビリティ: 新たな数値目標や機能は追加しない。既存動作に回帰が観測された場合は検証結果に記録し、修正対象または人の判断事項とする。ブラウザ検証の WebKit は実 Safari の保証と区別する。 |

## Constraints

- 公開、push、PR 作成、タグ発行、deploy は行わない。ローカル検証・候補組立に限定する。
- terrarium が対象であり、formicarium 内部や U3 の状態を直接変更しない。結果の返送は利用者の依頼で許可済み。
- project memory の Emscripten / no emulator 方針と、観測された Blink / static-musl 接続の差は未承認の戦略判断として保持する。この作業の承認は architecture 採用を意味しない。
- scope は refactor、depth と test strategy は Minimal、guard は strict。既存承認を維持し、必要な人の確認を省略しない。
- AI-DLC 管理部分の AGENTS.md 更新は active workflow による制約で保留中。履歴を終了させたり直接生成部分を書き換えたりして回避しない。

## Assumptions

- 固定ローカル入力で現在の接続を検証できる。利用不能なら未検証と記録し、公開 RC の証拠に置き換えない。
- 過去のログの digest が一致しても、ソースが変われば再実行が必要。最新の focused scan は実行試験を行っていない。
- ブラウザ検証の既存 skip は成功とは数えず、比較可能な理由と件数を残す。

## Out of scope

新しい CLI、機能、runtime の採用決定、formicarium 内部の変更、公開 RC の公開、実 Pages / service worker 環境の配布受入れ、実 Safari、remote Linux CI の実行、共有状態への操作。これらの未検証事項をローカル試験の合格で置き換えない。

## Open questions

- 現在ソースでの検証結果と、修正が必要な具体的な指摘は後続の設計・実装レビューと検証で確定する。
- staging の途中失敗で既存候補を保全できるかは現在未検証。既存配置方式の失敗条件と必要な修正を設計で明確にする。
- 方針差の採用判断、公開 RC・実配布環境の受入れ、AGENTS.md の正式更新は別途人の判断または workflow 制約の解消が必要。今回のローカル完了とは分けて返す。

## Source traceability

- 初期依頼: `aidlc engine workspace project-description` が返した project-description.json の description。
- 人の選択と確認: [requirements-analysis-questions.md](requirements-analysis-questions.md) の Q1 `refactor`、Consolidated Summary Confirmation `Looks correct`。後者は 2026-10-08 に記録済み。
- 現在の調査: [business-overview](../../../../codekb/terrarium/business-overview.md)、[architecture](../../../../codekb/terrarium/architecture.md)、[code-structure](../../../../codekb/terrarium/code-structure.md)。各文書の historical 節は過去時点の情報として扱う。
- [developer-scan](../reverse-engineering/developer-scan.md) と CodeKB の reverse-engineering-timestamp が現在の読取範囲を示す。深い読取23 path の調査は今回の実行検証の代替ではない。
- 本 intent の要件 ID はこの文書で定義する。過去 intent の要件と承認は変更しない。
