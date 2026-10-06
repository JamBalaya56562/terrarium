# terrarium の目的

## Business Domain

ドキュメント根拠: `aidlc/spaces/default/memory/project.md`。CLI をブラウザ端末で利用するライブラリと静的ページ。比較やバグ説明は利用元の Vivarium が担当する。

## Purpose

公開ページと埋め込み利用者が、一つの端末で一つの CLI ビルドを実行する。サーバー実行、汎用 OS、ネットワークアクセス、Node.js ライフサイクルスクリプトは対象外。

## Key Functionality

ドキュメント根拠: 開発者の `../../intents/261004-pitchfork-continuation/inception/reverse-engineering/developer-scan.md`。カタログ選択、fixture 初期化、コマンド実行、セッション内ファイル保持、カスタム要素と iframe 連携を提供する。API は [api-documentation.md](api-documentation.md)。

今回の継続対象は pitchfork v2.29.0 のスーパーバイザー不要コマンド。デーモン起動・監視は含めない。実行証拠と未検証項目は [code-quality-assessment.md](code-quality-assessment.md)。
