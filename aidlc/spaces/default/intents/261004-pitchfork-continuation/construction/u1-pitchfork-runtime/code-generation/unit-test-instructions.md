# U1単位限定のテスト手順

## Prerequisites and runner readiness

既存Bunテストと @playwright/test を使う。packageのfrozen lockfileを維持し、不要な依存や別test runnerを追加しない。
実装前の準備確認では既存Sessionテストの明示ファイルを実行する。Playwright Chromiumが未導入なら既存packageのCLIでそのブラウザだけを準備する。
新規runtime testの実行前にBun・Bash・jq・Nodeを、基本ブラウザ実行前にPlaywright、隔離ヘッダーを送る既存静的ホスト、.siteのbundle/build/fixtureを確認する。
単位テストはテンポラリルートと入力を使うため、実ビルドやネットワークに依存しない。
ブラウザ受入は新規ビルドを使い、実Wasmをmockに置き換えない。

## Exact unit-scoped commands

PowerShellでは実体をglobで解決する。Bunのshimや mise exec は使わない。
以下の各コマンドは指定したファイル/検証スクリプトだけを実行する。作業ディレクトリを厳密に合わせる。

```powershell
$taskBun = (Get-ChildItem "$env:LOCALAPPDATA/mise/installs/bun/*/bin/bun.exe" | Sort-Object FullName | Select-Object -Last 1).FullName
```

package cwd（packages/terrarium）でrunner readinessとSession回帰:

```powershell
& $taskBun test tests/session.test.ts
```

package cwdでU1のref・配置・vendorテスト:

```powershell
& $taskBun test tests/pitchfork-runtime.test.ts
```

root cwdでU1基本ブラウザ受入:

```powershell
& $taskBun scripts/check-pitchfork-runtime.mjs
```

browser verifierの既定はChromium。スクリプトは既存packageのPlaywright依存を解決して、既存serve.tsを子プロセスで起動する。
ホストのportは空きportを選び、既存の他作業のプロセスを停止しない。起動成功を待ち、時間制限を設け、終了時に自分のプロセスとbrowserを停止する。
.site内のv2.29.0 JS/Wasm/fixtureを読み、ページのUI操作を経由せず新しいterrarium-terminalの直接APIで検証する。

## Test scope and data

Minimalの要件駆動テストを採用し、各変更コンポーネントに成功ケースを含める。Test-afterで実装後にその層のテストを書き実行する。
ref/staging/vendorのテストは約10〜15件を目安とするが、数合わせやソース文字列をなぞるテストは作らない。

| Component | Happy path | Errors and edges |
|---|---|---|
| resolve-ref.sh | pitchfork default v2.29.0と実際の出力metadata | 明示tag/commit/PR、未知tool、不正build名、gh失敗 |
| stage-web.sh | JS/Wasm、fixture、source/ref/commitの配置 | aube/既存manifest保持、未知tool/不正名の書込前拒否、不足成果物 |
| vendor-patched.sh | lockに一致する版の適用と参照 | 同名crate複数版、対象外版を適用しない |
| 実Wasm/Session | 8コマンドのcode/outputと設定保持 | unknown127、missingcat非zero、fixture再投入 |
| aube回帰 | 既存4コマンドとSession単体テスト | U1共有変更が既存動作を壊していないこと |

refテストのghは一時PATHのcontrolled stubとして決められたAPI応答を返す。jqとshell処理は実物を実行し、stdin/API引数/outputを観測する。
vendorテストは小さな正規patchと一時Cargo.lock/registryを使い、変更後ファイルと生成Cargo参照を確認する。
fixtureは配布データをそのまま読み、テスト実装をfixtureディレクトリへ置かない。

## Expected outputs and acceptance

実ブラウザでは次の8結果を個別に照合する。すべてcode 0が必要。

1. pitchfork --version: 2.29.0。
2. pitchfork daemons: apiとworker。
3. pitchfork daemons add db --run "postgres -D data": 成功。
4. pitchfork daemons remove worker: 成功。
5. cat pitchfork.toml: api/dbがありworkerがなく、dbのrun値が保持される。
6. pitchfork status api: apiの状態を確認できる。
7. pitchfork settings set general.interval 5s: 成功。
8. pitchfork settings get general.interval: 5s。

unknown commandは127。存在しないファイルのcatは非zeroとエラー出力。新規要素は元fixtureのapi/workerから開始し、前要素のdb/削除結果が混入しない。
aubeは既存fixtureと既存テストの4コマンド・期待結果を再利用する。
スクリプトのprocess exit 0だけでなく全assertと各command code/outputを保存する。

## Build and staging evidence

新規source archive/checkoutの取得方法と対象commitを記録する。Windowsでは長い物理パスによるリンク失敗が観測されたため、追跡外 `.vendor/u1-pf/source` と空の `.vendor/u1-pf/target` を使う。
空targetから次のU1限定ビルド・配置を実行する。Bash cwdはroot。依存cacheは利用できるが既存コンパイル出力は成功証拠にしない。

```bash
task_record=aidlc/spaces/default/intents/261004-pitchfork-continuation
CARGO_TARGET_DIR="$PWD/.vendor/u1-pf/target" bash scripts/build-pitchfork.sh .vendor/u1-pf/source .vendor/u1-pf/out
TERRARIUM_REF=v2.29.0 TERRARIUM_COMMIT="$pitchfork_commit" bash scripts/stage-web.sh pitchfork v2.29.0 .vendor/u1-pf/out
```

pitchfork_commitは事前に実際に取得したv2.29.0のfull commit SHAを設定する。未設定のまま配置しない。
配置後は既存site assemblyで.siteを準備する。これは受入のセットアップで、プロジェクト全体のテストコマンドに置き換えない。
出力JS/Wasm・target・.site・web/distは追跡対象外。バイナリや秘密情報をmainへ入れない。
ビルドログにpatch適用、コンパイル、exit 0と出力を記録し、サイズ/hashを保存する。

## Coverage and evidence limits

### このWindows環境で具体化したビルド準備

旧SDKの実体が現在存在しないため、公式emsdkを準備する。最初の6.0.11によるビルドはリンクに失敗した。継続ではCIと同じ6.0.10を追跡外 `.vendor/emsdk` に導入する。installerの取得commitは `96c657fc60920d2a6a82318aa50e0abf82749604`。install／activateはローカル設定のみとし、`--permanent`／`--system`は使用しない。

`subst` ではCargoがリンク入力を長い物理パスへ戻すため解決しなかった。SDK Pythonは266文字の物理入力を exists=false、同じ入力のR:短縮パスを exists=true と返した。継続では実際に短いworkspace内 `.vendor/u1-pf` を使い、元の失敗targetを再利用しない。SDKは `EMSDK` に `.vendor/emsdk` の絶対パスを設定し、cargoは既存 `$HOME/.cargo/bin/cargo.exe` の実体を使う。Git Bashのusr/binとbinをそのプロセスのPATHへ追加する。

この環境準備は生成中に具体化した手順であり、初回の人の計画承認がこの追記の内容を承認したという意味ではない。

Testing Contractが要求する各要件の検証と既存スイート維持を満たす。このscopeに数値のline coverage floorは定義されていないため新たに捏造しない。
NFR2の全3ブラウザと全pre-PRチェックはU3で実行する。U1はChromium基本受入を実際に通す。
失敗や未実行はcode-summaryに未検証として残し、既存binaryの存在や推測で代用しない。
各テスト名・コマンド・exit code・結果と対象commit/hashを単位の証拠ファイルへ保存する。
