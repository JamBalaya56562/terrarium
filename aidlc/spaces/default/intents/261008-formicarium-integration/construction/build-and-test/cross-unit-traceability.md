# Cross-Unit Traceability

## Verdict

FAIL（明示ID対応の記録不足）。8/8上位FR/NFRはOK、10個の下位FR IDは親への対応のみで明示OKエントリがない。Unit/story段階はscopeで未実施。下位要件の挙動は対応テストで検証されているが、親参照を明示IDの記録として代用しない。

| ID | Status | Owner | Target | Evidence |
| --- | --- | --- | --- | --- |
| FR1 | OK | code-generation（stage-level） | `scripts/prepare-formicarium.mjs` | 明示OKエントリと実在を確認 |
| FR1.1 | GAP | code-generation（stage-level） | `scripts/prepare-formicarium.mjs` | 親要件のOK参照はあるが、このIDの明示エントリはない |
| FR1.2 | GAP | code-generation（stage-level） | `scripts/prepare-formicarium.mjs` | 親要件のOK参照はあるが、このIDの明示エントリはない |
| FR2 | OK | code-generation（stage-level） | `scripts/stage-formicarium.mjs` | 明示OKエントリと実在を確認 |
| FR2.1 | GAP | code-generation（stage-level） | `scripts/stage-formicarium.mjs` | 親要件のOK参照はあるが、このIDの明示エントリはない |
| FR2.2 | GAP | code-generation（stage-level） | `scripts/stage-formicarium.mjs` | 親要件のOK参照はあるが、このIDの明示エントリはない |
| FR2.3 | GAP | code-generation（stage-level） | `scripts/stage-formicarium.mjs` | 親要件のOK参照はあるが、このIDの明示エントリはない |
| FR3 | OK | code-generation（stage-level） | `.github/workflows/test-e2e.yml` | 明示OKエントリと実在を確認 |
| FR3.1 | GAP | code-generation（stage-level） | `.github/workflows/test-e2e.yml` | 親要件のOK参照はあるが、このIDの明示エントリはない |
| FR3.2 | GAP | code-generation（stage-level） | `.github/workflows/test-e2e.yml` | 親要件のOK参照はあるが、このIDの明示エントリはない |
| FR3.3 | GAP | code-generation（stage-level） | `.github/workflows/test-e2e.yml` | 親要件のOK参照はあるが、このIDの明示エントリはない |
| FR4 | OK | code-generation（stage-level） | `packages/terrarium/README.md` | 明示OKエントリと実在を確認 |
| FR4.1 | GAP | code-generation（stage-level） | `packages/terrarium/README.md` | 親要件のOK参照はあるが、このIDの明示エントリはない |
| FR4.2 | GAP | code-generation（stage-level） | `packages/terrarium/README.md` | 親要件のOK参照はあるが、このIDの明示エントリはない |
| NFR1 | OK | code-generation（stage-level） | `integration/formicarium-inputs.json` | 明示OKエントリと実在を確認 |
| NFR2 | OK | code-generation（stage-level） | `packages/terrarium/playwright.formicarium.config.ts` | 明示OKエントリと実在を確認 |
| NFR3 | OK | code-generation（stage-level） | `packages/terrarium/src/formicarium-session.ts` | 明示OKエントリと実在を確認 |
| NFR4 | OK | code-generation（stage-level） | `scripts/assemble-pages.sh` | 明示OKエントリと実在を確認 |

## Findings

CT-1: `construction/code-generation/traceability.json`へ FR1.1, FR1.2, FR2.1, FR2.2, FR2.3, FR3.1, FR3.2, FR3.3, FR4.1, FR4.2 の明示要件→target対応が不足する。上位要件の8エントリは存在し、各targetも実在する。挙動の失敗とは区別し、承認時にこの記録不足を提示する。
