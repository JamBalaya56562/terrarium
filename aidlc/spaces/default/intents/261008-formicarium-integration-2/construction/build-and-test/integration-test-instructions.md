# 統合検証

## 対象と実行

MinimalだがFR6により専用・legacyのChromium/Firefox/WebKitを実行する。新候補・CI=1・workers=1・retries=0・新結果dirを明示し、旧serverを再利用しない。

package directoryから、mise管理Bunの絶対pathとroot下の候補絶対pathを指定する。

```sh
mise exec -- bun x playwright test --config playwright.formicarium.config.ts --workers=1 --retries=0 --reporter=json --output <新しい専用結果dir>
mise exec -- bun x playwright test --config playwright.config.ts --workers=1 --retries=0 --reporter=json --output <新しいlegacy結果dir>
```

実行時envはCI=1、FORMICARIUM_INPUTS_ROOT、TERRARIUM_BUN、TERRARIUM_SITE_DIR。専用45pass、legacy34pass/2既存skipが比較基準。失敗/新skipは未解決。旧結果と合算せず、候補inventory・source・入力を前後照合する。

## 契約

session/catalog/terminal/iframe正常系と送信元拒否、timeout/abort/切替破棄、legacy互換を既存unit/E2Eへ対応させる。数値coverage floorは定義されていない。WebKitを実Safari合格と表現しない。
