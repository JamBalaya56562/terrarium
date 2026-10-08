# formicarium依存配置・CI接続の実装結果

## Implementation Summary

固定16ファイルdescriptorと明示prepareを追加し、依存tarballをrepo相対file参照へ変更した。prepareはdirectory/gzip ustar/clean HTTPSを受け、exact set・全digest・regular file・pathを配置前に検証する。暗黙の兄弟checkout参照は除いた。miseの自動deps hookを止め、ci tasksはprepare→frozen installの順に接続した。

assemblyは出力初期化前にpackage/coreと広告した全3 refsを検証する。legacy modeは既存Wasm catalogを維持する。terminalはguest未宣言のcatalogに既存Sessionを使い、recognized static-musl guestにadapterを使い、未知/壊れたguest宣言を拒否する。Session公開APIの変更はない。

2 test workflowsに固定URL入力、未設定fail-fast、専用3browserを接続した。pitchfork-buildの最初にもURLpresenceを確認し重いbuildを待たせない。site:buildの既定`.site`は維持し、今回の検証は独立tempの別出力を用いた。browser configは明示Bun/siteと別results outputを使い、legacy terminal/pitchforkと専用2filesを分ける。

## Files Created/Modified

[source-manifest.json](source-manifest.json)は今回の18 source/config/test/doc pathsとgenerator出力3treesを宣言する。[evidence/source-final.json](evidence/source-final.json)が旧/新raw SHAを持つ。[evidence/standalone-final-source-binding.json](evidence/standalone-final-source-binding.json)で独立tempとの全18byte一致を確認した。新ファイル以外の旧bytesをbaselineへ保持した。

catalog testは初回baseline保存から漏れていた。後からjj記録を読み戻し、調査時source-before.jsonのSHA `16cd04d3f0f02e95b85492bd2954c81b6185070aec97206d1ffa94d99e274c9a` と完全一致する旧bytesを回収した。変更前に保存したと扱わない。

## Test Coverage Summary

| 対象 | 結果 | 証拠 |
| --- | --- | --- |
| scoped統合unit | 36 pass / 0 fail | evidence/final-validation-0.txt |
| 全既存unit | 79 pass / 2 fail | evidence/unit-final-source.txt |
| 型検査 / build | 成功 | evidence/post-format-0.txt、post-format-2.txt |
| standalone prepare/install/typecheck/build/2 assembly | 成功 | evidence/standalone-commands.json |
| standalone専用3browser | 45 pass / 0 fail / 0 skip | evidence/browser-final-source.txt |
| standalone legacy3browser | 34 pass / 0 fail / 2既存skip | evidence/browser-legacy-final-source.txt |
| 変更対象Biome / actionlint / shellcheck / Tombi | 成功 | evidence/post-format-3.txt、final-layer-3.txt、final-layer-4.txt、final-layer-5.txt、final-validation-2.txt |
| README rumdl | 成功（空行指摘を修正後） | README final lint command |

全unitはgreenではない。native Mac bash3.2の負indexとBSD patchのreverse dry-run自動応答が、既存2testsを失敗させる。変更前保存ソースoverlayでも限定16で14pass/2failとなり、4独立scripts/testsは作業前jjと現byteが一致した。原因測定はevidence/existing-unit-shell-cause.json、比較はjj-original-unit-binding.jsonとprechange-existing-unit.txt。GNU工具が既存環境になく、期待緩和や無関係source修正はしなかった。

legacyの2skipは既存credentialless Chromium-only仕様によりFirefox/WebKitでskipするケースで、passへ加算していない。初回sandbox browser45 launch失敗と並行trace出力衝突は保存し、host起動・結果出力分離後に全対象を再実走した。formatter後bundle SHAも変わったため最終sourceから再assemblyして両suiteを実走した。最後のconfig整形はsettings不変でlist/lint確認した。

以前のfixed23 coverage81.87%は元候補の観測のみ。新sourceの数値coverage達成を主張しない。

## Plan Status / Traceability

Steps1–3、5–7、9–10は完了。Steps4/8はnative全unit2failのためpartialのままmarkerを残した。FR1/FR2/FR4、NFR1/NFR3/NFR4は保存・実装・狭い検証を完了。FR3/NFR2は対象browser成功と設定接続を確認したが、全suite非greenとremote CI未実走を明記してpartialとする。[traceability.json](traceability.json)参照。

## Evidence Independence / Residuals

元candidate SHA `3e3401c5a93bca5c7635d2ba0761bd72125b3421319c6ce054b178e011602983`、tarball `969e9fab854d4499da1d38087bd601b65042b6d50b086c8fc8ddaefd0752f810`、manifest `ba2f4ced257067a4c2aa64c9841b04a04f332e4812bcd369bab0d2807b310aef` は再照合一致。完全candidate inventoryはbaselineと今回とも45ファイル。調査のimported44 bindingと同じ集合だと仮定しない。新旧候補はevidence/candidate-final.jsonで分離した。

ローカルarchiveは`.vendor/formicarium-inputs.tar.gz`、SHA `00abfc608106c8b4a17bd973b4a948b0aa1fa23c713ac22ad62e5a4571c75d01`。外部uploadとFORMICARIUM_INPUTS_URL設定は未実施。CI未設定fail-fastは仕様の動作で、remote greenを示すものではない。pages/publish/lint等の他install利用者の固定入力接続も未検証。公開RC、実Pages/service-worker、実Safari、architecture採用は別受入れ。push、publication、兄弟repo変更・送信はしていない。
