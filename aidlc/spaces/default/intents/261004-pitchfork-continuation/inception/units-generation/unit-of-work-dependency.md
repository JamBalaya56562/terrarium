# 作業単位の依存関係

## Dependency DAG

以下は「左の単位が右の単位を必要とする」依存関係。優先順位や推奨ビルド順ではない。

- `u1-pitchfork-runtime`: 単位への依存なし。
- `u2-pitchfork-terminal` depends on `u1-pitchfork-runtime`。
- `u3-pitchfork-ci` depends on `u1-pitchfork-runtime` and `u2-pitchfork-terminal`。

```yaml
units:
  - name: u1-pitchfork-runtime
    kind: packaging
    depends_on: []
  - name: u2-pitchfork-terminal
    kind: ui
    depends_on: [u1-pitchfork-runtime]
  - name: u3-pitchfork-ci
    kind: packaging
    depends_on: [u1-pitchfork-runtime, u2-pitchfork-terminal]
```

文章による図の代替: U1は外部CLIソースと既存ランタイムを使い、ビルドと基本実行を提供する。U2はU1のビルドを各入口につなぐ。U3は両方の成果物をCIからビルド・検証し、結果をPRへまとめる。三単位間に逆向きの依存はなく、循環はない。

## Integration Points

| 接続 | 契約・受け渡す物 | 所有者／失敗時の扱い |
| --- | --- | --- |
| U1 → U2 | `tools.json`、`dist/builds.json`、pitchfork JS/Wasm、fixtureのpath-to-text map | U1が生成・登録、U2がCatalogで選択。未知ツール/ref・読込失敗は既存エラー契約を維持 |
| U1 → U3 | build/ref/stageスクリプト、パッチ、対象commit、基本セッションとその証拠 | U1が実行物を所有、U3がCIから呼ぶ。ビルド失敗・証拠不足は合格としない |
| U2 → U3 | 公開ページ、`chooseBuild`／`run`、終了イベント、iframe postMessage、各入口の受入シナリオ | U2が入口を所有、U3が共通E2Eへ組み込む。終了結果と期待出力をコマンドごとに確認 |

新しいAPI・共有サーバー状態は導入しない。セッションディスクは既存Sessionの責務で、fixtureと配布メタデータは上記の単一所有に従う。

## Integrated First Unit

依存のないU1は基本ブラウザ実行までを含む統合単位。既存端末要素と静的ホストでstaging済みpitchforkを直接選択して実行できる範囲とし、U2の新しい選択UIやU3の全CI構成を前提にしない。詳細な実行手順はCode Generationで定義する。ブラウザでの実際の合格は現時点では未検証。

## Parallel Development Opportunities

この三単位には独立した組はない。既存のserial設定を維持する。単位内の読取・文書化を同時に行えることと、計測時に並行負荷を避けることは別に扱う。経済的な優先順位とcritical pathは決めない。

## Sources

`units-generation-questions.md` の承認済み分割計画と `unit-of-work.md`。既存JSON／API契約は `../../../../codekb/terrarium/api-documentation.md`、完了条件は `../requirements-analysis/requirements.md`。
