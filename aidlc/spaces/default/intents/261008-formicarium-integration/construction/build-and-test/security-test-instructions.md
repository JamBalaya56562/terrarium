# Security Test Instructions

## 対象

NFR3のorigin/source、digest/provenance、同一origin Worker境界とFR2の入力安全性を確認する。API認証/サーバー/新ネットワーク機能は対象に存在しない。

packages/terrariumからunit-test-instructions.md記載の4種類のformicarium限定コマンドとshell限定コマンド、全unitを各一度実行する。入力なし、改変tarball/manifest/resolver、欠落ref、path escape/symlink、偽origin/source、cross-origin Workerを既存負例で確認する。browser負例はintegration-test-instructions.mdの実走に含む。

workspace rootから `mise exec -- actionlint .github/workflows/test-terrarium.yml .github/workflows/test-e2e.yml`、`mise exec -- shellcheck scripts/*.sh mise-tasks/*/*.sh`（source参照先も含む正規入力）。Actions full SHAとread-only permissions、persist-credentials:falseを読み取る。これは限定安全性検証で、総合脆弱性診断済みとは主張しない。
