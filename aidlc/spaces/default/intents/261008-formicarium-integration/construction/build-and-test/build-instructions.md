# Build Instructions

## 前提と入力

Bunとnode@26はmiseで解決する。固定16ファイルの入力は`.vendor/formicarium-export`を明示し、descriptorで検証してからfrozen installする。既存`.site`、前回候補、code-generation証拠は上書きしない。

## 実行

workspace rootで `mise exec node@26 -- bun scripts/prepare-formicarium.mjs --from .vendor/formicarium-export`。
packages/terrariumで `mise exec node@26 -- bun install --frozen-lockfile`、`mise exec node@26 -- bun run typecheck`、`mise exec node@26 -- bun run build`。
rootで `mise exec node@26 -- bash scripts/assemble-pages.sh .vendor/build-test-formicarium formicarium`、`mise exec node@26 -- bash scripts/assemble-pages.sh .vendor/build-test-legacy legacy`。legacyには既存固定aube v2.6.1/pitchfork v2.29.0を使用し、identityを記録する。

## 確認と復旧

evidence/commands.jsonにcwd、argv、exit、実行時間、raw logを保存する。入力なし/digest不一致は非ゼロで停止する。Node不足はmiseでnode@26を指定し、ブラウザserver権限不足は同じコマンドをhost実行する。期待値・skip・品質条件は緩和しない。
