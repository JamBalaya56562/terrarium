#!/usr/bin/env bash
#MISE description="ShellCheck — scripts/ + mise-tasks/ (read-only)"
set -euo pipefail
shopt -s globstar
shellcheck scripts/*.sh mise-tasks/**/*.sh
