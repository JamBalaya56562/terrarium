# 依存関係（現行 focus）

## External Dependencies

`@aletheia-works/formicarium` 0.1.0-rc.1 は package.json と lock の絶対 Mac tarball path を参照する。browser createSession とルート public types を消費する。tarball SHA/manifest SHA は timestamp に保存。その他 JS version は technology-stack 参照。

## Internal Dependencies

terminal → Catalog/Formicarium Session → public formicarium/browser。resolver は `base/formicarium-guest-distribution/resolver.mjs` を dynamic import。staging → installed package ＋兄弟 package manifest/resolver ＋ `FORMICARIUM_GUEST_SITE`。assets tests も兄弟 resolver を import するため独立 checkout だけでは完結しない。

## Compatibility Boundaries

assemble-pages は常時 staging を呼ぶが既存 site:build/旧 E2E workflow は guest-site env を供給しない。既存 Emscripten .js/.wasm catalog と static-musl guest/digest/provenance 配布は暗黙に互換と扱わない。same-origin Worker を要求し、base URL のみで跨 origin 対応とは主張しない。CI入力供給はConstructionで具体化する: immutable package/resolver/guest distributionを入力として固定し、絶対tarball/兄弟pathをportableな契約へ接続する。今回候補のretained assetsは確認済みで、将来のproducer増分追加は別修正対象。

根拠: [開発者スキャン](../../intents/261008-formicarium-integration/inception/reverse-engineering/developer-scan.md)。現在の深い解析範囲は [解析時点](reverse-engineering-timestamp.md)、検証証拠と制約は [品質](code-quality-assessment.md)。

再調査根拠: exact25 snapshot 後の全25ファイル再読・raw SHA25/25一致、直前のimported source/candidate再比較64/64一致。[再調査記録](../../intents/261008-formicarium-integration/inception/reverse-engineering/evidence/exact-scope-rescan-verification.json)。今回新規テスト実行なし。

## Prior Knowledge (historical, shallow outside current focus)

以下は `261004-pitchfork-continuation` の記述を保持したもの。旧 deep coverage は UNVERIFIED のため今回の verified deep 範囲に継承しない。現行 focus については上の記述を優先する。

## 依存関係

### External Dependencies

ドキュメント根拠: package manifest と開発者のパッチ一覧。宣言範囲であり実際の解決バージョンとは区別する。

| JS ライブラリ | 宣言範囲 | 用途 |
| --- | --- | --- |
| xterm | `^6.0.0` | 端末 |
| FitAddon | `^0.11.0` | サイズ調整 |
| Playwright | `^1.63.0` | Chromium/Firefox/WebKit |
| TypeScript | `^7.0.2` | 型検査・build |
| Bun types | `^1.4.2` | 型 |

クレートパッチ一覧: dirs 6/7、if-addrs 0.15.0、interprocess 2.4.4、reqwest 0.13.1、ring 0.17.14、libc 0.2.186、mio 1.2.2/1.2.3、nix 0.31.3、tokio 1.53.1。Rust std と pitchfork v2.29.0 のパッチもある。外部 Cargo.lock の完全な推移グラフは未解析。

### Internal Dependencies

ページと iframe は端末要素を利用し、要素は Catalog/Session と xterm を利用する。Node runner は Session を共有する。ツールビルドは std/tool/crate patch を適用し、staging が配布メタデータを作り、Catalog が消費する。責務とリスクは [component-inventory.md](component-inventory.md)。

### Compatibility Boundaries

`vendor-patched.sh` は Cargo.lock に合わせて crate patch を選び、同名クレートの複数 version は別 key と `package` で扱う。pitchfork tool patch は最新ファイルを選ぶため、v2.29.0 以外の ref 互換は未検証。
