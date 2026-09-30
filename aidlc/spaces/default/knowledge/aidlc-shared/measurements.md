# terrarium — measurements

2026-10-03, aube v2.6.1 with threads, on an otherwise idle Windows 11
machine. Release build: aube's own `[profile.release]` (thin LTO,
`codegen-units = 1`, `panic = "abort"`, so `-Zbuild-std=std,panic_abort`).

| | Debug | Release |
| - | ----- | ------- |
| `aube.wasm` | 113.6 MB | 19.9 MB (brotli 4.5 MB, gzip 7.3 MB) |
| `aube.js` | 283 KB | 120 KB (brotli 30 KB) |
| Page ready (localhost, Chromium) | 35 s, while another build ran | 0.26–0.32 s |

Seconds per command in the #1645 session, three runs each:

| | `aube install` | `aube install --frozen-lockfile` | `aube list` |
| - | -------------- | -------------------------------- | ----------- |
| Release, browser | 1.61 / 0.41 / 0.67 | 0.71 / 0.57 / 0.63 | 0.31 / 0.32 / 0.30 |
| Release, Node.js | 0.97 / 1.11 / 1.64 | 0.68 / 1.18 / 1.34 | 0.34 / 0.67 / 0.72 |
| Debug, Node.js | 6.75 / 4.36 / 5.28 | 2.41 / 1.81 / 2.35 | 0.76 / 0.67 / 0.77 |

Every command is a fresh instance, so each figure includes starting the
runtime and its pthread pool.

On GitHub Pages, which serves the wasm gzip-compressed (7.3 MB on the
wire) and sends no COOP/COEP headers, the page was ready in 1.27 s, of
which 0.94 s was the wasm download. The commands then took 2.66 / 1.29 /
0.60 s, while a release build was running on the same machine, so read
those as an upper bound.

