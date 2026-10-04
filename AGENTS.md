# AGENTS.md

> Standing instructions for any AI coding agent working in this repository.
> Follows the [agents.md](https://agents.md) convention, as
> [vivarium](https://github.com/aletheia-works/vivarium/blob/main/AGENTS.md)
> does. The project's decisions and rules live in
> [`aidlc/spaces/default/memory/`](aidlc/spaces/default/memory/), the AI-DLC
> method's files; read [`project.md`](aidlc/spaces/default/memory/project.md)
> first.

---

## 1. What this project is

**terrarium** runs one CLI tool in the browser, from a terminal, compiled
to WebAssembly on top of only the system calls that tool needs — no
emulator, no kernel. The first tool is [aube](https://github.com/aubepkg/aube).

- **A CLI on the web, nothing more.** terrarium makes the CLI usable on a
  page: one terminal running one build. Comparing a build with a fix, and
  explaining a bug, is
  [Vivarium](https://github.com/aletheia-works/vivarium)'s job; Vivarium
  uses terrarium.
- **Several ways in, one implementation.** The `<terrarium-terminal>`
  element in [`packages/terrarium`](packages/terrarium) (published as
  `@aletheia-works/terrarium`) is the terminal; the page at `web/` and the
  iframe entry are built on it.
- Design, measurements and history are in
  [`aidlc/spaces/default/knowledge/aidlc-shared/`](aidlc/spaces/default/knowledge/aidlc-shared/README.md).

## 2. Non-negotiable guardrails

AI agents **must not** take any of these actions — always hand off to the
human:

- Creating accounts, entering credentials, or handling payments, including
  logging in to npm or JSR.
- Destructive operations on shared state: `tofu destroy`, force-pushing or
  rewriting `main`, deleting released tags or published package versions.
- Rotating, exporting, or committing secrets. Reference them through GitHub
  Actions secrets; never inline.
- Publishing: pushing a `terrarium-v*` or `v*` tag needs the human's
  go-ahead each time.
- **Strategic pivots**: scope, which tools terrarium runs, and architecture
  choices are human decisions.

If unsure whether an action crosses the line, stop and ask.

## 3. Core working principles

1. **Verify before asserting.** Back a claim about behaviour with a command
   and its output, a test, or a log line; otherwise say it is unverified.
2. **Measure, do not argue.** Open questions in the design notes are
   settled by measurement.
3. **Small diffs, tight scope.** A fix does not bundle refactors; one PR,
   one change.
4. **Mechanical over judgement.** Labels, versions and routing come from
   path rules, Conventional-Commit parsing or CI.
5. **Same conventions as vivarium** unless this file says otherwise.

## 4. Repository conventions

### 4.1 Layout

| Path | What |
| ---- | ---- |
| `packages/terrarium/` | The npm/JSR package: the element, the Session, unit tests (`tests/`), browser tests (`e2e/`) |
| `web/` | The standalone page (also the iframe entry) |
| `runtime/` | Emscripten additions (`syscalls.c`, `libterrarium.js`) and the Node.js runner |
| `patches/` | Patches to crates and to Rust's std that let the tools build for Emscripten |
| `scripts/` | Build, staging and site assembly scripts, called by CI and mise |
| `fixtures/` | Projects preloaded into the terminal, and recorded sessions |
| `infra/github/` | OpenTofu for this repository's settings, ruleset and labels |
| `aidlc/` | AI-DLC: rules and decisions (`memory/`), design notes (`knowledge/`) |

### 4.2 Version control

Jujutsu (`jj`) on a colocated Git repository. Commit and push with `jj`.
Before editing after a push, start a new change (`jj new`): the working
copy is a commit, and edits otherwise rewrite the pushed one.

### 4.3 Commits and pull requests

- **Conventional Commits**, checked by the org commitlint: `type(scope)?:
  subject`, the subject starting with a lowercase letter, at most 100
  characters, no trailing period.
- Every change goes through a pull request; `main` takes squash merges only.
- An AI-authored PR names the tool and model on the last line of its
  description.

### 4.4 Labels

`prefix: value` labels, defined in [`infra/github/main.tf`](infra/github/main.tf)
(never through the GitHub UI). `scope: *` comes from
[`.github/labeler.yml`](.github/labeler.yml) path rules and `type: *` from
the PR title's Conventional-Commit type.

### 4.5 GitHub Actions

- Every action is pinned to a full commit SHA with its version as a
  comment; the organization only runs pinned actions.
- Tools come from mise (`jdx/mise-action`), not from setup actions.
- Least-privilege `permissions:` per job, `persist-credentials: false` on
  checkouts that do not push, and `github.repository_owner ==
  'aletheia-works'` on jobs that write or use secrets.
- **A script made on Windows has no executable bit.** Set it with
  `jj file chmod x <path>`; `shell:check` fails on Linux when a script
  under `scripts/` or `mise-tasks/` is not executable.

### 4.6 Toolchain

Everything is in [`mise.toml`](mise.toml). Tasks named `<area>:check` are
read-only, `<area>:check:fix` apply fixes; tasks with loops or conditionals
live in `mise-tasks/`. Bun is the package manager; keep
`packages/terrarium/bun.lock` at `lockfileVersion` 1, which Dependabot
reads (write it with Bun 1.2 if a newer Bun rewrites it).

### 4.7 Pre-PR local validation

Run the matching task before pushing; the ruleset requires these checks.

| Task | Workflow |
| ---- | -------- |
| `lint:all` | `test-lint-check.yml` (Polyglot lint) |
| `ci:terrarium` | `test-terrarium.yml` (type-check, unit tests, build) |
| `ci:e2e` | `test-e2e.yml` (E2E in Chromium, Firefox, WebKit) |

### 4.8 Builds, Pages and publishing

- **aube builds** are made by `.github/workflows/pages.yml` (by hand with
  a ref, or daily for aube's `main`) and stored on the `builds` branch,
  rewritten as one commit. They never go on `main`.
- **The site** is assembled from `main` plus those builds and deployed
  with `actions/deploy-pages`.
- **The package** is published to npm and JSR by
  `publish-terrarium.yml` on a `terrarium-v<version>` tag, with OIDC and
  provenance. Bump `version` in both `package.json` and `jsr.json` first.
- **GitHub releases** come from `release.yml` on a `v<semver>` tag.

## 5. When in doubt

1. Re-read [`project.md`](aidlc/spaces/default/memory/project.md) and the
   [design notes](aidlc/spaces/default/knowledge/aidlc-shared/README.md).
2. Look at how vivarium does it.
3. If still unclear, stop and ask the human.
