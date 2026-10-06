# 依存関係

## External Dependencies

ドキュメント根拠: package manifest と開発者のパッチ一覧。宣言範囲であり実際の解決バージョンとは区別する。

| JS ライブラリ | 宣言範囲 | 用途 |
| --- | --- | --- |
| xterm | `^6.0.0` | 端末 |
| FitAddon | `^0.11.0` | サイズ調整 |
| Playwright | `^1.63.0` | Chromium/Firefox/WebKit |
| TypeScript | `^7.0.2` | 型検査・build |
| Bun types | `^1.4.2` | 型 |

クレートパッチ一覧: dirs 6/7、if-addrs 0.15.0、interprocess 2.4.4、reqwest 0.13.1、ring 0.17.14、libc 0.2.186、mio 1.2.2/1.2.3、nix 0.31.3、tokio 1.53.1。Rust std と pitchfork v2.29.0 のパッチもある。外部 Cargo.lock の完全な推移グラフは未解析。

## Internal Dependencies

ページと iframe は端末要素を利用し、要素は Catalog/Session と xterm を利用する。Node runner は Session を共有する。ツールビルドは std/tool/crate patch を適用し、staging が配布メタデータを作り、Catalog が消費する。責務とリスクは [component-inventory.md](component-inventory.md)。

## Compatibility Boundaries

`vendor-patched.sh` は Cargo.lock に合わせて crate patch を選び、同名クレートの複数 version は別 key と `package` で扱う。pitchfork tool patch は最新ファイルを選ぶため、v2.29.0 以外の ref 互換は未検証。
