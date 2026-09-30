#!/usr/bin/env bash
# Apply patches/toolchain/rust-std-<toolchain>.patch to that toolchain's
# rust-src, which `cargo -Zbuild-std` compiles std from. Safe to re-run.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
for patch in "$root"/patches/toolchain/rust-std-*.patch; do
  toolchain=$(basename "$patch" .patch); toolchain=${toolchain#rust-std-}
  library=$(ls -d "${RUSTUP_HOME:-$HOME/.rustup}"/toolchains/"$toolchain"-*/lib/rustlib/src/rust/library)
  if patch -d "$library" -p1 -R --dry-run --quiet --binary <"$patch" >/dev/null 2>&1; then
    echo "already applied: $toolchain"
  else
    patch -d "$library" -p1 --quiet --binary <"$patch"
    echo "applied: $toolchain — cargo does not notice rust-src changes; delete"
    echo "  <target-dir>/wasm32-unknown-emscripten/<profile>/build/std to rebuild std"
  fi
done
