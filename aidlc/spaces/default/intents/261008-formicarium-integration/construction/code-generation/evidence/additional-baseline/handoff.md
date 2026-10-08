# 261006-npm-terrarium-release向けhandoff

terrarium側の固定入力配置とCI接続をこのintent内で実装し、元候補・packのbytesを保持した。兄弟repoへの書込みや別チャット送信は行っていない。

## Current implementation / identities

18 changed source/config/test/doc pathsはsource-manifest.json、旧/新raw SHAはevidence/source-final.json。最終単独workspaceのraw一致はevidence/standalone-final-source-binding.json。元候補・tarball・manifestのSHAはevidence/preservation-final.json、独立した新dedicated/legacy候補はevidence/candidate-final.json。新browser receiptsのsource/candidate bindingはevidence/results-final.json。

固定descriptorはintegration/formicarium-inputs.json。16filesの入力archiveは`.vendor/formicarium-inputs.tar.gz`、digestはevidence/input-archive.json。prepareは明示directory/archive/HTTPSのexact-setとraw digestで検証する。package/lockはignored inputへのrepo相対file参照。normalizedDescriptorSha256はraw descriptor SHAとは別の正規化JSON digest。入力不足・改変時は配置前に失敗する。

## Executed verification

scoped統合unit36pass、typecheck/build/layer lint成功。専用3browser45pass、legacy3browser34passと2既存credentialless skip（加算しない）。隣接checkoutのないtempでprepare/frozen install/typecheck/build/assemblyを実走した。legacy pitchforkは公開v2.29.0のsource.commit cfdea79f1d52b8449c0b99b29a03d9e771cd8ec3とダウンロードSHAをevidence/legacy-input-binding.jsonへ固定し、専用catalogを混ぜていない。

全unitは79pass/2failでgreenではない。既存native Mac bash3.2 negative-indexとBSD patch reverse dry-run挙動が原因。変更前source overlayでも同じ2fail、4関係scripts/testsは作業前jjと完全一致（evidence/jj-original-unit-binding.json）。GNU環境未入手、source修正/期待緩和なし。Steps4/8とFR3/NFR2をpartialと記録する。

## Remaining acceptance / concrete follow-up

- Linux GNU環境で全unitを実走し、既存2native失敗との差を確認する。現Mac結果は保存する。
- 指定16files ustarを承認済み配布先へ外部配備し、FORMICARIUM_INPUTS_URLを設定してremote CIを実走する。今回はURLも配布先も設定していない。
- 今回の2 test workflows以外のpages/publish/lint install pathsにも同じprepare順序を接続する。今回その成功は主張しない。
- 公開RC、実Pages/service-worker、実Safariの受入れとarchitecture採用は別条件。旧coverage81.87%を新sourceへ転用しない。

CodeKB unknownのツールmarkerとraw source適用性は分ける。直前のformicarium実行証拠は旧source/candidateに適用できたが、今回変更の合格証拠には代用していない。全コマンド・失敗履歴・source/Candidate SHAはcode-summary.mdとevidence/を参照する。
