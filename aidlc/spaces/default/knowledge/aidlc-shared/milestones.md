# terrarium — milestones

1. **Build.** aube compiles for the chosen target, with a patch set that
   is as small as possible and documented item by item. *Done
   2026-10-02: aube links (debug build: 85 MB `aube.wasm`, 245 KB
   `aube.js`). Patches are in `patches/`, applied by
   `scripts/vendor-patched.sh`; the build environment is
   `scripts/emscripten-env.sh`.*
2. **Headless run.** `aube --version`, then `aube install` on a local
   fixture, runs under the terrarium runtime in Node.js, with output
   compared against a native run of the same command. *Done
   2026-10-02 for #1645: `fixtures/sessions/aube-1645.txt` runs
   `aube install`, `rm -rf node_modules`, `aube install
   --frozen-lockfile` and `aube list` on `fixtures/aube-local-deps`, and
   prints `filedep@0.0.0` / `linked@0.0.0` after the frozen install and
   in `aube list`, exactly as the PR describes. Not yet compared
   byte-for-byte with a native run.*
3. **Browser terminal.** The same session in a page: a fixture project
   is preloaded, the reader types the commands. *Done 2026-10-03 on
   localhost: `web/` (xterm.js over `runtime/session.mjs`, the same
   Session the Node.js runner uses) runs the four #1645 commands in the
   tab with the same output as under Node.js. Served by a plain static
   server that sends no COOP/COEP headers; coi-serviceworker made the
   page cross-origin isolated, so pthreads have `SharedArrayBuffer`.
   Confirmed on GitHub Pages the same day: <https://aletheia-works.github.io/terrarium/web/>
   is cross-origin isolated and reproduces #1645.*
4. **Any build, embeddable.** The page runs whichever aube build the
   URL names (`?ref=main`, `?ref=pr-1645`, …), and GitHub Actions builds
   and publishes them (`.github/workflows/pages.yml`). Another page can
   embed the terminal in an iframe and drive it with `postMessage`.
   *Done 2026-10-04 on localhost: two iframes, `?ref=v2.6.1` and
   `?ref=pr-1645`, given the four #1645 commands by their parent, report
   `0.0.0` and `1.0.0` / `2.0.0` from `aube list`. The same day the
   workflow built aube's `main` (259cd05f) on GitHub Actions in 13
   minutes and published it; the page on GitHub Pages opens it by
   default. That first build was 29.6 MB: on the runner `node` is on
   PATH, so aube-resolver's build script fetched and embedded its npm
   metadata primer (+9.4 MB of zstd data), which local builds without
   `node` never had. `scripts/build-aube.sh` now always passes an empty
   primer; rebuilt, `main` is 19.9 MB (gzip 7.2 MB), like v2.6.1.*

   A side-by-side page in terrarium itself (2026-10-03) was the wrong
   place for it: comparing a baseline with a fix is Vivarium's job.
   terrarium only makes the CLI usable on the web.
5. **An element, not only an iframe.** `<terrarium-terminal>` (in
   `web/terrarium.mjs`) puts the terminal straight into another page;
   the standalone page and the iframe entry are built on it. *Done
   2026-10-04 on localhost: a page on another origin with two elements,
   v2.6.1 and pr-1645, drove the four #1645 commands through `run()` and
   got `0.0.0` and `1.0.0` / `2.0.0`. The same check showed the limits of
   the iframe entry: from another origin it needs
   `allow="cross-origin-isolated"` plus CORP headers or a
   `credentialless` iframe.*
6. **A package.** The element and the Session move to
   `packages/terrarium` in TypeScript, as `@aletheia-works/terrarium`
   (the element, and `/session` without the DOM), with xterm.js as a
   dependency and its stylesheet built in instead of fetched from a CDN.
   *2026-10-04: 25 unit tests under `bun test` (the Session against a fake
   Emscripten FS, the catalog against a fake `fetch`), each Session test
   shown to fail when the hard-link or `/tmp` handling is broken; the
   bundled page and the cross-origin element test give the same #1645
   results as before.*
7. **Vivarium.** A Vivarium page reproduces #1645 by embedding two
   terrarium terminals, baseline and fix. Done in Vivarium, not here.
