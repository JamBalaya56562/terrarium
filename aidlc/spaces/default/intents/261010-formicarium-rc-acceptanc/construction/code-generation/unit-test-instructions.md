# 公開RC受入れの試験手順

## Framework and Configuration

mise管理Bun・Node・npm、既存Bun unit／専用Playwright設定を使う。test-after、Minimal。新規coverage率は設定しない。既存suiteをgreenに保つ。setup不足は記録し、必要なproject toolをmiseで準備する。

## Exact Commands

新環境の必須準備（root）: `mise run terrarium:rc:prepare`。出力dir作成・exact npm取得・圧縮SHA256／integrity照合をscriptが行います。packageの`bun run test`と通常`ci:terrarium`も自動実行します。unit-scopedの直接Bun test前にこの準備を行ってください。

R-01回帰のfresh destination実測:

```sh
mise exec -- node scripts/fetch-formicarium-rc.mjs --output .vendor/formicarium-rc-fresh-review-r01
# cwd packages/terrarium
FORMICARIUM_RC_TARBALL=/Users/mutoakio/Documents/terrarium/.vendor/formicarium-rc-fresh-review-r01/aletheia-works-formicarium-0.1.0-rc.1.tgz mise exec -- bun test tests/formicarium-rc-identity.test.ts
```

zero-Unitの今回の受入れに限定したコマンド。新規script/testは計画の実装後に実行可能となる。実際のinput argsは公開RC実物確認後、実行前に以下を確定・記録する。

- 既存runner確認（packages/terrarium）: `mise exec -- bun test tests/formicarium-session.test.ts`
- identity新規unit（packages/terrarium）: `mise exec -- bun test tests/formicarium-rc-identity.test.ts`
- Node runner新規unit（packages/terrarium）: `mise exec -- bun test tests/formicarium-node-acceptance.test.ts`
- 既存接続・staging（packages/terrarium）: `mise exec -- bun test tests/formicarium-session.test.ts tests/formicarium-catalog.test.ts tests/formicarium-assets.test.ts tests/formicarium-inputs.test.ts tests/candidate-transaction.test.ts tests/assemble-candidate.test.ts`
- Node実guest（root）: `mise exec -- node scripts/accept-formicarium-node.mjs`（検証した公開RC導入先、固定guest入力、record出力を明示するargsを実装時に確定する）。
- Browser実guest（root）: `mise run terrarium:formicarium-e2e`。専用config＋element/iframe exact specs、3browser、workers1/retries0、計45case。
- 準備build（root）: `mise run terrarium:formicarium-build`。固定RC入力を選択して実行し、そのidentityを保存する。

型検査・全既存unit・lintは回帰検証として別途実行し、受入れ結果とは区別して記録する。単一Unitごとの重複実行は存在しない。

## Required Node Cases

実行前確定（2026-10-10）: 公開導入先は `packages/terrarium/node_modules/@aletheia-works/formicarium`、入力は `.vendor/formicarium-inputs-public-rc1`。Node exact command:

```sh
mise exec -- node scripts/accept-formicarium-node.mjs --inputs .vendor/formicarium-inputs-public-rc1 --output aidlc/spaces/default/intents/261010-formicarium-rc-acceptanc/construction/code-generation/evidence/node-acceptance.json
```

| ID | 実入力／API | 実行前の期待値 |
| --- | --- | --- |
| N1 | aube v2.7.0 / commit d36fec01764689ef6d99a5e43de98925b571d67f、args `--version` | stdout `2.7.0 linux-x64 (2026-10-07)\n`、exit 0、N4 sibling保持 |
| N2 | pitchfork v2.30.0 / commit 60e97b1c39183d56e2124f84f9a68ad550fc4011、args `--version` | stdout `pitchfork 2.30.0\n`、exit 0 |
| N3 | pitchfork args `daemons add db --run "postgres -D data"` | exit 0、同session readFile `/work/app/pitchfork.toml`にdaemons.db、指定run、既存daemons.api |
| N4 | aube-local-deps seed、cwd `/work`からsetCwd `/work/app` | sibling `/work/outside/linked/package.json`のlinked内容が実guest後も一致、nested app存在 |
| N5 | pitchfork args `--terrarium-invalid-argument` | nonzero exit、成功集計ではfail |
| N6 | N5と同じpitchfork sessionで`--version`→dispose→readFile | version stdout/exit 0、dispose後DISPOSED、再dispose成功、全session final cleanup |

guest SHA256はaube `c7d7d13692d01c5f6adc5511c40adc6b3769080b7c433b44c411a3e52ebcd99e`、pitchfork `67bcb90c31e8525f95f49c9ef5ff9b6526f36e79471f4804bc533b192a772a23`。各runのtimeoutは600000ms。DOM/event/iframe/origin/isolation契約はNode対象外。

計画のN1–N6を実行前にguest path、source identity、exact args、expected output/exit/FS状態で一覧化する。aubeとpitchforkの実guest、version、fixture/cwd、設定状態の保持、command error後の回復、disposeを確認する。Node runnerの成功判定をmockで置換しない。browser限定DOM/event/iframe/origin契約はNode対象外として明記する。

## Requirement Coverage

| ID | 検証 |
| --- | --- |
| FR1 | registry metadata・pack・固定依存／lockの照合 |
| FR2、NFR1 | version／integrity／SHA256／導入file比較とidentity unit happy＋4不一致ケース |
| FR3 | descriptor／manifest／staging unit、型・buildとcandidate identity |
| FR4 | Node N1–N6、runner unit happy＋非zero exit＋出力不一致 |
| FR5、NFR2 | 3browser各15case、Nodeと合わせ4環境の結果表 |
| FR6 | commands・cwd・tool versions・exit・output証跡の記録検査 |
| FR7 | baseline/source inventoryと今回の差分・最終報告の検査 |
| NFR3 | 型・既存unit・buildの結果 |

## Test Data and Failure Handling

hash不一致／誤version／導入file不一致はsynthetic temporary fixturesでunit検証する。公開RC受入れはnpmの実tarball、実導入物、既存固定guest/fixtureを使う。旧local pack、既存候補、他の変更を保持する。タイムアウト・skip・環境制約は証跡を残して未達とし、件数・期待値を弱めて合格にしない。命令と結果はrecord、実行用binaries／candidateは`.vendor`へ置く。
