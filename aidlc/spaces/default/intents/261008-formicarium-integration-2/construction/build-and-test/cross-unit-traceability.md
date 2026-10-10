# Cross-unit traceability

## 機械的照合

stage-level/no Unit。requirementsの全FR/NFRを列挙し、凍結済みcode-generation/traceability.jsonのstatus OKと対象ファイル存在を照合した。user-storiesは未実行でAC追加なし。

| ID | Status | Target | Exists | Verdict |
| --- | --- | --- | --- | --- |
| FR1 | OK | packages/terrarium/tests/formicarium-session.test.ts | True | PASS |
| FR2 | OK | packages/terrarium/tests/formicarium-catalog.test.ts | True | PASS |
| FR3 | OK | packages/terrarium/e2e/formicarium-iframe.spec.ts | True | PASS |
| FR4 | OK | packages/terrarium/tests/candidate-transaction.test.ts | True | PASS |
| FR5 | OK | scripts/candidate-transaction.mjs | True | PASS |
| FR6 | OK | aidlc/spaces/default/intents/261008-formicarium-integration-2/construction/code-generation/verification-recovery/checks.json | True | PASS |
| FR7 | PENDING | None | False | FAIL |
| FR8 | PENDING | None | False | FAIL |
| NFR1 | OK | scripts/candidate-transaction.mjs | True | PASS |
| NFR2 | OK | packages/terrarium/tests/formicarium-assets.test.ts | True | PASS |
| NFR3 | OK | scripts/assemble-candidate.mjs | True | PASS |
| NFR4 | OK | packages/terrarium/tests/candidate-transaction.test.ts | True | PASS |
| NFR5 | OK | packages/terrarium/e2e/terminal.spec.ts | True | PASS |

## 判定と工程の補足

機械的coverage: FAIL。未カバーは FR7, FR8。既存の承認済みtraceabilityへ事後のOKを付け替えない。FR7の現在実績は正式Code Generation review attempt 826a9a551ecd3d72、request review:00ea057e81e3a59480e2c2297b99eeb6、iteration1 READY、4指摘Resolved、および人のApprove。FR8のU3返送はBuild and Test承認後であり未実施。この機械的gapを承認時に明示する。ローカルコマンド成功は工程全体の完了を意味しない。
