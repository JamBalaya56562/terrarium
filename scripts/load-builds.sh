#!/usr/bin/env bash
# usage: load-builds.sh
# Replace web/dist/ with the published builds: the `builds` branch, which
# holds builds.json and <tool>/<name>/ for every build. Before that branch
# existed the builds lived in gh-pages under web/dist/, so fall back to that.
# Prints `base=<commit>` for the `builds` commit loaded, and `base=` when there
# was none, for a push that must not race another one. TERRARIUM_REMOTE
# picks the remote (default: origin).
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
remote=${TERRARIUM_REMOTE:-origin}
rm -rf web/dist
mkdir -p web/dist
if git fetch -q --depth=1 "$remote" builds 2>/dev/null; then
  git archive FETCH_HEAD | tar -x -C web/dist
  echo "base=$(git rev-parse FETCH_HEAD)"
elif git fetch -q --depth=1 "$remote" gh-pages 2>/dev/null; then
  git archive FETCH_HEAD web/dist | tar -x
  rm -rf web/dist/fixtures
  echo "base="
else
  echo "base="
fi
