# formicarium依存配置・CI接続の実装結果

## Implementation Summary

固定16ファイルdescriptor、明示prepare、repo相対tarball、入力検証先行のassembly、別legacy catalog、専用3browserのCI接続を実装した。旧.site/tarball/manifestと前回の失敗結果は保持する。

承認済み追加Steps11–14で既存2失敗を解消した。resolve-ref.shは最後のregex match indexを非負で計算しBash3.2にも対応する。build-pitchfork.shはreverse dry-runとforward applyに--forceを付け、自動方向反転を避ける。Mac fixture測定で--batchは未適用reverseもexit0、--forceはbefore/mismatchに1・afterに0を確認した。パッチ本体、他toolchain、期待値、skip、品質目標を変えていない。

## Files Created/Modified

[source-manifest.json](source-manifest.json)は22 source/config/test/doc pathsとgenerator出力3treesを宣言する。初回18pathsの旧/新SHAはevidence/source-final.json、追加修正後の全22pathsはevidence/source-shell-fix-final.json。全22source bytesは単独tempと一致する。追加4filesは変更開始前にevidence/additional-baseline/source/へ保存・読み戻し検証した。

catalog testの初回baseline漏れはjj記録から後で旧bytesを回収し、事前source-before.jsonの16cd04…と完全一致した。変更前保存と扱わない。初回summary/handoff/manifest、旧79pass/2failと45/34+2のraw結果・bindingもadditional-baselineと元evidenceに保持した。

## Test Coverage Summary

| 対象 | 現結果 | 証拠 |
| --- | --- | --- |
| 追加shell限定2files | 20 pass / 0 fail | evidence/additional-unit-scoped.txt |
| native Mac全unit | 85 pass / 0 fail | evidence/additional-validation-0.txt |
| standalone全unit | 85 pass / 0 fail | evidence/additional-standalone-unit-final.txt |
| 型検査 / build | 成功 | evidence/additional-validation-1.txt、additional-validation-2.txt |
| 2shell ShellCheck / 2tests Biome | 成功 | evidence/additional-validation-3.txt、additional-validation-4.txt |
| 専用3browser | 既実走45 pass / 0 fail / 0 skipを保持 | evidence/browser-final-source.txt |
| legacy3browser | 既実走34 pass / 0 fail / 2既存skipを保持 | evidence/browser-legacy-final-source.txt |

Mac標準/bin/bash3.2.57、/usr/bin/patch2.0-12u11-Appleを使った。GNU工具への置換で合格を代用しない。PRのpr-42 / #42 / URLを同じhead endpoint・metadataで検証し、patchの初回成功、vendor失敗後の再試行、不一致拒否を実shellで検証した。不一致ではvendor/Cargo実行・Cargo marker・build outputがない。GNU/Linux実走は未確認。

追加修正前の限定14pass/2fail、全79pass/2fail、sandbox launch失敗、trace衝突の失敗は上書きしていない。今回tempの初回全unitはpages-build-artifacts用pages.ymlの未コピーで82pass/1fail+1errorだった。既存workflow fixtureをsource変更せず読取コピーして85passへ再検証し、両結果とfixture SHAを保存した。前回tempにも同fixture不足があり、以前の「同じ2fail」説明は完全な結果記述ではなかった。今回の85/85が完全fixture集合での検証結果である。

## Browser / Evidence Binding

追加変更は2shellと2unit testsのみ。最終browser bundleを既実走candidateと同じversionで再生成し、双方SHA `70d84444ec59708f0ce094c0ee849d136fa2a5c263857331852e3779f43b61ca` の完全byte一致を確認した。3候補の全inventory SHAも不変（evidence/additional-preservation-browser-binding.json）。browserを再実走したとは記録せず、元results-final.jsonへの正しいbindingを保持する。

legacy2skipはFirefox/WebKitの既存credentialless Chromium-only仕様でpassに加算しない。以前のfixed23 coverage81.87%は元候補の観測のみで、新sourceの数値coverage達成は主張しない。

## Plan Status / Traceability

Steps1–14を完了した。Steps4/8の全unit残条件はnative/standalone85passで解消した。FR1–4/NFR1–4のローカル実装・検証をOKとし、traceability.jsonへ対応付けた。plan本文の79/2fail記述は追加修正前の歴史として残した。正規lifecycle reportとapproval gateはrootが行う。

## Remaining Acceptance

元candidateSHA `3e3401c5a93bca5c7635d2ba0761bd72125b3421319c6ce054b178e011602983`、tarball `969e9fab854d4499da1d38087bd601b65042b6d50b086c8fc8ddaefd0752f810`、manifest `ba2f4ced257067a4c2aa64c9841b04a04f332e4812bcd369bab0d2807b310aef`は一致。ローカルarchiveSHAは00abfc608106c8b4a17bd973b4a948b0aa1fa23c713ac22ad62e5a4571c75d01。

外部upload・FORMICARIUM_INPUTS_URL設定・remote CI・GNU/Linux実走は未実施。URL未設定fail-fastは仕様でremote greenの証拠ではない。他pages/publish/lint install経路のprepare接続、公開RC、実Pages/service-worker、実Safari、architecture採用は別受入れ。push、publication、兄弟repo変更・送信はしていない。
