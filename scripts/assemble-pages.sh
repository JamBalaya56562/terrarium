#!/usr/bin/env bash
# usage: assemble-pages.sh <site dir>
# Lay out what GitHub Pages serves: the page (web/, with the staged web/dist/),
# web/terrarium.mjs bundled from packages/terrarium with xterm.js inside, and
# a root page that forwards to web/. Needs bun and the package's dependencies
# (`bun install` in packages/terrarium).
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
site=${1:?usage: assemble-pages.sh <site dir> [formicarium|legacy]}
mode=${2:-formicarium}
case "$mode" in
  formicarium) node "$root/scripts/stage-formicarium.mjs" --check ;;
  legacy)
    test -s "$root/web/dist/builds.json"
    if [[ -n ${TERRARIUM_PITCHFORK_REF:-} ]]; then
      jq -e --arg ref "$TERRARIUM_PITCHFORK_REF" '.builds.pitchfork[$ref] != null' "$root/web/dist/builds.json" >/dev/null
    fi
    ;;
  *) echo "unknown assembly mode: $mode" >&2; exit 1 ;;
esac
# The caller may protect a preserved candidate; always refuse the source root.
case "$(cd "$(dirname "$site")" && pwd)/$(basename "$site")" in
  "$root"|"${TERRARIUM_PROTECTED_SITE:-$root}") echo 'choose a separate site output directory' >&2; exit 1 ;;
esac
package=$root/packages/terrarium
rm -rf "$site"
mkdir -p "$site"
cp -r "$root/web" "$site/web"
if [[ $mode == legacy && -n ${TERRARIUM_PITCHFORK_REF:-} ]]; then
  jq --arg ref "$TERRARIUM_PITCHFORK_REF" '.pitchfork.default = $ref' "$site/web/tools.json" > "$site/web/tools.json.tmp"
  mv "$site/web/tools.json.tmp" "$site/web/tools.json"
fi
cp "$root/LICENSE" "$site/"
touch "$site/.nojekyll"

# Stage the exact installed local pack and complete guest catalogue as one set.
# The caller supplies the validated candidate explicitly; never fetch an old guest.
if [[ "$mode" == formicarium ]]; then
  node "$root/scripts/stage-formicarium.mjs" "$site/web"
fi

# This deploy's version. The bundle appends it to the data it fetches
# (tools.json, builds.json, fixtures), and the page's own URLs carry it, so a
# page never mixes this deploy's files with ones its browser cached from an
# earlier deploy (GitHub Pages lets browsers cache for 10 minutes). The builds
# are versioned by builds.json instead. coi-serviceworker.js keeps its URL: a
# new URL would register a second service worker.
version=${TERRARIUM_VERSION:-$(date -u +%Y%m%d%H%M%S)}
(cd "$package" && bun run gen >/dev/null)
bun build "$package/src/index.ts" --outfile "$site/web/terrarium.mjs" \
  --format esm --target browser --minify \
  --define "__TERRARIUM_VERSION__=\"$version\""

stamp() { # <file> <literal text> <replacement>
  local file=$site/$1
  grep -qF -- "$2" "$file" || { echo "assemble-pages: '$2' is not in $1" >&2; exit 1; }
  FROM=$2 TO=$3 perl -0pi -e 's/\Q$ENV{FROM}\E/$ENV{TO}/' "$file"
}
stamp web/index.html 'src="terminal.mjs"' "src=\"terminal.mjs?v=$version\""
stamp web/terminal.mjs "from './terrarium.mjs'" "from './terrarium.mjs?v=$version'"
echo "version $version"
cat >"$site/index.html" <<'EOF'
<!doctype html>
<meta charset="utf-8" />
<script>location.replace('web/' + location.search);</script>
<meta http-equiv="refresh" content="0; url=web/" />
<title>terrarium</title>
<a href="web/">terrarium</a>
EOF
