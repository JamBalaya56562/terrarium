#!/usr/bin/env bash
# Source this before cargo: `. scripts/emscripten-env.sh`
# Expects emsdk at $EMSDK (default: ~/AppData/Local/emsdk on Windows, ~/emsdk elsewhere),
# and cmake + ninja installed through mise, or on PATH when mise is absent (CI).
#
# TERRARIUM_THREADS=1 builds with real threads through Emscripten pthreads. It
# needs a nightly toolchain and `cargo build -Zbuild-std`, since the prebuilt
# std for this target is compiled without atomics.
#
# Link flags go in .vendor/emscripten-link.rsp, which emcc reads as a response
# file, so changing them does not change RUSTFLAGS and rebuild every crate.
# Cargo does not notice the file changing either: relink by touching the
# binary's main.rs.
: "${EMSDK:=$( [ -d "$HOME/AppData/Local/emsdk" ] && echo "$HOME/AppData/Local/emsdk" || echo "$HOME/emsdk" )}"
em="$EMSDK/upstream/emscripten"
exe=""; [ -f "$em/emcc.exe" ] && exe=".exe"
tools_path=""
if command -v mise >/dev/null; then
  cmake_bin=$(dirname "$(find "$(cd "$HOME" && mise where cmake)" -name "cmake$exe" -path '*/bin/*' | head -1)")
  tools_path="$(cd "$HOME" && mise where ninja):$cmake_bin:"
fi

export EM_CONFIG="$EMSDK/.emscripten"
export PATH="$tools_path$em:$EMSDK:$PATH"
export CC_wasm32_unknown_emscripten="$em/emcc$exe"
export CXX_wasm32_unknown_emscripten="$em/em++$exe"
export AR_wasm32_unknown_emscripten="$em/emar$exe"
export CARGO_TARGET_WASM32_UNKNOWN_EMSCRIPTEN_LINKER="$em/emcc$exe"
export CMAKE_TOOLCHAIN_FILE_wasm32_unknown_emscripten="$em/cmake/Modules/Platform/Emscripten.cmake"
export CMAKE_GENERATOR=Ninja

terrarium_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
command -v cygpath >/dev/null && terrarium_root=$(cygpath -m "$terrarium_root")
mkdir -p "$terrarium_root/.vendor"
rsp="$terrarium_root/.vendor/emscripten-link.rsp"
{
  echo "--js-library=$terrarium_root/runtime/libterrarium.js"
  echo "$terrarium_root/runtime/syscalls.c"
  echo "-sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=\$TERRARIUM_HARDLINKS"
  echo "-sMODULARIZE=1"
  echo "-sEXPORTED_RUNTIME_METHODS=FS,ENV"
  echo "-sEXIT_RUNTIME=1"
  echo "-sALLOW_MEMORY_GROWTH=1"
  echo "-sSTACK_SIZE=8388608"
  # Must hold the static data and the 8 MiB stack; the 16 MiB default is
  # too small since aube 2.6.1's main. Memory still grows past it.
  echo "-sINITIAL_MEMORY=33554432"
  if [ "${TERRARIUM_THREADS:-0}" = 1 ]; then
    echo "-pthread"
    echo "-sPROXY_TO_PTHREAD"
    echo "-sPTHREAD_POOL_SIZE=16"
  fi
} >"$rsp"

CARGO_TARGET_WASM32_UNKNOWN_EMSCRIPTEN_RUSTFLAGS="-C link-arg=@$rsp"
if [ "${TERRARIUM_THREADS:-0}" = 1 ]; then
  export CFLAGS_wasm32_unknown_emscripten="-pthread"
  export CXXFLAGS_wasm32_unknown_emscripten="-pthread"
  CARGO_TARGET_WASM32_UNKNOWN_EMSCRIPTEN_RUSTFLAGS+=" -C target-feature=+atomics,+bulk-memory,+mutable-globals"
fi
export CARGO_TARGET_WASM32_UNKNOWN_EMSCRIPTEN_RUSTFLAGS
