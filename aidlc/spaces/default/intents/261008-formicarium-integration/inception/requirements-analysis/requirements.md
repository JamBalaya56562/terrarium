# formicarium統合の依存配置・CI接続

## Sources

- [desc] Initial description: Review and validate the existing formicarium npm integration in the sibling terrarium repository, preserving current source and candidate hashes and returning identified evidence to intent 261006-npm-terrarium-release; no publication or push.
- [Q1] `requirements-analysis-questions.md`: 「基準を保存して最小修正」。現在のソース・候補を保存し、terrarium側の依存配置・CI接続を別の変更として実装・検証する。
- [scope] Workflow-selected scope: express、Minimal。
- 承認済み調査: `../../../../codekb/terrarium/code-quality-assessment.md` と `../reverse-engineering/developer-scan.md`。
- 現ソース適用性の証拠: `../reverse-engineering/evidence/reconsideration-proof.json`。

## Intent Analysis

直近のformicarium検証済み候補を保存しながら、terrariumの依存配置とCI接続を、個人のMacの絶対パスや暗黙の隣接配置に依存しない形へ最小限修正する。利用者の端末・iframeの振る舞いは維持する。修正後の検証証拠を元の候補の証拠と区別し、兄弟intent `261006-npm-terrarium-release` に引き継げる記録を残す。[desc][Q1]

## Functional Requirements

### FR1: 基準の保存と変更後の識別

Must。[desc][Q1]

- FR1.1: 変更前の対象ソース、依存tarball/manifest、サイト候補のファイル一覧・SHA-256・既存検証の対応を保存する。既存 `.site` と検証証拠を上書きせず、修正後の生成物は別ディレクトリに作る。
- FR1.2: 変更後のソースと候補には独立した一覧・ハッシュ・検証結果を記録する。変更前の合格結果を変更後の合格結果として引用しない。
- 合格基準: 保存済み元候補digest `3e3401c5a93bca5c7635d2ba0761bd72125b3421319c6ce054b178e011602983` と元tarball SHA `969e9fab854d4499da1d38087bd601b65042b6d50b086c8fc8ddaefd0752f810` が変更後にも一致する。変更したソースは旧bytesを復元でき、旧・新manifestを識別できる。

### FR2: 明示した配布入力による依存配置

Must。[Q1]、調査のCI/portable依存課題。

- FR2.1: リポジトリ内の依存設定から個人Macの絶対tarballパスを除く。公開済みRCを仮定せず、既存の固定tarballとmanifestを明示入力として利用可能にする。
- FR2.2: package assets、resolver modules、guest siteの入力位置を明示でき、暗黙の兄弟checkoutを必須にしない。固定入力のdigestと必要ファイルを確認してから配置する。
- FR2.3: catalogで広告した全refのguest/provenance/fixturesを検証・配置し、不足・不一致は対象と原因を示して非ゼロ終了する。
- 合格基準: 一時的な単独checkout相当の作業場所で、明示入力だけから依存配置・サイト組立が成功する。入力なし・asset欠落・digest不一致のケースは成功を報告せず、元候補を変更しない。既存の全ref配置テストを保持する。

### FR3: CIでのformicarium統合検証

Must。[Q1]、調査のCI入力不足・専用config未接続。

- FR3.1: 固定package/resolver/guest入力の受渡しをCIに明示する。供給方法、必要な引数/環境変数、digest検証を記録し、ローカルでも同じ手順を実行できるようにする。
- FR3.2: 型検査・既存unit tests・buildに加え、formicarium専用Playwright configのelement/iframe検証をChromium/Firefox/WebKitで実行する。既存legacy検証を失わせない。
- FR3.3: 入力不足を早期に失敗させ、ブラウザごとの合否と検証対象identityを出力に残す。
- 合格基準: 個人の絶対パス・隣接checkoutなしでCI相当の手順が全対象を実行できる。専用configがコマンドに指定され、失敗はジョブの非ゼロ終了に伝搬する。リモートCIの実行はpush禁止のため今回の完了条件にしない。

### FR4: 検証記録と引継ぎ

Must。[desc][Q1]

- FR4.1: 要件→変更ファイル→コマンド→結果→新source/candidate identityを対応づける。取り込んだ直近の実行証拠と今回の変更後の実行結果を区別する。
- FR4.2: 兄弟intent向けの引継ぎ文書をこのintent内に作り、基準・修正後identity・確認済み範囲・残る配布受入れ条件を示す。兄弟リポジトリの書込みや別チャットへの送信は含めない。
- 合格基準: 各Must要件に証拠参照があり、未実行項目を合格として記録しない。CodeKBの `unknown` と実ソース鮮度の独立確認を混同しない。

## Non-functional Requirements

- NFR1: 再現性。固定入力のバイトとdigestを同定し、単独作業場所でも同じ入力で配置・検証が完了する。個人絶対パスへの参照を0件にする。[Q1]
- NFR2: 信頼性。変更後の既存unit/対象E2Eに新規失敗を0件とし、必要なテストの未実行やskipを成功に含めない。Firefox/WebKitのcross-origin iframeの明示拒否は既存仕様に従う。[Q1]
- NFR3: 境界維持。公開Session API、exact parent source/origin照合、digest/provenance照合、同一origin Worker条件を維持する。サーバー側CLI実行・ネットワーク機能を追加しない。関連する既存負例が引き続き通る。[desc]、既存仕様。
- NFR4: 証拠の独立性。変更前候補・tarballの改変0件。変更後のテスト記録を変更前のreceiptで代用する箇所0件。[desc][Q1]

## Constraints

- Bun/miseとjjを利用し、小さいdiffに留める。Actionsはfull SHA pin、最小権限を維持する。
- 依存・配置・CI接続の修正に必要な範囲だけを変更する。formicariumのproducer自体は変更しない。
- push、公開、タグ作成、accounts/credentials/secrets操作は行わない。
- 現Blink/static-musl統合を使う限定的検証は、Emscripten/no-emulator方針の正式変更を意味しない。採用戦略は人の判断事項として残す。
- 構築前に具体的な変更計画と検証手順を提示する。生成物は基準候補と分離する。

## Assumptions & Open Questions

None.

固定入力の具体的なCI供給方式はCode Generationで既存tarball/manifestとリポジトリの制約から設計する。公開registryから未公開RCを取得する方式や、入力を持たずに実行をskipする方式は要件を満たさない。実装段階で供給不能が分かった場合は、成功扱いにせず不足入力を示す。

## Out of Scope

formicarium側の一般producer改修、staging全体の原子性リファクタ、実GitHub Pages/service-worker・実Safariの受入れ、公開RCのpublish、remote CI実行、戦略変更、新たなCLIや汎用シェル機能。

## Verification and Traceability

| 要件 | 主な確認 |
| --- | --- |
| FR1・NFR4 | 基準manifestと元候補/tarballの再照合、新旧成果物の分離 |
| FR2・NFR1 | 単独作業場所での固定入力配置、欠落・不一致の負例 |
| FR3・NFR2 | 型検査/unit/build、legacyと専用3ブラウザのCI相当手順 |
| FR4 | 引継ぎ文書とコマンド・identity・結果の対応 |
| NFR3 | 公開契約、origin/digest負例と既存受入れの回帰 |

テスト戦略はMinimal。既存の直近合格証拠を初期基準として使い、変更後は影響する経路と必要な既存チェックを実行する。以前のfixed23の81.87%は元候補の観測値として保存し、変更後への自動転記や全ファイルcoverageの主張に使わない。
