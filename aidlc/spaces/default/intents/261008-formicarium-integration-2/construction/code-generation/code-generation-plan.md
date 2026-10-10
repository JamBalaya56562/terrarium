# formicarium 統合の実装計画

## 対象と制約

承認済み設計の BR1.1–BR3.3 と FR1–FR8 / NFR1–NFR5 に対応する。一回の stage-level 実装であり Unit / Bolt は作らない。既存接続を維持し、候補配置の失敗保全を追加する。公開・push・PR・タグ・deploy は行わない。履歴候補や完了 intent を変更しない。U3 の承認は代行しない。

## 実装順序

- [x] Step 1: 現在ソース、固定入力、保全対象の識別情報を記録し、対象外の変更と分離する。新しい検証候補の出力先を使う（NFR1、NFR4）。
- [x] Step 2: 既存 Bun runner、型検査設定、固定 resolver 入力を確認する。unit-test-instructions の既存ファイル限定コマンドを実行し、使用可能な基準を記録する。失敗を未確認の成功に置換しない。
- [x] Step 3: scripts/candidate-transaction.mjs を新設し、候補全体の inventory（path/kind、file size/digest、directory、symlink の非追跡リンク先文字列）、専有、同一 filesystem の作業領域、保持物、attempt/completion 記録と確定・復旧・清掃を実装する。正常履歴と中断残存物を区別し、不一致や記録失敗を非成功で報告する。復旧失敗時に保持物を削除しない（BR2.2）。
- [x] Step 4: packages/terrarium/tests/candidate-transaction.test.ts を新設し、Step 3 の実装後に正常・負例を実行する。旧候補あり/なしの途中書込み、切替、復旧、清掃、完了記録確定失敗、正常再実行、中断記録、種類・リンク先変化を含める。I/O 境界は注入可能にし実際の一時 filesystem と組み合わせる。
- [x] Step 5: scripts/stage-formicarium.mjs の既存入力検証を保持し、候補全体を transaction 内で配置する。scripts/assemble-pages.sh と必要な scripts/assemble-candidate.mjs のローカル orchestration を接続し、web copy・bundle・stamp・receipt・root entry まで完成後にサイト全体を確定する。配下だけ成功して全体が不完全となる結果を許可しない。保護先、source root、同時更新と残存物の検査を接続する。外部 fetch / publish は追加しない（BR2.1、BR2.2）。
- [x] Step 6: Step 5 の実装後に formicarium-assets.test.ts を拡張し、stage と assembly の正常/失敗を対象にする。必要な assembly 統合試験は candidate-transaction.test.ts または新しい assemble-candidate.test.ts に置く。専用三ブラウザの既存テスト、legacy、公開型の契約を維持する（BR1.1–BR1.3）。
- [x] Step 7: 既存 runner/config の変更は必要な接続に限定し、mise.toml の対象タスクを確認する。新しい shell script は実行属性を jj で設定する。packages/terrarium/README.md に失敗時の残存物・完了記録・復旧手順を追記する。閾値、skip、品質条件を緩めない。
- [ ] Step 8: 現在ソースで型検査・全 unit・build・適用 lint と、独立した新候補で専用/legacy の Chromium・Firefox・WebKit を実行する。旧候補に結び付いた検証証跡は保持し、件数/exit/環境/ログを新ソース・入力・候補へ結び付ける（BR3.2）。
- [x] Step 9: code-summary.md、source-manifest.json、traceability.json を記録する。すべての created/modified/deleted/generated source を manifest に含め、FR/NFR/BR から実装/テストへ参照する。正式レビューの対象を固定し、指摘は修正・再検証または人の判断へ返す（BR3.1）。
- [ ] Step 10: Build and Test に現在対象のログ、制限、固定入力と候補の識別情報を渡す。最終引継ぎは formicarium U3 の識別可能な結果として準備する（BR3.3）。本段階だけで U3 の完了や全工程の成功を宣言しない。

## 追加修正の順序

初回承認の実装と証跡を保持し、以下は新たな承認後に開始する。

