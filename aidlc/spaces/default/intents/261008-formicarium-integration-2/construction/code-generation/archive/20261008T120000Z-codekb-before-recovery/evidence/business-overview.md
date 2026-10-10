# terrarium の目的

## Business Domain
一つのCLIを一つのブラウザ端末で使う静的ページ・埋め込みライブラリ。比較とバグ説明はVivarium側の責務。

## Purpose
既存formicarium統合を正式レビューし、現在sourceに結び付く検証と識別可能な結果をformicarium intent 261006-npm-terrarium-releaseのU3へ返す。既存履歴を保持し、公開・push・PR作成は行わない。

## Key Functionality
guest宣言付きbuildは内部adapterからpublic formicarium Sessionへ接続し、宣言なしbuildはlegacy Emscripten経路を維持する。catalog選択、fixture/cwd、組込みコマンド、端末イベントとiframeを提供する。現行接続の観測はarchitecture方針変更の承認ではない。

根拠: [開発者引継ぎ](../../intents/261008-formicarium-integration-2/inception/reverse-engineering/developer-scan.md)。深い解析の個別23pathは[解析時点](reverse-engineering-timestamp.md)、証跡の適用性は[品質](code-quality-assessment.md)。

## Preserved Prior Store (historical; not current verification)

以下は前storeの文章を保存した履歴。今回範囲外の深い解析はshallowへ降格した。「現行」「確認済み」等は元intent時点の表現で、今回のfresh合格・承認を意味しない。上の今回評価を優先する。

# terrarium の目的（formicarium focused merge）

## Business Domain

一つの CLI ビルドをブラウザ端末で使う静的ページ・埋め込みライブラリ。比較・バグ説明は Vivarium が担当する。

## Purpose

今回の目的は既存 formicarium npm 接続のレビュー、直前の検証証拠の現行適用性確認、解消可能な懸念の再検討。実装・候補 bytes を保持し、兄弟 intent `261006-npm-terrarium-release` に関連づけられる知識を残す。公開・push・戦略変更を行わない。

## Key Functionality

現行 aube/pitchfork の要素・iframe 経路は formicarium adapter を使用。catalog 選択、fixture/cwd 初期化、制限付きコマンド、出力と終了イベント、切替・disconnect 時の破棄を提供する。その他 tool は legacy loadTool 分岐が残る。公開 RC や Pages 動作を立証したという意味ではない。

根拠: [開発者スキャン](../../intents/261008-formicarium-integration/inception/reverse-engineering/developer-scan.md)。現在の深い解析範囲は [解析時点](reverse-engineering-timestamp.md)、検証証拠と制約は [品質](code-quality-assessment.md)。

再調査根拠: exact25 snapshot 後の全25ファイル再読・raw SHA25/25一致、直前のimported source/candidate再比較64/64一致。[再調査記録](../../intents/261008-formicarium-integration/inception/reverse-engineering/evidence/exact-scope-rescan-verification.json)。今回新規テスト実行なし。

## Prior Knowledge (historical, shallow outside current focus)

以下は `261004-pitchfork-continuation` の記述を保持したもの。旧 deep coverage は UNVERIFIED のため今回の verified deep 範囲に継承しない。現行 focus については上の記述を優先する。

## terrarium の目的

### Business Domain

ドキュメント根拠: `aidlc/spaces/default/memory/project.md`。CLI をブラウザ端末で利用するライブラリと静的ページ。比較やバグ説明は利用元の Vivarium が担当する。

### Purpose

公開ページと埋め込み利用者が、一つの端末で一つの CLI ビルドを実行する。サーバー実行、汎用 OS、ネットワークアクセス、Node.js ライフサイクルスクリプトは対象外。

### Key Functionality

ドキュメント根拠: 開発者の `../../intents/261004-pitchfork-continuation/inception/reverse-engineering/developer-scan.md`。カタログ選択、fixture 初期化、コマンド実行、セッション内ファイル保持、カスタム要素と iframe 連携を提供する。API は [api-documentation.md](api-documentation.md)。

今回の継続対象は pitchfork v2.29.0 のスーパーバイザー不要コマンド。デーモン起動・監視は含めない。実行証拠と未検証項目は [code-quality-assessment.md](code-quality-assessment.md)。
