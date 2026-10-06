#!/usr/bin/env bash
# usage: stage-web.sh [<tool> <name> <dir containing <tool>.js and <tool>.wasm>]
# Copy every fixture to web/dist/fixtures/<fixture>.json, which the page loads
# from. With a build, also copy it to web/dist/<tool>/<name>/ and record it in
# web/dist/builds.json, from these variables (all optional):
#   TERRARIUM_SOURCE_URL  repository the build came from (default: tools.json)
#   TERRARIUM_REF         branch, tag or commit that was asked for (default: <name>)
#   TERRARIUM_COMMIT      commit that was built
#   TERRARIUM_PR          URL of the pull request it is the head of
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
dist="$root/web/dist"
[[ $# -eq 0 || $# -eq 3 ]] ||
  { echo 'usage: stage-web.sh [<tool> <name> <build dir>]' >&2; exit 1; }
if [ $# -eq 3 ]; then
  tool=$1 name=$2
  jq -e --arg t "$tool" '.[$t] != null' "$root/web/tools.json" >/dev/null ||
    { echo "unknown tool: $tool" >&2; exit 1; }
  [[ $name =~ ^[A-Za-z0-9._-]+$ && $name != . && $name != .. ]] ||
    { echo "bad build name: $name" >&2; exit 1; }
  for extension in js wasm; do
    [[ -f "$3/$tool.$extension" ]] ||
      { echo "missing build artifact: $3/$tool.$extension" >&2; exit 1; }
  done
fi
mkdir -p "$dist/fixtures"
if [ $# -eq 3 ]; then
  mkdir -p "$dist/$tool/$name"
  cp "$3/$tool.js" "$3/$tool.wasm" "$dist/$tool/$name/"
fi
node - "$root" "$@" <<'EOF'
const fs = require('fs'), path = require('path');
const [root, tool, name] = process.argv.slice(2);
const dist = path.join(root, 'web/dist');

const fixtures = path.join(root, 'fixtures');
for (const e of fs.readdirSync(fixtures, { withFileTypes: true })) {
  if (!e.isDirectory() || e.name === 'sessions') continue;
  const files = {};
  const walk = (rel) => {
    for (const f of fs.readdirSync(path.join(fixtures, e.name, rel), { withFileTypes: true })) {
      const child = rel ? `${rel}/${f.name}` : f.name;
      if (f.isDirectory()) walk(child);
      else files[child] = fs.readFileSync(path.join(fixtures, e.name, child), 'utf8');
    }
  };
  walk('');
  fs.writeFileSync(path.join(dist, 'fixtures', `${e.name}.json`), JSON.stringify(files, null, 2) + '\n');
}

const manifestPath = path.join(dist, 'builds.json');
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  : { schema_version: 1, builds: {} };
if (name) {
  const tools = JSON.parse(fs.readFileSync(path.join(root, 'web/tools.json'), 'utf8'));
  const env = process.env;
  manifest.builds[tool] ??= {};
  manifest.builds[tool][name] = {
    source: {
      type: 'git',
      url: env.TERRARIUM_SOURCE_URL || tools[tool]?.repository || null,
      ref: env.TERRARIUM_REF || name,
      commit: env.TERRARIUM_COMMIT || null,
    },
    upstream_pr: env.TERRARIUM_PR || null,
    built_at: new Date().toISOString(),
  };
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
EOF
ls -la "$dist/fixtures" ${tool:+"$dist/$tool/$name"}
