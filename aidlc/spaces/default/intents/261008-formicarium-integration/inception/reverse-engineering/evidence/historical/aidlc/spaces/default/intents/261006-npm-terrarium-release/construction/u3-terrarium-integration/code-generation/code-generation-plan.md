# Code Generation Plan — U3 Terrarium Integration

## Sources

- エンジン run-stage: code-generation / u3-terrarium-integration。主担当 TerrariumIntegration、US4.1・US4.2、C4/C5。
- 承認済み inception/{units-generation/unit-of-work.md,unit-of-work-story-map.md,contract-design/contract-summary.md,user-stories/stories.md,requirements-analysis/requirements.md}。
- 読取観測: sibling terrarium の AGENTS.md、memory/project.md、package.json、src/{session,catalog,terminal,index,npm}.ts、web/terminal.mjs、scripts/{assemble-pages,stage-web}.sh、playwright.config.ts、e2e/serve.ts、tests/catalog.test.ts、mise.toml。
- 基準 commit: 60dd0dc448f3a67d226dc8a3c6b3afcf4709823d。作業開始時に jj で基準・現作業差分を保存し、既存の変更を上書きしない。
- 検証済み U2: aube v2.7.0 / d36fec01764689ef6d99a5e43de98925b571d67f、pitchfork v2.30.0 / 60e97b1c39183d56e2124f84f9a68ad550fc4011。native と U1 Worker の --version 成功。aube は公式musl配布を再利用、pitchfork は承認済み一行muslパッチを適用してビルド。
- U2 候補 .artifacts/u2-guest-distribution/site-v2 は全3refの資産を持つ。既存ref維持の producer と再測定の collector に R-01/R-02 Major が残る。今回の新規測定の成功とは別に、公開前の未解消事項として保持する。

## Scope and Ownership

既存 terrarium のリンク、要素、run()、iframe、xterm UIを共通runtimeへ接続する。アプリケーション変更は /Users/mutoakio/Documents/terrarium に直接適用する。実装前に具体的な下記パスを対象とするホスト書込み権限を取得する。承認済み元ファイルの別名複製による置換や模擬端末だけでの完了は行わない。

