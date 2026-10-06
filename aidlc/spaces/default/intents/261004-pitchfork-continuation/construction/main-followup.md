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
