#!/usr/bin/env bash
# usage: resolve-ref.sh <tool> [<ref>]
# Resolve a ref of a tool in web/tools.json to the commit to build, printed as
# GITHUB_OUTPUT lines:
#   tool=    the tool
#   name=    build name, the directory under web/dist/<tool>/ (main, v2.6.1, pr-1645)
#   ref=     what was asked for (a branch, a tag, a commit, refs/pull/<n>/head)
#   commit=  the full commit SHA
#   repo=    the GitHub repository, owner/name
#   pr=      the pull request URL, for a pull request
# <ref> is a branch, a tag or a commit, or a pull request as pr-<n>, #<n> or
# its URL, or latest for the latest stable release; without one, the tool's default build. Needs `gh` (GH_TOKEN in CI)
# and jq.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
[[ $# -ge 1 && $# -le 2 ]] || { echo 'usage: resolve-ref.sh <tool> [<ref>]' >&2; exit 1; }
tool=$1
entry=$(jq -e --arg t "$tool" '.[$t]' "$root/web/tools.json") ||
  { echo "unknown tool: $tool" >&2; exit 1; }
url=$(jq -r .repository <<<"$entry")
repo=${url#https://github.com/}
ref=${2:-$(jq -r .default <<<"$entry")}
if [[ $ref == latest ]]; then
  ref=$(gh api "repos/$repo/releases/latest" --jq .tag_name)
  [[ $ref =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] ||
    { echo "invalid latest stable release: $ref" >&2; exit 1; }
fi
echo "tool=$tool"
echo "repo=$repo"
if [[ $ref =~ ^(pr-|#)([0-9]+)$ || $ref =~ /pull/([0-9]+)/?$ ]]; then
  match_index=$((${#BASH_REMATCH[@]} - 1))
  n=${BASH_REMATCH[match_index]}
  commit=$(gh api "repos/$repo/pulls/$n" --jq .head.sha)
  echo "name=pr-$n"
  echo "ref=refs/pull/$n/head"
  echo "commit=$commit"
  echo "pr=https://github.com/$repo/pull/$n"
else
  commit=$(gh api "repos/$repo/commits/$ref" --jq .sha)
  if [[ $commit == "$ref"* && $ref =~ ^[0-9a-f]{7,40}$ ]]; then
    name=${commit:0:12}
  else
    name=${ref//\//-}
  fi
  [[ $name =~ ^[A-Za-z0-9._-]+$ && $name != . && $name != .. ]] ||
    { echo "cannot name a build after $ref" >&2; exit 1; }
  echo "name=$name"
  echo "ref=$ref"
  echo "commit=$commit"
  echo "pr="
fi
