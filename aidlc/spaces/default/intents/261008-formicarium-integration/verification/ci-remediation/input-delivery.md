# Fixed CI inputs without repository variables

User authorized public upload of the 58,634,416-byte development archive to Marukome0743/terrarium. Stored separately from main on codex/formicarium-inputs-00abfc608106; signed commit c670296b2ebed05f2e8156a74fede29604ec8c95 is Verified on GitHub.

Archive SHA-256: 00abfc608106c8b4a17bd973b4a948b0aa1fa23c713ac22ad62e5a4571c75d01. Downloaded via public raw URL; compressed digest and all 16 files match. Preparation checks both archive digest and exact file set/digests before placement.

All four installing workflows use that commit-pinned URL by default; FORMICARIUM_INPUTS_URL optionally overrides the exact same archive. No variables/secrets changes required. Missing/modified content fails, without skipping tests. Regression checks cover URL consistency and archive digest rejection.

formicarium repository is public; package.json declares 0.1.0-rc.1. User clarified that the package is not released; npm lookup returned 404. This supplies CI development inputs without an npm/JSR release or a release tag.

Local checks: lint:all, type-check, 91 unit tests and build pass. Remote CI remains the acceptance criterion.