- [x] Step 11: .github/workflows/test-terrarium.yml、test-e2e.yml、pages.yml、publish-terrarium.yml から現在の固定入力と不一致の旧配布URL fallbackを除き、vars.FORMICARIUM_INPUTS_URLを明示必須にする。全16ファイルのサイズ・digest検証とインストール前の拒否を維持する。URL捏造、公開、遠隔CI実行は行わない。
- [x] Step 12: Step 11後、packages/terrarium/tests/formicarium-inputs.test.tsの旧配布commit前提を現行供給契約へ置き換える。4workflowの明示必須条件、旧・改変入力の拒否、正しい明示入力の受入れを検査する。既存prepare正常・負例を維持し、integration/formicarium-inputs.jsonの16ファイル内容は変更しない。
- [ ] Step 13: aidlc/spaces/default/codekb/terrarium/の9文書の空行・見出し階層・履歴見出し重複だけを修正する。本文・過去解析identity・履歴を保全する。別candidateストアで準備し、公式snapshot/publishの世代・source比較で確定する。live直接編集や新たに解析済みとの偽称をしない。正式手順が成立しなければ制限を報告する。
- [x] Step 14: 全unit・型・build・lintを再実行し、供給条件と負例を確認する。候補に影響するソース変更があれば新候補で専用/legacy三ブラウザを再実行する。影響しなければ既存成功証跡と新ソースの関係を明記する。旧ログを保持しsummary/manifest/traceabilityを更新して正式独立レビューへ渡す。遠隔CI未検証、配布入力未供給、U3未承認を区別する。

追加対象は上記4workflow、formicarium-inputs.test.tsとCodeKB9文書（code-structure.md、component-inventory.md、api-documentation.md、architecture.md、technology-stack.md、dependencies.md、reverse-engineering-timestamp.md、business-overview.md、code-quality-assessment.md）。履歴control領域の出力先指定は正式レビューの確認事項とし、実装修正が必要なら計画へ明示する。

## 保全不具合の追加修正

- [x] Step 15: scripts/candidate-transaction.mjs で transaction の記録・保持・lock namespace とその配下、canonical aliasへの出力指定を作業領域作成前に拒否する。履歴候補とrecord inventoryの結合を保持し、packages/terrarium/tests/candidate-transaction.test.ts に他試行retainedを出力指定する再現負例と履歴不変・元候補の再実行成功を追加する。
- [x] Step 16: scripts/assemble-candidate.mjs の legacy tools.json の書込みを作業領域内の非追跡path検査へ接続する。packages/terrarium/tests/assemble-candidate.test.ts に外部ファイルへ向くsymlinkとTERRARIUM_PITCHFORK_REFの再現負例を追加し、非成功・外部bytes不変・旧候補不変を検査する。
- [x] Step 17: packages/terrarium/README.md のURL変数不要という説明を現行の明示供給契約へ修正する。4workflowの設定必須条件、全件サイズ・digest検証、遠隔供給が未検証である条件を正確に説明する。
- [x] Step 18: 上記実装後に限定正常・負例、全unit・型・build・lintを実行し、新しい候補2種で専用/legacy三ブラウザを再実行する。初回証跡と候補は保持し、summary/manifest/traceabilityを新ソース・入力・候補へ結び付けて更新し、正式な再レビューへ渡す。CodeKBの正式CAS制限と保全した旧診断文書のlintは未解決のまま明示する。古い解析fingerprintの付替えや証跡削除で合格にしない。

この追加は既存のtransaction/assembly/READMEと対応する2テストの保全修正に限定する。CodeKB再解析、lint除外設定、既存診断証跡の変更は含めない。

## 変更予定ファイル

scripts/candidate-transaction.mjs、scripts/stage-formicarium.mjs、scripts/assemble-pages.sh、必要な scripts/assemble-candidate.mjs、packages/terrarium/tests/candidate-transaction.test.ts、packages/terrarium/tests/formicarium-assets.test.ts、必要な packages/terrarium/tests/assemble-candidate.test.ts、packages/terrarium/README.md。mise.toml は現行タスクで接続できない場合のみ変更する。既存 adapter/catalog/terminal/bridge は契約検証を行い、変更が必要なら承認済み計画の変更として提示する。

## 要件と検証の対応

FR1/FR2/FR3 は既存 session/catalog/element/iframe の unit・型・三ブラウザで確認。FR4 は transaction/assets/assembly の正常・負例。FR5/FR7/NFR3 は計画承認、manifest、正式レビューと変更記録。FR6/NFR1/NFR5 は対象を識別した全検証と skip/未検証の分類。FR8 は引継ぎ内容と宛先の確認、NFR4 は履歴保全と inventory 比較、NFR2 は入力不一致・iframe 負例で確認する。工程上の要件は記録の検査を使い、常に成功する疑似テストを作らない。新しい database/API/UI は対象外。

## 失敗・復旧と検証条件

