# 公開RC受入れのFocused scan

## Developer Code Scan Results

### Exact Snapshot Re-read

The original directory snapshot was refused by publication coverage matching. Root took a fresh snapshot over the exact 20 individual deep paths listed below: store_generation sha256:72007b143a712a8f7e6ff05857253a523474dbacc075065621467a9419e461ea; source_fingerprint git:a457c5b41a0069e8361c3e861167e62d1104e69c. This developer then re-read each actual source file with a separate plain cat command; all 20 returned exit 0. Re-evaluated dependency/staging/runner/spec/task behavior remains as described; candidate content and deep coverage remain unchanged. This is a new post-snapshot re-read, not a fingerprint substitution onto an unrepeated scan.

### Scan Coverage

- **Analyzed deeply** (20 individual paths, within pre-scan snapshot):
  - packages/terrarium/src/formicarium-session.ts
  - packages/terrarium/src/catalog.ts
  - packages/terrarium/src/terminal.ts
  - packages/terrarium/package.json
  - packages/terrarium/README.md
  - packages/terrarium/tests/formicarium-session.test.ts
  - packages/terrarium/tests/formicarium-assets.test.ts
  - packages/terrarium/playwright.formicarium.config.ts
  - packages/terrarium/e2e/formicarium-terminal.spec.ts
  - packages/terrarium/e2e/formicarium-iframe.spec.ts
  - packages/terrarium/e2e/formicarium-serve.ts
  - scripts/prepare-formicarium.mjs
  - scripts/stage-formicarium.mjs
  - scripts/assemble-candidate.mjs
  - scripts/candidate-transaction.mjs
  - scripts/assemble-pages.sh
  - integration/formicarium-inputs.json
  - runtime/run-node.mjs
  - web/terminal.mjs
  - mise.toml
- **Skimmed only**: remaining package source/tests, script/runtime/web surfaces; bun.lock relevant dependency entries; prior CodeKB preserved as historical. Prior unverified analyzed paths are demoted in the staged timestamp.
- **Left out**: ignored .vendor/.site, node_modules, dist, test-results, generated source/assets, tool caches; AI-DLC install/runtime/workspace is excluded from application scan. No generated/dependency content read.

### Packages Found

- @aletheia-works/terrarium 0.1.0 — TypeScript browser element and legacy Session library; internal adapter consumes formicarium/browser.

### Build System

- **Type**: Bun, tsc, mise, Node candidate assembly.
- **Config Files**: package.json, mise.toml, playwright.formicarium.config.ts; exact source inventory above.
- **Build Dependencies**: fixed inputs and installed package → staging → candidate transaction/site bundle. Legacy tool builds remain separate.

### APIs Discovered

- Internal adapter create/run/reset/dispose, guest resolver, public Browser Session APIs.
- Browser element ready/run/transcript/focus and events; iframe exact-origin commands/notifications.
- prepareInputs verifies exact fixed16file identity; candidateTransaction validates history and inventories.

### Frameworks & Libraries

- Declared xterm ^6.0.0, addon-fit ^0.11.0, Playwright ^1.63.0, TypeScript ^7.0.2, Bun types ^1.4.2. mise Node26.11.1; actual installed versions are not confirmed by declaration.

### Test Coverage

- **Test Directories**: packages/terrarium/tests and e2e.
- **Test Frameworks**: Bun unit; Playwright Chromium/Firefox/WebKit, element10 plus iframe5 per browser, 45 cases total.
- **Coverage Config**: dedicated config has workers1/retries0/trace failure and serviceWorkers:block; no percentage threshold in read config.
- Read fake public Session adapter tests and synthetic staging fixtures; no real Node guest acceptance run/command in this focused configuration.

### Code Quality Indicators

- **Linting**: mise Biome/Tombi/rumdl/ShellCheck/actionlint tasks.
- **CI/CD**: ci:terrarium/ci:e2e task wiring read; workflows preserved but not deeply re-read.
- **Documentation**: package README distinguishes local pack from published RC; preserves iframe/isolation/transaction constraints.

### Technical Debt Signals

- package.json dependency and bun.lock entry use file tarball, not npm RC registry installation.
- integration descriptor tarball SHA256 ebe7e5cf6efcd26914e9016ebbd31df1d59812f5cfcfc71b874672c01109dc35 differs from required8334d7f14c31109e5be3ec90147aa02105d8d839c4c79eccc1c25cb88eabbb3a. Installed package24files/manifest checks require matching public RC identity after switch.
- stage receipt explicitly local-pack-only, not published acceptance proof.
- runtime/run-node.mjs uses legacy Emscripten Tool and does not propagate individual command failure to process exit; insufficient for formicarium Node acceptance.

## Handoff Summary

- **Intent-relevant finding**: exact npm acquisition/installed identity and compatible descriptor/manifest must be connected before rerunning tests. No npm fetch/test/install done in this scan.
- **Existing command routes**: mise run terrarium:formicarium-unit; mise run terrarium:formicarium-build; mise run terrarium:formicarium-e2e. Last runs dedicated15cases in all3browsers against .vendor/site-formicarium. public Node real guest test requires locating/reusing an authorized runner or a minimal verification harness in later stage.
- **npm candidate commands (unexecuted)**: mise exec -- npm view @aletheia-works/formicarium@0.1.0-rc.1 version dist --json; mise exec -- npm pack @aletheia-works/formicarium@0.1.0-rc.1 --json --ignore-scripts --pack-destination <evidence directory>. Install through Bun with exact registry dependency and preserve lockfileVersion1.
- **Risks / follow-up**: Preserve original local inputs/candidates and unrelated jj changes. Record registry integrity and independent SHA256, bind actually installed files to packed bytes; browser spec expected pitchfork2.30.0 belongs to fixed guest input, not latest legacy CI. Firefox/WebKit cross-origin iframe refusal is expected. No publish/push/PR. Old tests in preserved CodeKB are historical, not this RC success.
