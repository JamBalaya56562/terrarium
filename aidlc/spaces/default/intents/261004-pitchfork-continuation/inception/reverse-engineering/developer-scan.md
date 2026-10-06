## Developer Code Scan Results

### Scan Coverage

- Snapshot source: `git:7b6abe574efc7eac5a860778eaf89ea7a873cdf2`; store generation `none`; permitted snapshot paths `./`.
- Repository-wide inventory was performed with `rg --files`; Minimal depth concentrates reading on the existing terminal and interrupted pitchfork integration. This is a **partial** deep scan, not a claim that every file was deeply understood.
- **Analyzed deeply**:
  - `packages/terrarium/src/catalog.ts`
  - `packages/terrarium/src/session.ts`
  - `packages/terrarium/package.json`
  - `packages/terrarium/playwright.config.ts`
  - `web/terminal.mjs`
  - `web/tools.json`
  - `scripts/build-pitchfork.sh`
  - `scripts/resolve-ref.sh`
  - `scripts/vendor-patched.sh`
  - `scripts/stage-web.sh`
  - `scripts/assemble-pages.sh`
  - `runtime/run-node.mjs`
  - `patches/tools/pitchfork-2.29.0.patch`
  - `fixtures/sessions/pitchfork-basic.txt`
  - `.github/workflows/pages.yml`
  - `mise.toml`
  - `biome.json`
- **Skimmed only**:
  - `packages/terrarium/src/terminal.ts`
  - `packages/terrarium/tests/`
  - `packages/terrarium/e2e/`
  - `runtime/`
  - `patches/`
  - `scripts/`
  - `fixtures/`
  - `web/`
  - `infra/`
  - `.github/`
  - `mise-tasks/`
  - `aidlc/`
  - `.codex/`
  - `.claude/`
  - `.agents/`

### Packages Found

- `@aletheia-works/terrarium` 0.1.0 — TypeScript library/browser custom element, public root and `/session` exports.
- `web/` — static standalone page and iframe entry built on the package, not a separate implementation.
- `runtime/` — C syscall adapter, Emscripten JavaScript additions and Node session runner.
- `patches/` and `scripts/` — Rust dependency/toolchain/tool patches and reproducible compilation/staging pipeline; tools' source repositories are external.
- `infra/github/` — OpenTofu repository configuration; directory inventory only.

### Build System

- Bun package manager, TypeScript compilation and Bun browser bundling; `mise.toml` owns local/CI tasks.
- `packages/terrarium/package.json`: generation embeds xterm CSS; build emits TypeScript distribution; typecheck covers source and tests; test runs `bun test tests`.
- `scripts/assemble-pages.sh`: copies static web assets, bundles `src/index.ts` with a deployment version, stamps module URLs, emits a redirect root page.
- `scripts/build-pitchfork.sh`: determines nightly Rust from the std patch filename, initializes Emscripten threads, applies the newest pitchfork tool patch and exact-version crate patches, runs cargo release `-Zbuild-std=std,panic_abort` for `wasm32-unknown-emscripten`, copies JS/Wasm output. This is source evidence; clean rebuild remains unverified.
- `scripts/vendor-patched.sh`: matches patch versions against Cargo.lock, copies registry source into `.vendor/`, emits `[patch.crates-io]` entries and distinct keys for duplicate crate versions.
- Pages resolve/build/store/site/deploy jobs resolve each tool's default or explicit ref, compile a tool matrix, record build provenance, store artifacts on `builds`, assemble/deploy the static site. `web/tools.json` is the tool registry.

### APIs Discovered

- Catalog: `catalog(base, version)`, `choose(all, {tool, ref})`, `fetchJson`, `versioned`, `describe`; `Choice.catalog` exposes all tools/builds to the page. JSON contracts: `tools.json`, `dist/builds.json`, fixture path-to-text maps.
- Session: `new Session({tool, write, cwd, env})`, `seed(files)`, `run(line): Promise<number>`, exported disk/FS/tool interfaces and `splitArgs`. One fresh Emscripten instance per CLI command; session disk is restored in preRun and saved onExit. Files, directories, symlinks and shared-inode hard links are represented; `/dev`, `/proc`, `/tmp` are excluded from saved disk.
- Session builtins are `cd`, `pwd`, `rm`, `ls`, `cat`; other unknown commands report 127. This is directly visible in `src/session.ts`, runtime execution is separately evidenced below.
- Custom element surface (skim): `<terrarium-terminal>`, `chooseBuild`, ready/run/focus/transcript and `terrarium-ready`, `terrarium-exit`, `terrarium-error` details. `src/terminal.ts:110-133` loads tool-named `.js` and `.wasm`; `:222-286` bootstraps fixture and Session.
- Page URL: tool/ref/fixture/cwd/run/embed/origin. Tool switch resets ref/fixture/cwd/run; dropdown only lists tools with published builds and hides when fewer than two exist (`web/terminal.mjs`, `showHeader`).
- Iframe messages: `terrarium:ready`, `terrarium:exit`, `terrarium:error` outbound; `terrarium:run` inbound. `web/terminal.mjs` checks parent source and resolved parent origin; no wildcard target origin.
- No application HTTP server endpoints discovered. E2E fixture server and static fetches are infrastructure, not server-side tool execution.

