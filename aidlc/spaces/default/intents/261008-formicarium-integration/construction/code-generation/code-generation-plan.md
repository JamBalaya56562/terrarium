# formicarium統合の最小修正計画

## 対象と固定境界

承認済み requirements.md の FR1–FR4、NFR1–NFR4 を直接実装に対応付ける。express のため Unit / story / design を新設しない。公開 Session API、端末、iframe の実行境界を維持する。formicarium producer・公開・push・配布先の新設は対象外。

変更前候補 digest は 3e3401c5a93bca5c7635d2ba0761bd72125b3421319c6ce054b178e011602983、tarball SHA は 969e9fab854d4499da1d38087bd601b65042b6d50b086c8fc8ddaefd0752f810。既存 .site と reverse-engineering/evidence は保存する。生成物・実行結果はこの段階の evidence/ と ignored の別サイト出力へ書く。基準保存前にアプリケーションソースを変更しない。

## 入力供給方式

ビルド成果物を main に追加しない。固定入力の記述ファイル integration/formicarium-inputs.json を新設し、既存 tarball・manifest・resolver modules・guest catalog と広告した全 asset の SHA-256 を固定する。入力本体は明示したディレクトリから ignored .vendor/formicarium-inputs/ に検証・配置する。package.json / bun.lock はそこへのリポジトリ相対 file 参照へ変更する。暗黙の隣接 checkout fallback は除く。

CI では repository variable FORMICARIUM_INPUTS_URL で指定した入力セット archive を取得し、記述ファイルの固定 digest / exact file set で検証する。URL の値を package identity の根拠にはしない。同じ prepare コマンドがローカルの明示ディレクトリと CI の archive を処理する。取得・検証は bun install と mise の自動 deps より前に行う。URL 未設定・取得失敗・digest 不一致は非ゼロで停止し、skip しない。今回 archive をローカルで作り、受渡し仕様と archive digest を記録するが、アップロードや repository variable の設定は行わない。外部入力の配備・remote CI の実走行は未確認として引継ぎに残す。新しい Actions を追加する場合は既存の full SHA pin を利用する。

## 実装手順と要件対応

- [x] Step 1: 変更予定ファイルと既存統合ソースの旧 bytes、tarball/manifest、元 .site の inventory をこの段階の evidence/baseline/ に保存し、読み戻して SHA を確認する。対象が既に存在する場合は上書きしない。元候補の44ファイルとの対応も記録する。(FR1, NFR4)
- [x] Step 2: 現在の Bun runner・型検査・Playwright configuration を確認する。既存の3つの formicarium unit test の限定コマンドが実行可能なことを確認し、現状結果を保存する。準備不足は記録し、成功扱いにしない。(NFR2)
- [x] Step 3: scripts/prepare-formicarium.mjs と integration/formicarium-inputs.json を実装する。明示入力のみから tarball/manifest/resolver/guest の固定 identity・必要ファイル・全ref・path境界を検証して ignored 入力を配置する。archive 読込みは展開前の path / symlink 境界も検証する。正常・入力なし・digest 不一致の requirement-driven tests を packages/terrarium/tests/formicarium-inputs.test.ts に追加して実行する。(FR2, NFR1, NFR3)
- [x] Step 4: package.json / Bun 1.2互換 lockfileVersion 1 の bun.lock を相対 tarball に更新する。mise.toml の入力準備順序と dedicated tasks を接続し、install --frozen-lockfile / typecheck / unit / build が明示入力で成立することを確認する。(FR2, FR3, NFR1)
- [x] Step 5: scripts/stage-formicarium.mjs の CLI を検証済み明示入力へ接続し、sibling fallback を除く。scripts/assemble-pages.sh では必須入力を破壊的な出力初期化より前に検証する。package/resolver/guest の既存全ref検証は保持する。既存 formicarium-assets.test.ts の sibling依存を検証済み resolver 入力へ置換し、retained ref 欠落・resolver 改変・入力不足で基準が変わらない負例を実行する。(FR1, FR2, NFR3, NFR4)
- [x] Step 6: dedicated/legacy Playwright config と必要なら e2e serve のサイトパスを明示出力に対応させる。legacy suite と dedicated suite の対象を明示して重複実行を防ぐ。TERRARIUM_BUN を mise 解決した実行ファイルから渡す。既存 origin / digest / worker 境界の assertions を保持する。(FR3, NFR2, NFR3)
- [x] Step 7: .github/workflows/test-terrarium.yml と test-e2e.yml に入力取得・検証、専用 config の3ブラウザ実行を接続する。既存 legacy 用ビルド・検証を保持し、別サイト output と結果 identity を出力する。job失敗を伝搬し、missing inputs を早期失敗させる。新設定の静的契約テストを formicarium-inputs.test.ts に追加し actionlint / matching lint を実行する。(FR3, FR4)
- [x] Step 8: 隣接 checkout のない一時作業場所へ現ソースと明示入力を用意し、prepare / frozen install / typecheck /全既存unit / build / assemblyを実行する。legacy の固定ビルド入力も明示して専用出力を作り、legacy suite と dedicated45ケースを Chromium / Firefox / WebKit で検証する。未実行・skip・timeoutを合格に数えない。(FR2, FR3, NFR1, NFR2)
- [x] Step 9: 変更後 source/candidate inventory と raw hashes、commands/exit/output、ブラウザ別結果を独立保存し、元候補・tarball の SHA を再照合する。入力準備と staging の missing/digest failure で基準が不変なことを記録する。(FR1, FR4, NFR4)
- [x] Step 10: code-summary.md、traceability.json、source-manifest.json と sibling intent 向け handoff.md をこのintent内に作成する。FR/NFRをファイルと実行結果へ対応付け、CI入力の外部配備・公開RC/Pages/実Safari・戦略判断を未確認として示す。兄弟repoを書き換えない。(FR4)

