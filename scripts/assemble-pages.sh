#!/usr/bin/env bash
# usage: assemble-pages.sh <site dir> [formicarium|legacy]
# Assemble and verify the entire site before replacing its local candidate.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
node "$root/scripts/assemble-candidate.mjs" "${1:?usage: assemble-pages.sh <site dir> [formicarium|legacy]}" "${2:-formicarium}"
