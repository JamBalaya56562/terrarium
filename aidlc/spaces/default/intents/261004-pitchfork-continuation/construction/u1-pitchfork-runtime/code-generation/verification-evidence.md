# U1の検証記録

## レビュー準備時の軽い検証

rootの `Get-CimInstance Win32_Processor` 観測はLoadPercentage100、logical processors8。他の開発がCPUを使うというuser情報もある。最新timeoutの環境負荷起因は有力な推測で、因果は未検証。user指示により再テスト／再ビルドを行わず、成果物整理へ進めた。

検証済み: 変更2ファイルの `biome check scripts/check-pitchfork-runtime.mjs packages/terrarium/tests/pitchfork-runtime.test.ts` はexit0、Checked2/No fixes applied（`.vendor/u1-pf/biome-final.log`）。`bun run --cwd packages/terrarium typecheck` はexit0、src/tests両tsconfig（`.vendor/u1-pf/typecheck-final.log`）。source-manifest/traceabilityのConvertFrom-Jsonと全targetのTest-Pathはexit0、writes18/targets8。最新単体greenの未達は保持し、Step9は未チェック。

## 30秒明示timeoutでの単独再試行

人の明示Retryとrootの単独実行準備完了を受け、現行brief exit0を読み込み、外部shellを使うU1ファイルだけに `setDefaultTimeout(30_000)` を設定。機能assertは維持した。所有temp `NZMllO` / `SLSg1n` は絶対パスの親とprocess参照を確認して削除した。

検証結果: package cwd `bun test tests/pitchfork-runtime.test.ts`、session51148、exit1。ログ `.vendor/u1-pf/unit-retry.log`。14件中7pass/7fail/39expect。失敗は次の7件、すべて30000ms timeout。原因・環境負荷との関係は未検証。追加timeout延長／再実走は行わず停止した。

- pitchfork ref resolution > resolves the registered default version（43295.48ms）
- pitchfork ref resolution > rejects unsafe names and reports API failures（31903.05ms）
- pitchfork staging > stages both artifacts and fixture metadata while preserving aube（33969.30ms）
- pitchfork staging > rejects path traversal names before writing（33540.72ms）
- locked crate patching > applies the locked version and emits its Cargo reference（33970.83ms）
- locked crate patching > applies both locked versions with distinct Cargo keys（33773.03ms）
- locked crate patching > does not apply a version absent from the lockfile and can rerun（34125.57ms）

stage cleanupにEBUSY、TEMPの `terrarium-pitchfork-LlPFHy` をログで観測。新しいSession／型検査／Biome／最終成果物の生成は開始せず未完了。成功済みfresh buildとChromiumの証拠・成果物は保持している。

## aube期待値修正後の再試行

人の明示的な再試行後、frozen installの@表記とlistの空白区切りのassertを分けた。現行testing-posture briefはexit0、同じtest-after/minimal契約を確認した。fresh buildは再実行していない。

検証済み: `bun scripts/check-pitchfork-runtime.mjs` はsession52808でexit0。別ログ `.vendor/u1-pf/browser-retry.log` にPF8件すべてcode0、unknown127、missingcat1、fixture復元、aube4件すべてcode0を記録。最終JSONは `verified:true, browser:chromium, pitchforkCommands:8, aubeCommands:4, edges:3`。pageerror配列が空のassertも通過した。

続く package cwd の `bun test tests/session.test.ts tests/pitchfork-runtime.test.ts` はsession35555でexit1。ログ `.vendor/u1-pf/unit-final.log`。28件中20pass/8fail/69expect。Session14件は全pass。U1の8件が既定5000ms timeoutとなり、null code・空stderr・cleanup EBUSYを伴うケースがある。例: default ref6345.60ms、unsafe name5705.30ms、stage5352.33ms、vendor単一版7133.48ms。速度原因は未検証。新規assertion失敗として再実行／timeout変更をせず停止した。

後続の型検査は前のexit非zeroの条件で起動していない。最新Biome・最終型検査・全単体テストのgreen・code-summary/traceability/source-manifestは未検証／未完了。以前の単体14passは保持するが今回の失敗を置き換えない。

失敗test名（すべて5000ms timeout）:

- pitchfork ref resolution > resolves the registered default version
- pitchfork ref resolution > rejects unsafe names and reports API failures
- pitchfork staging > stages both artifacts and fixture metadata while preserving aube
- pitchfork staging > rejects path traversal names before writing
- pitchfork staging > rejects missing artifacts and incomplete input without partial output
- locked crate patching > applies the locked version and emits its Cargo reference
- locked crate patching > applies both locked versions with distinct Cargo keys
- locked crate patching > does not apply a version absent from the lockfile and can rerun

