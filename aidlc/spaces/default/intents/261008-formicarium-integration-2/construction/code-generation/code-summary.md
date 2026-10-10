# formicarium 統合の実装結果

## 変更と判断

候補全体の組立を隔離してから切り替える `scripts/candidate-transaction.mjs` と `scripts/assemble-candidate.mjs` を新設し、既存 staging と shell 入口を接続した。候補 inventory は path/kind、file size/digest、empty directory、symlink のリンク先文字列を保存する。リンクを追跡して通常ファイルと同一視しない。候補に含まれるリンクを経由した作業外への書込みは拒否する。

同一 filesystem の work、旧候補の retained、候補外の attempt record と専有 lock を使う。入力検証後に全 web copy・asset・bundle・stamp・receipt・root entry が完成してから切り替える。通常の失敗は旧候補を保持または復旧し work を清掃する。清掃・復旧・完了記録・lock 解除の失敗は成功にせず、対象と残存物を診断に出す。強制終了を自動復旧しない。

正常履歴と中断残存物を completion、inventory、未清掃物の不在で識別する。順序番号で最新正常試行を選び、同一ミリ秒の UUID 並び順に依存しない。正常履歴は保持して再実行できる。保持物の種類・内容・リンク先の変化、欠落・不整合記録と未知の残存物は停止条件である。

変更は plan 内の application 8ファイルと generator の出力に限定した。全 write claim は source-manifest.json。既存 session/catalog/terminal/bridge を変更していない。新しい shell はなく、既存入口の実行属性を維持する。mise 設定・workflow・入力 descriptor・公開設定に追加変更していない。公開・push・PR・タグ・deploy を実施していない。

## 検証

最初の指定コマンドは未展開の既定 resolver と Bun の path filter による過去 baseline の誤選択で失敗した。既存の現在 descriptor と一致する repair-v1 入力16ファイルを検証し、新しい ignored 入力先へ prepare した。入力元・旧 archive・過去候補は変更していない。明示 `./` と入力先を指定した既存3ファイル限定は27 pass / 0 fail。runner の具体化であり承認済み計画本文と Testing Contract は変更していない。

新規 transaction/staging/assembly の46 testsは全pass。旧候補あり・なしの途中write/switch/cleanup/record、復旧失敗、同時更新、kind/link target/empty directory、専有、未完了記録、正常再実行、同ms順序、lock解除とlink経由write拒否を実 filesystem で検証した。assembly は正常サイト全体とcopy/bundle/stamp/root/staging境界の失敗を確認した。

最終の型検査・package build・新しい formicarium/legacy 候補組立はexit0。全unitは128 pass / 1 fail、465 assertions、11 files。失敗は既存 `formicarium-inputs.test.ts` が要求する descriptor.distribution.commit の欠落。全 lint は既存 CodeKB9文書の Markdown45件が原因でexit1。application Biome は50files成功、README の Markdown check は成功。これらを合格に置き換えない。対象外ファイルを修正せず、追加計画の人の承認へ返す。

初回 sandbox browser はOSのlaunch権限で失敗したため、ログを保全してhost権限で再実行した。最初のhost結果は専用45 pass、legacy34 pass / 2既存skip。仕上げの後にfinal候補を別名で組み立て、final三ブラウザも専用45 pass / 0 fail（1.4m）、legacy34 pass / 0 fail / 2既存skip（4.2m）、ともにexit0。skipはFirefox/WebKitの既存cross-origin iframe条件であり増加はない。最終結果は verification/browsers-final*.json と専用ログ。

## 証跡と残作業

verification/source-inventory.json の64ソースdigest、input-identity.json の16固定入力、formicarium-candidate.json / legacy-candidate.json の全candidate inventoryとdigest、checks-final.json のcommand/exit/time/log、environment.json のrunner準備とツール版を結び付ける。code-summary の合格記述よりJSON/logの実行事実を正本にする。

FR6 / BR3.2 の全suite維持は未解決。FR7 / BR3.1 の独立正式レビューと人の承認、および FR8 / BR3.3 の U3 引継ぎはrootが後続で行う。traceability.json の OK は実装・検証への参照が存在する意味であり、全工程の受入れ合格を意味しない。stage-level / no Unit の標準traceability sensor 制約は回避用の架空Unitを作らず報告する。

公開 RC、実 Pages/service worker、実 Safari、remote Linux CI は未検証。runtime採用の戦略判断とAGENTS.md正式更新は保留を維持する。過去の完了 intent と承認・検証証拠を書き換えず、formicarium U3の状態を代行変更しない。

## 引渡し状態

