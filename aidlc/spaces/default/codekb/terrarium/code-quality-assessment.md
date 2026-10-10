# 公開RC受入れ focused scan: code-quality-assessment

## Evidence

本scanではnpm取得/インストール/テストなし。以前の合格本文を下に保全し、新RC合格へ転記しない。

## Test Coverage

unitはfake public Sessionと合成package/ELF/staging fixtureを使う。browserはelement10＋iframe5の45 cases（3browser）。Firefox/WebKit cross-origin iframe拒否はspec期待である。serviceWorkers:blockとローカルheaders serverのため実Pages/実Safari受入れとは区別。

## Commands for Acceptance

既存Bun unit入口: mise run terrarium:formicarium-unit。型/候補組立: mise run terrarium:formicarium-build。3browser: mise run terrarium:formicarium-e2e（内部TERRARIUM_BUNとTERRARIUM_SITE_DIRはmise taskが設定、workers1/retries0）。これらは公開npm入力の準備とactual installed identityを確認した後に実行する。

公開npm取得の候補入口は mise exec -- npm view @aletheia-works/formicarium@0.1.0-rc.1 version dist --json と mise exec -- npm pack @aletheia-works/formicarium@0.1.0-rc.1 --json --ignore-scripts --pack-destination <evidence directory>。このscanでは実行していない。導入はBunでexact registry versionへmanifest/lockを合わせる工程を要する。

## Linting and CI/CD

miseにBiome/Tombi/rumdl/ShellCheck/actionlint、Bun type/unit/build、legacyとformicarium別候補CI tasks。CI workflows自体は本focusで未再読。

## Documentation Quality

READMEはlocal candidateとpublished RC acceptanceを区別。現在説明のlocal statusを公開合格に読み替えない。

## Technical Debt and Follow-up

runtime/run-node.mjsはlegacy Emscripten専用で各nonzero commandを表示するがprocess exitへ伝搬しない。調べた設定内にpublic formicarium Node実Worker試験の直接入口はない。Bun fake Sessionテストやlegacy runnerをNode RC受入れの代替にせず、Node public APIによる実guest/FS/lifecycle試験とfail判定を組み立てる。stage receiptはlocal-pack-onlyを明記するので外部のnpm evidenceとcandidate identityを結合して記録する。

根拠: [今回の開発者解析](../../intents/261010-formicarium-rc-acceptanc/inception/reverse-engineering/developer-scan.md)。今回の調査は静的解析のみで、npm取得・導入確認・受入れ試験は未実行。

## 保持した前store本文（historical）

以下は前intentの本文を保持した履歴であり、今回の公開RC実導入・再試験結果ではない。未再読の深いcoverageはshallowへ降格する。

## 現解析: code-quality-assessment

### 現在の検証と制限

今回の設定実装前runnerは限定2files40pass/128 assertions。設定後は424保全paths（cache・旧診断・正式review record/copy）不変、workspace外の誤書式執筆文書のMD025拒否、既存disable不変を確認した。r2証拠はunit136pass、型/build成功、専用45pass、legacy34pass/2既存skip。今回の全checksとbrowser適用性は新verification-recoveryで別記録する。生成diagnosticと正式ツール保存copyのみlint分類を変更し、作者文書/CodeKB/applicationを除外しない。正式レビューの受領登録、Build and Test/U3はrootの後続工程であり本解析で完了を主張しない。

根拠: [今回の解析と検証](../../intents/261008-formicarium-integration-2/construction/code-generation/code-summary.md)。

### 保持した過去の解析（historical）

以下は以前の本文・identityを保持した区画であり、今回の現解析や成功結果の代用ではない。

### 品質・検証状況

#### Evidence

今回のscanはテスト実行ゼロ。developerは旧pre-pr/evidence/final-results.jsonと10filesのSHA-256を再計算し全一致を確認した。しかしその74source inventoryのうち現在25filesがdriftしているため、当時の合格を現在sourceの合格として転記しない。旧storeの「現行bytesへ適用可能」は旧intent時点の評価として下記に保存する。

#### Test Coverage

読んだ3unit filesはpublic fake Session/catalog injection/実stage functionのhappy・拒否経路、queue/UTF-8/quoting、digest/identityを検証する。専用browser specは15cases×3browsers、version、keyboard/lifecycle、parent origin、marker、unsupported/isolation拒否。serviceWorkers:blockなので実Pages検証とは区別する。今回読取設定にcoverage thresholdはない。

旧raw tails: unit85/0fail、dedicated45pass、legacy34pass/2既存skip、lint exit0。CT-1は後続resolutionでtraceability18/18/missing0として解消済み。旧FAILのみを現未解決として継承しない。

