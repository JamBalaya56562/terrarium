# Test Results

## Overall Result

ローカルbuild/test成功。Cross-unit traceabilityはCT-1によるFAIL（詳細はcross-unit-traceability.md）。この記録不足を含む条件付きreviewとする。

| Check | Passed | Failed | Skipped | Evidence |
| --- | --- | --- | --- | --- |
| 全unit（9files） | 85 | 0 | 0 | evidence/unit-all.txt |
| 専用browser | 45 | 0 | 0 | evidence/browser-formicarium.txt |
| legacy browser | 34 | 0 | 2 | evidence/browser-legacy.txt |

限定unit27/9/8/19/20は全suiteの部分集合で、85に加算しない。legacy2skipはFirefox/WebKitの既存Chromium-only credentialless仕様でpassに含めない。型検査、build、frozen install、2site assembly、単独prepare/assembly、canonical ShellCheck、actionlintは成功。初回ShellCheckのsetup失敗は修正済みでrawを保持する。

## Browser Results

| Suite | Browser | Passed | Failed | Skipped |
| --- | --- | --- | --- | --- |
| formicarium | chromium | 15 | 0 | 0 |
| formicarium | firefox | 15 | 0 | 0 |
| formicarium | webkit | 15 | 0 | 0 |
| legacy | chromium | 12 | 0 | 0 |
| legacy | firefox | 11 | 0 | 1 |
| legacy | webkit | 11 | 0 | 1 |

## Target Verification Matrix

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| FR1 | ../../inception/requirements-analysis/requirements.md / FR1 | 元候補/tarball一致、旧bytes復元、新旧識別 | 候補全3inventory不変、旧19file照合、22source一致 | evidence/old-bytes-verification.json、preservation-after.json、source-binding.json | build-and-test | Met |
| FR2 | ../../inception/requirements-analysis/requirements.md / FR2 | 明示入力で単独配置、欠落/改変拒否 | 16input SHA一致、単独prepare/assembly exit0、入力負例9/9と配置8/8 | evidence/isolated-commands.json、unit-inputs.txt、unit-assets.txt | build-and-test | Met |
| FR3 | ../../inception/requirements-analysis/requirements.md / FR3 | 全3browser、失敗伝搬、既存suite維持 | 専用45/45、legacy34pass/2既存skip、unit85/85、CI静的契約成功 | evidence/browser-results.json、unit-all.txt、unit-inputs.txt、actionlint.txt | build-and-test | Met |
| FR4 | ../../inception/requirements-analysis/requirements.md / FR4 | 独立identity/resultsとhandoff | 新candidate/コマンド/要件対応の証拠分離、handoff既存確認 | evidence/requirement-evidence-map.json、commands.json、../../code-generation/handoff.md | build-and-test | Met |
| NFR1 | ../../inception/requirements-analysis/requirements.md / NFR1 | 個人絶対参照0、固定入力再現 | 対象source personal paths0、単独22source完全一致、16固定input一致 | evidence/personal-path-scan.json、standalone-binding.json、isolated-commands.json | build-and-test | Met |
| NFR2 | ../../inception/requirements-analysis/requirements.md / NFR2 | 新規失敗0、skipはpassに加算しない | 全unit0fail、専用0fail/0skip、legacy0fail/2既存skip | evidence/unit-all.txt、browser-results.json | build-and-test | Met |
| NFR3 | ../../inception/requirements-analysis/requirements.md / NFR3 | 公開API/origin/digest/Worker境界維持 | unit境界19pass、入力/配置負例成功、iframe/source/origin browser負例成功 | evidence/unit-boundaries.txt、unit-inputs.txt、browser-formicarium.txt | build-and-test | Met |
| NFR4 | ../../inception/requirements-analysis/requirements.md / NFR4 | 元候補/tarball改変0、旧receipt代用0 | 保存候補と全固定入力一致、新source候補でbrowser再実走 | evidence/preservation-after.json、post-browser-binding.json、browser-commands.json | build-and-test | Met |
| TC1 | ../../code-generation/code-generation-plan.md / Testing Contract | test-after、要件検証、正常系、既存suite green | 要件ごとの検証対応、新入力正常/6負例、全unit85/85 | evidence/requirement-evidence-map.json、unit-inputs.txt、unit-all.txt | build-and-test | Met |

## Coverage

数値coverage floorはない。新しいcoverage測定値は主張しない。上位8要件のsource traceabilityはOK、10下位IDは明示記録がなくGAP。各下位要件の検証証拠の対応表を別保存した。

## Preservation

元candidate `3e3401c5a93bca5c7635d2ba0761bd72125b3421319c6ce054b178e011602983`、tarball `969e9fab854d4499da1d38087bd601b65042b6d50b086c8fc8ddaefd0752f810`、manifest `ba2f4ced257067a4c2aa64c9841b04a04f332e4812bcd369bab0d2807b310aef` の固定bytesを照合。新候補は別出力で本段階に再実走し、旧receiptを転記していない。

## Remaining Acceptance

外部入力配備とremote CI、GNU/Linux、公開RC、実Pages/service-worker、実Safari、戦略採用は未実施。詳細はsummaryとcode-generation/handoff.md。
