# pitchfork 継続作業の要件

## Intent Analysis

公開ページや埋め込み端末の利用者が、pitchfork v2.29.0のスーパーバイザーを要しないコマンドをブラウザで試せる状態にする。中断した変更を仕上げ、実測した合否と再現手順を添えたPRを作成する。新規設計への置き換えは行わない。[desc][intent]

## Sources

- [desc] Initial description: 中断した pitchfork v2.29.0 の追加作業を引き継ぎ、スーパーバイザーを要しないコマンドに限定して既存パッチ・ビルド・fixture・ツール選択画面を仕上げ、ブラウザ実行、lint、CI/E2Eを検証してPRを作成する。AI-DLC設定の追加は別の変更として保持する。
- [intent] `../../ideation/intent-capture/intent-statement.md`。対象・目的・意思決定の承認済み記録。
- [confirmation] `requirements-analysis-questions.md` の Consolidated Summary Confirmation。回答 `Looks correct`。
- [project] `../../../../memory/project.md`。既決事項、技術・配布方針。
- [re] `../../../../codekb/terrarium/`。承認済みの部分調査。具体的な残課題は `code-quality-assessment.md`。
- [fixture] ルートの `fixtures/sessions/pitchfork-basic.txt` と `fixtures/pitchfork-basic/`。
- [agents] ルートの `AGENTS.md`。jj、検証、コミット・PR、公開の規約。

## Functional Requirements

すべて Must。受入条件は後続で実行する仕様であり、以下の記述自体を動作検証の証拠としない。実行結果は現在未検証のものを含む。

### FR1: pitchforkビルドと配布への登録

- **FR1.1**: v2.29.0のソースへterrarium側のツール・依存クレート・stdパッチを適用し、既存Emscripten方式でJS/Wasmを生成できること。[desc][project]
  - Given 対象ソースと記録されたツールチェーン、When `scripts/build-pitchfork.sh <source> <out>` を実行、Then 終了コード0で `pitchfork.js` と `pitchfork.wasm` が生成される。パッチ適用・コンパイルのログと対象ref/commitを残す。既存バイナリの存在だけではこの条件の合格としない。
  - 対象外refのパッチ互換性は保証しない。パッチ・コンパイルが失敗した場合は、その失敗を記録し成功扱いにしない。
- **FR1.2**: ref解決、staging、カタログ、Pagesビルド経路がpitchfork v2.29.0を扱うこと。[desc][re]
  - Given aubeとpitchforkを含む配布データ、When 対象refを解決して生成物をstagingしサイトを組み立てる、Then 各処理が終了コード0となり、カタログのpitchfork選択が該当JS/Wasmを参照する。`web/tools.json` のpitchfork defaultは `v2.29.0`。
  - Given 存在しないツール/ref、When カタログで選択、Then 別ツールへ黙って置換せず既存契約のエラーを返す。既存のカタログ単体テストで照合する。

### FR2: コマンド実行とセッション内設定保持

- **FR2.1**: `pitchfork-basic` を作業ディレクトリ `app` へ初期化し、記録セッションを順番に実行できること。[desc][fixture][confirmation]
- **FR2.2**: コマンド間で設定ファイルとsettings変更を保持すること。[project][fixture]

FR2.1・FR2.2の合格判定は次の全行を満たすこと。各CLIコマンドと `cat` の終了コードは0。空の標準出力が通常の編集コマンドは、後続の読取によって効果を確認する。

| 順序・入力 | 期待結果 |
| --- | --- |
| `pitchfork --version` | バージョン2.29.0を表示する |
| `pitchfork daemons` | fixtureのapiとworkerを表示する |
| `pitchfork daemons add db --run "postgres -D data"` | db定義を追加する。デーモンの起動成功は要求しない |
| `pitchfork daemons remove worker` | worker定義を削除する |
| `cat pitchfork.toml` | apiとdbを含み、worker定義を含まない。dbのrun値は `postgres -D data` |
| `pitchfork status api` | apiの状態としてavailableを表示する。プロセスの起動・監視は検証しない |
| `pitchfork settings set general.interval 5s` | intervalを設定する |
| `pitchfork settings get general.interval` | 設定値5sを返す |

- セッション開始時はfixtureを再投入し、前回の実行結果を混ぜない。終了結果と期待値はコマンドごとに照合する。[fixture][re]
- エラー／境界シナリオ: 未知コマンドの終了コード127、既存のファイル・cwd・env・一時領域・リンク保持のSession単体テストを維持する。runner全体のexit 0だけではFR2の合格判定にしない。[re][agents]

### FR3: 公開ページと埋め込みでの利用

