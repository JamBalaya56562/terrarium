# 要件と作業単位の対応

## Mapping Basis

User Storiesは承認済み計画で省略されているため、ストーリーIDを創作せず、`../requirements-analysis/requirements.md` のすべてのFRを直接対応付ける。IDとDirectoryは `unit-of-work.md`、依存は `unit-of-work-dependency.md` に一致する。

## Requirement Mapping

主担当はtraceability.jsonのOK target。協力単位も当該要件の受入に寄与するが、ファイル所有は `unit-of-work.md` に従う。

| Requirement ID | 内容 | Unit ID | Directory | 協力単位／分担 |
| --- | --- | --- | --- | --- |
| FR1 | ビルドと配布登録 | U1 | `u1-pitchfork-runtime` | U2:カタログ、U3:Pages／CI |
| FR1.1 | パッチ適用・Emscriptenビルド | U1 | `u1-pitchfork-runtime` | U3:CIからの再現 |
| FR1.2 | ref・staging・カタログ・Pages | U1 | `u1-pitchfork-runtime` | U1:ref/staging、U2:カタログ、U3:Pages |
| FR2 | コマンドと設定保持 | U1 | `u1-pitchfork-runtime` | U2:各入口、U3:全構成E2E |
| FR2.1 | 基本セッションの順次実行 | U1 | `u1-pitchfork-runtime` | U2:公開／埋め込み、U3:CI |
| FR2.2 | 設定・settings保持 | U1 | `u1-pitchfork-runtime` | U2:各入口、U3:CI |
| FR3 | 公開ページと埋め込み利用 | U2 | `u2-pitchfork-terminal` | U1:基本ビルド、U3:E2E |
| FR3.1 | URL・ツール選択 | U2 | `u2-pitchfork-terminal` | U3:切替回帰 |
| FR3.2 | 要素・iframe | U2 | `u2-pitchfork-terminal` | U3:終了通知・境界回帰 |
| FR4 | 既存aube動作の維持 | U3 | `u3-pitchfork-ci` | U1/U2も変更範囲の回帰を確認 |
| FR5 | jj変更分離・PR提出 | U3 | `u3-pitchfork-ci` | 各単位の証拠と差分を集約 |

## Cross-cutting Requirements

| Requirement ID | 内容 | 主担当 | 協力・受入条件 |
| --- | --- | --- | --- |
| NFR1 | 既存実行方式・安全境界 | U2 | U1は基本実行、U2は公開／埋め込み境界、U3は既存境界テストのCI再現 |
| NFR2 | lint・型・unit・build・3ブラウザE2E | U3 | 各単位は自分の受入を検証し、U3で全タスク合格を集約 |
| NFR3 | 証拠・再現手順 | U3 | U1/U2も各条件の具体的な証拠を残す。未検証・失敗を成功に置換しない |

## Within-unit Acceptance Progression

これは単位内の受入確認のつながりであり、単位間の経済的な優先順位ではない。

- U1: FR1.1のビルドとFR1.2のstagingを前提に、FR2.1のセッションとFR2.2の保持を実ブラウザで確認する。
- U2: FR1.2のカタログ選択を前提に、FR3.1のページとFR3.2の埋め込み、aube切替・安全境界を確認する。
- U3: 実行可能なU1/U2を用いてFR1.2のPages経路、FR4・NFR2の全回帰、NFR3の証拠集約を確認し、FR5のレビュー可能なPRへまとめる。

## Coverage Verification

FR1、FR1.1、FR1.2、FR2、FR2.1、FR2.2、FR3、FR3.1、FR3.2、FR4、FR5の11IDをすべて対応付けた。三単位すべてがFRを持つ。機械検証対象は `traceability.json`。これは割当の網羅性であり、実行テストの合格率ではない。
