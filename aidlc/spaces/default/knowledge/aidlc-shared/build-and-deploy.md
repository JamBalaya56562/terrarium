# terrarium — build and deployment

## Build environment (Windows)

One-time setup, not per tool: emsdk (installed from its own repository —
the mise `emsdk` plugin fails on Windows), CMake and Ninja for
`libz-ng-sys`, `CC`/`CXX`/`AR_wasm32_unknown_emscripten` pointing at
`emcc.exe` (cc-rs otherwise calls an `emcc.bat` that emsdk no longer
ships), `CMAKE_TOOLCHAIN_FILE_wasm32_unknown_emscripten` and
`CMAKE_GENERATOR=Ninja`, and a short `--target-dir`: CMake's
`try_compile` fails under Windows' path-length limit otherwise.

## Building any aube commit

`scripts/build-aube.sh <aube source> <out>` builds one aube source tree:
it appends `scripts/vendor-patched.sh`'s `[patch]` block to its
`Cargo.toml`, patches the toolchain's std, and builds release with
threads. `scripts/stage-web.sh aube <name> <out>` then copies the build
to `web/dist/aube/<name>/` and records it in `web/dist/builds.json`;
`scripts/resolve-aube-ref.sh <ref>` turns a branch, tag, commit or
`pr-<n>` into the name and the commit. CI runs the same scripts. Two
things bit on the first try:

- **Sharing the target directory** between the baseline and the fix
  reuses the dependencies, but cargo also reused the baseline's compiled
  aube crates (same names, same version), so the fix failed to compile
  against a stale `aube-codes`. Delete
  `<target>/{release,wasm32-unknown-emscripten/release}/build/aube*`
  before switching sources.
- **A release link must not lose its parent process.** When the shell
  that started cargo is killed — a tool timeout did it twice — the link
  carries on, but the `node` that emcc starts for its JS passes fails
  with `0xC0000142` and the build is lost. On this machine a release
  build of aube takes 26–41 minutes; run it where nothing will kill it.

## Deployment

`.github/workflows/pages.yml` deploys the site with `actions/deploy-pages`
(the Pages source is "GitHub Actions", set in `infra/github/main.tf`). The
site is `web/`, the `web/terrarium.mjs` that `scripts/assemble-pages.sh`
bundles from `packages/terrarium`, the fixtures, and the builds. Run by
hand with a `ref` the workflow builds that aube; every day it builds
`main` if `main` has moved; a push to `main` that touches the site
redeploys it.

The builds are build output and stay out of `main`: they live on the
`builds` branch (`builds.json` and `<tool>/<name>/`), which the workflow
rewrites as a single commit whenever it adds one, so old builds do not
pile up in its history. `scripts/load-builds.sh` puts them in `web/dist/`.
Until 2026-10-04 the site and the builds were both the `gh-pages` branch;
`load-builds.sh` falls back to it while `builds` does not exist.

From 2026-10-04 until the move to pull requests the push trigger had no
`paths` filter: `main` was then rewritten by force pushes whose before and
after commits share no ancestor, which GitHub cannot diff, so a `paths`
filter never matched.

GitHub Pages lets browsers cache every file for 10 minutes, so right
after a deploy a page could load a new `index.html` with a cached old
`terminal.mjs`; that broke the page once (2026-10-04). `assemble-pages.sh`
therefore stamps the deploy's version into the page's own URLs
(`terminal.mjs?v=…`, `terrarium.mjs?v=…`, and the version that the bundle,
built with `--define __TERRARIUM_VERSION__`, appends to `tools.json`, `builds.json` and
fixtures). A build's `.js` and `.wasm` are versioned by its `built_at`
instead, so they stay cached across deploys and a rebuild never pairs a
new `.wasm` with an old `.js`. `coi-serviceworker.js` keeps its URL, since
a new one would register a second service worker. The page works on a host that cannot set
headers because `web/coi-serviceworker.js` adds COOP/COEP from a service
worker and reloads once on the first visit. With every dependency already compiled,
the release build still took 26 minutes on this machine: optimising the
aube crate and running `wasm-opt` over the linked module.

## Publishing the package

`packages/terrarium` is published as `@aletheia-works/terrarium` to npm
and JSR by `.github/workflows/publish-terrarium.yml`, as vivarium
publishes its MCP server: OIDC trusted publishing with provenance, no
registry tokens. Bump `version` in both `package.json` and `jsr.json`,
merge, then push a tag `terrarium-v<version>`. The workflow builds, tests,
and skips a registry that already has that version.

npm's `"."` is `src/npm.ts`, which adds the global types for the element's
tag and events; JSR's `"."` is `src/index.ts` without them, because JSR
rejects global augmentation. The generated `src/generated/xterm-css.ts` is
gitignored, so `jsr.json` un-excludes it.
