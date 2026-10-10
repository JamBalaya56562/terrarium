# 統合修正のテスト手順

## Runner と設定

既存 Bun test と packages/terrarium/tests/tsconfig.json を利用する。mise 管理のツールを使う。固定 resolver の準備状態を確認し、手元入力が不足する場合は明記して停止する。新しい閾値や skip は導入しない。Testing Contract は test-after、Minimal、既存 suite を維持する。

## 初回のファイル限定コマンド

workspace root で実行する:

```sh
mise exec -- bun test ./packages/terrarium/tests/formicarium-session.test.ts ./packages/terrarium/tests/formicarium-catalog.test.ts ./packages/terrarium/tests/formicarium-assets.test.ts
```

Step 2 でこれを実行し、runner/依存の使用可能性を確認する。失敗があれば原因と修正必要性を記録する。計画承認前に新しい実装を開始しない。

## 実装後のファイル限定コマンド

```sh
mise exec -- bun test ./packages/terrarium/tests/candidate-transaction.test.ts
mise exec -- bun test ./packages/terrarium/tests/formicarium-assets.test.ts
```

assembly 専用ファイルを作成した場合のみ:

```sh
mise exec -- bun test ./packages/terrarium/tests/assemble-candidate.test.ts
```

既存接続と三ブラウザの検査は Build and Test で新しい対象へ結び付ける。ここに記載する unit コマンドはすべて対象ファイル限定とする。

## 期待値とデータ管理

transaction は正常系、旧候補あり・なしの書込み途中失敗、切替失敗、復旧失敗、清掃失敗、完了記録失敗、正常再実行、中断/欠落/不整合記録、ファイル種類/リンク先の変化を検査する。旧候補 inventory の全件一致と非成功終了、残存物の識別を assertion にする。専有競合と保護先拒否も確認する。assets は入力 digest/identity/provenance の拒否と正確な配置を維持する。

正常系を各変更 component に少なくとも一つ、要件ごとに狭い有効な検査を割り当てる。既存テストを再利用できるものは対応を明記する。数値 coverage floor は今回定義されていないため捏造せず、定義済み品質条件を下げない。

実 filesystem はテスト専用の一時ディレクトリを使う。失敗注入は I/O adapter または境界 callback を使い、通常動作で任意の環境変数による破壊処理を露出しない。fake runtime は既存テストの形を維持する。清掃で削除するのは各テストが作成した領域のみで、既存候補・履歴・固定入力へ触れない。テスト終了後は成功・失敗・skip と理由を保存する。

## 追加修正の限定検査

```sh
FORMICARIUM_INPUTS_ROOT=.vendor/formicarium-inputs-integration-2 mise exec -- bun test ./packages/terrarium/tests/formicarium-inputs.test.ts
```

4workflowの明示必須条件を検査する。固定16ファイルの正常入力と旧・改変入力の拒否は既存prepare/stagingテストを維持・再利用し、不足だけを追加する。ネットワークに依存しない一時入力を使う。CodeKBはcandidate上でMarkdown検査し、本文・過去identity・履歴保全比較と公式CAS成功を確認する。全体検証は新しいログに記録する。

## 保全不具合の再現検査

```sh
mise exec -- bun test ./packages/terrarium/tests/candidate-transaction.test.ts ./packages/terrarium/tests/assemble-candidate.test.ts
```

Step15/16の各実装後に対応テストを追加・実行する。履歴retainedそのものとaliasへの出力を拒否し、過去inventoryが一致したまま元候補で次試行を成功できることを確認する。legacy tools.jsonのsymlinkとref指定を組み合わせ、作業外bytesの不変、非成功終了、旧候補保全を確認する。既存正常系と故障注入を維持し、新しい一時filesystemを用いる。
