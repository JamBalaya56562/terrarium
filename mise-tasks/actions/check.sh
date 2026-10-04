#!/usr/bin/env bash
#MISE description="actionlint — workflow syntax + ShellCheck over every run: block (read-only)"
set -euo pipefail
# Paths are explicit because actionlint finds workflows via `.git`, which a
# Jujutsu workspace without a colocated Git repository does not have.
actionlint .github/workflows/*.yml