application source は凍結済み。全64ソースとfinal候補2種のinventoryを検証後にも照合し、変更なしを記録した。Step8の実行は終了したが全unit/lint維持要件は失敗が残るため達成としない。Step10の資料は本summaryとverificationをrootへ引き渡す。追加のstrict Plan Approvalと独立レビューの手続きはrootが行い、workerはplanを再編集しない。

レビュー観点として、明示出力が別試行の `.transactions` 保持物そのものを指す場合の専用namespace保護を追加検討する。現行はsource root/ディレクトリと明示protected pathsのcanonical overlapを拒否するが、transaction namespace自体を出力禁止にしていない。今回の新しい出力には該当せず、既存保持物へのwriteはしていない。これは正式レビューの結論ではなく実装者からの残課題である。

## 追加承認後の結果（Step11–14）

4workflowから古い固定配布URLのfallbackを除去し、vars.FORMICARIUM_INPUTS_URLを明示必須にした。未設定・空値はprepareおよびinstallの前に拒否する。現在descriptorの16ファイルのpath/size/SHAは変更せず、架空URLや旧archiveを現在入力として登録していない。明示URLの実供給・到達性・遠隔CIは未検証であり、変数の未供給は自動fallbackで隠さない。

実装後にinputs契約テストを13件実行し全pass。4workflowの実際のshell guardを未設定・空値・明示URLで検証した。正しい現在16入力を一時領域へ配置して受け入れを確認し、改変resolverと旧extension archiveを配置前拒否した。全unitは131 pass / 0 fail、518 assertions、11 files。型とbuildもexit0。古いdistribution.commit前提だけを現行供給契約へ置き換え、既存prepareの正常・負例、拒否条件、閾値、skipを維持した。

CodeKB9文書は別candidateで空行、見出し階層・重複だけを修正した。本文・履歴identity・最終Scope of Analysis blockは全9件不変を比較し、candidateのrumdlは9件成功した。正式snapshot後に公式CASを1回実行したが、過去解析fingerprint 6cbeaedce987b9631bd8735fbfaeb62afb58d23bと現在source 45c63a70612811c0e0267d5b00bba9c37d138085の不一致により拒否された。過去fingerprintの付替え、無許可再解析、live直接更新、追加CAS試行は行わず停止した。Step13はlive反映未完了として残す。candidateは record/.aidlc-engine/codekb-format-stage-terrarium/ に保全した。

追加変更は4workflowとinputsテストだけであり、bundle入口・runtime・web・browser spec・入力descriptorは変更していない。成功済みfinal候補2種のinventoryと、それらを組み立てた64ソースとの差を分類した。専用45pass、legacy34pass/2既存skipの成功証跡は同じ候補bytesと同じブラウザ実行対象に適用できる。今回browserは再実行せず、供給workflow自体の遠隔成功と混同しない。

追加の最初のglobal lintは370件/91文書で失敗した。内訳はCodeKB45件、初回sandbox browserが生成した旧error-context.mdの324件、実装summaryの空行1件。旧error-contextはOS起動拒否の失敗証跡として保全し、成功済みhost/final結果と区別する。旧証拠のMarkdown本文を修正してlintを通す処理はしていない。今回所有するsummaryの空行を修正後のglobal lintは369件/90文書で失敗（CodeKB45件、旧error-context324件）。最終logはverification-additional/lint-final.log。application Biome50filesと4workflow actionlintは成功。

verification-additionalに新しいsource inventory、影響分類、候補/入力/CodeKBの不変照合、command/exit/time、log digestとCAS制限を保存した。初回のsource/input/candidate/logを上書きせず、source-manifestは追加5pathsを累積した。独立レビュー・段階承認・U3返送はrootへ渡し、全ソースと成果物を凍結してworkerを停止する。履歴namespaceの専用保護は今回の追加承認範囲に含めず、正式レビュー観点として残す。

## 正式レビュー指摘後の修正（Step15–18）

R01に対応し、transaction履歴・attempt・retained・work・lockのnamespace、その配下とcanonical aliasをmkdir前に拒否する。履歴を含む祖先とcontrol領域のsymlinkも拒否し、保持inventory不変と元候補の正常再実行を回帰で確認した。R02に対応し、legacy ref更新のtools.jsonをcandidateFile検査へ接続した。通常ファイルの更新成功、対象symlinkとweb親symlinkの外部書込み拒否、外部bytes・inventoryと旧候補不変を確認した。R04のREADMEは4workflowの明示URL必須、全16path/size/SHA検証、遠隔供給未検証を説明する。正式な再レビューは未実施であり、自己確認を承認として扱わない。

