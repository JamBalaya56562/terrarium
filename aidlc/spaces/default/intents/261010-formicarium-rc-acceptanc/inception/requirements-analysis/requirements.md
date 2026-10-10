# 公開RC受入れ検証の要件

## Intent Analysis

指定された公開npm RCが現在のterrariumで受け入れられるかを、実際の導入物と再実行した試験に基づいて判断できるようにする。過去のlocal packの合格は今回の公開RCの合格証拠としない。目的の根拠は[承認済み目的](../../ideation/intent-capture/intent-statement.md)、現状の根拠は[承認済み調査](../reverse-engineering/developer-scan.md)。深度Minimal、workflow-selected scopeはpoc。全要件の優先度はMust。

## Functional Requirements

| ID | 要件・合格基準 | 根拠 |
| --- | --- | --- |
| FR1 | `@aletheia-works/formicarium@0.1.0-rc.1`を完全固定しnpm registryから取得・導入する。実行コマンドと取得元・解決されたtarball URL・registry metadataを保存する。local file依存や可変tagでの導入を公開RC導入の代用にしない。 | 初期依頼、目的Problem Statement |
| FR2 | 実導入物のpackage.json versionが`0.1.0-rc.1`であること、取得tarballのintegrityがregistryの`dist.integrity`と一致すること、tarball SHA256が`8334d7f14c31109e5be3ec90147aa02105d8d839c4c79eccc1c25cb88eabbb3a`と一致することを実測する。導入先・lockの解決内容と、導入物のファイルが照合したtarball由来であることを記録する。不一致時は受入れ成功にしない。 | 初期依頼、目的Success Metrics |
| FR3 | terrariumの依存・入力descriptor・package manifest・stagingを指定RCの実物へ接続し、試験が照合した導入物を利用することを確認する。必要な変更と理由を記録し、ハッシュ検証を弱めて通さない。旧入力は履歴として区別する。 | FR1・FR2を成立させる条件、調査Technical Debt Signals |
| FR4 | Nodeで公開RCを使う実行経路を確認・必要なら最小の検証用runnerを用意し、実guestを動かす受入れ試験を再実行する。対象guest・コマンド・期待出力・exit・状態保持等の対象ケースと結果を記録する。fake Sessionのunit試験やlegacy Emscripten runnerだけでは達成としない。 | 初期依頼Node、調査Node Runner |
| FR5 | 公開RCを利用するterrariumの専用受入れ試験をChromium・Firefox・WebKitで再実行する。既存の要素10ケース＋iframe5ケース／ブラウザ（計45ケース）について実際の件数、pass/fail/skipを記録する。失敗・skipを隠すために既存期待値や件数を下げない。失敗時は原因と未達ケースを記録する。 | 初期依頼3ブラウザ、調査Test Coverage |
| FR6 | 全取得・導入・照合・build・試験コマンドについて実行場所、環境/tool version、終了コード、出力または証跡ファイルを記録する。各環境の判定をpass/fail/未実行で区別し、再試験結果と過去証拠を区別する。 | 初期依頼コマンド・結果、目的Success Metrics |
| FR7 | upstream/main更新後の検証開始時点を基準に、今回追加したterrariumの差分を記録する。元から存在した他の変更と区別し、既存変更を保全する。記録をこのintent配下へ保存し、取得物の同一性、4環境の結果、差分、残課題をこのチャットで報告する。 | 初期依頼差分、目的Target Customer・Q2、main更新指示 |

## Non-functional Requirements

| ID | 検証可能な条件 | 根拠 |
| --- | --- | --- |
| NFR1 | 対象RCのversion・integrity・SHA256と、実試験に使った導入先／入力identityの対応を証跡で追える。値を推測・宣言だけで済ませない。 | FR1–FR3、Verify before asserting |
| NFR2 | Node＋3ブラウザの4環境すべてに結果行を作る。依存取得失敗や環境制約で実行不能な場合は未実行理由を明記し、受入れ完了とは判定しない。 | 目的Success Metrics |
| NFR3 | 変更に対応する既存型検査・unit・buildを実行し結果を記録する。失敗を解消できない場合は残課題として報告し、既存suiteがgreenとは主張しない。追加のcoverage率・速度・可用性目標は設定しない。 | org Testing Posture poc、FR6 |

## Constraints

- 公開、push、PR作成は行わない。npm login、アカウント・秘密情報の操作も不要。
- ローカルVCS操作はjj、tool実行はproject-pinned mise、package管理はBun。bun.lockのlockfileVersion 1を維持する。
- upstream/main `9aa3c0e6`は取り込み済み。既存の未コミット変更を上書き・除去しない。今回の差分の基準を別途捕捉する。
- 公開RCの取得と受入れに必要な最小変更だけを行う。製品の対象CLIやアーキテクチャの戦略変更は行わない。
- Node試験は検証用ホストとしてのNode利用であり、ブラウザ製品へNode.js実行機能を追加するものではない。

## Assumptions

None.

## Out of Scope

公開・deploy・push・PR、他チャットや担当者への追加送信、対象CLI追加、formicarium内部の修正、新規製品機能。実Pages配布・service worker・実Safariの検証は今回指定されたWebKit試験と同一視しない。

## Open Questions

人の判断が必要な未回答事項はNone。公開RCの実ファイル構成・入力互換性・Node APIの実行可否は後続で測定する技術上の未検証事項。RCが不一致／非互換なら結果と必要な対処を報告し、別版へ無断で切り替えない。
