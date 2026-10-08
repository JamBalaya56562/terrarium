# 解析時点

- 日付: 2026-10-08（Asia/Tokyo）、intent `261008-formicarium-integration`、Minimal、Brownfield、Focused scan。
- 根拠: 再調査済み developer-scan.md、evidence/revision-snapshot.json、reconsideration-proof.json、直前のimported evidenceの原本/コピー。
- prior store UNVERIFIED。旧 prose は全9 artifact に保持し、今回読取範囲外の旧 deep paths は shallow に降格。
- root の後続 jj status: working copy `tysyuvwr 617cfc66`、parent `8cd2624e main`。未コミット integration を含むため単一 commit の全面解析ではない。証拠 inventory 大容量コピーは disk 保存、jj snapshot 対象外。
- pre-scan store: `sha256:e93df109fd65ee48b34f1fe29779047fdb5023bc5cd0d1c6e7454480b2ca132c`。
- 有効な再調査前 source: `tree:2ed309925418cce2a885b5828323813c57cd3d3921f04b29140b5bc8ea31d998`、paths は evidence/revision-snapshot.json の exact25。snapshot 後に全25ファイルを再読・再確認し raw SHA-256 は保存済み値と25/25一致。直前のimported source20＋candidate44も再比較64/64一致。
- 初回 directory snapshot `tree:76efb44aefed2e76a08d778719bb86e84c822aaf9fc6261de591e000fb3e8423` は scan-snapshot.json に履歴として保持。対象集合の差による fingerprint の別値はソース変更を意味しない。
- mint は `unknown`（exit 0）を返した。そのまま保持しCodeKB自動CURRENTとは主張しない。ただし独立のtree/raw SHA/digest/receipt照合で、直前のimported execution evidenceの現ソース適用性は確認済み。鮮度不明と同一視しない。

## Fresh Evidence Applicability

[reconsideration-proof.json](../../intents/261008-formicarium-integration/inception/reverse-engineering/evidence/reconsideration-proof.json): sameExactTree=true、source25/25、imported64/64、fixed23、installed23、receipt46 binding一致、candidate digest/sourceIdentity独立再計算一致。U3 collectorと今回retained assets懸念は解消、CI/general producerはConstruction、実配布受入れとarchitecture決定は別。詳細は[品質](code-quality-assessment.md)。

## Preserved Evidence Identities

対象・計算法の違う identity を置換/同一視しない。source31/31、直前のimported source20＋candidate44 =64/64 raw SHA一致。直前の実行結果を現行bytesへ適用できる。今回新規test実行とは主張しない。

| 識別子 | 保存値 |
| --- | --- |
| tarball SHA-256 | `969e9fab854d4499da1d38087bd601b65042b6d50b086c8fc8ddaefd0752f810` |
| package manifest SHA-256 | `ba2f4ced257067a4c2aa64c9841b04a04f332e4812bcd369bab0d2807b310aef` |
| candidate identity | `3e3401c5a93bca5c7635d2ba0761bd72125b3421319c6ce054b178e011602983` |
| old identity.json 4-source identity | `aee272eb2b52f2ed0eac662271c2ca2905a7a415760ab06929fbf80c658e8eda` |
| coverage generation | `47181b67-22c6-4eff-9993-4488e2c103ed` |
| coverage sourceIdentity | `10e59a2ce434302860783e7d0436efda25e21ab2d5a22354d0a06f6f9c23b9f6` |
| historical baselineCommit | `60dd0dc448f3a67d226dc8a3c6b3afcf4709823d`（現HEADの代用にしない） |

## Prior Analysis Metadata (historical)

## 解析時点

- 日付: 2026-10-05（Asia/Tokyo）。
- Intent: `261004-pitchfork-continuation`、Minimal、Brownfield。
- 開発者引継ぎ: `aidlc/spaces/default/intents/261004-pitchfork-continuation/inception/reverse-engineering/developer-scan.md`。
- 事前 snapshot: paths `./`、store generation `none`、source `git:7b6abe574efc7eac5a860778eaf89ea7a873cdf2`。
- 一覧は広く、深い読取は下記17ファイル。未コミット変更を含むため単一 commit の完全解析ではない。

### Scope of Analysis

```yaml
scope_version: 1
kind: partial
intent: 261008-formicarium-integration
fingerprint: unknown
analyzed:
  paths:
    - packages/terrarium/src/formicarium-session.ts
    - packages/terrarium/src/catalog.ts
    - packages/terrarium/src/terminal.ts
    - packages/terrarium/src/index.ts
    - packages/terrarium/src/npm.ts
    - packages/terrarium/package.json
    - packages/terrarium/bun.lock
    - packages/terrarium/jsr.json
    - packages/terrarium/tsconfig.json
    - packages/terrarium/tests/tsconfig.json
    - packages/terrarium/tests/formicarium-session.test.ts
    - packages/terrarium/tests/formicarium-catalog.test.ts
    - packages/terrarium/tests/formicarium-assets.test.ts
    - packages/terrarium/playwright.formicarium.config.ts
    - packages/terrarium/e2e/formicarium-terminal.spec.ts
    - packages/terrarium/e2e/formicarium-iframe.spec.ts
    - packages/terrarium/e2e/formicarium-serve.ts
    - packages/terrarium/e2e/host/formicarium/element.html
    - packages/terrarium/e2e/host/formicarium/iframe.html
    - scripts/stage-formicarium.mjs
    - scripts/assemble-pages.sh
    - web/terminal.mjs
    - mise.toml
    - .github/workflows/test-terrarium.yml
    - .github/workflows/test-e2e.yml
  components:
    - Catalog
    - Formicarium Session
    - Terminal Element
    - Page Adapter
    - Asset Staging
    - Integration Verification
    - Package Configuration
shallow:
  paths:
    - packages/terrarium/src/session.ts
    - packages/terrarium/playwright.config.ts
    - web/tools.json
    - scripts/build-pitchfork.sh
    - scripts/resolve-ref.sh
    - scripts/vendor-patched.sh
    - scripts/stage-web.sh
    - runtime/run-node.mjs
    - patches/tools/pitchfork-2.29.0.patch
    - fixtures/sessions/pitchfork-basic.txt
    - .github/workflows/pages.yml
    - biome.json
    - packages/terrarium/tests/
    - packages/terrarium/e2e/
    - runtime/
    - patches/
    - scripts/
    - fixtures/
    - web/
    - infra/
    - .github/
    - mise-tasks/
    - aidlc/
    - .codex/
    - .claude/
    - .agents/
    - web/index.html
    - .github/workflows/
```
