# Pre-PR remediation — 2026-10-08

ユーザーの追加指示により、修正可能な残件を先に修正し、pushとupstream PR作成を許可された。

- CT-1: 下位10要件の明示IDと既存の実行証拠を追加し、18/18 target存在・OKを確認。以前のFAIL報告はその時点の記録として保持。
- Pages/publish: frozen install前に固定入力の検証・配置を接続。
- Node 26.9.0をmiseへ明示し、関連Actionsで導入。未指定shimによる型検査・組立の失敗を解消。
- Mac Bash 3.2でも全shell scriptsを列挙できるlint経路へ修正。
- コード・文書をlint規約へ整形。型負例の注釈位置を維持。immutable evidenceはlint修正対象から除外し、保存済み候補・入力の同一bytesを再確認。
- upstream mainのActions更新（f0b7d465）を取り込み。

最終確認: lint:all、ci:terrarium（型検査、85 unit tests、build）成功。再組立した専用候補の45 E2E成功。legacyは34成功、既存のFirefox/WebKit credentialless iframe 2件skip。

最新ソースinventoryと各ログdigestは [証拠](evidence/final-results.json) を参照。専用候補の初回実行は既存組立を使用したため、最新の再組立後に45件を別ログbrowser-formicarium-final.txtで再実行した。過去の証拠を最新結果へ流用しない。

外部archive配備・FORMICARIUM_INPUTS_URL設定、remote Linux CI、公開formicarium RC、実Pages/service-workerと実Safariの受入れは未完。file依存のままのpackage公開は受入れ未成立。戦略採用と公開tagは人の判断を要する。PRはこれらを明示してdraftとする。

当初のoriginはaletheia-works/terrarium本体。connectorの権限表示はpush可能だったが、SSHユーザーMarukome0743は実際のpushを拒否された。既存Edgeセッションから個人forkを作成し、originを個人fork、upstreamを本体とする。個人forkのcodex作業ブランチからupstream mainへdraft PRを提出する。
