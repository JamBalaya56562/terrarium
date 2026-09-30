# Research: an open-source CheerpX

Status: research notes, 2026-10-03. Nothing here is decided.

The idea: instead of compiling each CLI to wasm (the route in
[`design.md`](../design.md)), run **unmodified Linux x86 binaries** in the browser
the way WebVM / CheerpX does — emulate the instructions and the Linux
system calls in user mode, no kernel boot, with an x86→wasm JIT. One
engine would then run any tool, with no per-tool build.

Labels: **[verified]** read in code or run; **[doc]** from a project's
own documentation; **[estimate]** judgement.

## CheerpX itself

- Community Edition is free for personal and FOSS use, but cannot be
  self-hosted (loaded from Leaning Technologies' CDN), cannot be
  redistributed, and needs attribution. Older pages say organisations
  need a licence; ask Leaning Technologies before relying on it for
  aletheia-works. [doc]
- 32-bit x86 only; 64-bit and ARM are on the roadmap. [doc]
- WebVM adds COOP/COEP from a service worker, so it runs on GitHub
  Pages, the same trick terrarium uses. Disk images are ext2 split into
  128 KB chunks loaded on demand, up to 950 MB. [doc]

## aube on 32-bit x86

`cargo check` of aube v2.6.1 for `i586`/`i686-unknown-linux-gnu`
(Rust 1.98.0), without a container: [verified]

- `sonic-simd` 0.1.4 fails on i686: it picks the SSE2 backend by
  `target_feature = "sse2"`, and `sse2.rs` imports `core::arch::x86_64`.
  Reported upstream as cloudwego/sonic-rs#228 (not by us); a fix is
  claimed in a branch, not merged. i586 (no SSE2) avoids it.
- `sonic-rs` 0.5.10 fails on any 32-bit x86, also on its `main`:
  `MetaNode { *const Shared, u64 }` is asserted to be the size of
  `Value` (16 bytes), but i386 aligns `u64` to 4, making it 12.
  `#[repr(C, align(8))]` fixes the check. Not reported upstream yet.
  wasm32 and armv7 align `u64` to 8, so they are unaffected.
- Everything else that fails is a C library (no Linux C compiler on the
  host); a real build needs a container.

So aube under CheerpX needs at least one dependency patch (i586) or two
(i686), plus a 32-bit glibc compatible with the guest image.

### Building and running it [verified]

- Built in a `debian:buster` (amd64) container with `gcc-multilib`,
  Rust 1.98.0 and `--target i586-unknown-linux-gnu`, so it links the
  i386 glibc 2.28 of WebVM's Debian buster image. Buster's CMake (3.13)
  is too old for `libz-ng-sys`; an upstream CMake binary works. Release
  build: 44 min 42 s, 27 MB, needs at most `GLIBC_2.28`.
- Natively, in `i386/debian:buster`, it reproduces #1645: the frozen
  install and `aube list` print `0.0.0`. 64 / 45 / 10 ms per command.

### On CheerpX 1.3.9 (2026-10-03, localhost, WebVM's Debian image)

- The page boots in 0.4–4.4 s with coi-serviceworker supplying
  COOP/COEP; files go in through a `DataDevice` at `/data` (read-only,
  no exec bit, so binaries run via `/lib/ld-linux.so.2`). Copying 27 MB
  from `/data` into the IndexedDB overlay did not finish in a minute;
  reading it to `/dev/null` took about 1 s.
- A C probe compiled with the image's own gcc (2 min 40 s) behaves
  exactly as natively: pthreads, condvar, `eventfd`, edge-triggered
  `epoll`, `socketpair`, `FUTEX_WAIT_BITSET`.
- A Rust probe (tokio 1.53.1) passes `available_parallelism`, thread
  spawn, current-thread and multi-thread runtimes, `spawn_blocking`,
  signal registration, and create dir / write / metadata / hard link /
  symlink / rename / read_dir / `File::lock_shared` under `/tmp` and
  `/home/user`; with mimalloc as the global allocator too. (A first run
  had hung in its filesystem step; that did not reproduce.)
- **Why aube hangs.** `stat64(NULL)` and `fstatat64(fd, NULL)` do not
  return `EFAULT` on CheerpX: the console logs `Fault addr 0` and the
  whole VM stops (even a concurrent `sleep` never returns). CheerpX
  answers `statx` with `ENOSYS`, so glibc 2.28 emulates `statx` through
  `fstatat64`, and Rust std's availability probe
  `statx(0, NULL, 0, STATX_ALL, NULL)` — made after the first failing
  `statx`, i.e. the first stat of a missing file — reaches that path.
  aube stats `~/.npmrc` at startup. Found with an `LD_PRELOAD` tracer
  (last call before the stop) and a C probe that hangs on exactly the
  NULL-path cases.
- **Workaround:** an `LD_PRELOAD` shim whose `statx` returns `ENOSYS`
  makes std use `stat64` directly. With it the unmodified i586 aube
  reproduces #1645 on CheerpX (frozen install and `aube list` show
  `0.0.0`): `--version` 0.3–0.7 s, first `install` 1.8–5.7 s, frozen
  install 1.3–3.6 s, `list` 0.17–0.65 s (four page loads, page hidden).
