# 統合の論理モデル

新しい業務データを追加せず、既存接続とローカル検証の概念を表す。永続データベースは導入しない。

```yaml
entities:
  - id: CHOICE
    description: 選択された CLI ビルド
    owner: Build catalog
    attributes:
      - {name: tool, type: identifier, required: true}
      - {name: ref, type: identifier, required: true}
      - {name: source_commit, type: digest, required: true}
      - {name: guest_identity, type: identifier, required: false}
    constraints: [tool と ref と source_commit の組が選択を識別する]
    relationships:
      - {target: RUN, cardinality: one-to-many, direction: outgoing}
      - {target: CANDIDATE, cardinality: one-to-zero-or-one, direction: outgoing}
  - id: RUN
    description: セッション内で直列実行されるコマンド
    owner: Formicarium command adapter
    attributes:
      - {name: generation, type: integer, required: true, min: 0}
      - {name: arguments, type: list-of-text, required: true}
      - {name: environment, type: text-map, required: true}
      - {name: cwd, type: path, required: true}
      - {name: timeout, type: duration, required: false, min: 0}
      - {name: output_sequence, type: integer, required: true, min: 0}
      - {name: state, type: enumeration, required: true, allowed_values: [queued, running, ended, failed, disposed], default: queued}
    constraints: [出力は現在世代の実行に属し順序を持つ]
    relationships: []
  - id: INPUT_SET
    description: 固定入力の検証済み集合
    owner: Fixed integration input descriptor
    attributes:
      - {name: identity, type: digest, required: true, unique: true}
      - {name: files, type: list-of-path-size-digest, required: true}
      - {name: provenance, type: metadata, required: true}
    constraints: [期待される全入力が一致しなければ検証済みではない]
    relationships:
      - {target: CANDIDATE, cardinality: one-to-many, direction: outgoing}
  - id: CANDIDATE
    description: 組立済みサイトの全体と選択可能なビルド
    owner: Site assembly
    attributes:
      - {name: destination, type: path, required: true, unique: true}
      - {name: input_identity, type: digest, required: true, references: INPUT_SET.identity}
      - {name: inventory, type: list-of-path-kind-content, required: true}
      - {name: attempt_id, type: identifier, required: true, unique: true}
      - {name: previous_candidate_identity, type: digest, required: false}
      - {name: retained_location, type: path, required: false}
      - {name: completion, type: enumeration, required: true, allowed_values: [incomplete, completed_ready, completed_failed, recovery_required], default: incomplete}
      - {name: state, type: enumeration, required: true, allowed_values: [preparing, ready, failed, recovery_required]}
    constraints: [ready の候補だけを今回の検証対象として選べる, 履歴保持物は完了記録と inventory が一致するときのみ正常履歴とする]
    relationships:
      - {target: EVIDENCE, cardinality: one-to-many, direction: outgoing}
  - id: EVIDENCE
    description: 対象を識別する検証・レビュー・引継ぎ記録
    owner: Formicarium integration tests
    attributes:
      - {name: record_id, type: identifier, required: true, unique: true}
      - {name: source_identity, type: digest, required: true}
      - {name: candidate_identity, type: digest, required: true}
      - {name: timestamp, type: timestamp, required: true}
      - {name: result, type: enumeration, required: true, allowed_values: [pass, fail, skipped, unverified]}
      - {name: references, type: list-of-path-digest, required: true}
    constraints: [変更前の記録は履歴として保持し現在の成功に流用しない]
    relationships: []
```

CHOICE は既存選択情報、RUN は実行単位。INPUT_SET と CANDIDATE は配布検証境界、EVIDENCE はその結果の追跡単位。配列の要素の path は相対パス、size は非負整数、digest は完全な暗号学的識別値とする。具体的な保存形式と既存型は実装段階で照合する。

CANDIDATE.inventory の各要素は相対 path と kind（file / directory / symlink）を必須とする。file は bytes の size と digest、directory はその存在と種類、symlink はリンク先文字列を必須とする。リンク先を追跡して file の digest に置き換えず、リンク先文字列をそのまま比較する。その他の種類は保全可能性を検証できないため開始前に拒否する。順序を正規化した全要素が候補 identity の入力となる。

試行記録は attempt_id、対象 destination、input identity、旧候補 identity / inventory と保持場所、新候補 identity / inventory、作業領域、completion を結び付ける。旧候補がないときは旧候補関連を省略する。新候補関連は完成後に記録する。記録は候補と別の場所に保持し、未完了から完了への更新は途中の記録を完了と読ませない方法で確定する。完了記録が欠落・不整合なら正常な履歴保持物とは扱わない。
