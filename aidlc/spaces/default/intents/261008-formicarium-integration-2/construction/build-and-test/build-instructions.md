# Build手順

## 前提

mise管理の既存Bun/Nodeとfrozen依存を使う。固定入力は `.vendor/formicarium-inputs-integration-2` の16ファイル。既存入力・候補・履歴は変更しない。公開、push、PR、タグ、deployは行わない。

## コマンド

rootから全体lint、packageから型・全unit・buildを実行する。

```sh
mise run lint:all
cd packages/terrarium
mise exec -- bun run typecheck
mise exec -- bun run test
mise exec -- bun run build
```

各distinct限定unitコマンドはcode-generation/unit-test-instructions.mdの全ブロックを収集し一回ずつ実行する。追加の全unitは既存suiteの維持判定として一回だけ実行し、限定検査件数と合算しない。

## 候補組立

rootで入力先とversionを明示し、新しい出力先だけを組み立てる。

```sh
FORMICARIUM_INPUTS_ROOT=.vendor/formicarium-inputs-integration-2 TERRARIUM_VERSION=integration2-bt-20261008 mise exec -- bash scripts/assemble-pages.sh .vendor/site-formicarium-integration-2-bt
TERRARIUM_VERSION=integration2-bt-20261008 mise exec -- bash scripts/assemble-pages.sh .vendor/site-legacy-integration-2-bt legacy
```

## 証跡と障害

command/cwd/env/time/exit/log SHA、固定入力、現在source、全候補inventoryをverificationへ保存する。入力不足・不一致、未知remnant、既存保持物破損は停止し、旧証拠を修正しない。失敗は結果へ記録して人へ返す。Markdownはno-cache、jj操作はレビュー中に行わない。
