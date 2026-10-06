#!/usr/bin/env bash
# usage: vendor-patched.sh <project-dir>
# For each crate in patches/ whose exact version is in the project's
# Cargo.lock, copy it from the cargo registry into .vendor/, apply the patch,
# and print the [patch.crates-io] block to append to the project's Cargo.toml.
# Run `cargo fetch` in the project first so the registry has the sources.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
lock="$1/Cargo.lock"
registry=$(find "${CARGO_HOME:-$HOME/.cargo}/registry/src" -maxdepth 1 -name 'index.crates.io-*' | head -1)
native() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }
mkdir -p "$root/.vendor"
echo "[patch.crates-io]"
seen=" "
for patch in "$root"/patches/*.patch; do
  crate=$(basename "$patch" .patch)
  name=${crate%-*}
  version=${crate##*-}
  grep -A1 "^name = \"$name\"$" "$lock" | grep -qx "version = \"$version\"" || continue
  dest="$root/.vendor/$crate"
  if [ ! -d "$dest" ]; then
    staging=$(mktemp -d "$root/.vendor/.${crate}.XXXXXX")
    trap 'rm -rf "$staging"' EXIT
    cp -r "$registry/$crate/." "$staging/"
    (cd "$staging" && patch -p1 --quiet --binary) <"$patch"
    mv "$staging" "$dest"
    trap - EXIT
  fi
  # A project can lock two versions of one crate; [patch] needs a distinct
  # key for the second, naming the crate with `package`.
  case $seen in
    *" $name "*) echo "$name-${version//./-} = { package = \"$name\", path = \"$(native "$dest")\" }" ;;
    *) echo "$name = { path = \"$(native "$dest")\" }" ;;
  esac
  seen="$seen$name "
done
