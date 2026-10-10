# 実guest受入れ手順

## Scope

MinimalだがFR4/FR5のためNodeと3ブラウザを実行する。性能・securityの追加目標は存在せず、対応instructionは生成しない。zero-Unitで重複実行しない。

## Commands

rootで公開candidate build後に`mise run terrarium:formicarium-e2e`。専用element/iframe45cases、3browser、workers1/retries0。Nodeは`mise exec -- node scripts/accept-formicarium-node.mjs --inputs .vendor/formicarium-inputs-public-rc1 --output aidlc/spaces/default/intents/261010-formicarium-rc-acceptanc/construction/build-and-test/evidence/node-acceptance.json`。

unitはCode GenerationのExact Commandsの5つを一度ずつ実行する。fresh tarball指定identityも実行する。必須N1–N6とexpected値は同stage instructionsを使用する。

## Expected

staging suiteとfull suiteには`FORMICARIUM_INPUTS_ROOT=/Users/mutoakio/Documents/terrarium/.vendor/formicarium-inputs-public-rc1`を明示する。旧default input参照による初回失敗を解消した。ブラウザ起動がmacOS sandboxで拒否される場合は同コマンドをホスト権限で実行する。初回失敗を成功扱いに置き換えず別ログに保存する。

Node6/6、3browser各15/15、fail/skip0。Firefox/WebKitのunsupported契約と実guest成功を区別する。遠隔CI/Pages/実Safariは対象外。coverage率・速度・可用性目標はない。
