# pitchfork継続作業の分割計画

## Sources

- [requirements] `../requirements-analysis/requirements.md`。承認済みFR1–FR5、NFR1–NFR3。
- [scope] `.codex/scopes/aidlc-pitchfork-continuation.md`。承認済み計画は三つの実装単位を想定している。
- [re] `../../../../codekb/terrarium/component-inventory.md`、`architecture.md`、`code-quality-assessment.md`。既存の責務と未検証事項。
- [project] `../../../../memory/project.md`。共通Session、Emscripten、Pages、公開ページ・カスタム要素・iframeの既決事項。
- [prior] intent-capture、approval-handoff、requirements-analysisの確認ファイル。対象範囲・利用者・報告・PR境界の決定。

## Prior Context and Questions Disposition

Domain DesignとUser Storiesは承認済み計画で省略されているため、`components.md`、`decisions.md`、`stories.md`は未作成。新しい構成を推測して補わず、承認済み既存構成調査を部品の根拠とし、要件IDを直接作業単位へ対応付ける。今回、コンポーネントや独立サービスの追加は提案しない。

一般的な追加質問は None。三単位の想定、既存の配布先・API・セッション契約、serialの実行設定は既存の確認事項を再利用する。下記の具体的な境界を計画として確認する。コミット・PRの区切りはユーザーの既存指示どおりCodexが判断し、AI-DLC設定追加は別変更にする。

## Decomposition Plan

機能を既存の変更責務で分ける。単位は独立した新サービスや別のデプロイ先を意味しない。複雑度は既存調査に基づく推測であり、作業時間の約束ではない。

| Unit ID | Directory / name | kind | 責務・境界 | 主な要件 | 複雑度 |
| --- | --- | --- | --- | --- | --- |
| U1 | `u1-pitchfork-runtime` | packaging | pitchforkパッチ、ビルド・ref解決・staging、ツール登録、基本fixture。既存Sessionと端末要素へ接続し、生成したビルドをブラウザで直接選んで基本セッションを実行できるところまでを含む | FR1.1、FR1.2のref/staging部分、FR2.1、FR2.2、NFR1の基本実行、NFR3の当該証拠 | L |
| U2 | `u2-pitchfork-terminal` | ui | Catalogとページのツール選択、URL切替、カスタム要素・iframe入口。U1の生成物とfixtureを消費し、既存の終了イベント・メッセージ契約とaube切替を維持する | FR1.2のカタログ部分、FR3.1、FR3.2、FR4のUI回帰、NFR1、NFR3の当該証拠 | M |
| U3 | `u3-pitchfork-ci` | packaging | Pagesのツール別ビルド経路、mise／E2Eの両ツール準備、3ブラウザ回帰、自動検証・証拠の集約、jj変更分離とPR作成 | FR1.2のPages部分、FR4の全回帰、FR5、NFR2、NFR3の集約 | M |

### File Ownership

- U1: `scripts/build-pitchfork.sh`、`scripts/resolve-ref.sh`、`scripts/vendor-patched.sh`、必要なstagingのpitchfork対応、pitchfork追加に必要な `patches/`、`web/tools.json`、`fixtures/pitchfork-basic/`、`fixtures/sessions/pitchfork-basic.txt`。共通ランタイム／Sessionは基本的に再利用し、互換性修正が観測で必要になった場合だけU1が持つ。
- U2: `packages/terrarium/src/catalog.ts`、`web/terminal.mjs`、必要なツール選択表示とその単体検証。端末要素・埋め込み契約は既存のものを利用し、変更が必要な場合はU2が持つ。
- U3: `.github/workflows/pages.yml`、`mise.toml`の該当検証タスク、`packages/terrarium/e2e/`とそのテスト用サーバー／ハーネス。全体の検証ログとPR提出の責務。U1・U2の修正が検証で必要になった場合、担当単位のファイルとして区別する。

### Dependencies and Integration Points

- U2 depends on U1。JS/Wasm、ツール／ビルドカタログ、fixtureを既存静的JSON契約で消費する。
- U3 depends on U1 and U2。実行可能な成果物と接続済みの入口を検証する。CIがU1のビルドスクリプトを呼び、E2EがU2の既存API・イベント・postMessageを使う。
- 循環依存はない。独立した単位の組はこの計画ではないため、作業は既存のserial設定に沿う。経済的な優先順位やcritical pathはこの文書で新たに決めない。
- 各単位は既存パッケージ・静的サイト／ビルド配布へ組み込む。独立デプロイ・新規サーバー・API変更は提案しない。

### Integrated First Slice

U1は単にコンパイルするだけでは完了しない。pitchfork v2.29.0をstagingして既存端末要素から読み込み、fixture上の基本セッションを実ブラウザで実行する。これはU2のページ切替UIやU3の全CI構成が完成する前にも、既存の端末要素とホストで検証可能な範囲。詳細な実行コマンドと検証手順はCode Generationの計画で示す。ブラウザ動作は現時点では未検証。

## Plan Approval

上記の三単位と境界、kind、依存関係で作業単位の文書を作成してよいですか？

A. Approve Plan
B. Revise Plan
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

- U1 `u1-pitchfork-runtime`、kind `packaging`: パッチ・ビルド・ref解決・staging・ツール登録・fixtureと、既存端末要素での基本ブラウザ実行を担当する。
- U2 `u2-pitchfork-terminal`、kind `ui`: カタログとツール選択、URL、公開ページ・カスタム要素・iframeの接続を担当する。U1に依存する。
- U3 `u3-pitchfork-ci`、kind `packaging`: Pagesのビルド経路、mise／E2E、3ブラウザとaube回帰、証拠整理、jj変更分離とPR提出を担当する。U1とU2に依存する。
- 既存Session・API・静的配布先を維持し、単位間の循環依存は作らない。各ファイルの担当は上記File Ownershipのとおり。作業は既存のserial設定を維持する。
- 設計・ストーリー作成は承認済み計画で省略されているため、既存構成調査を部品の根拠とし、要件IDを直接単位へ対応付ける。AI-DLC設定追加はpitchfork実装と別変更にする。
- 計画確認の回答: Approve Plan。

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
