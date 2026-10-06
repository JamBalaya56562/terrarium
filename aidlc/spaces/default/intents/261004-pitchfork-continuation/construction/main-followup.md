# マージ後のPages検証（2026-10-06）

ユーザーの「両方ともマージしました。main更新して続きの作業」に従い、通常レビュー・CIの続きを実施した。AI-DLCの状態や受領記録を代作しない。

## mainの更新

- 検証済み: `gh pr view`でPR #20のmerge commitは`2b7cdeccebce4c774d8180b39ef04693aff05653`、PR #21は`8201aa9ead29ab96a1ca18f146d3d07a8e5f0a92`、どちらもMERGED。
- 検証済み: `jj git fetch --all-remotes`後、`jj new main@upstream`で`8201aa9e`を親とする新しい変更へ移った。削除済みPRブランチの整理で現れたローカル監査ログの競合はmainへ持ち込まず、fetch前のrevision `a1740924`の原文をignoredの`.vendor/u1-pf/audit-before-main-fetch.md`へ保全した。
- 検証済み: [mainの自動Pages run 37410161751](https://github.com/aletheia-works/terrarium/actions/runs/37410161751)はsuccess。buildとstoreはskip、siteとdeployはsuccess。公開ビルド一覧にはaubeの既存3entryだけがあり、pitchforkはまだなかった。

## pitchfork初回公開ビルドで観測した登録漏れ

既存Pages workflowを`tool=pitchfork`、`ref=v2.29.0`、`force=false`で起動した。[run 37411488961](https://github.com/aletheia-works/terrarium/actions/runs/37411488961)は全ジョブsuccessだが、公開登録の成功とは判定しない。

- 検証済み: [build job 112100736982](https://github.com/aletheia-works/terrarium/actions/runs/37411488961/job/112100736982)はsuccessで成果物`build-pitchfork-v2.29.0`を作った。
- 検証済み: [store job 112102636836](https://github.com/aletheia-works/terrarium/actions/runs/37411488961/job/112102636836)のログは、1件のartifactを`$RUNNER_TEMP/builds`へ直接展開し、その後`no build succeeded`でexit0。GitHub APIで読んだ`builds`ブランチの`builds.json`にもpitchforkはない。
- 検証済み: キャッシュを区別するquery付きの公開manifestにもpitchforkはなかった。公開Chromium確認はmanifestのpitchfork entry取得でexit1（`.vendor/u1-pf/published-pitchfork-verification.log`）。8コマンドの公開実行は未合格・未実行で、ローカル／PR E2Eの成功で置き換えない。
- ドキュメント根拠: [ピン留めされたdownload-artifactのソース](https://github.com/actions/download-artifact/blob/3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c/src/download-artifact.ts)は、`artifacts.length === 1`なら指定pathへ直接展開する。保存stepの`builds/*/`探索と一致しない。

修正は、直下に`build.json`があればそのディレクトリを処理し、それ以外は既存のサブディレクトリ探索を使う。回帰テストはworkflow自身のshell選択部分を、単一・複数・成果物なしの実ファイル配置で実行する。

- 検証済み: 修正前の`bun test tests/pages-build-artifacts.test.ts`は2pass/1fail。単一ケースだけが`no build succeeded`を返して失敗した（`.vendor/u1-pf/pages-artifacts-before-fix.log`）。
- 検証済み: 修正後の同じ3ケースは3pass/0fail/6assertions（`.vendor/u1-pf/pages-artifacts-after-fix.log`）。
- 検証済み: 全lintはexit0（`.vendor/u1-pf/pages-artifacts-lint.log`）。`mise run ci:terrarium`もexit0で、型チェック・全単体45pass/0fail/145assertions・package buildが成功した（`.vendor/u1-pf/pages-artifacts-package.log`）。
- 未検証: 修正をmainへ取り込んだ後の実Pages登録と、公開ページでの8コマンド・設定保持・aube切替。マージ後に同じ`force=false`のworkflowを再実行して確認する。

## キャッシュの保存先（独立した修正）

検証済み: buildログには`Invalid pattern .../../target`と`Invalid pattern .../../emsdk`、`Relative pathing '.' and '..' is not allowed`があり、SDKとCargo targetのキャッシュ保存が拒否された。

`codex/pages-cache-directories`はこの問題だけを変更する。SDKとツール別targetを`RUNNER_TEMP`の下へ置き、前stepから`GITHUB_ENV`へ設定する。差分はPages workflowの1ファイルだけで、ローカル`mise run lint:all`はexit0（`.vendor/u1-pf/pages-cache-lint.log`）。修正済みPagesジョブでの実キャッシュ保存はマージ後のビルドまで未検証。

## 修正マージ後の公開確認（2026-10-06）

上記の未検証項目を、PR #22・#23のマージ後に実行した。以前の失敗記録は初回runの観測として残す。

- 検証済み: `gh pr view`でPR #22は`d4f92c08ab8313a0e5f4c7f8c25acd7e0253a14b`、PR #23は`77e805dd72566fe2eb49bdc1f8204d22944f873f`へMERGED。`jj git fetch --all-remotes`と`jj new main@upstream`で後者を親とする新しい変更へ移った。fetch前の監査ログは`.vendor/u1-pf/audit-before-pages-merge-fetch.md`へ保全し、旧変更の競合をmainへ持ち込んでいない。
- 検証済み: `gh workflow run pages.yml --ref main -f tool=pitchfork -f ref=v2.29.0 -f force=false`で起動した[Pages run 37421669980](https://github.com/aletheia-works/terrarium/actions/runs/37421669980)は、resolve・build・store・site・deployがすべてsuccess。
- 検証済み: [build job 112132231083](https://github.com/aletheia-works/terrarium/actions/runs/37421669980/job/112132231083)に`Cache saved with key: cargo-pitchfork-Linux-1907b7810a52262ecbf13f2e6d1dfbd968df08053fc0996beaa4bd119e3342a7-cfdea79f1d52b8449c0b99b29a03d9e771cd8ec3-37421669980-1`と`Cache saved with key: emsdk-Linux-6.0.10`を観測した。両キャッシュの保存が成功した。
- 検証済み: [store job 112133793409](https://github.com/aletheia-works/terrarium/actions/runs/37421669980/job/112133793409)は`a6f854124a6ba54f8e9781a307d5798967bd5228 -> builds (forced update)`まで実行した。GitHub APIで取得した[builds.json](https://github.com/aletheia-works/terrarium/blob/a6f854124a6ba54f8e9781a307d5798967bd5228/builds.json)にはpitchfork `v2.29.0`、source commit `cfdea79f1d52b8449c0b99b29a03d9e771cd8ec3`があり、既存aubeの`v2.6.1`・`pr-1645`・`main`も残っていた。
- 検証済み: `bun .vendor/u1-pf/verify-published-pitchfork.mjs`はexit0。Chromiumで[公開ページ](https://aletheia-works.github.io/terrarium/web/?tool=pitchfork&ref=v2.29.0)のmanifestと端末のsource commitを上記SHAと照合し、`crossOriginIsolated`を確認してからfixtureの8コマンドを順に実行した。ログは`.vendor/u1-pf/published-pitchfork-after-merge.log`、出力原文は`.vendor/u1-pf/published-pitchfork-results.json`に保管した。

| コマンド | 終了コード | 観測した出力 |
| --- | --- | --- |
| `pitchfork --version` | 0 | `pitchfork 2.29.0` |
| `pitchfork daemons` | 0 | `app/api`と`app/worker` |
| `pitchfork daemons add db --run "postgres -D data"` | 0 | `added app/db to /work/app/pitchfork.toml` |
| `pitchfork daemons remove worker` | 0 | `removed app/worker from /work/app/pitchfork.toml` |
| `cat pitchfork.toml` | 0 | apiとdbを保持し、dbのrunは`postgres -D data`、workerはなし |
| `pitchfork status api` | 0 | `Name: app/api`、`Status: available` |
| `pitchfork settings set general.interval 5s` | 0 | `set general.interval = 5s in /work/app/pitchfork.toml` |
| `pitchfork settings get general.interval` | 0 | `5s` |

検証済み: 同じブラウザでツール選択をaubeへ変更し、URLの`ref`が除去されたことと端末がaube `main`へ切り替わったことを確認した。`aube --version`は終了コード0、`2.6.1 emscripten-wasm32 (2026-10-05)`を返した。設定保持の確認範囲は同一セッション内の連続コマンドであり、ページ再読み込み後の永続化はこの確認に含めない。

通常レビュー・CIで進めるユーザー指示を継続し、AI-DLCのstage完了や承認記録は代作していない。この追記は公開検証の実測記録である。
