# Draft PRの共有範囲

## Scope

公開RC受入れの12ファイルだけではmain上で再現できないため、既存のformicarium入力検証・候補transaction・staging修正を前提として含める。application/configは27ファイル、記録用Markdown lint設定も含む。

関連するformicarium-integration/integration-2/rc-acceptancの記録、intents registry、terrarium CodeKBを共有する。これらは前提変更の経緯・baseline・失敗・成功を保持する。AI-DLCの生成ツール・skill・harness更新、AGENTS.md/.gitignoreのframework更新は別のローカル変更として保全する。

## Validation and Delivery

upstream/mainの作業ブランチcodex/formicarium-public-rc-acceptanceへjjで署名付きpushし、main向けdraft PRを作る。mainへの直接push・merge・タグ公開は行わない。

Node6/6、Chromium/Firefox/WebKit各15/15、unit144/144、型/build成功の受入れ証跡を添付する。新環境のnpm取得・tarball SHA256/integrity照合も検証済み。共有checkoutでlint:allとci:terrariumを確認する。遠隔CIには現在の固定16ファイル供給URLが必要で、到達性は未検証。旧archive fallbackを復活させない。

AIレビューと細部調整はAI-DLCの安定後に行う。draftのまま共有し、自動AIレビューを依頼しない。
