# 公開RCのbuild手順

## Prerequisites

project-pinned miseのNode/npm/Bun、検証済み16入力を使用する。秘密情報・外部公開は不要。

## Commands

rootで`mise run terrarium:rc:prepare`、導入24filesの確認に`mise exec -- node scripts/verify-formicarium-rc.mjs`。固定入力は`.vendor/formicarium-inputs-public-rc1`。

```sh
FORMICARIUM_INPUTS_ROOT=.vendor/formicarium-inputs-public-rc1 mise run terrarium:formicarium-build
```

package cwdで`mise exec -- bun run build`。型はbuild taskに含まれる。入力不足はprepareからやり直し、hashを変更しない。同versionの古い導入物は照合失敗時のみ`bun install --force`で再導入する。
