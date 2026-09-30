#!/usr/bin/env bash
# usage: vendor-patched.sh <project-dir>
# For each crate in patches/ whose exact version is in the project's
# Cargo.lock, copy it from the cargo registry into .vendor/, apply the patch,
# and print the [patch.crates-io] block to append to the project's Cargo.toml.
# Run `cargo fetch` in the project first so the registry has the sources.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
lock="$1/Cargo.lock"
registry=$(ls -d "${CARGO_HOME:-$HOME/.cargo}"/registry/src/index.crates.io-* | head -1)
native() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }
mkdir -p "$root/.vendor"
echo "[patch.crates-io]"
for patch in "$root"/patches/*.patch; do
  crate=$(basename "$patch" .patch)
  name=${crate%-*}
  version=${crate##*-}
  grep -A1 "^name = \"$name\"$" "$lock" | grep -qx "version = \"$version\"" || continue
  dest="$root/.vendor/$crate"
  if [ ! -d "$dest" ]; then
    cp -r "$registry/$crate" "$dest"
    (cd "$dest" && patch -p1 --quiet --binary) <"$patch"
  fi
  echo "$name = { path = \"$(native "$dest")\" }"
done
