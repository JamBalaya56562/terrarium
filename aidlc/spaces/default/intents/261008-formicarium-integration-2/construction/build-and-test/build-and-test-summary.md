# Build and Test結果

## 概要

ローカル検証は成功。全unit136pass/0fail/554assertions。専用browser45pass/0skip、legacy34pass/2既存skip。全15distinct commandがexit0。限定unit件数を全suiteへ合算しない。型・lint・build・両assembly成功。version integration2-bt-20261008の新候補を三ブラウザで検証した。

## Target Verification Matrix

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| TC-existing-suite | ../code-generation/code-generation-plan.md Testing Contract | 既存suite合格 | unit136/0fail、skip増加0 | verification/test.log | Build and Test | Met |
| FR6-checks | requirements.md FR6 | lint/型/unit/build成功 | 全exit0 | verification/checks.json | Build and Test | Met |
| FR6-browser | requirements.md FR6 | 専用/legacy三ブラウザ成功 | 45pass、34pass/2既存skip、両exit0 | verification/browser-formicarium.log; browser-legacy.log | Build and Test | Met |
| NFR1-identity | requirements.md NFR1 | 実行と対象の識別可能 | command/time/exit/log SHA/source78/input16/candidate全件保存 | verification/checks.json; source-end.json; input-identity-reference.json | Build and Test | Met |
| NFR2-boundary | requirements.md NFR2 | 不正入力/送信元/link拒否 | 既存負例とnamespace/tools.json負例合格 | verification/test.log; browser-formicarium.log | Build and Test | Met |
| NFR4-preservation | requirements.md NFR4 | 旧入力/候補/証跡不変 | source78/旧4316paths/新候補全件changed0 | verification/prior-preservation-end.json; source-end.json; candidate-end JSON | Build and Test | Met |
| NFR5-regression | requirements.md NFR5 | 既存browser回帰なし | 失敗0/flaky0/同理由2skip | verification/formicarium-browser-stats.json; legacy-browser-stats.json | Build and Test | Met |

## 品質条件と対象

Testing Contractはtest-after/Minimal、追加coverage floorなし。NFR requirements/designはscope未実行。独立load/benchmarkは新数値目標なしでN/A。信頼境界はunit/E2Eで検証。既存skipはFirefox/WebKitのcredentialless iframe条件。同数・同理由で成功件数に含めない。

## 上流成果物

- [code-generation-plan](../code-generation/code-generation-plan.md)
- [unit-test-instructions](../code-generation/unit-test-instructions.md)
- [code-summary](../code-generation/code-summary.md)

最新追記とTesting Contractを照合。旧失敗ログは現在の成功へ書き換えない。source集合digestはb70c328cf9d309a18a6dc06eccde0817b0c3a78bf6f7b513ea4cb159beee2f99。

## 対応表と工程の未完了

[cross-unit-traceability](cross-unit-traceability.md)の機械的coverageはFAIL。凍結済み上流のFR7/FR8がPENDING。FR7の現在実績は正式READY登録と人のApproveに存在するが、承認済み上流へ事後のOKを付け替えない。FR8のU3返送は本段階承認後の義務で未実施。このgapを承認時に明示する。ローカル測定target全Metは工程全体完了を意味しない。

## 制限と返送

build/test-ready。公開/配布受入れは未承認・未検証。公開RC、実Pages/service-worker、実Safari、remote Linux CI、明示URL遠隔到達性は範囲外・未検証。方針採用と管理AGENTS更新も保留。公開/push/PR/tag/deployなし。人の段階承認後、識別可能な結果をU3へ返し、U3の承認/完了は代行しない。

## 証跡

[実行一覧](verification/checks.json)にcommand/cwd/time/exit/log SHA。[環境](verification/environment.json)、[入力参照](verification/input-identity-reference.json)、candidate start/end inventory、source start/endに新対象を結び付ける。既存候補・原本を上書きしない。
