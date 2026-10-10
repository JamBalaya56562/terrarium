# 検証開始時の観測

## Source and VCS

upstream/main取り込み後、parentは`9aa3c0e6`、working copyは`8f4ba0d9`（jj change `wvuqxqkr`）。`jj --ignore-working-copy status`で既存のframework/aidlc/application変更を確認しました。baseline.jsonには対象application bytesをbase64・size・SHA256で捕捉しています。terrarium-diff.jsonはこのbytes集合との差分で、parentとの差分ではありません。

## Baseline command

cwd: `/Users/mutoakio/Documents/terrarium/packages/terrarium`。

```sh
mise exec -- bun run test
```

Bun 1.4.2。exit 1、127 pass、9 fail、136 tests／11 files、501 expectations。最初のtool出力はtoken上限で部分省略されたため、完全なraw baseline logとは主張しません。失敗9ケースと共通原因はその場の出力で確認しました。

- current sixteen-file explicit supply: `formicarium inputs: exact input file set differs`
- formicarium whole-site assembly includes verified receipt
- copies exact installed package worker loader wasm build-info and all advertised refs
- preserves unrelated tools and legacy source/upstream_pr/built_at metadata
- guest hash mismatch rejects before output
- copied resolver modules retain exact frozen source bytes
- partial asset write fails without changing candidate old=true
- partial asset write fails without changing candidate old=false
- existing output symlink cannot redirect staging writes outside candidate

後8件は既定`.vendor/formicarium-inputs/resolver/manifest.js`不足（ENOENT）。現descriptorに対応するrepair-v1供給を別public-rc1 directoryへ複製し、明示FORMICARIUM_INPUTS_ROOTで解消しました。旧入力を削除せず、期待値も変更していません。

## Setup and intermediate failures

`mise exec -- npm view ...`の初回はHOME npm cache書込みEPERM。専用`--cache=/private/tmp/terrarium-rc-npm-cache`で解消。npmのchown推奨は実行していません。

`mise exec -- bun install`のsandbox実行はtempdir EPERM、host権限の再実行はlockを更新したものの同versionの旧local filesを残し「12 installs checked, no changes」。identity検査は`assets/build-info.json`不一致を検出しました。host権限の`mise exec -- bun install --force`は12 packages installed、固定RC全24files一致で解消。この途中の導入を合格扱いしていません。

新identity testの初回はawaitを非async closureへ置いた構文error、初回型/buildはBuffer添字possibly undefined。いずれも今回作成testの修正後に5passと型/build成功を確認しました。最終全unit144pass/0failのraw出力はfinal-unit.jsonに保存しています。
