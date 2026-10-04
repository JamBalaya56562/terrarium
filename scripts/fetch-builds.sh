#!/usr/bin/env bash
# usage: fetch-builds.sh <name>...
# Download published builds of aube from the GitHub Pages site into web/dist/,
# with their entries of builds.json, so the site can be assembled and tested
# without building aube (which takes the better part of an hour). Needs curl
# and jq. TERRARIUM_SITE overrides where they come from.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
site=${TERRARIUM_SITE:-https://aletheia-works.github.io/terrarium/web}
dist=$root/web/dist
mkdir -p "$dist"
published=$(curl -fsSL "$site/dist/builds.json")
manifest=$dist/builds.json
[ -f "$manifest" ] || echo '{"schema_version":1,"builds":{}}' >"$manifest"
for name in "$@"; do
  entry=$(jq -e --arg n "$name" '.builds.aube[$n]' <<<"$published") ||
    { echo "fetch-builds: no published build \"$name\"" >&2; exit 1; }
  mkdir -p "$dist/aube/$name"
  for file in aube.js aube.wasm; do
    curl -fsSL "$site/dist/aube/$name/$file" -o "$dist/aube/$name/$file"
  done
  jq --arg n "$name" --argjson e "$entry" '.builds.aube[$n] = $e' "$manifest" >"$manifest.tmp"
  mv "$manifest.tmp" "$manifest"
  ls -la "$dist/aube/$name"
done