後続ci-remediation/input-deliveryは公開固定archive identityと91unit/typecheck/build/lint成功、latest-pitchforkは89unit等と2.30.1 identityを記録する。latest-locked-cratesはremote run37721681248のmio1.2.4失敗後3cratesのforward dry-run成功で、修正後remote CI合格の証明ではない。これらは履歴記載で今回のfresh testではない。

#### Linting and CI/CD

strict/noUncheckedIndexedAccess/noImplicitOverride、Biome/Tombi/rumdl/ShellCheck/actionlint。読んだCIはSHA-pinned actions、read permissions、persist-credentials:false、固定archive prepare、legacy/formicariumの別候補、3browser検証。現コードの接続と実行合格は別の事実。

#### Documentation Quality

READMEはlocal candidateとpublished acceptanceを区別し、固定公開archive既定とlatest pitchfork CI責務を追記する。compile-to-Wasm表現とstatic-musl guest経路の説明整合は正式レビューで確認する。

#### Technical Debt and Follow-up

正式レビュー未実施。現在source/inputs/candidate inventoryを結び直し、新raw logsのcommand/cwd/env/exitとreview identifierをU3へ返す。prepare-formicarium/runtime internals/new crate patches/latest build実装は範囲外。stagingはvalidation後に逐次writeし途中write失敗のatomic保証は未観測。公開RC・実Pages/service-worker・実Safariは未検証。人のarchitecture判断を調査で上書きしない。公開・push・PRは禁止。

根拠: [開発者引継ぎ](../../intents/261008-formicarium-integration-2/inception/reverse-engineering/developer-scan.md)。深い解析の個別23pathは[解析時点](reverse-engineering-timestamp.md)、証跡の適用性は[品質](code-quality-assessment.md)。

#### Preserved Prior Store (historical; not current verification)

以下は前storeの文章を保存した履歴。今回範囲外の深い解析はshallowへ降格した。「現行」「確認済み」等は元intent時点の表現で、今回のfresh合格・承認を意味しない。上の今回評価を優先する。

##### 品質・検証状況（再検討後）

#### Historical 1: Evidence

formicariumで直前に生成された実行証拠は、現在のterrariumソース/候補へ適用できる。「このチャットで再実行していない」と「古い証拠」を混同した前回記述を訂正した。[独立照合](../../intents/261008-formicarium-integration/inception/reverse-engineering/evidence/reconsideration-proof.json)はexact25 raw SHAとtree、imported source20＋candidate44の64/64、coverage fixed23 sources、installed package23、46 receiptsのgeneration/sourceIdentity/candidate/status、immutable U1 report SHAを照合。候補全44件の欠落/余剰0、digestも独立再計算して一致した。

[原本時刻/ハッシュ](../../intents/261008-formicarium-integration/inception/reverse-engineering/evidence/reconsideration-latest-evidence.json)ではreceipts mtimeは2026-10-08 09:54:50〜09:57:24 JST。mtimeは認証済み実行時刻ではないが、現行bytes/binding一致が適用性を確認する。原本・コピー・candidate/hashを保持し、今回新規test/build/lintは実行していない。CodeKB `fingerprint: unknown` は自動markerの制約であり、ソース鮮度の不一致を示すものではない。

#### Historical 2: Test Coverage

直前の26 Node cases、45 browser cases、46 receipts（Node1＋browser45）は現行bytesへ適用できる。fixed23は1567 lines、1283 covered、skipped0、81.87%、passed:true。legacy Session個別15.82%、terminal79.46%なので全file80%ではない。quotes Red10/1→Green11/0、combined26/0、latest pitchfork v2.30.1 commit `1054549e85470b08d9507e2c82c850959a4b3914` のnative/public Worker version一致も取り込み証拠。

現行suiteはadapter11/catalog7/assets8、element10/iframe5を3 browserで検証する。Firefox/WebKit cross-origin iframeのrefusalは仕様どおりで未解決の失敗ではない。serviceWorkers:block＋専用headers serverは実Pages経路の検証とは区別する。

#### Historical 3: Linting and CI/CD

Biome/Tombi/rumdl/ShellCheck/actionlint、strict/noUncheckedIndexedAccess/noImplicitOverride。既存CIは専用formicarium Playwright configとpackage/resolver/guest site入力を接続していない。ローカル受入れは確認済み、combined CIは別の未実行条件。

#### Historical 4: Documentation Quality

READMEのlocal candidate/same-origin Worker条件を保持。architectureの人の決定と観測コードを区別する。旧pitchfork記述は下記に一度だけ保持し現行評価と混同しない。

#### Historical 5: Technical Debt and Follow-up

