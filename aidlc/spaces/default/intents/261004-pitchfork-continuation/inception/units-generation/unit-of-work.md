# pitchfork追加の作業単位

## Sources

承認済み要件は `../requirements-analysis/requirements.md`。計画と生成内容の確認は `units-generation-questions.md`（Approve Plan / Looks correct）。既存の責務は `../../../../codekb/terrarium/component-inventory.md` と `architecture.md`。Domain Design、User Stories、Delivery Planningは今回の承認済み計画で省略されている。新規のサービス境界・配布方式を導入せず、要件IDから直接対応付ける。

## Unit Definitions

| Unit ID | Directory | Name | kind | 内容 | Deployment | Complexity |
| --- | --- | --- | --- | --- | --- | --- |
| U1 | `u1-pitchfork-runtime` | `u1-pitchfork-runtime` | packaging | v2.29.0ビルド、登録・staging、fixture、既存端末要素による基本実行 | shared / embedded | L |
| U2 | `u2-pitchfork-terminal` | `u2-pitchfork-terminal` | ui | カタログ、ツール選択、公開ページ・要素・iframeの接続 | embedded | M |
| U3 | `u3-pitchfork-ci` | `u3-pitchfork-ci` | packaging | Pages／CIの両ツール対応、全検証・証拠集約、変更分離とPR提出 | shared | M |

Complexityは既存調査に基づく相対見積り（推測）。時間の確約ではない。単位の依存関係は [unit-of-work-dependency.md](unit-of-work-dependency.md)、全要件対応は [unit-of-work-story-map.md](unit-of-work-story-map.md)。

## U1: pitchforkの基本実行

### Responsibilities and Boundaries

Build Distribution、Runtime Extensions、Session、Verification Fixturesの既存構成を利用し、対象ツールのパッチ・ビルドと記録セッションの基本実行を担当する。共通Sessionを新設・再設計しない。基本ブラウザ実行までをこの単位に含めるため、コンパイルだけの単位ではない。

所有ファイル: `scripts/build-pitchfork.sh`、`scripts/resolve-ref.sh`、`scripts/vendor-patched.sh`、必要なstaging処理、pitchfork追加に必要な `patches/`、`web/tools.json`、`fixtures/pitchfork-basic/`、`fixtures/sessions/pitchfork-basic.txt`。共通ランタイム／Sessionへの互換性修正は観測で必要になった場合のみU1が所有する。既存aubeにも関わる共有ファイルは、その回帰を確認する。

### Deliverables and Acceptance

- FR1.1: v2.29.0のパッチ適用とビルドのログ、JS/Wasmの生成を確認する。既存バイナリの存在だけでは合格にしない。
- FR1.2のref解決・staging: 対象commitと配布カタログ／生成物の整合を確認する。
- FR2、FR2.1、FR2.2: 基本fixtureを既存端末要素に読み込み、承認済みの8コマンドすべての終了結果・出力・設定保持を実ブラウザで確認する。Nodeの結果は補助証拠とし、runnerのprocess exit 0だけでは判定しない。
- NFR1、NFR3: 既存のブラウザ内実行・新規インスタンス・共有Sessionを維持し、コマンド別証拠を残す。変更範囲の単体・型検査・lint、既存aubeの対応する回帰も確認する。

### Implementation Notes and Constraints

既存の直接選択APIと静的ホストでU1の統合を検証する。U2のツール選択UIやU3の全CI準備は前提にしない。具体的な実行手順・検証コマンドはCode Generationで提示する。基本ブラウザ動作は現時点では未検証。デーモンの起動・監視、別pitchforkバージョンは追加しない。

## U2: ページと埋め込みへの接続

### Responsibilities and Boundaries

Catalog、Page Adapter、Terminal Elementを担当する。U1の登録・staging済みビルドとfixtureを消費し、既存の公開API・イベント・iframeメッセージを利用する。

所有ファイル: `packages/terrarium/src/catalog.ts`、`web/terminal.mjs`、必要なツール選択表示と単体検証。端末要素・埋め込み側の変更が必要な場合はU2が所有する。U1のビルド・パッチ・fixtureやU3の共通E2Eハーネスを重複所有しない。

### Deliverables and Acceptance

- FR1.2のカタログ選択: pitchforkを指定したとき対象JS/Wasmを選択し、未知ツール／refの既存エラーを維持する。
- FR3、FR3.1、FR3.2: 公開ページ、要素、iframeでFR2の全セッションを実行し、終了結果・出力・設定保持と終了通知を確認する。
- FR4: pitchforkからaubeへの切替で固有のref／fixture／cwd／runを残さず、既存aubeのUI・埋め込み動作を確認する。
- NFR1、NFR3: 非隔離エラー、iframeのsource/origin確認など既存安全境界を維持し、実行証拠を残す。

### Implementation Notes and Constraints

公開ページとiframeは同じ要素を使う。新しい入口・API・認証・サーバーを導入しない。U2自身の受入検証をU3に先送りしない。U3はそのシナリオを共通CIへ組み込み、全構成を再現可能にする責務を持つ。

## U3: CIとレビュー可能な提出

### Responsibilities and Boundaries

Build DistributionのPages経路、Verification Fixturesの共通E2Eハーネス、Repository Infrastructureの該当CIとPR提出を担当する。新しいデプロイ先を作らない。

所有ファイル: `.github/workflows/pages.yml`、`mise.toml`の該当検証タスク、`packages/terrarium/e2e/`とテスト用サーバー／ハーネス。U1・U2の成果物を使用し、全検証ログを集約する。検証で互換性修正が必要になったときは、元の単位のファイル所有に従って修正する。

### Deliverables and Acceptance

- FR1.2のPages経路: ツール別refとビルド・配布メタデータの整合を確認する。
- FR4、NFR2: `mise run lint:all`、`mise run ci:terrarium`、`mise run ci:e2e`がすべて終了コード0となり、Chromium・Firefox・WebKitでpitchfork受入と既存aube回帰が合格する。
- NFR3: FR1–FR4／NFR1–NFR2の証拠を集約し、未検証・失敗を合格として記録しない。
- FR5: jjで変更を適切な区切りに分け、AI-DLC設定追加をpitchfork実装とは別変更にし、Conventional CommitのPRを作成する。差分・コミット・PR URLで確認する。

### Implementation Notes and Constraints

動作確認をモックだけで代用しない。脚本の実行ビットはjjとshell checkで確認する。生成JS/Wasmはmainに含めない。公開タグ・パッケージ公開は行わない。CIへの組込みを理由にU1・U2の受入条件を弱めない。

## Assumptions & Open Questions

None.

## Completion Boundary

これは責務と検証条件の分割であり、実装が完了したという主張ではない。実行合否は後続のテスト・ログによって判定する。経済的な実装優先順位やcritical pathは新たに選ばない。
