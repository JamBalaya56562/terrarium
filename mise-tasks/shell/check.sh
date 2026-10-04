#!/usr/bin/env bash
#MISE description="ShellCheck — scripts/ + mise-tasks/, and their executable bits (read-only)"
set -euo pipefail
shopt -s globstar
shellcheck scripts/*.sh mise-tasks/**/*.sh

# CI and mise run these directly, so each must be executable. A script made
# on Windows is not, unless its mode is set in version control
# (`jj file chmod x <path>`); the check bites on Linux, where the checkout
# carries the recorded mode.
if [ "$(uname -s)" = Linux ]; then
  missing=0
  for f in scripts/*.sh mise-tasks/**/*.sh; do
    if [ ! -x "$f" ]; then
      echo "$f is not executable" >&2
      missing=1
    fi
  done
  exit "$missing"
fi
