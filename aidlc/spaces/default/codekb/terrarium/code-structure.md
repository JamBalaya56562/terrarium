# コード構造

## Package Organization

ドキュメント根拠: 開発者スキャンのリポジトリ一覧。深い読取範囲は [reverse-engineering-timestamp.md](reverse-engineering-timestamp.md)。

| パス | 分類・目的 |
| --- | --- |
| `packages/terrarium/` | TypeScript パッケージ、Catalog、Session、端末要素、unit/E2E |
| `web/` | 静的ページ、iframe 入口、ツール登録、サービスワーカー |
| `runtime/` | C syscall、Emscripten JS 補完、Node runner |
| `scripts/` | ref 解決、コンパイル、vendoring、staging、サイト組立 |
| `patches/` | Rust std、依存クレート、ツール自身のパッチ |
| `fixtures/` | 初期ファイルと記録コマンド |
| `.github/` / `mise-tasks/` | CI と検証タスク |
| `infra/` | OpenTofu 設定（一覧のみ） |
| `aidlc/` / ハーネス各ディレクトリ | ワークフロー・判断・知識 |

## Code Patterns

Catalog の JSON 契約、Session の Tool/FS インターフェース、ツール別アダプターを境界とする。依存関係は [dependencies.md](dependencies.md)。AI-DLC 設定追加と pitchfork 実装は別変更として保持する。
