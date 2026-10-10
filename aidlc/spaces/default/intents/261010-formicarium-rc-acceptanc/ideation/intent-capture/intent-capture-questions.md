# 公開RC受入れ検証の確認事項

## Sources

- [desc] Initial description: "formicariumの公開RC @aletheia-works/formicarium@0.1.0-rc.1 を使った受入れ検証を進めてください。バージョンを固定してnpmから取得し、実際に導入したパッケージのversion・integrity・tarball SHA256を確認してください。期待するSHA256は 8334d7f14c31109e5be3ec90147aa02105d8d839c4c79eccc1c25cb88eabbb3a です。Node・Chromium・Firefox・WebKitで受入れ試験を再実行し、コマンド・結果・terrariumの差分を記録してください。公開・push・PR作成は不要です。"
- [scope] Workflow-selected scope: `poc`.

## 依頼で確定した事項

- 公開npmの固定版 `@aletheia-works/formicarium@0.1.0-rc.1` の実際の導入物を対象にする。[desc]
- version・integrity・tarball SHA256を確認し、指定SHA256と比較する。[desc]
- Node・Chromium・Firefox・WebKitで受入れ試験を再実行し、コマンド・結果・terrariumの差分を記録する。[desc]
- 公開・push・PR作成は行わない。[desc]
- 今回の進め方は承認済みの `poc`（workflow-selected）。[scope]

## Q1. 結果を確認し、受入れを判断する人

結果報告の宛先と受入れ判断者を明確にします。追加の関係者がいなければ、このチャットで依頼者へ報告します。

A. このチャットの依頼者が確認・判断する
B. 依頼者に加えてformicarium担当者が確認する（宛先を指定）
C. Not identified（追加の判断者は未定）
X. Other (please specify)

[Answer]: B. 依頼者に加えてformicarium担当者が確認する。ユーザー回答: Q1: 2, Q2: 1。担当者の個別宛先は今回指定なし（追加送信なし）。

## Q2. 結果の報告方法

コマンド・結果・差分の記録は依頼済みです。その記録を今回どこへ報告するか確認します。

A. terrarium内に記録し、このチャットで結果を報告する
B. terrarium内の記録とこのチャットに加えて、指定のチャットへ結果を返す（宛先を指定）
C. None（追加の報告先・定期報告なし）
X. Other (please specify)

[Answer]: A. terrarium内に記録し、このチャットで結果を報告する。ユーザー回答: Q1: 2, Q2: 1。
