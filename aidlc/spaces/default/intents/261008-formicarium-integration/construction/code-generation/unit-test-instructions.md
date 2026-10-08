# formicarium統合の検証手順

## Runnerと前提条件

Bunは mise 管理を使う。固定 formicarium tarball / manifest / resolver / guest 全ref を明示ディレクトリとして渡し、prepareで検証してから installする。公開RCや隣接checkoutを前提にしない。lockfileはversion 1を保つ。検証サイトは既存 .site 以外の新しい出力ディレクトリに置き、そのパスを両Playwright configへ渡す。

現時点で存在する runner readiness コマンド（packages/terrarium から）:
`mise exec -- bun test ./tests/formicarium-session.test.ts ./tests/formicarium-catalog.test.ts ./tests/formicarium-assets.test.ts`

実装後の新規入力テスト:
`mise exec -- bun test ./tests/formicarium-inputs.test.ts`

配置層:
`mise exec -- bun test ./tests/formicarium-assets.test.ts`

境界回帰:
`mise exec -- bun test ./tests/formicarium-session.test.ts ./tests/formicarium-catalog.test.ts`

これらはこの変更のexact filesに限定する。入力準備と検証結果を evidence/ に保存し、不足入力は非ゼロで報告する。

## ブラウザとCI相当確認

packages/terrarium から、TERRARIUM_BUNにmise解決したBun、TERRARIUM_SITE_DIRに新サイトの絶対パスを渡して実行する。legacy用にはlegacy buildを含む別出力を準備する。環境変数の具体値と生成物identityは実行記録に残す。

専用:
`mise exec -- bun x playwright test --config playwright.formicarium.config.ts e2e/formicarium-terminal.spec.ts e2e/formicarium-iframe.spec.ts --workers=1 --retries=0`

legacy:
`mise exec -- bun x playwright test --config playwright.config.ts e2e/terminal.spec.ts e2e/pitchfork.spec.ts --workers=1 --retries=0`

legacyのexact filenamesは現在の実在ファイルと照合済み。専用3projectを全て実行し、cross-origin refusalの既存仕様を変えない。ブラウザ準備不足・skip・timeoutは失敗または未実行として残す。CI相当の型検査・全既存unit・build・lintはplan Step 8の回帰確認として別途実行記録に残す。

## ケース・データ・品質

新規入力準備テストは正常明示入力、入力なし、tarball/manifest/resolverのdigest不一致、必要asset欠落、path escapeを最低限対象にする。配置層は全ref保持、旧ref欠落、guest改変を既存テストで継続確認する。FR1/NFR4は基準の保存・再照合、FR4は新旧identityと結果の対応で検証する。

入力負例には一時dir内のsynthetic assetsを使う。runtime executionのE2Eは実固定pack/guestで実行し、runtimeをmockしない。全入力はdigest固定し、候補・receiptを再利用して新テスト合格に見せない。少なくとも新コンポーネント正常1件と2種類のerrorを検証する。express/Minimalに追加coverage floorはなく、既存suiteに新規失敗0件が目標。旧coverageの観測を新候補へ転記しない。

## 結果保存

## 既存2件の追加修正検証

以下はpackages/terrariumをcwdとして実行する。Bun/nodeはmiseを通し、Mac標準bash3.2とBSD patchの実行ファイル・versionを記録する。

限定回帰: `mise exec -- bun test ./tests/pitchfork-runtime.test.ts ./tests/pitchfork-build-retry.test.ts`

全unit: `mise exec -- bun run test`。zero-Unitの単一実装iterationでの全既存suite回帰に限り、複数Unitごとの反復には使用しない。

shell検査（workspace root）: `mise exec -- shellcheck scripts/resolve-ref.sh scripts/build-pitchfork.sh`

PR表記3種類で同じhead endpointとmetadataを検証する。patchは未適用の初回、vendor失敗後の適用済み再試行、不一致入力の失敗とmarker不在を実shellで確認する。既存assertionsを維持し、GNU工具への置換やskipをMac合格の代用にしない。独立tempでも同じ全unitを実行し最新sourceとのbyte一致を保存する。

コマンド、exit code、出力、実行対象source/candidate/input digestをこの段階のevidenceへ保存する。生成物は新しいignored outputに置く。単独一時作業場所での成功と入力不足・不一致での失敗を別々に記録し、基準不変の照合を行う。外部CI入力URLの配備やremote CIは未実行として引継ぐ。

実走cwdは packages/terrarium。Bunは ./tests の明示パスで起動し、evidence/baseline の保存コピーを探索させない。型検査・buildは mise exec node@26 -- を明示する。