終了後の読み取り観測: TEMPに `terrarium-pitchfork-NZMllO` と `terrarium-pitchfork-SLSg1n` が残存。Win32_Processのbash/bun/jq/patch検索では別セッション由来のbashのみで、本テストの残存プロセスは観測されなかった。削除・停止はしていない。候補修正は外部shellテストの時間制限をWindowsの観測に合う明示値にし、終了コード・outputのassertを保持して当該テストを単独再実行すること。速度の原因・負荷との関係は未検証で、製品性能要件は変更しない。

## 明示的Retry後のfresh build

## 配置・Chromium受入の観測

検証済み: jq/Bunのmise実体をPATHへ追加した後の `stage-web.sh pitchfork v2.29.0 .vendor/u1-pf/out` と `mise run site:build` は順次実行でexit0。fixture2件とfresh JS/Wasm、terrarium.mjs bundleを配置した。

`bun scripts/check-pitchfork-runtime.mjs` はsession56068でexit1。追跡外ログ `.vendor/u1-pf/browser.log` に各コマンドのJSON結果を保存。pitchforkの8コマンドはすべてcode0で、version2.29.0、api/worker、db追加、worker削除、configのapi/db保持、api available、interval set/get 5sを個別に確認した。unknownは127、missing catは1、新要素のconfigはapi/workerでdbなし。aube4コマンドも個別code0。

失敗はverifierのlist出力assertion（scripts/check-pitchfork-runtime.mjs:190）。実出力 `filedep 0.0.0` / `linked 0.0.0` に対しinstallと同じ `filedep@0.0.0` / `linked@0.0.0` regexを要求していた。受入script全体は未合格。新規実走・修正は停止し、rootへ報告した。生成物・ログを保持し、未実行の後続検査と成果物を完了扱いしない。

| PFコマンド | code | ログの出力 |
|---|---:|---|
| pitchfork --version | 0 | pitchfork 2.29.0 |
| pitchfork daemons | 0 | app/api bun run server/index.ts、app/worker python3 worker.py |
| pitchfork daemons add db --run "postgres -D data" | 0 | added app/db to /work/app/pitchfork.toml |
| pitchfork daemons remove worker | 0 | removed app/worker from /work/app/pitchfork.toml |
| cat pitchfork.toml | 0 | daemons.api と daemons.db、db.run = postgres -D data、workerなし |
| pitchfork status api | 0 | Name: app/api、Status: available |
| pitchfork settings set general.interval 5s | 0 | set general.interval = 5s in /work/app/pitchfork.toml |
| pitchfork settings get general.interval | 0 | 5s |

読み取り根拠: `rg -n 'filedep|linked|aube list|frozen-lockfile' packages/terrarium/e2e` は既存 terminal.spec.ts:30 の `dependencies:\n├── filedep` と34の `linked` を返した。既存E2Eもlistのツリー表記を期待している。候補修正はfrozen installの@表記とlistのname+space+versionを別assertにすること。受入scriptのみの修正・再実走で、新規ビルドは不要。最新Biome、受入script全体、code-summary・traceability・source-manifestは未検証／未完了。

検証済み: SDK6.0.10 (`emcc --version`: d6c521a7f05449857c76bd99e396895583cf2083) と `.vendor/u1-pf/source`、未作成の `.vendor/u1-pf/target` から `bash scripts/build-pitchfork.sh .vendor/u1-pf/source .vendor/u1-pf/out` を実行。session9076はexit0。ログ `.vendor/u1-pf/build.log`。source commit `cfdea79f1d52b8449c0b99b29a03d9e771cd8ec3`。

| 出力 | bytes | SHA256 |
|---|---:|---|
| pitchfork.js | 126049 | b312de3d81d994c3761ec7145a5b72cc7ba61fb004d2e0ae5aaa30f2989ab427 |
| pitchfork.wasm | 20392048 | e33d63a709e129de350e444497e132a36023cb775c58eb10eb125df9fa2fe66c |

環境準備の失敗: 最初のstageはexit1、`jq: command not found`。続くsite setupはexit127、`bun: command not found`。miseの実体の親を子プロセスPATHへ追加し、jq1.8.2、Bun1.4.2、Node24.19.0をGit Bashから確認して、同じ成功成果物のstageを再実行する。ビルド成功と配置・ブラウザの成否は別に記録する。

## 実行済みの検証

コマンド中のBun・Biome・ShellCheckはmise installsから実体をglobで解決し、直接実行した。

