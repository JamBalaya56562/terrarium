# 261006-npm-terrarium-release向け最終handoff

## Outcome

terrarium側の明示固定入力配置、相対tarball依存、テストCI接続、Bash3.2/BSD patchの既存2失敗修正を実装し、Build and TestのユーザーApproveを記録した。これは公開許可やarchitecture採用判断ではない。兄弟リポジトリや別chatへの書込み・送信は行っていない。

## Latest Verification

| Check | Result | Evidence |
| --- | --- | --- |
| 全unit | 85 pass / 0 fail | construction/build-and-test/evidence/unit-all.txt |
| 専用3browser | 45 pass / 0 fail / 0 skip | construction/build-and-test/evidence/browser-formicarium.txt |
| legacy3browser | 34 pass / 0 fail / 2既存skip | construction/build-and-test/evidence/browser-legacy.txt |
| typecheck / build / frozen install | exit0 | construction/build-and-test/evidence/commands.json |
| 正規ShellCheck / actionlint | exit0 | 同上 |
| 単独temp固定入力配置/assembly | exit0、22source完全byte一致 | construction/build-and-test/evidence/isolated-commands.json、standalone-binding.json |
| 保存候補 / 固定入力 | 全inventory/16input SHA一致 | construction/build-and-test/evidence/preservation-after.json、post-browser-binding.json |

最新browserは承認済みsourceから別候補`.vendor/build-test-formicarium`と`.vendor/build-test-legacy`を組立てて本段階で再実走した。限定unit結果は全suiteに加算しない。旧Code Generationのbrowser結果とSHAは過去証拠として残し、新候補への転記をしない。全source/candidateのファイルSHAとcommands/cwd/env/exit/raw logはconstruction/build-and-test/evidence/を参照する。

## Fixed Identities

元candidate `3e3401c5a93bca5c7635d2ba0761bd72125b3421319c6ce054b178e011602983`、tarball `969e9fab854d4499da1d38087bd601b65042b6d50b086c8fc8ddaefd0752f810`、manifest `ba2f4ced257067a4c2aa64c9841b04a04f332e4812bcd369bab0d2807b310aef`。archive `00abfc608106c8b4a17bd973b4a948b0aa1fa23c713ac22ad62e5a4571c75d01`はCode Generationで作成した固定入力archiveのidentity。取得後はintegration/formicarium-inputs.jsonのexact16filesを照合する。

新candidateはconstruction/build-and-test/evidence/formicarium-candidate.json、legacy-candidate.json、新sourceはsource-inventory.jsonで独立同定する。実走後の一致確認はpost-browser-binding.json。旧19sourceの復元可能なbytesもold-bytes-verification.jsonで照合した。

## Remaining Acceptance

CT-1: 下位FR1.1/FR1.2/FR2.1/FR2.2/FR2.3/FR3.1/FR3.2/FR3.3/FR4.1/FR4.2の明示IDがcode-generation/traceability.jsonに不足する。上位8IDはOKだが、この不足は未解消。ユーザーは提示後にBuild and TestをApproveした。cross-unit-traceability.mdのFAILをPASSへ書き換えない。各下位検証の実行証拠は別要件対応表にある。

外部archive配備、FORMICARIUM_INPUTS_URL設定、remote CI/GNU Linux、pages/publish/lint利用者の入力prepare接続、公開RC、実Pages/service-worker、実Safariは未確認または対象外。Emscripten/no-emulator方針からの正式採用変更は人の判断事項。今回push、tag、publication、secret操作をしない。配布/CD/監視の新設条件を満たさない段階は非適用理由をauditに残す。

## Reading Order

construction/build-and-test/build-and-test-summary.md、test-results.md、cross-unit-traceability.md、evidence/evidence-manifest.json、construction/code-generation/code-summary.mdを参照する。初回ShellCheckの入力不足SC1091は正規全script入力で解消し、旧ログも保持する。過去unit2failと後の85passを混同しない。

## 追加修正と提出の許可（2026-10-08）

上記のCT-1未解消とpush対象外は前回承認時点の記録。追加指示後、CT-1および修正可能なCI/lint残件を解消。最新結果と残る外部条件は[追加修正記録](verification/pre-pr/resolution.md)を参照。pushとupstream PR作成は今回許可された。
