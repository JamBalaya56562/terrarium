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
