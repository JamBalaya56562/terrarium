# 解析時点

- 日付: 2026-10-05（Asia/Tokyo）。
- Intent: `261004-pitchfork-continuation`、Minimal、Brownfield。
- 開発者引継ぎ: `aidlc/spaces/default/intents/261004-pitchfork-continuation/inception/reverse-engineering/developer-scan.md`。
- 事前 snapshot: paths `./`、store generation `none`、source `git:7b6abe574efc7eac5a860778eaf89ea7a873cdf2`。
- 一覧は広く、深い読取は下記17ファイル。未コミット変更を含むため単一 commit の完全解析ではない。

## Scope of Analysis

```yaml
scope_version: 1
kind: partial
intent: 261004-pitchfork-continuation
fingerprint: 5e4127a05036fe6f576e657b9fe5da72026bb743
analyzed:
  paths:
    - packages/terrarium/src/catalog.ts
    - packages/terrarium/src/session.ts
    - packages/terrarium/package.json
    - packages/terrarium/playwright.config.ts
    - web/terminal.mjs
    - web/tools.json
    - scripts/build-pitchfork.sh
    - scripts/resolve-ref.sh
    - scripts/vendor-patched.sh
    - scripts/stage-web.sh
    - scripts/assemble-pages.sh
    - runtime/run-node.mjs
    - patches/tools/pitchfork-2.29.0.patch
    - fixtures/sessions/pitchfork-basic.txt
    - .github/workflows/pages.yml
    - mise.toml
    - biome.json
  components:
    - Catalog
    - Session
    - Page Adapter
    - Build Distribution
    - Node Runner
shallow:
  paths:
    - packages/terrarium/src/terminal.ts
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
```
