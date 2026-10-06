# U1 pitchforkランタイムの実装計画

## Sources

- ../../../inception/requirements-analysis/requirements.md: FR1、FR1.1、FR1.2のref・配置、FR2、FR2.1、FR2.2、NFR1・NFR3のU1責務。
- ../../../inception/units-generation/unit-of-work.md と unit-of-work-story-map.md: U1の基本ブラウザ実行、U2の画面・埋め込み、U3のCIという分担。
- code-generation-questions.md: 人の Looks correct と要約確認の記録。
- 設計段階とUser Storiesは省略済み。存在しないAC・設計文書は作らず、要件IDを直接対応付ける。

## Scope and ownership

scripts/build-pitchfork.sh、scripts/resolve-ref.sh、scripts/vendor-patched.sh、必要なscripts/stage-web.sh、web/tools.json、pitchfork用パッチ、fixtures/pitchfork-basic/ と fixtures/sessions/pitchfork-basic.txt を仕上げる。
新規テストは packages/terrarium/tests/pitchfork-runtime.test.ts、基本ブラウザ検証は scripts/check-pitchfork-runtime.mjs に置く。
後者はU1の受入を再実行するためのスクリプトであり、U3は後でCIに接続する。packages/terrarium/e2e/ の設定・テストとPagesの変更はU3に残す。
共有runtime/とSessionの修正は、実行失敗と再現テストで必要性が観測された場合だけ行う。
U2のcatalog.ts・画面切替・埋め込み全受入は変更しない。スーパーバイザー、ネットワーク、別ツール、別pitchforkバージョンは追加しない。

## Execution plan

Testing Contractのtest-afterを適用する。各適用層を実装し、その層のテストを追加・実行してから次の層へ進む。
新規DB、サーバーAPI、repository層、画面機能はこの単位にないため、その層の手順は対象外とする。

- [x] Step 1: 既存U1変更と呼出元を確認し、fixture・パッチ・build/ref/stagingの責務と変更対象を確定する。失敗証拠は本intentの .aidlc-engine/u1-build/ に保持し、Windowsの長い物理パスでのリンク失敗後の再試行は追跡外 .vendor/u1-pf/ の新規source・空targetで行う。新規出力とソースcommitを記録する。FR1・FR2・NFR3。
- [x] Step 2: 実体をglobで解決するBun・Node・jjと、Bash・jq・gh・Emscripten・Rustの準備を確認する。既存Sessionテストをファイル限定で実行し、Playwright Chromiumと静的ホストの実行準備を確認する。新しいテストを初めて実行する前にrunnerを準備する。NFR1・NFR3。
- [x] Step 3: ref解決と配置の実装を仕上げる。pitchforkのdefault v2.29.0、指定ref/PR/commitの解決、metadata、fixtureの配置、既存aube/builds保持を維持する。不明ツールと不正なbuild名は書込み前に拒否し、不足入力の失敗を明示する。FR1.2。
- [x] Step 4: packages/terrarium/tests/pitchfork-runtime.test.ts を作成し、実際のshell処理を一時ルート・入力で実行する。default解決、明示ref/PR/SHA、未知ツール、不正名、pitchfork配置・fixture/metadata、aube保持、不足成果物を確認して実行する。ソース文字列一致だけを合格根拠にしない。FR1.2・NFR3。
- [x] Step 5: pitchfork/依存パッチとビルドを仕上げる。Cargo.lockの各正確な版にパッチを適用し、複数版の同名crateをdistinctなpatch keyで参照する。JS/Wasmを出力し、共有変更のaube互換性を維持する。FR1.1・FR2・NFR1。
- [x] Step 6: 同じ単位テストに、一時Cargo.lock・registry・patchを用いたvendor-patched.shの実行を加える。単一版と複数版の実際の適用・Cargo参照を確認する。コンパイル対象commitとパッチ適用を記録し、新しいソースと空のtargetからreleaseビルドを実行する。既存.tem-pfの成果物をビルド成功証拠にしない。FR1.1・NFR3。
- [x] Step 7: fixtureと8コマンドの基本実行を仕上げる。失敗が出た場合は最小の再現を保存し、必要なpitchforkパッチ・Session互換修正だけを行う。新しいJS/Wasmをv2.29.0として配置し、.siteへ組み立てる。FR2.1・FR2.2・NFR1。
- [x] Step 8: scripts/check-pitchfork-runtime.mjs を作成してChromiumで実行する。既存Playwright依存・静的ホスト・terrarium-terminalのready/runを使い、8コマンドの各コードと出力、設定保持、未知コマンド127、missing catの非zero、新規要素へのfixture再投入、既存aubeの4コマンドをassertする。タイムアウト・pageerror・起動失敗を非zeroとし、起動したbrowser/hostを終了時に停止する。FR2.1・FR2.2・NFR1・NFR3。
- [ ] Step 9: 必要な修正後に当該テストと既存Session回帰を確認する。変更JS/TSのBiome・型検査、変更shellのShellCheckを実行する。Windows作成の実行対象scriptは jj file chmod x で実行属性を設定する。NFR1・NFR3。
- [x] Step 10: code-summary.md、source-manifest.json、traceability.jsonを作成し、全U1変更・生成pathと各要件の実装/テスト対応を記録する。コマンド、exit code、各コマンド結果、対象commit、JS/Wasmのサイズ/hashを証拠に残し、未達は未検証と明記する。NFR3。

## Acceptance evidence

| Requirement | Evidence |
|---|---|
| FR1・FR1.1 | 新規source commit、patch適用ログ、空targetからのコンパイルexit 0、新規JS/Wasmとhash |
| FR1.2（U1部分） | ref/stagingの実行テスト、default v2.29.0、不明tool/不正nameの拒否、metadataとaube保持 |
| FR2・FR2.1 | 実ブラウザの8結果すべてcode 0、version 2.29.0、api/worker、db追加、worker削除、config、api status、interval set/get |
| FR2.2 | 同一Sessionのconfigにapi/dbがありworkerがない、db run値、後続settings getが5s |
| NFR1（U1部分） | Chromiumでの既存要素/Session、unknown 127、読取失敗、fixture再投入、aube既存コマンドとSession回帰 |
| NFR3（U1部分） | テスト名・ログ・終了コード・commit/hashを保存し、未検証を合格にしない |

Browser全3種・ページ/iframe全受入と3つのpre-PR task完了は、承認済みU2/U3で実施する。
この単位ではChromiumの基本統合検証を完了させ、後続単位に検証を丸投げしない。
コードやパッチの存在、Node runner全体のexit 0は上表の合格証拠ではない。

## Assumptions & Open Questions

None.

新規ビルドとChromium基本受入はexit0。Step9の最新単体greenは未達（30秒timeoutで7fail）。CPU100%を観測したが負荷との因果は未検証。詳細はcode-summaryとverification-evidenceを参照。

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "pitchfork-continuation",
  "test_strategy": "minimal",
  "project_type": "brownfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    }
  ],
  "obligations": {
    "strategy": "minimal",
    "strategy_volume": [
      "One verifiable test per requirement at the narrowest effective level.",
      "At least one happy-path unit test per component.",
      "Unit tests are the default; a bugfix/security scope floor may require an integration or E2E regression when that is the narrowest level that reproduces the defect."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Verify the existing test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Verify the existing test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:f8690836d5868884210476fac86592b497646e2237d028ded11af9c704835265",
  "contract_sha256": "sha256:f7d8bb522b167216babc2918644ebc2c39441e944521e467b7f2f82726c04b3f"
}
```
