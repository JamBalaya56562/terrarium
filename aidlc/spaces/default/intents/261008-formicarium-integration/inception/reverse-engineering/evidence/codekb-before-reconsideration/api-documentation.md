# API と契約（現行 focus）

## External APIs

`<terrarium-terminal>` は ready/run/transcript/focus と `terrarium-ready/exit/error`。npm `dist/npm.js` と `/session`、JSR `src/index.ts` と `/session` は既存 Session exports を保持し、formicarium adapter は内部接続。iframe 入力 `terrarium:run`、出力 ready/exit/error は exact parent source/origin 照合。未知・opaque・wildcard origin を拒否し、隔離と credentialless support を起動前確認する。

## Internal APIs

Catalog catalog/choose/describe は tools/builds JSON を読み、未知 tool/ref を拒否、default-first 選択。Formicarium Session は create/run/reset/dispose、public createSession/seed/setCwd/run を使用。fixture 未指定と空指定を区別し cwd だけ override できる。組込み pwd/cd/cat/ls/rm と指定 CLI のみ、既存 splitArgs の引用境界を保持し shell expansion を拒否する。

## Failure Behaviour

選択・base・tool/ref/commit 不一致は実行前拒否。callback output の重複/順序/UTF-8 境界を制御し、queue は失敗後の次の操作へ回復する。切替/disconnect は古い結果を抑止して dispose。Worker assets は利用ページと同一 origin に置く条件があり、別 origin base だけで動く保証はない。攻撃・拒否経路の歴史テストと新規実行の区別は quality 参照。

根拠: [開発者スキャン](../../intents/261008-formicarium-integration/inception/reverse-engineering/developer-scan.md)。現在の深い解析範囲は [解析時点](reverse-engineering-timestamp.md)、検証証拠と制約は [品質](code-quality-assessment.md)。

再調査根拠: exact25 snapshot 後の全25ファイル再読・raw SHA25/25一致、旧source/candidate再比較64/64一致。[再調査記録](../../intents/261008-formicarium-integration/inception/reverse-engineering/evidence/exact-scope-rescan-verification.json)。今回新規テスト実行なし。

## Prior Knowledge (historical, shallow outside current focus)

以下は `261004-pitchfork-continuation` の記述を保持したもの。旧 deep coverage は UNVERIFIED のため今回の verified deep 範囲に継承しない。現行 focus については上の記述を優先する。

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
