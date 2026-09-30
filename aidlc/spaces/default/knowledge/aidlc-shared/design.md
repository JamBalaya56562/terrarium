# terrarium — design

Status: draft. Decisions below were made in the design discussion;
everything under [Open questions](#open-questions) is still open and
should be settled by measurement, not argument.

Related notes in this directory: [portability](portability.md) (does
the approach scale past one tool), [build and deployment](build-and-deploy.md),
[milestones](milestones.md), [measurements](measurements.md), and
[research/cheerpx-oss](research/cheerpx-oss.md) (the alternative route).

## Goal

Run a specific CLI tool in the browser from a terminal, with its real
output, so that a bug in that tool can be reproduced as the session a
user would actually type.

First target: **aube** (a Node.js package manager written in Rust).
First milestone: an offline `aube install` / `aube list` of a project
whose dependencies are all local (`file:` and `link:`), which is enough
to reproduce aubepkg/aube#1645 and #1643.

## Decisions

- **Runs entirely in the browser.** No server executes anything. A
  reader who opens the page is running the tool on their own machine.
- **One tool, not a distribution.** terrarium is not a Linux in the
  browser. There is no general shell and no arbitrary binaries. The
  terminal accepts the target CLI plus a handful of built-in commands a
  reproduction needs (`ls`, `cat`, `rm -rf`, `cd`), implemented by the
  terminal itself.
- **No emulator, no kernel.** The CLI is compiled to WebAssembly from
  source. terrarium provides the system calls it makes, and nothing
  more. This is the opposite trade-off from WebVM (an x86 JIT plus a
  Linux syscall layer for unmodified binaries) and container2wasm (a
  full-system CPU emulator booting a kernel).
- **Its own repository**, separate from Vivarium. Vivarium consumes it
  for terminal-style reproduction pages.
- **A CLI on the web, not a bug-reproduction page.** terrarium's page is
  one terminal running one build of the tool. Which build is a URL
  parameter (`?ref=main`, `?ref=pr-1645`), and the page can be embedded
  and driven from its parent. Putting a baseline next to a fix, and
  telling the reader what to look for, is Vivarium's job.
- **Several ways in, one implementation.** The terminal is a custom
  element, `<terrarium-terminal>` in `web/terrarium.mjs`; the page at
  `web/` is one such element configured from its URL, and the iframe
  entry is that page. Another page can use the element directly, without
  an iframe: in a cross-origin isolated page a cross-origin iframe needs
  CORP headers (GitHub Pages cannot send them) or a `credentialless`
  iframe (Chromium only), while the element only needs CORS, which
  GitHub Pages sends. The element's pthread workers start from a `blob:`
  URL of the tool's script, since a worker cannot start from another
  origin's URL.

## Non-goals (for now)

- Network access. Registry fetches, TLS, and DNS are out of the first
  milestone; the CLI gets an error if it tries.
- Running Node.js, and therefore lifecycle scripts (`postinstall` etc.).
- Tools other than aube. The second tool is chosen after the first one
  works, and will show which parts of the runtime generalise.

## Architecture (proposed)

```text
browser page
├── terminal UI            — renders the session; built-in ls / cat / rm / cd
├── terrarium runtime      — implements the imports the CLI's wasm module uses
│   ├── filesystem         — in-memory tree with symlinks, hard links, locks
│   ├── process            — argv, env, cwd, exit code, stdio wired to the terminal
│   └── (later) threads, clock, random, network stubs
└── aube.wasm              — aube compiled for the runtime's target
```

The target is `wasm32-unknown-emscripten`, for the reasons in
[portability.md](portability.md).

The first runtime is Emscripten's own JavaScript runtime, which already
has an in-memory filesystem with symlinks and pthreads on Web Workers.
terrarium fills its gaps in `runtime/`:

- **System calls Emscripten leaves unimplemented.** Emscripten defines
  them as weak C stubs that print "unsupported syscall", so a JavaScript
  library alone cannot replace them: `runtime/syscalls.c` gives each a
  strong definition that forwards to `runtime/libterrarium.js`. So far:
  `socketpair` (AF_UNIX), built from two crossed PIPEFS pipes; tokio's
  signal driver needs it at startup. Under pthreads the JavaScript side
  must be marked `__proxy: 'sync'`, since the filesystem lives on the
  main thread and the tool's `main` runs on a worker.
- **Hard links.** MEMFS has none, and aube's store and linker are built
  on them. `libterrarium.js` adds a `link` node op; see the comment there
  for how, and for the one known gap (renaming the second name of a
  linked file moves the first).
- **File locks in std.** Rust's `File::lock*` returns "not supported" on
  targets it does not list. `patches/toolchain/` adds Emscripten, whose
  `flock` always succeeds — right for a single process.

Threads are real: Emscripten pthreads, which needs nightly Rust with
`-Zbuild-std` and `+atomics` (`TERRARIUM_THREADS=1` in
`scripts/emscripten-env.sh`). With `-sPROXY_TO_PTHREAD` the tool's `main`
runs on a worker, so blocking calls never block the page.

**One process per command, one disk per session.** The terminal owns the
disk. Each command the reader types starts a fresh instance of the tool
— a new process — whose in-memory filesystem is seeded from the disk and
written back when it exits, symlinks and hard links included.
`runtime/session.mjs` implements this once; `runtime/run-node.mjs` runs
it under Node.js and `web/terminal.mjs` in the browser.

If startup or size measurements show Emscripten's runtime is the
bottleneck, terrarium replaces it with a narrower one that implements
only the system calls the target tools make; the compiled tools would
not change.

## Open questions

- **Upstream changes.** Would `mio`, `nix`, `tokio` and `interprocess`
  accept Emscripten support? Each one accepted is a patch terrarium no
  longer carries.
- **Processes.** pitchfork needs a supervisor process and IPC. Is that in
  scope for terrarium at all, or does terrarium stay with tools that run
  as a single process?
- **Startup.** No target number yet. Measure download size, compile
  time, and time to first output at each milestone, and compare with
  WebVM on the same machine.

## Prior art

- [WebVM](https://webvm.io/) / CheerpX — x86 JIT to wasm plus a Linux
  syscall emulation layer; runs unmodified Debian, loads disk blocks on
  demand.
- [BrowserPod](https://labs.leaningtech.com/blog/browserpod-20) —
  applications compiled to wasm on a Linux syscall layer; implements
  `fork` with compiler-injected instrumentation. The closest design to
  terrarium's.
- [container2wasm](https://github.com/ktock/container2wasm) and
  [qemu-wasm](https://ktock.github.io/qemu-wasm-demo/) — full-system
  emulation of a container image or a board.
- [Linux-Wasm](https://joelseverin.github.io/linux-wasm/) — the Linux
  kernel itself ported to wasm.
- Vivarium's `aube-1645` recipe — aube's lockfile reader compiled to
  `wasm32-wasip1` with one patch to aube-util, running on
  `@bjorn3/browser_wasi_shim`. The starting point for milestone 1.
