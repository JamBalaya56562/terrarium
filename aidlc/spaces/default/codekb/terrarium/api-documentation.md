# API と契約

## External APIs

ドキュメント根拠: 開発者スキャン。端末要素は浅い読取なので詳細なエラー・ライフサイクル契約は未検証。

- `<terrarium-terminal>`: `chooseBuild`、ready/run/focus/transcript。イベント `terrarium-ready`、`terrarium-exit`、`terrarium-error`。
- URL: `tool`、`ref`、`fixture`、`cwd`、`run`、`embed`、`origin`。ツール切替で ref/fixture/cwd/run をリセットする。
- iframe: 入力 `terrarium:run`、出力 `terrarium:ready` / `terrarium:exit` / `terrarium:error`。`web/terminal.mjs` に parent source と parent origin の照合がある（読取根拠、攻撃テスト未検証）。
- 静的 JSON: `tools.json`、`dist/builds.json`、fixture の path-to-text map。アプリケーション HTTP サーバーのエンドポイントはスキャンで発見されていない。

## Internal APIs

- Catalog: `catalog(base, version)`、`choose(all, {tool, ref})`、`fetchJson`、`versioned`、`describe`。`Choice.catalog` が全ツール／ビルドをページへ渡す。
- Session: `new Session({tool, write, cwd, env})`、`seed(files)`、`run(line): Promise<number>`、`splitArgs`、Tool/FS/disk 型。
- 組込み: `cd`、`pwd`、`rm`、`ls`、`cat`。未知コマンドの 127 は読取根拠。実行証拠は [code-quality-assessment.md](code-quality-assessment.md)。
- ビルド入口: `build-pitchfork.sh <source> <out>`、`resolve-ref.sh <tool> [ref]`、`stage-web.sh <tool> <name> <out>`。

## Failure Behaviour

Session は各コマンドの終了コードを返す。Node runner は非ゼロを表示するがプロセス終了コードへ伝搬しない（`runtime/run-node.mjs` の読取根拠）。受入判定は runner の exit 0 だけでは足りない。
