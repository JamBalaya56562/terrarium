#!/usr/bin/env bash
# usage: build-aube.sh <aube source dir> <out dir>
# Release build of the aube CLI for the browser terminal, with threads: point
# the source at terrarium's patched crates, patch the toolchain's std, build,
# and copy aube.js and aube.wasm to <out dir>. Needs emsdk (see
# emscripten-env.sh) and the nightly toolchain patches/toolchain/ names, with
# rust-src and the wasm32-unknown-emscripten target (build scripts such as
# indexmap 1.x probe for std with its prebuilt std). CARGO_TARGET_DIR
# defaults to ~/.tem-aube-mt: keep it short on Windows, where CMake's
# try_compile otherwise hits the path-length limit.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
src=$(cd "$1" && pwd)
mkdir -p "$2"
out=$(cd "$2" && pwd)
toolchain=$(basename "$root"/patches/toolchain/rust-std-*.patch .patch)
toolchain=${toolchain#rust-std-}
target=${CARGO_TARGET_DIR:-$HOME/.tem-aube-mt}
cargo=${CARGO:-cargo}

TERRARIUM_THREADS=1 . "$root/scripts/emscripten-env.sh"
"$root/scripts/patch-rust-src.sh"

(cd "$src" && "$cargo" "+$toolchain" fetch)
if ! grep -q '^# terrarium-patches$' "$src/Cargo.toml"; then
  { echo; echo '# terrarium-patches'; "$root/scripts/vendor-patched.sh" "$src"; } >>"$src/Cargo.toml"
fi
sed -n '/^# terrarium-patches$/,$p' "$src/Cargo.toml"

# Ship aube-resolver without its metadata primer. When `node` is on PATH its
# build script fetches the top 2000 npm packuments and embeds them (about
# 9.4 MB, zstd-compressed, so gzip on the wire barely shrinks it); without
# `node` it embeds nothing. The primer only saves registry fetches, which
# terrarium has no network for, so always pass an empty one: the same build
# on every machine, and no network access while building.
empty_primer="$root/.vendor/empty-primer.rkyv.zst"
: >"$empty_primer"
if command -v cygpath >/dev/null; then empty_primer=$(cygpath -m "$empty_primer"); fi
export AUBE_PRIMER_PATH="$empty_primer"

# Another aube source shares crate names and versions with this one, and cargo
# reuses their build-script output; drop it so it is regenerated.
rm -rf "$target"/{release,wasm32-unknown-emscripten/release}/build/aube*

start=$(date +%s)
(cd "$src" && "$cargo" "+$toolchain" build --release -Zbuild-std=std,panic_abort \
  --target wasm32-unknown-emscripten -p aube --bin aube --no-default-features \
  --target-dir "$target")
echo "built in $(($(date +%s) - start)) s"
cp "$target"/wasm32-unknown-emscripten/release/aube.{js,wasm} "$out/"
ls -la "$out"
