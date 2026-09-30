#!/usr/bin/env bash
# usage: assemble-pages.sh <site dir>
# Lay out what GitHub Pages serves: the page (web/, with the staged web/dist/),
# the Session it imports from runtime/, and a root page that forwards to web/.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
site=$1
rm -rf "$site"
mkdir -p "$site/runtime"
cp -r "$root/web" "$site/web"
cp "$root/runtime/session.mjs" "$site/runtime/"
cp "$root/LICENSE" "$site/"
touch "$site/.nojekyll"

# Put this deploy's version into the URLs the page loads its code and data
# from (see VERSION in web/terrarium.mjs). The builds are versioned by
# builds.json instead. coi-serviceworker.js keeps its URL: a new URL would
# register a second service worker.
version=${TERRARIUM_VERSION:-$(date -u +%Y%m%d%H%M%S)}
stamp() { # <file> <literal text> <replacement>
  local file=$site/$1
  grep -qF -- "$2" "$file" || { echo "assemble-pages: '$2' is not in $1" >&2; exit 1; }
  FROM=$2 TO=$3 perl -0pi -e 's/\Q$ENV{FROM}\E/$ENV{TO}/' "$file"
}
stamp web/index.html 'src="terminal.mjs"' "src=\"terminal.mjs?v=$version\""
stamp web/terminal.mjs "from './terrarium.mjs'" "from './terrarium.mjs?v=$version'"
stamp web/terrarium.mjs "from '../runtime/session.mjs'" "from '../runtime/session.mjs?v=$version'"
stamp web/terrarium.mjs 'const VERSION = null;' "const VERSION = '$version';"
echo "version $version"
cat >"$site/index.html" <<'EOF'
<!doctype html>
<meta charset="utf-8" />
<script>location.replace('web/' + location.search);</script>
<meta http-equiv="refresh" content="0; url=web/" />
<title>terrarium</title>
<a href="web/">terrarium</a>
EOF
