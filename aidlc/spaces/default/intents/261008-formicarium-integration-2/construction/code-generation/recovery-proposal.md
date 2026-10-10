# 登録拒否と文書lintの修復計画

## 調査結果と確度

正式再レビューの要求は2026-10-08T11:20:31Z、結果登録拒否は11:23:39Z。68個の実装ソースは一致したが、11:23:22Zにrumdlのworkspace cacheが更新された。既存の `.aidlc-engine/source-review/code-generation/workspace-941b21b49881.tsv` はgitignore対象の `.rumdl_cache/` を325件含む。現在のworkspace_index.binは同記録とSHAが異なり、新cache JSONも存在する。これは登録拒否の有力原因である。要求時そのものの全件inventoryがないため、cacheだけが原因と断定しない。拒否後のjj snapshotは11:24:13Zで、最初の拒否とは分ける。

公式rumdlの `check --no-cache` は利用可能。現在のレビュー本文は1ファイル検査成功、検査前後のdoctor source boundaryは `e2886869ebe6` で不変。旧cacheの削除・復元、ソース識別の除外追加、保護機能の緩和、旧receiptの書換えは行わない。

## 修復の順序

1. 既存の要求・不成立レビュー・正式レビュー1・ソース・ログ・候補とcacheの識別を保全する。公式のCode Generation再開始手順で新しい試行を開く。旧レビューを新しいソースへ付け替えず、実装と試験証跡は出所と適用対象を明記して再利用する。再開始の影響と新計画は通常の承認手順を通す。
2. `mise.toml` のMarkdown検査を `rumdl check --no-cache .` へ変更する。レビュー中の単独Markdown検査も公式 `--no-cache` を用いる。workspace外の一時領域を使い、ソースinventoryを要求直前・レビュー終了後・正式登録後に保存して内容/集合の不変を検証する。指紋計算法やguard設定を変更しない。
3. CodeKBは既存9文書の原bytesと過去解析identityを保存した上で、現在の30個別ソースを公式snapshot後に実際に再読する。既存23個別pathに candidate-transaction.mjs、assemble-candidate.mjs、対応する2テスト、formicarium-inputs.test.ts、pages.yml、publish-terrarium.yml を加える。現在の分析を新しい区画として明記し、古い解析区画を履歴として保持する。見出し階層・重複・空行を修正し、別candidateでlint、scope比較と世代/source CASを実行する。古いfingerprintを現在のものに付け替えない。liveストアの直接編集をしない。
4. `.rumdl.toml` の原本証跡を対象外とする既存方針に、深い階層のPlaywright生成 `error-context.md` と正式ツール生成 `reviews/review-*.md` の保存コピーを明示する。対象はintent記録内のこの2種類だけ。原bytesとcanonical review JSONは不変に保持し、生成物一覧とdigestを検証する。Markdown規則のdisable追加、application/CodeKB/仕様/計画/summaryの除外は行わない。新規レビュー本文は正式登録前に別途no-cacheで検査する。
5. 全体lintをexit0まで確認し、変更ファイルとソース識別をmanifestへ追加する。実装・候補に影響がある場合は新候補で三ブラウザを再実行し、影響しない場合は最新成功証跡の適用範囲を独立照合する。通常の承認・正式独立レビューを完了し、続いてBuild and Testの必須検査・正式レビュー・承認を完了する。人の承認を代行しない。
6. 正式レビューとBuild and Test完了後に、formicarium intent `261006-npm-terrarium-release` のU3へ識別可能な最終結果を返す。U3承認/完了は代行しない。公開・push・PR・タグ・deployは行わない。

## 変更範囲と制限

追加のアプリケーション動作変更は予定しない。変更対象はmise.toml、.rumdl.toml、公式CASで更新するCodeKB9文書、現在の計画・テスト手順・summary・manifest・traceabilityと新しい検証記録。正式レビュー1のcanonical JSONと保存コピー本文、過去sandbox診断、過去解析identity、旧候補は変更しない。

読取再解析を行うのは上記30ファイルだけであり、全repoの解析済みを主張しない。新試行でもソース境界が変化した場合は登録を止め、要求前後inventoryから具体的差分を提示する。二度拒否された同操作は再試行しない。

## 承認

この修復範囲とCode Generationの公式再開始を承認する。

Approve
Request Changes

```text
[Answer]: Approve
```
