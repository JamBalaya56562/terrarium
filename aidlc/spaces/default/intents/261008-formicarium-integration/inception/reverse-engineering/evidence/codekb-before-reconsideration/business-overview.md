# terrarium の目的（formicarium focused merge）

## Business Domain

一つの CLI ビルドをブラウザ端末で使う静的ページ・埋め込みライブラリ。比較・バグ説明は Vivarium が担当する。

## Purpose

今回の目的は既存 formicarium npm 接続のレビューと証拠保存。実装・候補 bytes を保持し、兄弟 intent `261006-npm-terrarium-release` に関連づけられる知識を残す。公開・push・戦略変更を行わない。

## Key Functionality

現行 aube/pitchfork の要素・iframe 経路は formicarium adapter を使用。catalog 選択、fixture/cwd 初期化、制限付きコマンド、出力と終了イベント、切替・disconnect 時の破棄を提供する。その他 tool は legacy loadTool 分岐が残る。公開 RC や Pages 動作を立証したという意味ではない。

根拠: [開発者スキャン](../../intents/261008-formicarium-integration/inception/reverse-engineering/developer-scan.md)。現在の深い解析範囲は [解析時点](reverse-engineering-timestamp.md)、検証証拠と制約は [品質](code-quality-assessment.md)。

再調査根拠: exact25 snapshot 後の全25ファイル再読・raw SHA25/25一致、旧source/candidate再比較64/64一致。[再調査記録](../../intents/261008-formicarium-integration/inception/reverse-engineering/evidence/exact-scope-rescan-verification.json)。今回新規テスト実行なし。

## Prior Knowledge (historical, shallow outside current focus)

以下は `261004-pitchfork-continuation` の記述を保持したもの。旧 deep coverage は UNVERIFIED のため今回の verified deep 範囲に継承しない。現行 focus については上の記述を優先する。

# terrarium の目的

## Business Domain

ドキュメント根拠: `aidlc/spaces/default/memory/project.md`。CLI をブラウザ端末で利用するライブラリと静的ページ。比較やバグ説明は利用元の Vivarium が担当する。

## Purpose

公開ページと埋め込み利用者が、一つの端末で一つの CLI ビルドを実行する。サーバー実行、汎用 OS、ネットワークアクセス、Node.js ライフサイクルスクリプトは対象外。

## Key Functionality

ドキュメント根拠: 開発者の `../../intents/261004-pitchfork-continuation/inception/reverse-engineering/developer-scan.md`。カタログ選択、fixture 初期化、コマンド実行、セッション内ファイル保持、カスタム要素と iframe 連携を提供する。API は [api-documentation.md](api-documentation.md)。

今回の継続対象は pitchfork v2.29.0 のスーパーバイザー不要コマンド。デーモン起動・監視は含めない。実行証拠と未検証項目は [code-quality-assessment.md](code-quality-assessment.md)。