## テスト範囲と実装上の扱い

test-after。新しい入力準備層を実装後に狭い正常・負例を追加し、配置層・CI設定層も各変更の後で検証する。Minimal の1要件1検証と新コンポーネントの happy path を満たす。新規テストは約5–10ケースを目安とし、既存26の関連unitと45の専用browserケースを保持する。数値coverage floorは追加せず、旧81.87%は旧観測値として残す。既存の失敗を隠すskipや閾値緩和を行わない。

依存 tarball が必要な現行 source をそのまま初回 baseline として扱う。入力記述と archive identity は実バイトから作る。ローカル作成した archive の外部配備は今回の完了証拠ではない。コマンド・変更予定範囲が成立しない場合は不足を明示して停止する。

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "express",
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
  "input_sha256": "sha256:c8f84e35190e007d9863fad236154d0269ab9bf633fc2a3ff106ed965ba4a9b9",
  "contract_sha256": "sha256:bb76c1b22f8307be6e5780d50cabab891684449d5b164bd0e825e9e4e5c61e5b"
}
```

## 実行結果の残項目

## 既存2件の解消 — 追加修正計画

変更希望の原文: 「既存2件の失敗の解消」。既存suiteをgreenにするため、次の4手順をFR3/NFR2の追加修正として実施する。以前の実装・基準・失敗証拠は保持し、期待値・skip条件・閾値を緩和しない。

- [x] Step 11: scripts/resolve-ref.sh、scripts/build-pitchfork.sh、関連2testsの旧bytesを別baselineに保存する。Mac標準Bash3.2/BSD patchの限定回帰で既存2件の失敗を再確認し、保存済み原因測定と対応づける。(FR1, FR4, NFR4)
- [x] Step 12: scripts/resolve-ref.sh の負の配列添字を、最後のmatch indexを非負で計算して参照するBash3.2互換処理に置き換える。pitchfork-runtime.test.tsでpr-42 / #42 / PR URLの全3表記をhead endpointとmetadataの検証へ追加して実行する。branch/tag/commitとAPI失敗の既存検証も維持する。(FR3, NFR2)
- [x] Step 13: scripts/build-pitchfork.sh の逆向きdry-runが自動で方向を変えて成功しないよう、BSD/GNU双方の非対話オプションを一時fixtureで測定して選ぶ。未適用なら正方向を一度適用し、適用済みなら再適用せず、不一致なら非ゼロ終了する。pitchfork-build-retry.test.tsのvendor失敗後の再試行検証を維持し、不一致patchでCargo markerを残さない負例を追加して実行する。パッチ本体と他toolchain scriptは変更しない。(FR3, NFR2)
- [x] Step 14: Mac標準Bash/patchで全unitを再実行して0failを確認し、型検査/build、2shellのShellCheck、変更testのBiomeを実行する。独立tempに追加変更を同期し同じ全unitを再検証する。shell/test-only差分はbrowser bundleに影響しないことを確認し、既に実走したbrowser結果はその元source/candidateへの束縛を保持する。最終source inventory、source-manifest、summary/traceability/handoffを更新し、Steps4/8の残条件が満たされた場合だけ完了とする。元candidate/tarball/manifestのSHAを再照合する。(FR1, FR3, FR4, NFR2, NFR4)

GNU/Linux remote CIはpushなしのため未実走のままとする。GNU工具をローカルに用意できない場合、その環境の実走行は未確認と明記する。外部CI入力の配備と他workflowの接続は今回の追加希望にも含めない。以下の残項目は追加修正前の状態であり、成功後に新結果と区別して更新する。

Step 4 は相対依存、明示prepare順序、frozen install、typecheck、build、関連36unitまで完了。全81unitはnative Macで79pass/2failのため完了markerを付けない。Step 8 は単独tempのprepare/install/typecheck/build/assembly、専用45pass、legacy34pass/既存2skipまで実走したが、同じ全unit2failが残るためpartialとする。期待値・skip・閾値は変更していない。

legacy modeを小さく分離し、catalogにguestがないbuildは既存Session、静的musl guestの宣言はadapter、未知/壊れたguest宣言は拒否する最小互換変更を追加した(FR3/NFR2)。両browser configのresults outputも分離し、同時実走のtrace出力衝突を修正した。これらはcurrent planでの実行変更であり、以前のapprovalが変更内容まで承認したとは扱わない。

baseline初回保存のcatalog test漏れはjj記録から旧bytesを回収し、事前source-before.jsonのSHAと完全一致して復元可能にした。後からの回収をevidenceへ明記する。