| 種類 | コマンド／対象 | 観測結果 |
| --- | --- | --- |
| 検証済み | package cwd: `bun test tests/session.test.ts` | exit 0、14 pass、0 fail、38 expect calls |
| 検証済み | package cwd: `bun test tests/pitchfork-runtime.test.ts` | exit 0、14 pass、0 fail、54 expect calls |
| 検証済み | root cwd: `bun run --cwd packages/terrarium typecheck` | exit 0。generated CSS、srcとtestsのTypeScript検査 |
| 検証済み | `biome check scripts/check-pitchfork-runtime.mjs packages/terrarium/tests/pitchfork-runtime.test.ts` | exit 0、Checked 2 files、No fixes applied（起動／コマンド時間制限追加前の結果） |
| 検証済み | `shellcheck -x scripts/build-pitchfork.sh scripts/resolve-ref.sh scripts/stage-web.sh scripts/vendor-patched.sh` | 指摘なし。後続jj操作を含むコマンドexit 0 |
| 検証済み | `jj file chmod x scripts/build-pitchfork.sh scripts/check-pitchfork-runtime.mjs` | exit 0。build scriptのdiffでnew file mode 100755を確認 |
| 検証済み | `gh api repos/jdx/pitchfork/commits/v2.29.0 --jq .sha` | `cfdea79f1d52b8449c0b99b29a03d9e771cd8ec3` |
| 検証済み | 上記commitのGitHub archiveを `.aidlc-engine/u1-build/source` へ取得 | Cargo.tomlのversionが2.29.0 |

ref/stagingの11ケースはdefault、明示branch、SHA、PR、未知tool、API失敗、不正name、成果物・fixture・metadata、aube保持、不足成果物・引数を実処理で確認した。vendorの3ケースは正規patchの単一版／複数版の適用、対象外版除外と再実行を確認した。

## 初回実行の問題と修正

- テスト用shell stub内のテンプレート文字列に構文ミスがあり、Bunの最初の実行は0 pass / 1 failだった。固定された環境変数の参照に直した。
- Windowsのテスト用PATHにGit Bashのusr/binがなく、`dirname: command not found` で初回の処理テストが9 failだった。実体のGit Bash用PATHとWindowsパスの正規化を追加した。上表の14 passは修正後の実行結果である。
- ShellCheck単独の初回呼出しはsourceを辿らずSC1091を出した。`-x`を付けて実際のsourceも確認した。指摘を無効化していない。
- jjの準備読取では古いindex.lockの取得エラーがあった。rootが残存ロックの安全確認と処理を担当した。実装エージェントはロックを削除していない。

## ビルド・ブラウザの準備

新規sourceと新規出力は `.aidlc-engine/u1-build/` 配下に置く。既存HOMEの `.tem-pf` JS/Wasmをfresh buildの証拠に用いない。

旧ring fingerprintには `C:/Users/Jam/AppData/Local/emsdk/upstream/emscripten/emcc.exe` が記録されていたが、その場所は現状存在しない。`mise ls`にもemsdkはなかった。公式emsdk archiveを追跡外のu1-build/emsdkへ取得し、manifestのlatest aliasに対応する6.0.11を固定して準備中。ログは `.aidlc-engine/u1-build/emsdk-install.log`。

## 新規ビルドの失敗

検証済みの失敗: Emscripten6.0.11、nightly-2026-10-01、新規source、空targetから `bash scripts/build-pitchfork.sh R:/source R:/out` を実行し、終了コード101となった。

ログ `.aidlc-engine/u1-build/build.log` はツールパッチ4ファイルの適用、stdパッチの既適用確認、dirs6/7など9crateのパッチ参照と実コンパイルを含む。リンクで次のエラーを観測した。

```text
error: linking with `R:/emsdk/upstream/emscripten/emcc.exe` failed: exit code: 1
emcc: error: .../u1-build/target/wasm32-unknown-emscripten/release/build/notify-debouncer-full/38aca51c0846e9a6/out/libnotify_debouncer_full-38aca51c0846e9a6.rlib: No such file or directory
error: could not compile `pitchfork-cli` (bin "pitchfork") due to 1 previous error
```

一部のリンク入力はR:から長い物理パスへ展開されている。短いドライブ名だけで物理パス制限を解消できなかった可能性がある（推測）。再試行は行わず、ソース・target・ログを追跡外領域に保存してrootへ返す。

生成JS/Wasmは未達、outは空。新規ビルドの配置と実ブラウザ8コマンド受入は未実行。Step6のビルド以降は未完了であり、完了判定を行わない。
