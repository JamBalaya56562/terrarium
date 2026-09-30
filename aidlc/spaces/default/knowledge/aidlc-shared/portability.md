# terrarium — portability across tools

The deciding question for terrarium: if each new CLI needs its own port,
the project is not practical. The experiments below (2026-10-02,
`cargo check` only — nothing was linked or run yet) compare aube v2.6.1
(`-p aube --bin aube --no-default-features`) and pitchfork at 9f19e8dc
(`--no-default-features`).

## Crates that fail, per target

| Crate | Needs | `wasm32-wasip1` | `wasm32-unknown-emscripten` | after patches |
| ----- | ----- | --------------- | --------------------------- | ------------- |
| `socket2`, `fslock`, `signal-hook-registry` | sockets, locks, signals | aube, pitchfork | builds | builds |
| `os_pipe` | pipes | pitchfork | builds | builds |
| `tokio` (`full`) | threads, sockets, processes | aube, pitchfork | not reached | builds |
| `mio`, `nix` | event loop, POSIX wrappers | not reached | aube, pitchfork | builds |
| `crossterm` | terminal control | pitchfork | not reached | builds |
| C libraries (zstd, zlib-ng, aws-lc, ring, sqlite) | — | aube, pitchfork | build with emcc | build |
| `interprocess` | local sockets between processes | not reached | not reached | pitchfork |
| `rustls` (via `ring`) | a randomness source | — | pitchfork | pitchfork |
| `if-addrs` | network interfaces | pitchfork | pitchfork | pitchfork |

With the patches below, **the whole aube CLI passes `cargo check` for
`wasm32-unknown-emscripten` without a single change to aube's own
code.** pitchfork is down to three crates.

## Why Emscripten moves the needle

Most failures on `wasm32-wasip1` are not missing features in the tool.
They are crates that check `cfg(unix)` or a list of operating systems
and find WASI on neither side. Emscripten is `target_family = "unix"`,
so `socket2`, `fslock`, `signal-hook-registry` and `os_pipe` build
unchanged. The ones that still fail keep explicit lists of supported
operating systems, and Emscripten is simply not on them.

## The patches

Every change is "add `target_os = "emscripten"` to an existing list",
next to an OS with the same semantics, except two `libc` declarations:

| Crate | Change | Treated like |
| ----- | ------ | ------------ |
| `mio` 1.2.2 / 1.2.3 | lift the wasm `compile_error!`; `poll(2)` selector, pipe waker, `accept4`, the remaining lists (6 files, +12 −1) | cygwin |
| `nix` 0.31.3 | socket address lists: no `sun_len`, no `LinkAddr` (2 files, ±20) | cygwin |
| `tokio` 1.53.1 | depend on `socket2`; lift the wasm `compile_error!`; peer credentials (3 files, +6 −3) | hurd, vita (no processes) |
| `libc` 0.2.186 | declare `pthread_sigmask`, `sigwait` (+2) | — already in 0.2.189 |

Because the work lands in shared crates, it carries over: the `mio` /
`nix` / `tokio` changes made for aube are exactly what moved pitchfork
forward. Each further tool should need fewer new patches, not a new
port. All of them are small enough to propose upstream, which would
remove them from terrarium entirely.

What remains is tool-specific in a real sense. pitchfork's
`interprocess` rejects Emscripten by name, and pitchfork *is* inter-process
communication between a CLI and a supervisor; getting that to run needs
processes in the runtime, not a cfg change.

## Not yet known

`cargo check` proves the code type-checks. It says nothing about
linking (whether Emscripten's libc provides every symbol), or about
running: threads need `SharedArrayBuffer`, blocking calls need a worker
or Asyncify, and aube's linker needs symlinks and hard links.

