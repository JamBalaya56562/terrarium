# :hammer: Build and Test Complete

## Summary

変更ソース22fileを前回承認後のSHAと照合し、現在のsourceでfrozen install、型検査、package build、全unit85/85、専用browser45/45、legacy34pass/2既存skipを再実走した。Chromium/Firefox/WebKitの全projectを使い、再試行0。単独tempでも固定入力prepareと別出力assemblyを確認した。元.site、tarball、manifestと前回2candidateの全ファイルは不変。

Minimal/test-after。数値coverage floor・性能目標は今回の入力に存在しない。前回81.87%を転記しない。build/integration/securityの手順を作成し、performance手順は適用性のみ記録した。NFR要件/design段階はscopeで未実施で、requirementsとTesting Contractから9個の品質対象を抽出した。

## Readiness and Findings

ローカルbuild/testは成功。安全性は既存の入力/origin/digest/Worker負例とCI静的契約の確認に限定する。公開/配布受入れ全体の完了とは扱わない。

CT-1（記録不足）: 上位8FR/NFRの明示OKと対象file存在は確認したが、下位FR10個の明示エントリがcode-generation/traceability.jsonにない。cross-unit-traceability.mdはFAILを記録した。下位の実行検証対応はevidence/requirement-evidence-map.jsonに別記し、親のOKを子の明示エントリとして代用しない。この不足を承認時のfindingとして提示する。

remote CI、FORMICARIUM_INPUTS_URLの外部配備、GNU/Linux実走、公開RC、実Pages/service-worker、実Safari、architecture採用は今回の対象外で未確認。push/publication/兄弟repo変更や送信なし。

## Environment Correction

初回の限定ShellCheckはsource先emscripten-env.shを入力に含めずSC1091でexit1。正規shell:checkと同じscripts/*.sh + mise-tasks/**/*.shの全入力を指定し再検証exit0。ソース/ルール/閾値を変更していない。初回ログはevidence/shellcheck.txtに保持し、正規結果はshellcheck-canonical.txt。他の適用コマンドは全てexit0。

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

## Recovery and Evidence

古いrecovery breadcrumbはcode-generation（01:55:32Z）だが、後続auditのcode-generation承認/完了とbuild-and-test開始（02:33:40Z）、state/runtime-graphが一致し、破損なし。日誌/学習/summary checkpointは無効のため生成しない。

実走のcwd/argv/exit/所要時間はevidence/commands.json、isolated-commands.json、browser-commands.json。source全inventoryはsource-inventory.json、旧bytesはold-bytes-verification.json、新候補はformicarium-candidate.json/legacy-candidate.json。ログは元結果と別保存し、限定unitの重複を合計に加算しない。