実装後の限定回帰はtransaction26 pass/90 assertions、assembly14 pass/38 assertions。新しい全unitは136 pass/0 fail/554 assertions（11 files）、型とbuildはexit0。新version integration2-r2-20261008の独立候補2種の組立はともにexit0。host上で新r2候補の専用Chromium/Firefox/WebKitは45 pass、legacyは34 pass/2既存skip、両suite exit0。CI=1、各suite専用結果dir、retries=0で旧serverや旧成功証跡を代用しなかった。新source68paths、固定16入力、候補inventoryと全command/time/exit/logをverification-preservation-fixesで結び付けた。

全体lintはexit1、91文書370件。内訳はlive CodeKB45、保全した旧sandbox失敗診断324、正式review-01のtool生成コピーの表MD056が1件。R03は未解決であり、品質条件達成や全工程成功を宣言しない。旧CASはstale解析fingerprintで拒否された事実を維持し、付替え・再解析・CAS再試行・live直接編集を行わなかった。レビュー文書と旧error-contextを修正して合格にせず、そのまま正式再レビューへ渡す。

旧候補・旧証跡を維持した。verification-preservation-fixes/prior-code-summary.txtは本追記前のsummary保全である。source-manifestの累積15pathsは今回の5編集とgenerated buildを既に含み、新しいapplication fileの追加・削除はない。FR6/BR3.2はlint未解決、FR7/FR8/BR3.1/BR3.3は正式レビューとrootの引継ぎを待つ。Step18 checkboxは必要検証を実行して記録したことを示し、lint成功を意味しない。全source/producesを凍結し、公開・push・PR・tag・deploy・U3承認は行わない。

## 新しい修復試行（Step19–25）

今回の正式契約をverification-recovery/execution-contract.txtへ無改変保存し、verify/begin成功後に作業した。前試行のplan/instructions/summary/manifest/traceabilityの原bytes5件は計画作成前archiveから別archiveへ同bytes保存・照合した。旧receipt、正式レビュー1、未成立iteration2、旧診断、候補、固定入力とcacheを改変していない。旧登録拒否はrumdl cache更新が有力原因だが、要求時全workspace inventoryがないため唯一原因とは断定しない。拒否後jj snapshotの時刻と区別し、調査根拠をsource-boundary-investigation.txtへ保存した。

mise.tomlのMarkdown検査は公式rumdl check --no-cache .へ変更した。.rumdl.tomlの追加除外はintent内のPlaywright生成error-contextと正式ツールreviews/review-*.md保存コピーに限る。作者文書・CodeKB・applicationと既存disable/閾値を維持した。実装前runnerは40pass、実装後はcache/旧診断/review record等424paths不変、workspace外誤書式作者文書のMD025拒否を検査した。root所有recovery-proposalのMarkdown解釈修正はrootが原本保全後に実施した。

CodeKBは正式30path snapshot後に30個別ファイルを再読した。新分析区画を9candidate文書に記録し、旧本文・identityを歴史区画と別archive原bytesへ保全した。見出し階層/重複/空行と歴史scope fenceの分類のみ変更し、歴史本文/identity比較9/9一致。candidate no-cache lint9files成功、scope比較COVERS、公式世代/source CAS成功。今回sourceはgit:f8c0130d7fa6b4a4b88457cb71299a8c07e896f6、公開generationはsha256:72007b143a712a8f7e6ff05857253a523474dbacc075065621467a9419e461ea。初回不十分な1path snapshotは無効範囲として別保存し、CASへ使用しなかった。旧stale CASの失敗を成功へ変更していない。

全unit136pass/0fail/554 assertions、型とbuildはexit0。初回lintは新原本archiveの45件でexit1。その新コピーだけを既存evidence分類下へ同bytes移動し、最終lintはexit0。旧原本/過去evidenceのpathやbytesは変更していない。以前のlint370件は当時の記録として保持し、現在のlive CodeKB・作者文書のlint成功と原本生成物の対象分類を区別する。

r2専用/legacy候補の全inventoryと固定16入力は不変。68既存ソースとの差はmise.tomlのMarkdown taskだけであり、browser source/config/server/bundle入力の集合とbytesは不変。r2で実行した専用三ブラウザ45pass、legacy34pass/2既存skipはその同bytes候補へ適用できる。今回browserを再実行したとは記載しない。遠隔供給・CI・公開RC・実Pages/service-worker・実Safariは未検証である。

今回追加writeはmise.toml、.rumdl.toml、公式CASのCodeKB9文書と本summary/manifest/traceability/新検証記録、planのStep19–23 checkboxである。Step24の正式要求前/レビュー後/登録後workspace inventoryと正式レビュー受領はrootが連携して実行する。Step25の人の承認・Build and Test・U3返送も未実施で、現在完了とは主張しない。以降source/produces/planを凍結する。公開・push・PR・tag・deploy・U3承認は行っていない。
