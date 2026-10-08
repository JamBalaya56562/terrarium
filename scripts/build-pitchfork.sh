#!/usr/bin/env bash
# usage: build-pitchfork.sh <pitchfork source dir> <out dir>
# Release build of the pitchfork CLI for the browser terminal, with threads:
# apply terrarium's patch to pitchfork itself (patches/tools/pitchfork-*.patch,
# the newest one), point the source at terrarium's patched crates, patch the
# toolchain's std, build, and copy pitchfork.js and pitchfork.wasm to
# <out dir>. Only the commands that do not need pitchfork's supervisor are
# meant to work. Needs what build-aube.sh needs. CARGO_TARGET_DIR defaults
# to ~/.tem-pf.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
src=$(cd "$1" && pwd)
mkdir -p "$2"
out=$(cd "$2" && pwd)
toolchain=$(basename "$root"/patches/toolchain/rust-std-*.patch .patch)
toolchain=${toolchain#rust-std-}
target=${CARGO_TARGET_DIR:-$HOME/.tem-pf}
cargo=${CARGO:-cargo}
version=$(awk '/^version = / { gsub(/"/, "", $3); print $3; exit }' "$src/Cargo.toml")
tool_patch=$(printf '%s\n' "$root"/patches/tools/pitchfork-*.patch | sort -V | tail -1)

if [[ -f "$root/patches/tools/pitchfork-$version.patch" ]]; then
  tool_patch="$root/patches/tools/pitchfork-$version.patch"
fi

TERRARIUM_THREADS=1 . "$root/scripts/emscripten-env.sh"
"$root/scripts/patch-rust-src.sh"

if ! grep -q '^# terrarium-patches$' "$src/Cargo.toml"; then
  echo "applying $(basename "$tool_patch")"
  # A failed vendor step can leave the tool patch applied on a retry.
  # Force the requested direction: batch mode can silently reverse a dry run.
  if ! (cd "$src" && patch -p1 --binary --force --reverse --dry-run --quiet) <"$tool_patch"; then
    (cd "$src" && patch -p1 --binary --force --forward) <"$tool_patch"
  fi
  (cd "$src" && "$cargo" "+$toolchain" fetch)
  vendor_block=$("$root/scripts/vendor-patched.sh" "$src")
  { echo; echo '# terrarium-patches'; printf '%s\n' "$vendor_block"; } >>"$src/Cargo.toml"
fi
sed -n '/^# terrarium-patches$/,$p' "$src/Cargo.toml"

start=$(date +%s)
(cd "$src" && "$cargo" "+$toolchain" build --release -Zbuild-std=std,panic_abort \
  --target wasm32-unknown-emscripten --bin pitchfork --target-dir "$target")
echo "built in $(($(date +%s) - start)) s"
cp "$target"/wasm32-unknown-emscripten/release/pitchfork.{js,wasm} "$out/"
ls -la "$out"
