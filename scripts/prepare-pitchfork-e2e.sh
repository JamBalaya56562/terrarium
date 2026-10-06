#!/usr/bin/env bash
# Reuse a staged build, or stage a fresh build from TERRARIUM_PITCHFORK_BUILD.
# Build it first with scripts/build-pitchfork.sh <source> <out>.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
commit=cfdea79f1d52b8449c0b99b29a03d9e771cd8ec3
if [[ -n ${TERRARIUM_PITCHFORK_BUILD:-} ]]; then
  TERRARIUM_COMMIT=$commit bash "$root/scripts/stage-web.sh" \
    pitchfork v2.29.0 "$TERRARIUM_PITCHFORK_BUILD"
fi
for extension in js wasm; do
  if [[ ! -s "$root/web/dist/pitchfork/v2.29.0/pitchfork.$extension" ]]; then
    echo 'Build pitchfork v2.29.0 first and set TERRARIUM_PITCHFORK_BUILD to its output directory.' >&2
    exit 1
  fi
done
jq -e --arg commit "$commit" \
  '.builds.pitchfork["v2.29.0"].source.commit == $commit' \
  "$root/web/dist/builds.json" >/dev/null
