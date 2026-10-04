#!/usr/bin/env bash
# usage: assemble-pages.sh <site dir>
# Lay out what GitHub Pages serves: the page (web/, with the staged web/dist/),
# web/terrarium.mjs bundled from packages/terrarium with xterm.js inside, and
# a root page that forwards to web/. Needs bun and the package's dependencies
# (`bun install` in packages/terrarium).
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
site=$1
package=$root/packages/terrarium
rm -rf "$site"
mkdir -p "$site"
cp -r "$root/web" "$site/web"
cp "$root/LICENSE" "$site/"
touch "$site/.nojekyll"

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
