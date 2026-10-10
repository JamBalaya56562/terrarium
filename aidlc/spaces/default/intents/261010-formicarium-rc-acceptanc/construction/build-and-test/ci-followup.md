# PR #29 fixed-input CI follow-up

## Cause and change

After rebasing onto main containing PR #30, package and all three E2E jobs
failed before installation because `FORMICARIUM_INPUTS_URL` was empty.
The old main archive also does not match the public RC's sixteen-file descriptor.

The verified public RC inputs are now supplied from the fork's signed commit
`74baa1101ebf6d8fc310ea70de3ddc071a87c01f` at
<https://raw.githubusercontent.com/Marukome0743/terrarium/74baa1101ebf6d8fc310ea70de3ddc071a87c01f/inputs.tar.gz>.
The generated archive lives only on the dedicated input branch, outside main.
Its SHA256 is
`f8b5493047389bc4033dee2608070cc4636c43006877145f0be27f72f11348c4`.
The descriptor pins this compressed digest as well as the exact sixteen files.
An alternate repository-variable URL must still supply these same bytes.

Package, E2E, Pages and publishing workflows use this immutable default and run
`node scripts/fetch-formicarium-rc.mjs` before installation. The npm RC version,
integrity, expected SHA256 and installed-file verification remain unchanged.
No package or release tag was published.

## Local validation, 2026-10-10

- `mise exec -- bun scripts/prepare-formicarium.mjs --url <immutable URL>`:
  passed archive digest and exact sixteen-file verification.
- `mise run lint:all`: passed.
- `FORMICARIUM_INPUTS_DIR=<verified source> mise run ci:terrarium`:
  passed type checks, 146 tests, 576 assertions and package build.
- `FORMICARIUM_INPUTS_DIR=<verified source> TERRARIUM_PITCHFORK_REF=v2.30.1
  TERRARIUM_PITCHFORK_COMMIT=1054549e85470b08d9507e2c82c850959a4b3914
  mise run ci:e2e`: passed legacy Chromium 12, Firefox 11, WebKit 11,
  with two existing Chromium-only iframe skips; public RC 15 per browser,
  45 total, no failures or skips.

The legacy pitchfork build reused the successful artifact from GitHub Actions
run `37800808283`; the compiler build was not rerun locally. The obsolete-resolver
test matches its synthetic archive's digest so that it still independently
tests exact-file-set rejection. Archive-digest rejection is covered separately.
Remote checks are verified against the pushed PR head before merging.