- **FR3.1**: 公開ページのURL・ツール選択からpitchforkのビルドとfixtureを読み込めること。[intent][confirmation][re]
  - Given 両ツールの配布カタログ、When pitchforkを選びFR2のセッションを実行、Then 対象ビルドが起動し、全行の終了結果と期待出力が一致する。
  - ツール切替時は既存のref/fixture/cwd/runリセット仕様を維持する。pitchforkからaubeへ切り替え、pitchfork固有の設定を引き継がずaubeを実行できることを検証する。
- **FR3.2**: 同じ端末要素を利用するカスタム要素とiframe入口でもpitchforkを実行できること。[intent][project][confirmation]
  - Given 各入口を既存の必要な隔離条件で準備、When FR2を実行、Then 各コマンドの終了結果・出力・設定保持が一致する。要素の終了イベント／iframeの終了メッセージが当該コマンドの終了結果を伝える。
  - 非隔離ページでのエラー、およびiframeのsource/origin確認は既存契約を維持し、既存該当テストの合格を記録する。新たな認証・ホスト機能は追加しない。

### FR4: 既存aube動作の維持

- aubeの既存単体テスト・ブラウザシナリオが合格すること。[confirmation][agents]
- Given 既存aube fixture、When 現行のinstall／frozen install／list等のE2Eを実行、Then 既存の終了コード・期待出力・埋め込み検証がすべて合格する。pitchforkだけの成功で代用しない。

### FR5: レビュー可能な変更の提出

- jjで適切な区切りにコミットし、Conventional Commitのタイトルと具体的な検証結果を持つPRを作成する。AI-DLC設定の追加はpitchfork実装とは別変更として保持する。[desc][agents][confirmation]
- PR差分、コミット、PR URLで分離と提出を確認する。実装差分に生成JS/Wasm、秘密情報、リリースタグの発行を含めない。PR説明の最後に使用ツール・モデルを記載する。

## Non-Functional Requirements

### NFR1: 既存実行方式と安全境界

ブラウザ内実行、Emscripten pthreads、共通Session、コマンドごとの新規インスタンスを維持する。サーバー実行や新たなネットワーク対応を追加しない。[project][confirmation]

合格条件: FR3の実ブラウザ検証、既存の隔離エラー／iframe境界テストが合格し、変更差分が上記制約を維持する。性能の数値保証・ホストの可用性保証は本要件では設定しない。

### NFR2: 自動検証と回帰防止

`mise run lint:all`、`mise run ci:terrarium`、`mise run ci:e2e` がすべて終了コード0で合格する。ci:terrariumの型検査・単体テスト・ビルド、ci:e2eのChromium・Firefox・WebKit全構成を対象とする。pitchfork受入シナリオをE2Eに含める。[desc][agents][confirmation]

合格条件: 各タスクのログにコマンド・終了結果・テスト名と合否があり、pitchforkと既存aubeの回帰を区別できること。新規スクリプトの実行権限はjjのファイルモードとshell checkで確認する。失敗や未実行を合格として記録しない。

### NFR3: 証拠と再現手順

受入条件の実行結果をコマンド・出力・テスト名／ログで追跡できること。合否の根拠を検証済み／ドキュメント根拠／推測に区別する。[agents][re]

合格条件: FR1–FR4とNFR1–NFR2それぞれに具体的な証拠を紐付け、Node runnerのprocess exitだけに依存しない。検証できない項目は「未検証」、理由、再現手順を記録し、完了とは判定しない。時間測定を行う場合は並行負荷を止めて測る。新たな起動時間・サイズ閾値は要求しない。

## Constraints

- 既存パッチ・ビルド・fixture・カタログ・ページ選択の継続修正に限定し、ついでの改良を含めない。[desc][agents]
- ツール自身の変更はterrariumの `patches/tools/`、依存変更は既存パッチ方式で持つ。[project]
- ビルド成果物はmainへコミットせず、既存Pages／builds配布方式を維持する。[project][agents]
- SCMはjj。ツールの実体はmise管理のインストールから解決する。タスクは `mise run` を使う。[agents]
- 公開タグ・パッケージ公開、秘密情報、共有状態の破壊、戦略変更は人の判断に委ねる。[agents]

## Assumptions

None.

## Out of Scope

デーモンの起動・監視、スーパーバイザー／IPCの実装、ネットワークアクセス、Node.jsライフサイクルスクリプト、汎用シェル、別CLI・pitchfork別バージョン対応、ランタイムの再設計、速度目標の新設、リリースタグ発行・パッケージ公開。[project][confirmation]

## Open Questions

None.

実装・ビルド・ブラウザ実行の成否は後続で検証する事項であり、未決の要件とは区別する。

[desc]: ../../ideation/intent-capture/intent-statement.md
[intent]: ../../ideation/intent-capture/intent-statement.md
[confirmation]: requirements-analysis-questions.md
[project]: ../../../../memory/project.md
[re]: ../../../../codekb/terrarium/code-quality-assessment.md
[fixture]: ../../../../../../../fixtures/sessions/pitchfork-basic.txt
[agents]: ../../../../../../../AGENTS.md