- The first such run took 62 s for the first `install`; that did not
  reproduce in five later page loads, including one started right after
  a VM had frozen. Cause unknown.
- What `install` does that costs time on CheerpX: it runs
  `node --version` (the image has Node 10.24; 0.5–1.3 s per spawn; a
  `node-version` line in `.npmrc` skips it), and it resolves
  `registry.npmjs.org` / `npm.jsr.io` even with only `file:`/`link:`
  deps — there is no network, so those fail at once. CheerpX stores only
  the overlay in IndexedDB; disk blocks come over the WebSocket again on
  every page load.

## Prior art checked

No open-source project does both user-mode Linux emulation and an
x86→wasm JIT. [doc/verified]

### copy/v86 (BSD-2) — the JIT to learn from

Full-system emulator, 32-bit only; no long mode anywhere. [verified]

- Counts executed instructions per physical page; at 200,000 it
  compiles the page's entry points plus code reachable by direct jumps
  (at most 3 pages) into **one wasm module**.
- Wasm bytes are assembled by hand in Rust (`WasmBuilder`, ~1.3k lines,
  ISA-neutral), compiled asynchronously by JS, and installed into a
  shared function table; generated code imports the main module's
  memory and calls interpreter helpers as imports.
- Registers live at fixed addresses, loaded into wasm locals on entry;
  memory accesses do an inline TLB check with a slow-path call.
- Invalidation per physical page when code pages are written.
- No module-to-module chaining and no flag elision yet.
- JIT-related Rust is ~15k lines, ~7.8k of them the 32-bit x86
  translation, which would have to be rewritten for x86-64.

### jart/blink (ISC) — the emulator core to build on

x86-64 user-mode Linux emulator in C, 7.6k stars. [verified]

- Mature decoder and ALU/SSE semantics, software MMU, 178 system calls.
- Guest threads map to host pthreads (`SysClone` → `SysSpawn`).
- Its JIT copies the native machine code of compiled C micro-ops
  (x86-64/arm64 hosts only); that trick is impossible in wasm. Path
  formation and the RIP→hook table are reusable; a wasm backend would
  install generated modules into the function table, v86-style.
- On wasm32 Blink cannot use its fast "linear" memory mode and falls
  back to page-table lookups, which its README puts at ~4× slower; no
  JIT is another ~10× [doc].
- Gaps that matter for aube, upstream, even on native hosts:
  **no `eventfd`** (mio's waker on Linux), **`FUTEX_WAIT_BITSET`
  returns EINVAL** ("will be supported soon"; Rust's std uses it), and
  `epoll` only as a passthrough to a host that has it. Both of the first
  two would be upstream contributions in their own right.
- Upstream has scattered `__EMSCRIPTEN__` ifdefs but no wasm build.

### webix / portabox — do not use

`AnEntrypoint/webix` (MIT) and `AnEntrypoint/portabox` (Apache-2.0)
wrap a heavily patched Blink fork (`lanmower/blink`) built with
Emscripten. [verified]

- **portabox's history carried malware**: commit 8021d2f (2026-09-23)
  removes a `.vscode` task that ran an obfuscated "font" on folder open
  and fetched a second stage from an Ethereum address; the same dropper
  was in the Blink fork. A `folderOpen` task key is still in portabox's
  `.vscode/settings.json` at HEAD. Never open, install or run them.
- Even setting that aside: demo-grade (busybox, apk), fork returns
  ENOSYS, guest threads untested, README claims ("unmodified upstream
  Blink", "no JS VFS") are false.

## What the two routes share

Running aube on Blink-in-wasm hits the same browser gaps the Emscripten
route already had to fill — `socketpair`, hard links (MEMFS has none),
`flock` (Emscripten fakes it) — plus Blink's own `eventfd`, futex and
epoll gaps. The runtime layer terrarium built (`runtime/`) is the start
of the in-browser "kernel" either route needs.

## If this route is taken: first milestone [estimate]

1. A clean Emscripten build of **upstream** jart/blink, interpreter
   only, in a Worker under Node.js and in a COOP/COEP page.
2. Its pass test: a small static-musl x86-64 Rust binary that starts a
   multi-thread tokio runtime (timer, `UnixStream::pair`), runs a 4-way
   rayon `par_iter` with Mutex/Condvar, and creates, hard-links,
   symlinks and flocks files.
3. That needs `eventfd2`, `FUTEX_WAIT_BITSET` and edge-triggered epoll
   in Blink, and the filesystem gaps closed in the browser.
4. Then run static-musl aube on it and measure — the number that decides
   whether a JIT is needed.

JIT effort, from v86's scope: a "call the interpreter handler per
instruction" wasm backend in 4–8 weeks; one that inlines common integer
ops, has a TLB fast path and invalidation, a further 4–8 months;
CheerpX-level, open-ended. [estimate]
