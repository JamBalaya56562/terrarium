# U1 pitchfork runtime コード生成要約

## Files created/modified

U1はpitchfork v2.29.0のブラウザ用JS/Wasmをビルドし、ref解決・配布fixture・metadata・配置を整える。全application sourceの作成／変更／削除は `source-manifest.json` に列挙した。既存U1変更のbuild script、7種のpatch、fixture、tools catalog metadata、resolve scriptの改名、vendor処理も含む。

今回の実装は `resolve-ref.sh` と `stage-web.sh` の入力検証、`packages/terrarium/tests/pitchfork-runtime.test.ts` の実shellテスト、`scripts/check-pitchfork-runtime.mjs` のChromium基本受入。gen-cssが書く `packages/terrarium/src/generated/` はdirectory claimとする。共有Session/runtimeの追加修正は必要性が観測されず行っていない。U2画面／catalogとU3workflow／E2E設定は別責務。

## Key implementation decisions

Testing Contractはtest-after/minimal、sha256:f7d8bb522b167216babc2918644ebc2c39441e944521e467b7f2f82726c04b3f。設計段階を省略したため直接FR/NFR IDを実装・テストへ対応付ける。traceabilityのOKは対象コードへのcoverage対応を示し、最新テスト合格の宣言ではない。

未知tool、危険なbuild名（`.`／`..`を含む）、不足成果物は配置書込前に拒否する。refテストはcontrolled gh API応答と実jq/shellで結果を検証。vendorテストは実patchと一時Cargo.lockで単一版／同名複数版／対象外版／rerunを確認する。外部shellのWindows起動を許容するためU1ファイルのtimeoutを30秒に明示し、機能assertは維持した。

Chromium verifierは既存elementのready/runを直接使い、各command code/output、設定保持、新要素fixture復元、未知command、読取失敗、aube回帰、pageerrorをassert。自分のbrowserとhostをfinallyで終了する。aube frozen installとlistは観測された別出力形式を別assertにする。

## Test coverage summary

検証済み: 新規固定commit `cfdea79f1d52b8449c0b99b29a03d9e771cd8ec3` のarchiveから展開したsource、空 `.vendor/u1-pf/target`、SDK6.0.10、nightly-2026-10-01でrelease build exit0。patch適用／コンパイルログ `.vendor/u1-pf/build.log`。JS126049 bytes、Wasm20392048 bytes、SHA256は `verification-evidence.md` に保存。既存 `.tem-pf` を成功証拠に用いていない。

検証済み: fresh成果物stageとsite assembly exit0。`bun scripts/check-pitchfork-runtime.mjs` の再試行exit0、`.vendor/u1-pf/browser-retry.log` にPF8件code0と期待出力、unknown127、missingcat1、別要素のapi/worker復元、aube4件code0を保存。最終verified:true、pageerror=[]もassert済み。

以前の検証済み: U1単体14pass/0fail/54assertions、Session14pass/0fail/38assertions、型検査exit0、ShellCheck指摘なし。最新Biomeは2変更ファイルを確認しexit0、No fixes applied。

最新U1単体は未合格: 単独再試行exit1、7pass/7fail/39assertions。7件すべて30000ms deadline、child code null／空stderr、cleanup EBUSYを伴う。ログ `.vendor/u1-pf/unit-retry.log` と正確なtest名は検証記録に保存。rootの `Get-CimInstance Win32_Processor` はLoadPercentage100、logical processors8を観測。環境負荷起因は有力な推測だが因果は未検証。以前の合格で今回の失敗を置き換えない。

## Deviations from the plan

長いrecord物理パスの266文字リンク入力はSDK Pythonからexists=false、R:ではexists=true。substでCargoの物理パス展開を回避できず、最初のSDK6.0.11ビルドはexit101。明示RetryでCI同版6.0.10と実際に短いignored `.vendor/u1-pf/` に新source／空targetを準備し成功した。失敗source／target／logはrecord `.aidlc-engine/u1-build/` に保持。

stage／assemblyのjq/Bun PATH準備漏れをmise実体の親追加で修正した。aube list期待値の失敗は人のRetry後にassertを分け、同じfresh成果物で合格。5000ms単体timeoutは人のRetry後30秒にしたが最新単独試行も7件失敗した。timeoutをさらに増やさず、userの条件付き継続指示で影響を受けない成果物整理へ進めた。

## Remaining verification and handoff

最新変更後型検査はexit0（src/tests両tsconfig）、ログ `.vendor/u1-pf/typecheck-final.log`。JSON構文と8 trace targetの存在も確認した。最新単体greenは未達。U1はstage完了を宣言せず、計画Step9の未達を保持する。負荷を落ち着かせた環境で同じ30秒・同じassertを維持してU1ファイルを単独検証する。製品の性能要件を変更しない。

全3ブラウザ、ページ／iframeの全受入と全pre-PR tasksは承認済みU2/U3の責務。生成binary／SDK／target／web/dist／.siteはignoredでmainに入れない。独立レビュー、canonical routing、コミット・PRはrootへ引き渡す。
