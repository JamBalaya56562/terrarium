# 公開RC受入れ検証の目的

## Problem Statement

formicariumの公開npm版 `@aletheia-works/formicarium@0.1.0-rc.1` をterrariumで受け入れられるか、配布物の同一性と再実行した試験結果に基づいて判断できる状態にする。指定版をnpmから取得し、実際に導入したパッケージを確認する。[desc]

## Target Customer

依頼者とformicarium担当者が検証結果を確認する。個別担当者への追加送信は今回の報告方法に含めない。[Q1] [Q2]

## Success Metrics

- 実際に導入したパッケージのversion、integrity、tarball SHA256を確認した記録がある。[desc]
- tarball SHA256を期待値 `8334d7f14c31109e5be3ec90147aa02105d8d839c4c79eccc1c25cb88eabbb3a` と比較し、一致・不一致が判断できる。[desc]
- Node、Chromium、Firefox、WebKitの受入れ試験を再実行し、各コマンドと結果を記録する。実行していない試験を成功とは記載しない。[desc]
- terrariumの差分を記録し、結果をこのチャットで報告する。[desc] [Q2]

## Initiative Trigger

公開RCの受入れ検証を進めるという今回の依頼を契機とする。旧ローカル配布物の結果だけでは今回指定のnpm取得と再実行の完了にはならない。[desc]

## Initial Scope Signal

- workflow-selected scopeは `poc`。[scope]
- 検証対象は固定版 `@aletheia-works/formicarium@0.1.0-rc.1` とterrariumの受入れ試験。[desc]
- 公開・push・PR作成は行わない。[desc]
- 記録はterrarium内に保存し、このチャットへ報告する。[Q2]

## Assumptions & Open Questions

None.