### Frameworks & Libraries

- Manifest constraints, not assertions about currently installed versions: xterm `^6.0.0`, FitAddon `^0.11.0`, Playwright `^1.63.0`, TypeScript `^7.0.2`, Bun types `^1.4.2`; Node >=24, Bun >=1.2.0.
- Emscripten CI version 6.0.10; Rust nightly selected by `rust-std-nightly-2026-10-01.patch`; Rust CLI source selected by external ref/commit.
- Patch inventory: dirs 6/7, if-addrs 0.15.0, interprocess 2.4.4, reqwest 0.13.1, ring 0.17.14, libc 0.2.186, mio 1.2.2/1.2.3, nix 0.31.3, tokio 1.53.1 and Rust std. Their upstream dependency graph is not reconstructed from an external Cargo.lock here.

### Test Coverage

- Unit directories: `packages/terrarium/tests/`, Bun test with fake Emscripten FS/tool. Source test names cover catalog defaults/selection/errors/cache/retry and Session quoting/builtins/env/cwd/UTF-8/disk persistence/hard links/symlinks/fresh instances.
- Browser directory: `packages/terrarium/e2e/`; Playwright Chromium, Firefox and WebKit, one worker; same-origin page, cross-origin custom element, non-isolated error and iframe postMessage cases.
- `rg -n 'test\\(|pitchfork|aube' packages/terrarium/e2e/terminal.spec.ts` showed six aube-oriented test declarations and no pitchfork-specific test. `mise.toml` `ci:e2e` fetches only v2.6.1 before staging/building/running the browser suite. Pitchfork browser coverage remains unverified and needs an explicit acceptance check.
- Recorded earlier in this same workflow by the conductor: direct Bun `test tests` returned 25 pass, 0 fail, 57 expect calls, 2 files. No coverage percentage was measured.
- Recorded earlier in this same workflow: `TERRARIUM_CWD=app node runtime/run-node.mjs C:/Users/Jam/.tem-pf/wasm32-unknown-emscripten/release/pitchfork.js fixtures/pitchfork-basic fixtures/sessions/pitchfork-basic.txt` exited 0; output showed version 2.29.0, fixture api/worker entries, add db/remove worker persisted in config, status api available, interval set/get 5s. This is inherited current-session observation, not a new run by this link. Browser equivalence remains unverified.
- Runner caution: `runtime/run-node.mjs` prints a nonzero command code but does not set process exit status. Future acceptance must check individual command results/output, not only runner process exit 0.

### Code Quality Indicators

- Lint: Biome root config and `mise` JS/TOML/Markdown/shell/actions checks; action SHA pins and explicit permissions exist in Pages workflow. Full lint status is unverified.
- `biome.json` excludes aidlc and .claude but does not exclude new .codex/.agents setup. Whether setup additions affect lint is unverified; keep setup changes separate as the approved intent requests.
- CI workflows present: package, E2E, polyglot lint, autofix, Pages, npm/JSR publish, releases, commitlint and repository infrastructure. Non-Pages workflows were inventoried, not fully audited.
- Documentation exists at root/package README and space knowledge; interface comments explain filesystem/process model and URL/event/message contracts.
- No runtime application source was modified by this scan; only this handoff artifact is produced.

### Technical Debt Signals

- Verification gap: Node success is not proof of browser pthread/service-worker behavior; need pitchfork page/custom element/iframe acceptance evidence as required by intent.
- Reproducibility gap: build script selects latest pitchfork patch without matching requested source version. Patch compatibility with refs other than v2.29.0 is unverified; current intent targets v2.29.0 only.
- Retry caveat in build script: tool patch and crate vendoring are guarded by a Cargo.toml marker added last. Interrupted partial patching behavior is unverified; avoid claiming idempotency without a test.
- Tool patch adjusts build-script native link behavior, LAN-interface cfg, supervisor ioctl/setgroups/initgroups portability, and fallback boot manager method; it does not implement a browser supervisor. Supported scope remains supervisor-free commands only.
- Executable bit for new `scripts/build-pitchfork.sh` must be checked/fixed with jj before PR; conductor earlier observed 100644. No mode mutation here.
- Clean CI build, local typecheck/build/lint, staged pitchfork browser artifacts, and browser regression evidence remain outstanding. Existing aube regression must continue passing.

## Handoff Summary

- **Intent-relevant finding**: existing architecture already separates generic Session/catalog/element from tool-specific compilation. Pitchfork registry, build script, tool/crate patches, fixture transcript, page selection and matrix workflow are present; focus implementation on remaining compatibility and verification rather than a new architecture.
- **Risks / follow-up**: preserve honest partial deep scope despite root-wide inventory; architect must not claim `kind: full` or analyzed `./`. Retain the runner exit-code caveat and the aube-only browser test gap. Use observed command outputs and named tests for acceptance; unsupported supervisor/network execution is outside approved scope. Keep AI-DLC setup change separate from pitchfork PR.