通常捕捉可能な I/O 失敗を検証する。強制終了は未完了記録の検出と復旧案内まで。完全な候補の成功と完了記録の確定を結び付け、記録や清掃の失敗は成功にしない。正常履歴は保持して次の試行を開始し、未完了/不整合残存物は人の復旧判断まで停止する。旧履歴や保持物の自動削除をしない。標準 traceability sensor の no Unit パス制約は隠さず、ID・参照先の実在を別途検査する。

## 新試行の修復計画

recovery-proposal.mdの修復範囲と正式再開始は人が承認した。Step1–18の実装と証跡は前試行の結果として保持する。今回の追加Step19–25が、以前のCodeKB再解析禁止とlint分類変更禁止の範囲を明示的に更新する。初期のstale CASを成功扱いせず、再解析を実際に行った新しい結果として記録する。

- [x] Step 19: 前試行のplan/instructions/summary/manifest/traceabilityの原bytesを計画作成前に保持した値と照合し、承認後に別archiveへ保存する。旧正式レビュー、未成立レビュー、候補、固定16入力、cacheと過去解析の識別を保全する。旧receiptや指紋の付替えをしない（NFR1/NFR4）。
- [x] Step 20: 既存runner/configを確認し、unit-test-instructionsの2ファイル限定コマンドで基準を記録する。その後mise.tomlのMarkdown検査をrumdl check --no-cache .に変更する。.rumdl.tomlの原本証跡除外方針を、intent記録内の深いPlaywright生成error-context.mdと正式ツール生成reviews/review-*.md保存コピーに限って補う。執筆文書/CodeKB/applicationの除外、ルールdisable、閾値変更はしない（FR6/FR7）。
- [x] Step 21: Step20実装後に正常・負例を検査する。no-cache前後のcache不変、生成診断・保存コピーの一覧/digest不変、執筆文書とapplicationの対象維持、workspace外の誤書式執筆文書を拒否することを確認する。原本やcanonical review JSONを変更しない。
- [x] Step 22: CodeKB旧9文書を原bytesと過去解析identity付きで保存する。公式snapshot後、現在の個別30pathを実際に再読する。旧23pathにcandidate-transaction.mjs、assemble-candidate.mjs、対応する2テスト、formicarium-inputs.test.ts、pages.yml、publish-terrarium.ymlを加える。新分析区画と歴史区画を区別し、見出し階層・重複・空行を修正した別candidate9文書を生成する。過去本文/identityを保全比較し、no-cache lint、scope比較、公式世代/source CASで更新する。旧fingerprintの付替え・無解析current主張・live直接編集は禁止（NFR3/NFR4）。
- [x] Step 23: 全lint・型・unit・buildを現在対象へ結び付けて実行する。最新r2候補とブラウザ対象ソースのbytes/集合を独立照合し、変更があれば新候補で三ブラウザを再実行する。変更がなければ保存された専用45pass/legacy34pass+既存skip2の適用範囲を明記する。失敗を成功へ置換しない（FR1–FR6）。
- [ ] Step 24: source-manifestに累積writeを含め、summary/traceabilityを更新してfreezeする。正式要求前・レビュー後・登録後のworkspace inventoryを保存し、cacheを更新しない条件で集合/bytes差分0を確認して正式独立レビューを完了する。境界が変化すれば具体的path差分を提示して止め、同操作2拒否で停止する。guardや指紋計算法を変更しない（FR7/BR3.1）。
- [ ] Step 25: 人の段階承認後、Build and Testへ対象・証拠・制限を渡す。Build and Testの必須検査・正式レビュー・承認完了後にU3へ最終結果を返す。U3承認/完了、公開・push・PR・タグ・deployを代行しない（FR8/BR3.2–BR3.3）。

追加変更はmise.toml、.rumdl.toml、公式CASのCodeKB9文書、現在のplan/questions/instructions/summary/manifest/traceabilityと新検証記録に限定する。動作コードや固定入力descriptorの変更は予定しない。必要になれば新しい計画変更として承認を求める。snapshotやlintが失敗したときは保護条件を緩めない。

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "refactor",
  "test_strategy": "minimal",
  "project_type": "brownfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    }
  ],
  "obligations": {
    "strategy": "minimal",
    "strategy_volume": [
      "One verifiable test per requirement at the narrowest effective level.",
      "At least one happy-path unit test per component.",
      "Unit tests are the default; a bugfix/security scope floor may require an integration or E2E regression when that is the narrowest level that reproduces the defect."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Verify the existing test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Verify the existing test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:06c12367ad8c44802c849bfad1d351bad9312bf5dfa96742a3ea92f337cd806c",
  "contract_sha256": "sha256:be24de49065e6c54a26024b4a9117dabfa3bc2a5a7d4774a9ade02b7d86b1894"
}
```
