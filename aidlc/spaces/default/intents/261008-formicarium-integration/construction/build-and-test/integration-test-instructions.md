# Integration Test Instructions

## 要件による追加確認

MinimalだがFR3/NFR2の明示要件により専用とlegacyの全3browserを実行する。Playwright依存はfrozen install済みとし、TERRARIUM_BUNはmise which bun、TERRARIUM_SITE_DIRは新出力の絶対パス。mock runtimeは使わない。

packages/terrariumから:

- `mise exec node@26 -- bun x playwright test --config playwright.formicarium.config.ts e2e/formicarium-terminal.spec.ts e2e/formicarium-iframe.spec.ts --workers=1 --retries=0`
- `mise exec node@26 -- bun x playwright test --config playwright.config.ts e2e/terminal.spec.ts e2e/pitchfork.spec.ts --workers=1 --retries=0`

全Chromium/Firefox/WebKitを対象とする。専用45caseはskipなし、legacyは既存Chromium-only credentiallessの2skipを成功に含めない。source、candidate全ファイルinventory、browser versionと結果を保存する。remote CI、実Pages/service-worker、実Safariは要求範囲外。
