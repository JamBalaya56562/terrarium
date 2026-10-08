#!/usr/bin/env bash
# Reuse a staged build, or stage a fresh build from TERRARIUM_PITCHFORK_BUILD.
# Build it first with scripts/build-pitchfork.sh <source> <out>.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
ref=${TERRARIUM_PITCHFORK_REF:-}
commit=${TERRARIUM_PITCHFORK_COMMIT:-}
if [[ -z $ref || -z $commit ]]; then
  resolved=$(bash "$root/scripts/resolve-ref.sh" pitchfork latest)
  ref=$(printf '%s\n' "$resolved" | sed -n 's/^name=//p')
  commit=$(printf '%s\n' "$resolved" | sed -n 's/^commit=//p')
fi
[[ $ref =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ && $commit =~ ^[0-9a-f]{40}$ ]] ||
  { echo 'invalid resolved pitchfork identity' >&2; exit 1; }
if [[ -n ${TERRARIUM_PITCHFORK_BUILD:-} ]]; then
  TERRARIUM_COMMIT=$commit bash "$root/scripts/stage-web.sh" \
    pitchfork "$ref" "$TERRARIUM_PITCHFORK_BUILD"
fi
for extension in js wasm; do
  if [[ ! -s "$root/web/dist/pitchfork/$ref/pitchfork.$extension" ]]; then
    echo "Build pitchfork $ref ($commit) first and set TERRARIUM_PITCHFORK_BUILD to its output directory." >&2
    exit 1
  fi
done
jq -e --arg commit "$commit" --arg ref "$ref" \
  '.builds.pitchfork[$ref].source.commit == $commit' \
  "$root/web/dist/builds.json" >/dev/null

mkdir -p "$root/.vendor"
jq -n --arg ref "$ref" --arg commit "$commit" '{ref: $ref, commit: $commit}' > "$root/.vendor/pitchfork-e2e.json"
