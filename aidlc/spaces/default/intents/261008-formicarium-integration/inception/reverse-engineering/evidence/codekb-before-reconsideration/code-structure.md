# コード構造（focused merge）

## Package Organization

| 深い解析の分類 | 所在・責務 |
| --- | --- |
| 接続 | `src/formicarium-session.ts`、`catalog.ts` |
| 要素・exports | `src/terminal.ts`、`index.ts`、`npm.ts` |
| 配置 | `scripts/stage-formicarium.mjs`、`assemble-pages.sh` |
| ページ・iframe | `web/terminal.mjs` |
| 依存・型 | package/lock/JSR/TS configs、`mise.toml` |
| 検証 | formicarium unit suites、Playwright config、element/iframe/server/host fixtures |
| CI | `test-terrarium.yml`、`test-e2e.yml` |

ファイル単位の完全な deep 一覧は timestamp に一度だけ記録する。runtime/fixtures/その他 scripts/legacy Session と旧 tests は shallow。

## Code Patterns

public Session を注入可能な adapter、型による公開契約、単調 output sequence、queue recovery、接続世代で lifecycle を制御する。legacy のファイル保持方式は下記の旧記録であり今回再検証しない。

根拠: [開発者スキャン](../../intents/261008-formicarium-integration/inception/reverse-engineering/developer-scan.md)。現在の深い解析範囲は [解析時点](reverse-engineering-timestamp.md)、検証証拠と制約は [品質](code-quality-assessment.md)。

再調査根拠: exact25 snapshot 後の全25ファイル再読・raw SHA25/25一致、旧source/candidate再比較64/64一致。[再調査記録](../../intents/261008-formicarium-integration/inception/reverse-engineering/evidence/exact-scope-rescan-verification.json)。今回新規テスト実行なし。

## Prior Knowledge (historical, shallow outside current focus)

以下は `261004-pitchfork-continuation` の記述を保持したもの。旧 deep coverage は UNVERIFIED のため今回の verified deep 範囲に継承しない。現行 focus については上の記述を優先する。

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
