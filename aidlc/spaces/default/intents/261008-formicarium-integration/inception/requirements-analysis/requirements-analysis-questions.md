# Requirements Analysis Questions

## Sources

- Initial description: Review and validate the existing formicarium npm integration in the sibling terrarium repository, preserving current source and candidate hashes and returning identified evidence to intent 261006-npm-terrarium-release; no publication or push.
- 承認済み調査: `aidlc/spaces/default/codekb/terrarium/code-quality-assessment.md`。
- 追加依頼: 「未解決の点は解決できそうなら解決して欲しい」。直近の検証証拠は現在のソース・候補に適用できることを確認済み。

## Q1: 修正範囲と既存候補の保存

CI入力不足・絶対tarballパス・隣接配置への依存は、terrariumの設定や配置処理の変更で改善できます。一方、最初の依頼には現在のソースと候補ハッシュの保存が含まれます。今回の作業範囲をどう定めますか？

A. 現ソース・候補を基準として保存し、terrarium側の依存配置・CI接続の最小修正を別の変更として実装・検証する。修正後のハッシュと証拠は新規に記録する。
B. 現ソース・候補のバイトを変更せず、検証・証拠引継ぎと具体的な修正計画までに留める。
X. Other (please specify)

[Answer]: A. 基準を保存して最小修正

どちらの場合も、push・公開、formicarium側のproducer改修、アーキテクチャの正式変更は含めない。直近の成功証拠を古いという理由だけで再実行しない。変更する場合は変更の影響に応じた検証を行う。