| Repository | Planned paths | Purpose |
|---|---|---|
| terrarium | packages/terrarium/src/formicarium-session.ts (new) | C1 public APIだけを使うcommand adapter。既存 exported Session/Tool は保持 |
| terrarium | packages/terrarium/src/terminal.ts | legacy対象guestロードをC3 + adapterへ接続、ready/events/queue/dispose |
| terrarium | web/terminal.mjs | queryとexact-origin iframe、隔離不成立の原因通知 |
| terrarium | packages/terrarium/package.json, bun.lock | ローカルpackを通常dependencyとして導入、開発段階の未公開版を明記 |
| terrarium | scripts/assemble-pages.sh, scripts/stage-formicarium.mjs (new), mise.toml | 同一packのWorker/loader/wasm/build-infoとU2 resolverを配信配置、unit-scopedタスク |
| terrarium | packages/terrarium/tests/formicarium-{session,catalog,assets}.test.ts (new) | public adapter/selection/asset boundary |
| terrarium | packages/terrarium/e2e/formicarium-{terminal,iframe}.spec.ts, playwright.formicarium.config.ts, e2e/formicarium-serve.ts, e2e/host/formicarium/*.html (new) | 3browser、9セル、非実行oracle |
| terrarium | packages/terrarium/README.md | 実導入、asset、iframe条件、移行範囲 |
| formicarium | tests/terrarium/{adapter,assets,coverage}.test.mjs, playwright.config.mjs, consumer.spec.mjs, serve.mjs (new) | sibling差分とpackのconsumer検証 |
| formicarium | scripts/terrarium/{prepare,evidence,coverage}.mjs (new), docs/terrarium-integration.md | local候補/差分/digest、測定世代、U4への結果提供 |

新規配置・設定・テストファイルも source-manifest に含める。U1/U2 の凍結済みソース・契約・review は書き換えない。U2 の R-01/R-02 修正はU2所有の明示的な revision 経路を必要とし、U3中の無断修正はしない。今回は完全な site-v2 を使い、測定ディレクトリは毎回新規・既存拒否とする。これを既存問題の修正完了と呼ばない。

## Implementation Steps

- [ ] Step 1 — 配置とrunner準備 (US4.1/US4.2): 外部repoの jj status/基準差分と既存変更を記録、上記具体パスへの書込み権限取得。U1 tarballをpack内容/digest付きで通常dependencyへ導入し、U2の完全なsite-v2とresolver3moduleをdigestで束ねる。新規unit-scopedタスクとbrowser configを作り、既存catalog testによるrunner readinessをmainで確認する。Workerは実配信same-origin URL、blob回避を使わない。
- [x] Step 2 — command/business logic実装 (US4.1、AC4.1.1/3): createSessionをcwd=/work、home=/root、選択全entriesで作成し、setCwdで選択cwdへ変更。public FSのみでcd/ls/cat/rm/pwdを翻訳し、hard-link peer、mode、symlink、コピー・根境界を維持。literal引用符と既存未知command127を維持し、pipe/redirection/expansionを明示拒否。guest args/env/timeoutsをC1へ渡す。
- [x] Step 3 — Step 2のテスト作成・main実行 (US4.1): adapter unit 8件以上。正常/非0、分割UTF8・stream順序・partial output重複防止、empty、未知command、shell拒否、ls表、rm表、nested cwd外の/work sibling保持、reset/dispose/state independenceをテストする。既存exportの互換型も確認。
- [x] Step 4 — selection/data access実装 (US4.1): 既存catalog/Choice/describeを保持してC3選択と照合。aube/pitchforkのみ新guest経路を使用し、tool/ref/fixture/base/commitの不一致・404・hash失敗を明示拒否。fixture=''とundefined、明示cwd、既定ref先頭を維持。旧metadataの他ツールを強制変換しない。
- [x] Step 5 — Step 4のテスト作成・main実行 (US4.1): catalog/assets各5–8件。最新版両tool＋aube旧refで対応を確認、未配布ref/fixture/未知tool/digest/asset欠落、既存source/upstream_pr/built_atの保存とasset再配置を検証。
- [ ] Step 6 — frontend実装 (US4.1、AC4.1.1/2/3): 既存terminalのready/transcript/run/focusとイベントfields/bubbles/composedを維持。stream別decoderをsequence順表示しraw結果は別保存。ready成功/失敗・空/非0/異常runの通知回数を固定し、queueを失敗後再利用、finallyでbusyを解除。disconnect/tool切替でdisposeし旧世代を遮断。run属性/複数query run、ツール切替reset、履歴/矢印/削除/Ctrl-C/focusを比較。必要なinteractive箇所にdata-testidを追加。
- [ ] Step 7 — Step 6のテスト作成・main実行 (US4.1): browser端末8scenario以上を3browserで実行。実際の最新版guest --version と代表連続操作、既定/空fixture、nestedcwd/work sibling、ready/exit/errorの順序回数fields、失敗後再実行、switch/disconnectの古い通知抑制、キーボード/focusを確認。baseline観測と安全上の契約差分を分けて記録する。
- [ ] Step 8 — iframe API実装 (US4.2、AC4.2.1–4): origin query→ancestorOrigins→referrerの優先を保ち、null/opaque/wildcard/無効originを拒否。event.source===window.parentかつexact origin/type/command型を検査。通知もexact originのみ。非対応/隔離不足でguestを起動しない。待ち続けるservice-worker状態を成功にしない。
- [ ] Step 9 — Step 8のテスト作成・main実行 (US4.2): 3条件×3browserを個別判定し、同origin全成功、Pages相当cross-origin credentialless/allowのChromium成功・Firefox/WebKit未対応、隔離不足全拒否。各条件の未承認origin/source/type/commandとunknown/null/wildcard originも検査。guest実行要求監視＋marker guest書込みで非実行を確認。ローカルPages相当ホストと実GitHub Pagesを区別し、実外部配信が未観測なら未検証を残す。
- [ ] Step 10 — build/measurement環境 (US4.1/US4.2、US5.2補助): 同一tarballのpackage/Worker/core資産を組としてstageし、U2の全ref資産をコピー後digest照合。新しい第一者配布JS inventoryをpack/siteから固定し、U1固定13/U2固定3を縮小せず追加対象と統合する。測定世代/source/candidate identityを結果にbind、未import0・未収集realm失敗・旧receipt拒否を試験。行coverage80%・統合前CI条件は維持し、U4の全体判定を代行しない。
- [ ] Step 11 — documents/evidence/traceability (US4.1/US4.2、US5.1/US6.4補助): 基準commit・実差分・installedVersion・tarball/core/guest/sourceのdigests、commands/browser/stdout/stderr/code/失敗分類をU4へ提供。local packは公開済みRC受入れへ再ラベルしない。AC4.1.1–3/AC4.2.1–4をsource/testに対応させ、全変更パスsource-manifest、code-summaryを作成しsensorと独立reviewを行う。

## Constraints and Acceptance

新規通常実装は層ごと実装→テスト。不具合を発見した場合は再現Red→修正Green→Refactor。DB/repository/HTTP API追加は非該当。Session内部表やEmscripten factoryの知識をadapterへ拡散させない。最新toolは実行前に公式releaseを再確認し、取得版/commitを固定して記録する。変更のないaubeは再ビルドしない。更新により候補が変われば古い結果を再利用しない。

mainだけがbuild/testを逐次実行。probe600秒、aube browser840秒、pitchfork browser600秒/Node120秒、1worker、retry0、wasm1GBを維持。既存terrarium configのCI retry1をU3 configへ引き継がない。追加guest/network/daemon/汎用shell/JIT/UI再設計/実機Safari必須化を追加しない。push・タグ・npm/JSR・Pages公開はこの計画承認に含めない。

## Risks and Unverified Items

- 外部repo書込み/依存install/既存状態、基準commitに対する実行差分、U3 runner/bundle、実Pages iframe、全体coverage/CI、公開済みRC受入れは未検証。
- U2 R-01/R-02は未解消の公開前事項。fresh candidateの実測は有効だが一般producer/collectorの修正完了ではない。
- 現terrarium memoryは旧Emscripten/no-emulator設計を記載する。本intentで人間が承認したcommon runtime移行を優先し、範囲外の戦略変更を加えない。
- 独立review前にsource-tree複製の再現fixtureを作らず、source fingerprintを凍結する。review後の修正はnative owning revision経路へ戻す。

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "team",
  "ordering": "通常の新規実装は各テスト可能な層を実装した後にその層のテストを作成・実行し、不具合修正は再現テストの失敗を先に観測してから修正し同じテストの成功を確認する。（人間の回答 Q3）",
  "scope": "classic",
  "test_strategy": "standard",
  "project_type": "brownfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "- **Methodology**: test-after\n- **Ordering**: 通常の新規実装は各テスト可能な層を実装した後にその層のテストを作成・実行し、不具合修正は再現テストの失敗を先に観測してから修正し同じテストの成功を確認する。（人間の回答 Q3）\n- node:test と Playwright の既存結合テストを利用する（検証済み：package.json scripts、code-quality-assessment.md）。今回の成功結果・coverage 値は未検証。\n- classic の追加条件は行 coverage 80%以上と統合前 CI 実行（ドキュメント根拠：org.md Testing Posture）。基準を下げて通過させない。\n- coverage の技術提案（未実装・未検証）：第一者が保守する配布 JS 全体（既存 runtime の未変更ファイル、共通処理、公開 API、Node/browser Worker adapter を含む）の一覧を事前に固定し、未実行ファイルも分母に含める。tests、生成 blink JS/wasm、第三者/vendor、ゲスト ELF、.d.ts、デモ・開発専用 scripts は理由を明示して対象外とし、資産・型・回帰検証を別途行う。設計で配布対象を確定し、閾値達成のために除外を変更しない。\n- Worker/ブラウザ内の計測を収集・マージし、対象一覧と照合して欠落を検出する。未収集ファイルを分母から外さず0%または未測定として失敗／未検証を報告する。計測方式は担当者が未importファイル・別process/realmを含む試験を観測して選ぶ。対象一覧、除外理由、行数、レポート、実行コマンドを CI 成果物へ残す。ブランチ coverage の新しい数値条件は追加しない。\n- 既存上限は probe 600秒、aube ブラウザ840秒、1worker、retryなし、probe 8項目全通過、native 出力一致、wasm 1GB。テストは main session が逐次実行する（人間の指示：AGENTS.md）。\n- aube はソースが変わっていなければ再ビルドしない。計測は重い並行処理なしで行う。新しいコア不具合の回帰 probe は native Linux でも確認する。\n- npm tarball の import/Worker/型/wasm・notices・build-info の同梱確認は設計候補（推測・未検証）。ゲストと fixture は terrarium 側の ref 別配布という既存意図を維持する。"
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
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
  "input_sha256": "sha256:dd7d634a9c475bfe0b7fdd87b1566bd3f238a9b0ead389ae268b08de9bf333f2",
  "contract_sha256": "sha256:ce013e1551c9c06de1a756c04942d606c8dffe82caf0ae8422f95df28968c638"
}
```
