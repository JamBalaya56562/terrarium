# 公開RC受入れ focused scan: api-documentation

## External APIs

package root exportsはbrowser要素、/sessionはlegacy Session。内部FormicariumSessionは公開exportsの置換ではない。要素ready/run/transcript/focusとready/exit/error、iframe terrarium:runと通知を扱う。

## Internal APIs

FormicariumSession.create/run/reset/dispose、resolveChoice、formicariumAssets。public Browser createSessionへentriesを渡しsetCwd/run/readFile/listEntries/remove/reset/disposeを利用。default timeout 600000ms、AbortSignal、literal quotingを扱う。

## Failure Behaviour

shell expansion/pipeをINVALID_INPUTとして拒否、unknown command127、通常missing file1。queueは失敗後再利用。選択identity不一致、package/guest digest違いは候補配置前拒否。候補APIはcompleted_readyのみ成功で未解決履歴は拒否。

根拠: [今回の開発者解析](../../intents/261010-formicarium-rc-acceptanc/inception/reverse-engineering/developer-scan.md)。今回の調査は静的解析のみで、npm取得・導入確認・受入れ試験は未実行。

## 保持した前store本文（historical）

以下は前intentの本文を保持した履歴であり、今回の公開RC実導入・再試験結果ではない。未再読の深いcoverageはshallowへ降格する。

## 現解析: api-documentation

### 現在のAPIと失敗契約

公開Session/Toolと要素ready/run/transcript/focus/eventsは維持する。FormicariumSessionはpublic browser APIを使い、Choice/resolverのtool/ref/commitを照合する。queue・UTF8 stream decoder・generation guard・exact parent originを維持する。candidateTransactionはbuild(work)とcheckpoint境界を持つローカルAPI。completed_readyのみ成功、未完了/不整合履歴は停止する。強制終了後の自動復旧や公開無停止切替は保証しない。

根拠: [今回の解析と検証](../../intents/261008-formicarium-integration-2/construction/code-generation/code-summary.md)。

### 保持した過去の解析（historical）

以下は以前の本文・identityを保持した区画であり、今回の現解析や成功結果の代用ではない。

### API と契約

#### External APIs

要素はready/run/transcript/focusとbubbles/composedのready/exit/error events。npm rootと/session、JSR rootが既存exportsを保持しformicarium adapterは非公開。iframe terrarium:runは実parent sourceとexact originを照合し同originへ通知する。null/wildcard/opaque origin、isolation不足はpreflightで拒否する。

#### Internal APIs

FormicariumSession.create/run/reset/dispose、cwd、lastResult。public createSession/seed/setCwd/run/readFile/listEntries/removeを使用する。guest宣言なしはlegacy、static-musl-x86_64のみformicarium。clean HTTP(S) baseとChoice/resolver tool/ref/commitを照合。fixture未指定と空文字、cwd overrideを区別する。

#### Failure Behaviour

runは直列化、600000ms default timeout、AbortSignal、dispose abort。stdout/stderrを別UTF-8 decoderでcallbackだけから表示する。組込みcd/ls/cat/rm/pwd、unknown127、引用境界を保持する。切替/disconnect後の旧結果は抑止、空runはexitを増やさず失敗queueは復旧する。same-origin Worker条件とunsupported cross-origin iframe拒否を受入条件に含める。

根拠: [開発者引継ぎ](../../intents/261008-formicarium-integration-2/inception/reverse-engineering/developer-scan.md)。深い解析の個別23pathは[解析時点](reverse-engineering-timestamp.md)、証跡の適用性は[品質](code-quality-assessment.md)。

#### Preserved Prior Store (historical; not current verification)

以下は前storeの文章を保存した履歴。今回範囲外の深い解析はshallowへ降格した。「現行」「確認済み」等は元intent時点の表現で、今回のfresh合格・承認を意味しない。上の今回評価を優先する。

##### API と契約（現行 focus）

#### Historical 1: External APIs

