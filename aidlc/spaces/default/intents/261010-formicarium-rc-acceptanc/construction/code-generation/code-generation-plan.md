# 公開RC受入れの実装計画

## Summary

- Builds: npm公開RCの導入・同一性照合とNode／3ブラウザの受入れ準備。
- Touches: package.json、bun.lock、integration入力、検証用scripts・tests、README、必要なmise task。
- Tests: 同一性照合のunit試験、実guestのNode必須ケース、既存ブラウザ45ケース、既存型・unit・build。

## Scope

承認済み[要件](../../inception/requirements-analysis/requirements.md)のFR1–FR7、NFR1–NFR3のみ。zero-Unitの単一実装。公開・push・PR、対象CLI・アーキテクチャの戦略変更なし。既存ローカル入力・候補と他の作業変更を保持する。

## Implementation Steps

- [x] Step 1: 検証開始時点のjj状態、対象ソースbytes、依存・入力・候補のidentityを捕捉する。既存変更を今回の差分と区別する。FR7。
- [x] Step 2: mise管理Node/npm/Bun、既存unit runnerと専用browser設定の準備状態を確認する。後述のexact test commandsを記録する。NFR3。
- [x] Step 3: npm registryから`@aletheia-works/formicarium@0.1.0-rc.1`のversion/dist metadataとtarballを取得する。tarballは`.vendor/formicarium-rc-acceptance/`へ保存し、命令・結果はrecordへ保存する。SHA256が`8334d7f14c31109e5be3ec90147aa02105d8d839c4c79eccc1c25cb88eabbb3a`、integrityがdist.integrityと一致しなければ成功扱いせず中止・記録する。FR1、FR2。
- [x] Step 4: package.jsonをexact registry versionへ変更しBunで導入する。lockfileVersion 1を維持。実導入package.json、lockの解決値、tarball内の全package filesと導入filesのdigest対応を検証する最小script `scripts/verify-formicarium-rc.mjs`を実装する。metadata値だけで導入済みとは主張しない。FR1、FR2、NFR1。
- [x] Step 5: 照合scriptに対し`packages/terrarium/tests/formicarium-rc-identity.test.ts`を追加して実行する。happy path、誤version、integrity不一致、tarball SHA不一致、導入ファイル不一致を確認する。FR1、FR2、NFR1。
- [x] Step 6: 既存の検証済みresolver/guest入力を保持し、新しい入力ディレクトリで公開tarball由来のpackage manifestとdescriptorを作成する。必要最小限のintegration descriptor・prepare/staging接続を更新し、検証を弱めず公開RCの実物をstageする。互換性不成立なら別版へ切替せず記録する。FR3。
- [x] Step 7: 変更した入力・staging境界に対応する既存unit testsを実行する。必要なら公開RC対応のregressionを既存test fileに追加する。型検査とbuildを行い、browserの配布candidateが照合した公開RC由来であることを記録する。FR3、NFR3。
- [x] Step 8: 公開packageのNode exportと実Worker APIを確認し、最小の実guest検証runner `scripts/accept-formicarium-node.mjs`を実装する。実行前に対象guest、必須ケース、期待値、Node対象外のbrowser契約をunit-test-instructionsへ確定する。下記ケースのAPI実行、出力、exit、状態を検証し結果を保存する。FR4。
- [x] Step 9: Node runnerの結果集計について`packages/terrarium/tests/formicarium-node-acceptance.test.ts`のhappy path、非zero exit、期待出力不一致を追加して実行する。実guestのNode試験を実行する。FR4、FR6、NFR2。
- [x] Step 10: Chromium／Firefox／WebKitで既存要素10＋iframe5ケース、計45ケースを再実行する。pass/fail/skip、browser version、command／exit／reportを記録する。期待値や件数を下げて通さない。FR5、FR6、NFR2。
- [x] Step 11: README、必要なmise task、code-summary、traceability.json、実行証跡を整える。公開RC identity・4環境結果・baselineとの差分・失敗／未実行／残課題を区別する。既存suiteの適切なcheckを行う。FR6、FR7、NFR3。
- [x] Step 12: 修正依頼に対応し、新環境の通常の試験準備へ固定versionのnpm tarball取得とSHA256・integrity照合を追加する。空の取得先で準備できること、identity suiteが成功することを確認し、README・試験手順・差分証跡を更新する。FR2、FR6、FR7、NFR3。

## Node Acceptance Cases

実行前に公開RCのAPIと固定guest入力からexact command／expected値を確定する。fixtureや状態APIの形式は実物から取得する。

| Case | 対象 | 必須の検証 |
| --- | --- | --- |
| N1 | aube固定guest | `--version`の実出力とexit 0。 |
| N2 | pitchfork固定guest | `--version`の実出力（既存入力の2.30.0）とexit 0。 |
| N3 | pitchfork固定guest | 設定／config系の書込み後、同じsessionの次commandまたは公開FS APIで永続化を確認。supervisorは起動しない。 |
| N4 | fixture／cwd | 公開seed・cwd／FS APIで初期fixtureとnested cwdを確認し実guest実行に渡す。 |
| N5 | command error | 不正な引数またはcommandが非zero exit／errorを返し、runnerが失敗を検出する。 |
| N6 | lifecycle | error後の再実行とdisposeを確認し、ハング／未処理errorがない。 |

DOM、要素event、iframe source/origin、browser隔離の契約はNode対象外としてブラウザ45ケースで検証する。APIが必須ケースを満たせない場合、未達を明記する。

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "poc",
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
  "input_sha256": "sha256:ddd208517f68585f816e80821872bd21e26dc15e7bf545c6a78ec96b6afc20da",
  "contract_sha256": "sha256:8780c9b6738d34215859c7d0d02b149a16944cf2942a43d2c2dee67268c80df0"
}
```
