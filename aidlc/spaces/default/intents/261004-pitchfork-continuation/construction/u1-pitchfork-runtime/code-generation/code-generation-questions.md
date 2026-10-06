# pitchfork基本実行の実装準備

## Sources

- 承認済みの `../../../inception/units-generation/unit-of-work.md` のU1を対象とする。
- `../../../inception/requirements-analysis/requirements.md` のFR1・FR1.1・FR1.2のref/staging部分、FR2・FR2.1・FR2.2、NFR1・NFR3のU1責務を実装・検証する。
- `../../../inception/units-generation/unit-of-work-story-map.md` の責務分担を維持する。User Storiesと設計段階は省略済みのため、存在しない成果物は作らず要件IDに直接対応付ける。
- `scripts/build-pitchfork.sh`、`scripts/resolve-ref.sh`、`scripts/vendor-patched.sh`、`scripts/stage-web.sh`、`web/tools.json`、pitchforkパッチ・fixtureを既存の変更の出発点とする。
- `packages/terrarium/src/terminal.ts` の既存 `ready` / `run()` と `packages/terrarium/e2e/serve.ts` の静的ホストを基本ブラウザ実行に利用する。

## 解決済みの判断

要件と作業単位で決定済みの事項を再質問しない。追加の要件質問はない。

- pitchforkはv2.29.0だけを対象とし、スーパーバイザーを要しない8コマンドと設定保持を確認する。プロセスの起動・監視、ネットワーク、別CLIは追加しない。
- ツール・依存クレート・stdパッチはterrarium側に置き、既存Emscripten pthreads／Sessionを利用する。共有ランタイム修正は実際の失敗で必要性が確認できた場合に限定する。
- 既存バイナリの存在をビルド成功の根拠にしない。新しいパッチ適用・コンパイルのログ、対象commit、JS/Wasm生成を確認する。
- 同一セッション内の8コマンドすべての終了コード0と期待出力を実ブラウザで照合する。未知コマンド127、存在しないファイルの読取失敗なども確認する。Nodeのprocess exit 0だけで合格にしない。
- 既存aubeとSessionの回帰を確認する。画面切替・埋め込みの全受入はU2、全ブラウザCIへの組込みとPR提出はU3が担当する。
- 自動進行の選択は `Continue automatically`。初回の計画承認・要約確認・検証コマンドの選択は個別の人の回答を必要とする。
- 現在のTesting Contractはtest-afterで、適用する各テスト可能な層を実装した後にその層のテストを書いて実行する。Minimalの要件駆動テストと既存スイート維持を適用し、実行前にrunnerの準備を確認する。

## 実装計画へ反映する内容

- ref解決・staging・複数バージョンの依存パッチの変更範囲と呼出元を確認し、必要な修正だけを行う。
- パッチ・ビルド・登録・fixtureを仕上げ、対象commitの新しいビルドを実行する。生成JS/Wasmは追跡対象外に置く。
- 一時入力に対してref解決／stagingを実行する単位限定テストを追加し、成功とエラー終了・出力を確認する。ソース文字列の一致だけをテストにしない。
- U1の基本受入検証用として `scripts/check-pitchfork-runtime.mjs` を追加する案を計画に含める。既存Playwright依存と静的ホストを使い、要素の直接APIで8コマンドの結果・設定保持と境界シナリオを確認する。U3は後でこれを利用・CIへ接続できる。fixture配布データへテスト実装を混ぜない。
- 既存Session回帰、変更範囲のlint・型検査を実行する。実行コマンド・ログ・テスト名を要件に結び付け、未検証を完了扱いにしない。

## Assumptions & Open Questions

None.

ビルドとブラウザ実行の成否は現在未検証であり、実装中に観測する事項とする。

## Consolidated Summary Confirmation

この内容で実装計画と単位限定のテスト手順を作成してよいですか？ 計画の作成後、コード生成の前に計画承認を別途提示する。

- Looks correct
- Request changes

[Answer]: Looks correct

## Plan Approval

code-generation-plan.md の10手順、埋め込まれたTesting Contract、unit-test-instructions.md の単位限定テスト手順を承認してコード生成へ進めてよいですか？

[Approval Fingerprint]: sha256:v3:f326aa8f751958492bf07d6ce66182dfb5fa07384d6e932e7ea00aa1a800d294
[Planned Source]: b9ffde6b1600308f4111eea851e83f8ae0075d3e6e29da4df2cf416748ac0857

- Approve Plan
- Request Changes

[Answer]: Approve Plan