`<terrarium-terminal>` は ready/run/transcript/focus と `terrarium-ready/exit/error`。npm `dist/npm.js` と `/session`、JSR `src/index.ts` と `/session` は既存 Session exports を保持し、formicarium adapter は内部接続。iframe 入力 `terrarium:run`、出力 ready/exit/error は exact parent source/origin 照合。未知・opaque・wildcard origin を拒否し、隔離と credentialless support を起動前確認する。

#### Historical 2: Internal APIs

Catalog catalog/choose/describe は tools/builds JSON を読み、未知 tool/ref を拒否、default-first 選択。Formicarium Session は create/run/reset/dispose、public createSession/seed/setCwd/run を使用。fixture 未指定と空指定を区別し cwd だけ override できる。組込み pwd/cd/cat/ls/rm と指定 CLI のみ、既存 splitArgs の引用境界を保持し shell expansion を拒否する。

#### Historical 3: Failure Behaviour

選択・base・tool/ref/commit 不一致は実行前拒否。callback output の重複/順序/UTF-8 境界を制御し、queue は失敗後の次の操作へ回復する。切替/disconnect は古い結果を抑止して dispose。Worker assets は利用ページと同一 origin に置く条件があり、別 origin base だけで動く保証はない。直前に実行された攻撃・拒否経路の証拠は現行bytesと一致する。詳細は quality 参照。

根拠: [開発者スキャン](../../intents/261008-formicarium-integration/inception/reverse-engineering/developer-scan.md)。現在の深い解析範囲は [解析時点](reverse-engineering-timestamp.md)、検証証拠と制約は [品質](code-quality-assessment.md)。

再調査根拠: exact25 snapshot 後の全25ファイル再読・raw SHA25/25一致、直前のimported source/candidate再比較64/64一致。[再調査記録](../../intents/261008-formicarium-integration/inception/reverse-engineering/evidence/exact-scope-rescan-verification.json)。今回新規テスト実行なし。

#### Prior Knowledge (historical, shallow outside current focus)

以下は `261004-pitchfork-continuation` の記述を保持したもの。旧 deep coverage は UNVERIFIED のため今回の verified deep 範囲に継承しない。現行 focus については上の記述を優先する。

#### Historical 4: API と契約

##### Historical 5: External APIs

ドキュメント根拠: 開発者スキャン。端末要素は浅い読取なので詳細なエラー・ライフサイクル契約は未検証。

- `<terrarium-terminal>`: `chooseBuild`、ready/run/focus/transcript。イベント `terrarium-ready`、`terrarium-exit`、`terrarium-error`。
- URL: `tool`、`ref`、`fixture`、`cwd`、`run`、`embed`、`origin`。ツール切替で ref/fixture/cwd/run をリセットする。
- iframe: 入力 `terrarium:run`、出力 `terrarium:ready` / `terrarium:exit` / `terrarium:error`。`web/terminal.mjs` に parent source と parent origin の照合がある（読取根拠、攻撃テスト未検証）。
- 静的 JSON: `tools.json`、`dist/builds.json`、fixture の path-to-text map。アプリケーション HTTP サーバーのエンドポイントはスキャンで発見されていない。

##### Historical 6: Internal APIs

- Catalog: `catalog(base, version)`、`choose(all, {tool, ref})`、`fetchJson`、`versioned`、`describe`。`Choice.catalog` が全ツール／ビルドをページへ渡す。
- Session: `new Session({tool, write, cwd, env})`、`seed(files)`、`run(line): Promise<number>`、`splitArgs`、Tool/FS/disk 型。
- 組込み: `cd`、`pwd`、`rm`、`ls`、`cat`。未知コマンドの 127 は読取根拠。実行証拠は [code-quality-assessment.md](code-quality-assessment.md)。
- ビルド入口: `build-pitchfork.sh <source> <out>`、`resolve-ref.sh <tool> [ref]`、`stage-web.sh <tool> <name> <out>`。

##### Historical 7: Failure Behaviour

Session は各コマンドの終了コードを返す。Node runner は非ゼロを表示するがプロセス終了コードへ伝搬しない（`runtime/run-node.mjs` の読取根拠）。受入判定は runner の exit 0 だけでは足りない。
