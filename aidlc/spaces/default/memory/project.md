# Project-Level Rules

> Project-specific specialisation and corrections. Loaded after `org.md` and
> `team.md` as strict-additive guidance; contradictions with broader policy
> are rejected. Populated by practices-discovery and the self-learning loop.
>
> Use sparingly: most teams don't need a project layer. Reach for it
> only when this specific project needs stable, durable guidance beyond the
> team practice (for example, package-specific release checks or an additional
> regression suite for a legacy component).

## Way of Working

<!-- Project-specific specialisation. Example: -->
<!-- This monorepo requires package-scoped branch names and a package owner -->
<!-- review in addition to the team's normal merge policy. -->

## Walking Skeleton

<!-- Project-specific specialisation. Example: -->
<!-- The walking skeleton must exercise the legacy service adapter as well -->
<!-- as the new service boundary. -->

## Testing Posture

<!-- Project-specific specialisation. -->

## Guard Policy

<!-- Project-specific. Mode: strict, relaxed, or off. Strict here holds for every intent and cannot be changed from chat. A section under the retired Change Control heading, written by an earlier release, is still read. -->

## Deployment

<!-- Project-specific specialisation. -->

- 公開先は GitHub Pages の `gh-pages` ブランチ（`web/`、`runtime/session.mjs`、ステージ済みの `web/dist/`）。`web/dist/` はビルド成果物であり `main` にはコミットしない。
- `gh-pages` は `.github/workflows/pages.yml` が書き込む。手動実行で任意の ref（ブランチ、タグ、コミット、`pr-<n>`）をビルドし、毎日 aube の `main` をビルドする。デプロイのたびに `gh-pages` を 1 コミットに書き換える。
- COOP/COEP ヘッダーは `web/coi-serviceworker.js` が付与する。ヘッダーを設定できないホストでも動くことが前提。
- 詳細: `aidlc/spaces/default/knowledge/aidlc-shared/build-and-deploy.md`

## Code Style

<!-- Project-specific specialisation. -->

## Tech Stack

<!-- Technology choices locked for this project. -->

- 対象 CLI はソースから `wasm32-unknown-emscripten` 向けにコンパイルする（WASI ではなく Emscripten を選んだ理由は `knowledge/aidlc-shared/portability.md`）。
- ランタイムは Emscripten 自身の JavaScript ランタイム。不足分は `runtime/`（`syscalls.c`、`libterrarium.js`）で補う。
- スレッドは Emscripten pthreads（nightly Rust、`-Zbuild-std`、`+atomics`、`-sPROXY_TO_PTHREAD`）。
- 依存クレートへの変更は `patches/` のパッチとして持ち、`scripts/vendor-patched.sh` で適用する。対象ツール自身のコードは変更しない。
- ブラウザ端末は xterm.js。Node.js 実行（`runtime/run-node.mjs`）とブラウザ（`web/terminal.mjs`）は同じ `runtime/session.mjs` を共有する。

## Decided

<!-- Decisions made in earlier stages that should not be re-asked. -->
<!-- Format: DECIDED: [decision] (Stage [slug], [date]) -->

- DECIDED: すべてブラウザ内で実行し、サーバー側では何も実行しない (design discussion, 2026-10-02)
- DECIDED: ディストリビューションではなく 1 つの CLI だけを動かす。汎用シェルや任意バイナリは提供せず、端末組み込みは `ls` / `cat` / `rm -rf` / `cd` のみ (design discussion, 2026-10-02)
- DECIDED: エミュレーターもカーネルも使わず、CLI が使うシステムコールだけを提供する (design discussion, 2026-10-02)
- DECIDED: Vivarium とは別リポジトリとし、Vivarium が terrarium を利用する (design discussion, 2026-10-02)
- DECIDED: terrarium の目的は CLI をウェブ上で使えるようにすることだけ。ページは 1 つの端末で 1 つのビルドを動かし、ビルドは URL（`?ref=`）で選ぶ。修正前後の並列表示やバグ再現の説明は Vivarium の役目で、terrarium には置かない (user correction, 2026-10-04)
- DECIDED: 提供方法は複数用意する（リンク、カスタム要素 `<terrarium-terminal>`、iframe）。実装は要素 1 つにまとめ、ページと iframe はその上に作る。iframe の入口は残す (user decision, 2026-10-04)
- DECIDED: 1 コマンド 1 プロセス、1 セッション 1 ディスク。各コマンドは新しいインスタンスで起動し、ディスクから初期化して終了時に書き戻す (design discussion, 2026-10-02)
- DECIDED: 当面の非ゴールはネットワークアクセス、Node.js の実行（ライフサイクルスクリプト含む）、aube 以外のツール (design discussion, 2026-10-02)
- 未決事項は `knowledge/aidlc-shared/design.md` の Open questions を参照。議論ではなく計測で決める。

## Scope Overrides

<!-- Custom scope rules for this project. -->

## Forbidden

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: NEVER [behavior] (affirmed [date]) -->
<!-- Example: NEVER throw exceptions across service layer boundaries (affirmed 2026-05-17) -->

## Mandated

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: ALWAYS [behavior] (affirmed [date]) -->
<!-- Example: ALWAYS use Result<T,E> for fallible operations in service layer (affirmed 2026-05-17) -->

## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
