# 公開RC受入れの実装と結果

## Outcome

`@aletheia-works/formicarium@0.1.0-rc.1`をnpmから固定取得・導入し、実導入24filesとtarball bytesの一致を確認しました。SHA256は`8334d7f14c31109e5be3ec90147aa02105d8d839c4c79eccc1c25cb88eabbb3a`、npm integrityは`sha512-SIFbXU1QkxXDATkE0M1Prm65Kq+Q2SkwnDyBwRf/ejEd3mADZT5uueETF+r0AAl4nuDRqbbSkBc7K/fHclwICA==`。lockfileVersion1、registry版への完全固定です。

| Environment | Version | Pass | Fail | Skip |
| --- | --- | ---: | ---: | ---: |
| Node | 26.11.1 | 6 | 0 | 0 |
| Chromium | 153.0.8010.12 | 15 | 0 | 0 |
| Firefox | 155.0 | 15 | 0 | 0 |
| WebKit | 26.6 | 15 | 0 | 0 |

Nodeは実Workerと固定aube2.7.0／pitchfork2.30.0を利用しました。version・fixture/nested cwd・config書込みの永続化・不正引数の非zero・次command・disposeを確認しました。browser既存45casesのspec/期待値は無変更です。Firefox/WebKitのcross-origin credentialless非対応は既存の期待されたunsupported契約としてpassし、実guest成功とは区別します。

## Files Created / Modified

変更は12application files。`evidence/terrarium-diff.json`にbaseline/currentの全bytesとSHA256を記録しています。新規は`scripts/verify-formicarium-rc.mjs`、`scripts/prepare-formicarium-rc-inputs.mjs`、`scripts/accept-formicarium-node.mjs`、`scripts/fetch-formicarium-rc.mjs`、identity/Node集計の2test files。変更はpackage.json、bun.lock、integration descriptor、stage-formicarium.mjs、README、mise.tomlです。

新入力`.vendor/formicarium-inputs-public-rc1`は既存repair-v1を検証してguest/resolver全bytesを保持し、package tarball/manifestだけ公開RCへ更新しました。stageのpublishedRc markerがある場合は実導入全files／tarball／lock照合も必須です。既存ローカル候補はcandidate transaction履歴に保持されています。

## Verification

- 新identity unit5pass、Node集計unit3pass。
- 接続/staging既存6files83pass。
- 最終全unit13files144pass/0fail、型検査とpackage build成功。
- 変更JS/JSONのBiome、README rumdl、mise format、最終staging check成功。
- browser候補のformicarium全24filesも公開tarballのidentityに一致。

全current logsは`evidence/`のcommand/cwd/exit/outputで追跡します。取得/導入/中間失敗は`evidence/baseline-results.md`、exact再実行コマンドは`evidence/commands.md`、Node各実行のraw stdout/stderr/exit/stateは`evidence/node-acceptance.json`、browser全45結果は`evidence/browser-acceptance.json`です。

## Baseline and Deviations

main更新後のparent`9aa3c0e6`と対象source bytesをbaseline.jsonに捕捉しました。元の未コミット変更は保全し、今回差分はこのbytes集合との比較です。開始時のunit127pass/9failは古いデフォルト入力のresolver不足等で、明示した新入力で解消しました。初回baseline raw出力はtool上限で部分省略、観測した全件数・9fail一覧を記録しています。

通常のBun installが同version旧local filesを残したため、実ファイル照合で不一致を検出し、`bun install --force`で解消しました。hashを変更して通していません。npm HOME cache／Bun tempdir sandbox制約は専用cache／host権限で解消しました。新testの構文と型の中間失敗は修正済みです。

Node exact cases/args/expected値を実行前にunit-test-instructionsへ確定しました（計画の許容範囲）。Testing Contractは変更していません。公開・push・PR、遠隔CI・実Pages・実Safariの検証は行っていません。これら遠隔条件とWebKitを同一視しません。

## R-01 Fresh Environment Revision

人の依頼に従い、新環境のnpm tarball取得を通常試験準備へ追加しました。`terrarium:rc:prepare`／`ci:terrarium`／`ci:e2e`が取得scriptを実行し、packageの`bun run test`も`test:prepare`を先に実行するため、CI workflowの通常unit入口も準備を引き継ぎます。既存成功Node6／browser45証跡は保持し、挙動を変更していないため再実行していません。

取得scriptはディレクトリを自動作成しexact npm view/packを実行、共通のversion・圧縮SHA256・integrity検証に合格してから配置します。既存不一致packは拒否、既存一致packはregistry metadataと再照合して再利用します。npm cacheと未検証packは一時領域で完結します。

既存のsynthetic wrong tarballを取得scriptへ渡した場合もexit1のSHA256 mismatchで拒否し、そのbytesが保持されたことを実確認しました（`evidence/r01-corrupt-pack-refusal.json`）。

実在しない`.vendor/formicarium-rc-fresh-review-r01`を事前確認して取得成功、そのfresh tarballでidentity5pass。新しい通常`ci:terrarium`もexit0、型検査・全unit144pass・build成功です。fixed入力先はFORMICARIUM_INPUTS_ROOTを明示して既存入力を保全しました。証跡は`fresh-rc-acquisition.json`、`fresh-identity-unit.json`、`fresh-ci-terrarium.json`。Node/browser期待値とRC identityの定数は変更していません。
