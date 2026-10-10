# 共有checkoutの検証

2026-10-10、upstream/main 9aa3c0e6を基点に、共有コミットだけのjj workspace `/private/tmp/terrarium-rc-share-20261010` で実行した。AI-DLC本体の未共有更新は含まない。

| Command | Result |
| --- | --- |
| `FORMICARIUM_INPUTS_DIR=/Users/mutoakio/Documents/terrarium/.vendor/formicarium-inputs-public-rc1 mise run ci:terrarium` | exit 0。新規dirでnpm view/pack、期待SHA256/integrity一致、frozen install、typecheck、144pass/0fail、build成功 |
| `mise run lint:all` | 初回記録Markdown27指摘。対象16filesのrumdl機械整形後、exit 0。Biome56files、rumdl88files、Tombi21files、ShellCheck/actionlint成功 |

初回miseはtrusted-config cacheへのsandbox書込みを拒否したため、ホスト権限で実行した。秘密情報・製品ロジック変更はなし。

Node6/6、3browser各15/15の実guest再実行証跡はconstruction/build-and-test/evidenceを参照。共有準備ではapplication source bytesを変えず、同じ受入れ結果を採用する。通常ci:e2e全体（legacy/build/download含む）は今回の共有準備で再実行していない。

遠隔CI/Pages/実Safariは未検証。CIは現在の固定16ファイルarchiveのFORMICARIUM_INPUTS_URL供給が必要。test-e2e workflowの直接assembly経路で照合tarballを準備する接続は後続調整対象としてdraft PRへ明記する。
