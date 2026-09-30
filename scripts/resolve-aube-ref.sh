#!/usr/bin/env bash
# usage: resolve-aube-ref.sh <ref>
# Resolve an aube ref to the commit to build, printed as GITHUB_OUTPUT lines:
#   name=    build name, the directory under web/dist/aube/ (main, v2.6.1, pr-1645)
#   ref=     what was asked for (a branch, a tag, a commit, refs/pull/<n>/head)
#   commit=  the full commit SHA
#   pr=      the pull request URL, for a pull request
# <ref> is a branch, a tag or a commit, or a pull request as pr-<n>, #<n> or
# its URL. Needs `gh` (GH_TOKEN in CI).
set -euo pipefail
repo=${TERRARIUM_AUBE_REPO:-aubepkg/aube}
ref=$1
if [[ $ref =~ ^(pr-|#)([0-9]+)$ || $ref =~ /pull/([0-9]+)/?$ ]]; then
  n=${BASH_REMATCH[-1]}
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
  [[ $name =~ ^[A-Za-z0-9._-]+$ ]] || { echo "cannot name a build after $ref" >&2; exit 1; }
  echo "name=$name"
  echo "ref=$ref"
  echo "commit=$commit"
  echo "pr="
fi
