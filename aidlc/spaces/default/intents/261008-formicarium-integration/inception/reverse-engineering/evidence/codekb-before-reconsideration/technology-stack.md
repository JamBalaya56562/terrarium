# 技術スタック（現行 focus）

## Languages and Toolchain

TypeScript/JavaScript、Web Components、browser Worker、Bun/TypeScript/mise を使用。package 0.1.0。mise tools は latest 指定で厳密 pin ではない。インストール済み version・脆弱性調査は行っていない。

## Frameworks and Libraries

現行 lock 解決: xterm 6.0.0、addon-fit 0.11.0、Playwright 1.63.0、TypeScript 7.0.2、Bun types 1.4.2。formicarium 0.1.0-rc.1 は local tarball dependency であり公開済み RC の証明ではない。旧 Emscripten toolchain 記録は shallow/historical として保持する。

根拠: [開発者スキャン](../../intents/261008-formicarium-integration/inception/reverse-engineering/developer-scan.md)。現在の深い解析範囲は [解析時点](reverse-engineering-timestamp.md)、検証証拠と制約は [品質](code-quality-assessment.md)。

再調査根拠: exact25 snapshot 後の全25ファイル再読・raw SHA25/25一致、旧source/candidate再比較64/64一致。[再調査記録](../../intents/261008-formicarium-integration/inception/reverse-engineering/evidence/exact-scope-rescan-verification.json)。今回新規テスト実行なし。

## Prior Knowledge (historical, shallow outside current focus)

以下は `261004-pitchfork-continuation` の記述を保持したもの。旧 deep coverage は UNVERIFIED のため今回の verified deep 範囲に継承しない。現行 focus については上の記述を優先する。

# 技術スタック

## Languages and Toolchain

ドキュメント根拠: スキャンで読まれた manifest／CI。現在のインストール済みバージョンを示す表ではない。

| 技術 | 宣言・用途 |
| --- | --- |
| TypeScript / JavaScript | package とブラウザ／Node アダプター |
| Rust / C | 外部 CLI、std/crate patch、syscall 補完 |
| Bun | パッケージ管理、bundle、unit tests。manifest >=1.2.0 |
| Node | runner。manifest >=24 |
| Emscripten | CI 6.0.10、`wasm32-unknown-emscripten`、pthreads |
| Rust nightly | std patch `nightly-2026-10-01`、`-Zbuild-std` |
| mise / jj | タスクとツール管理／SCM |
| OpenTofu / GitHub Actions / Pages | リポジトリ設定／CI／静的配布 |

## Frameworks and Libraries

JS 依存の宣言範囲は [dependencies.md](dependencies.md)。外部ツールの今回の対象は pitchfork v2.29.0。パッケージ自身は `@aletheia-works/terrarium` 0.1.0。
