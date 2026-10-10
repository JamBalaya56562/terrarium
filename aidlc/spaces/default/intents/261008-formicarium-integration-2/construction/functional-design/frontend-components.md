# 既存端末と iframe の設計境界

## Component hierarchy

Standalone and iframe bridge → Terrarium terminal element → Build catalog → Formicarium command adapter または Legacy Session compatibility boundary。新しい画面や要素は追加しない。

## Props and state

既存の tool/ref 選択と fixture/cwd を維持する。要素は現在の generation、初期化状態、実行 queue、transcript、終了通知を所有する。切替・disconnect により旧世代を無効にする。bridge は親 source/origin と選択入力を所有し、Session の内部状態を所有しない。

## Interaction flows

選択 → identity 照合 → 初期化 → 直列 run → callback 出力 → 終了イベント。起動・実行エラーは利用者に通知する。後続実行の回復、遅延初期化後の切替、disconnect 後の古い出力を既存 unit / browser 検証で確認する。候補切替中はブラウザ検証を開始しない。

## Validation and integration

guest 宣言なしの legacy 分岐、既存公開 API、引数・environment・timeout・取消の伝達を保持する。iframe は親 source/origin を完全一致で照合する。不正メッセージで実行を開始しない。新しいフォームはなく、既存選択入力の検証契約を維持する。

## Traceability

FR1 / FR2 → BR1.1、FR1 / FR3 → BR1.2、FR3 / NFR2 → BR1.3。新しいアクセシビリティ・性能目標は追加せず、既存動作の回帰を記録する（NFR5 / BR3.2）。本設計は公開 RC、実 Safari、実配布 host を保証しない。