| 項目 | 再検討後の状態・次の作業 |
| --- | --- |
| imported evidenceの鮮度/適用性 | 解決: exact tree/raw bytes/digest/46 bindings一致。古いから再試験とはしない |
| U2 R-01 collectorをU3へ波及した懸念 | U3について解決: prepareCoverageのEEXIST拒否、mergeのgeneration/source/candidate照合、現9負例。旧U2 collector修正を証明するものではない |
| U2 R-02 retained refs | 今回候補について解決: advertised refs assets検証、candidate44全件一致、旧aube v2.6.1も存在。producerのinput.buildsだけを書く一般的増分追加問題はConstruction follow-up |
| jj読取り | 解決: --ignore-working-copy root/log/status成功、commit `617cfc66a9cc18bb485d31f4632aa34ed9d5fd93`、親8cd2624e。大容量証拠はdisk保存、全件jj追跡とは主張しない |
| CodeKB marker | 自動判定はunknownのまま。独立鮮度確認とは別。手書きmarkerや実装調査でCURRENTを作らない |
| CI/portable依存 | Construction: immutable入力を定義し絶対tarball/兄弟modules/guest site依存と専用configをCIへ接続 |
| staging/cleanup観測 | Constructionでatomic replacementとcleanup failure観測の最小変更を検討。再現済み機能障害とは主張しない |
| 公開RC/実Pages/service-worker/実Safari/combined CI | 別の受入れ条件。公開/pushを推定で実行しない |
| Emscripten/no-emulatorとBlink/static-muslの差 | 人のarchitecture決定。現在の統合を黙示承認に変えない |

根拠: [再検討済みdeveloper handoff](../../intents/261008-formicarium-integration/inception/reverse-engineering/developer-scan.md)。旧U2 findingsを現U3へ一括継承しない。技術的修正はConstructionで具体化し、この段階でアプリコードを変更しない。

#### Prior Knowledge (historical, shallow outside current focus)

以下は `261004-pitchfork-continuation` の記述を保持したもの。旧 deep coverage は UNVERIFIED のため今回の verified deep 範囲に継承しない。現行 focus については上の記述を優先する。

#### Historical 6: 品質・検証状況

##### Historical 7: Evidence

検証済み（この workflow の親エージェントの既存観測を引継ぎ、新規再実行なし）:

- `packages/terrarium` の直接 Bun `test tests`: **25 pass、0 fail、57 expect、2 files**。Catalog/Session の fake FS/tool tests。coverage % は未計測。
- `TERRARIUM_CWD=app node runtime/run-node.mjs C:/Users/Jam/.tem-pf/wasm32-unknown-emscripten/release/pitchfork.js fixtures/pitchfork-basic fixtures/sessions/pitchfork-basic.txt`: runner exit 0、version 2.29.0、api/worker、add db/remove worker 後の config、status api available、interval set/get 5s を出力。

runner exit 0 は各コマンド成功を保証しない。`runtime/run-node.mjs` の読取根拠: 非ゼロを表示するがプロセス終了コードへ伝搬しない。後続検証は各終了コードと期待出力を照合する。

##### Historical 8: Test Coverage

ドキュメント根拠: `tests/` は Catalog と Session、`e2e/` は同一 origin、別 origin 要素、非隔離 error、iframe を対象とする。`rg -n 'test\\(|pitchfork|aube' packages/terrarium/e2e/terminal.spec.ts` のスキャン結果は aube の6宣言、pitchfork 専用なし。`ci:e2e` も v2.6.1 のみ取得する。

##### Historical 9: Linting and CI/CD

ドキュメント根拠: Biome、mise の JS/TOML/Markdown/shell/actions checks。package/E2E/lint/autofix/Pages/publish/release/infra workflow が存在する。Pages 以外は一覧中心。完全 lint、型検査、build、CI 実行は未検証。

##### Historical 10: Documentation Quality

root/package README、共有 design と API コメントが存在する（読取／一覧根拠）。古い portability/design の未完了記述は、今回の Node 観測や project.md の後日の pitchfork 決定とは時点が異なる。

##### Historical 11: Technical Debt and Follow-up

1. pitchfork のブラウザ page・要素・iframe で pthread/service-worker を実測し、既存 aube 回帰を確認する。Node 証拠だけではブラウザを保証しない。
2. clean build と CI、`lint:all`、`ci:terrarium`、`ci:e2e` の合否を記録する。
3. 新規 `build-pitchfork.sh` の executable bit を jj で確認／必要時修正する（親の前回観測 100644）。
4. tool patch の別 ref 互換、途中パッチ適用からの再開の冪等性は未検証。今回の対象 v2.29.0 に限定する。
5. AI-DLC 設定追加を別変更とする。Biome は aidlc/.claude を除外するが新規 .codex/.agents の lint 影響は未検証。

スーパーバイザー実装・ネットワーク対応・汎用ランタイム拡張は今回の追加修正に含めない。
