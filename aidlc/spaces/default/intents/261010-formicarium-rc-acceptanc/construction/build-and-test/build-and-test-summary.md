# 公開RCの最終品質確認

## Status

成功。全ローカル受入れ条件を満たした。

## Requirements Inventory

Code Generation Testing Contract `sha256:8780c9b6738d34215859c7d0d02b149a16944cf2942a43d2c2dee67268c80df0` はtest-after/Minimal/poc。requirements FR1–FR7/NFR1–NFR3を検証。nfr-requirements/nfr-design/user-stories/Unit DAGは未実施。追加coverage率・速度・可用性目標なし。coverage率は未測定。

## Environment and Identity

2026-10-10、macOS、Node26.11.1、Bun1.4.2、npm11.20.0。ブラウザversionは同一インストールのCode Generation runtime-versions.json（Chromium153.0.8010.12、Firefox155.0、WebKit26.6）。version0.1.0-rc.1、24導入files一致、lockVersion1。

SHA256 `8334d7f14c31109e5be3ec90147aa02105d8d839c4c79eccc1c25cb88eabbb3a`。
integrity `sha512-SIFbXU1QkxXDATkE0M1Prm65Kq+Q2SkwnDyBwRf/ejEd3mADZT5uueETF+r0AAl4nuDRqbbSkBc7K/fHclwICA==`。

## Results

| Suite | Pass | Fail | Skip | Evidence |
| --- | ---: | ---: | ---: | --- |
| Node actual guests | 6 | 0 | 0 | evidence/node-acceptance.json |
| Chromium | 15 | 0 | 0 | evidence/browser-host.json |
| Firefox | 15 | 0 | 0 | evidence/browser-host.json |
| WebKit | 15 | 0 | 0 | evidence/browser-host.json |
| Full unit13files | 144 | 0 | 0 | evidence/full-unit.json |
| Scoped session | 11 | 0 | 0 | evidence/session-unit.json |
| Scoped identity | 5 | 0 | 0 | evidence/identity-unit.json |
| Fresh tarball identity | 5 | 0 | 0 | evidence/fresh-identity.json |
| Scoped Node aggregation | 3 | 0 | 0 | evidence/node-unit.json |
| Scoped staging6files | 83 | 0 | 0 | evidence/staging-unit-fixed.json |

型/candidate build/package buildはexit0。scopedはfull suiteの一部なので144へ加算しない。sessionはstagingとも重複する。実Node/3browserはこのstageで再実行した。

## Resolved Failures

初回stagingは74pass/9fail、古い既定inputsのresolver不足。FORMICARIUM_INPUTS_ROOTを検証済みpublic-rc1へ明示して83passになった。初回browserはsandboxのMachPort Permission denied等で45launch failures。同じコマンドをhost権限で再実行して45pass。期待値/sourceを変更しない。初回失敗はevidence/staging-unit.json、browser-command.jsonに保存し、最終成功と区別する。取得空dir/不正tarball拒否/既存bytes保持は../code-generation/evidence/fresh-rc-acquisition.jsonとr01-corrupt-pack-refusal.json。

## Target Verification Matrix

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| RC-identity | requirements FR1/FR2/NFR1 | RC固定・指定SHA256・integrity・24files一致 | 全一致 | evidence/identity.json、../code-generation/evidence/fresh-rc-acquisition.json | build-and-test | Met |
| RC-stage | requirements FR3 | 公開RCをstage | candidate build exit0 | evidence/public-build.json | build-and-test | Met |
| RC-node | requirements FR4 | 実guest N1–N6pass | 6pass/0fail/skip | evidence/node-acceptance.json、node-command.json | build-and-test | Met |
| RC-browser | requirements FR5/NFR2 | 45pass、fail/skip0、期待値維持 | 各browser15pass | evidence/browser-host.json | build-and-test | Met |
| RC-record | requirements FR6/FR7 | commands/cwd/output/diff記録 | 12files SHA現在source一致 | evidence/coverage-source.json、../code-generation/evidence/terrarium-diff.json | build-and-test | Met |
| TC-green | Testing Contract obligations、NFR3 | 型/unit/build green、requirement10/10 | full unit144pass、build/type exit0、10targetsOK/存在 | evidence/full-unit.json、public-build.json、package-build.json、coverage-source.json | build-and-test | Met |

## Readiness and Limitations

ローカルbuild-ready/test-ready、全target Met。build/integration instructions生成、unit exact commandsはCode Generation instructionsを使用。MinimalでもNode/browserは明示要件で実施。performance/securityは適用目標がなくinstruction未生成。型やテスト追加source変更なし。公開・push・PRなし。遠隔CI/Pages/実Safariは対象外で未検証。Firefox/WebKit credentialless非対応の期待unsupported契約を実guest成功と区別する。
