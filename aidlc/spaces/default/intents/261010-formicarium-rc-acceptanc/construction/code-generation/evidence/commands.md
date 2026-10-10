# 再実行コマンドと環境

## Environment

root cwd: `/Users/mutoakio/Documents/terrarium`。unit/type/build cwd: `packages/terrarium`。Node v26.11.1、Bun 1.4.2、npm 11.20.0。Chromium153.0.8010.12、Firefox155.0、WebKit26.6。versionsは実browser launch後のversion()値です。

## Commands

R-01後の新環境の入口（root）:

```sh
mise run terrarium:rc:prepare
FORMICARIUM_INPUTS_DIR=/Users/mutoakio/Documents/terrarium/.vendor/formicarium-inputs-public-rc1 FORMICARIUM_INPUTS_ROOT=/Users/mutoakio/Documents/terrarium/.vendor/formicarium-inputs-public-rc1 mise run ci:terrarium
```

通常test前の取得・検証はtest:prepareへ組み込み済み。fresh-rc-acquisition.jsonは不存在directoryからの実取得、fresh-identity-unit.jsonはその新tarballでの5cases、fresh-ci-terrarium.jsonは実際の通常pipelineの出力です。

各JSON logのcommand/cwd/exit/outputが実行証跡です。新public input生成の最初のscript版はargsなしでbaselineを読んで実行しました。最終版は同じ処理を明示argsにしたため再生成手順は次です（既存一致bytesの再利用のみ許可）。

```sh
mise exec -- node scripts/prepare-formicarium-rc-inputs.mjs --from .vendor/formicarium-inputs-repair-v1 --descriptor aidlc/spaces/default/intents/261010-formicarium-rc-acceptanc/construction/code-generation/evidence/input-baseline-descriptor.json --output .vendor/formicarium-inputs-public-rc1
mise exec -- node scripts/verify-formicarium-rc.mjs
mise exec -- node scripts/accept-formicarium-node.mjs --inputs .vendor/formicarium-inputs-public-rc1 --output aidlc/spaces/default/intents/261010-formicarium-rc-acceptanc/construction/code-generation/evidence/node-acceptance.json
FORMICARIUM_INPUTS_ROOT=/Users/mutoakio/Documents/terrarium/.vendor/formicarium-inputs-public-rc1 mise run terrarium:formicarium-build
FORMICARIUM_INPUTS_ROOT=/Users/mutoakio/Documents/terrarium/.vendor/formicarium-inputs-public-rc1 mise run terrarium:formicarium-e2e
```

取得はnpm-pack.json、registryはregistry-metadata.json、導入はbun-install.jsonとbaseline-results.md、実導入同一性はinstalled-identity.json、staging候補はcandidate-identity.json。browser command exit0、45pass/0fail/0skip。Node command exit0、6pass/0fail/0skip。
