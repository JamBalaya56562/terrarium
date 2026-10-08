# 261006-npm-terrarium-release向けhandoff

terrariumの固定入力配置・CI接続と承認済み既存2shell失敗修正を完了した。local結果はsuccess。兄弟repo書込み・別チャット送信、push/publicationは行っていない。

## Current identities / execution

source-manifest.jsonは22source/config/test/doc paths＋生成3trees。evidence/source-shell-fix-final.jsonで旧/新SHAと単独tempの全22bytes一致を確認した。追加4filesの旧bytesと旧summary/manifestはevidence/additional-baseline/に保存。過去の失敗記録とbrowser bindingは上書きしていない。

Mac標準Bash3.2/BSD patchで限定20pass、全unit85pass/0fail。独立tempも全85pass/0fail。型/build/ShellCheck(-x)/Biome成功。追加は負match indexを正indexへ置換し、patch方向を--forceで固定した。PR3表記、初回patch成功、vendor失敗から適用済み再試行、不一致拒否とvendor/Cargo marker不在を実測した。

追加変更前の専用45passとlegacy34pass/2既存skipは元source/candidate bindingで保持した。同versionで再bundleしたSHA70d844…は既実走candidateと完全一致し、3candidate全inventoryも不変。browser再実走は不要として行っていない。legacy2skipはpassに加算しない。

入力descriptor16filesとarchive00abfc…を使用し、旧candidate3e340…、tarball969e…、manifestba2f…も再照合一致。fixed23の旧81.87%を新sourceへ転用しない。最終詳細はcode-summary.md、evidence/additional-results-final.json、additional-preservation-browser-binding.jsonを参照する。

## Historical failures / remaining acceptance

旧native全unit79pass/2failと原因測定を保持する。temp初回のpages.yml fixture不足による82pass/1fail+1errorも保持し、読取fixtureコピー後の85passと区別した。以前のtempの「同じ2fail」説明にはfixture不足errorが省略されており、今回完全集合で再検証した。

GNU/Linux・remote CIは未実走。固定archiveの外部配備、FORMICARIUM_INPUTS_URL設定、他pages/publish/lint install利用者のprepare接続は未実施。公開RC、実Pages/service-worker、実Safari、architecture採用は別条件。CodeKBのunknownとraw source確認を分け、直前のformicarium証拠を今回のunit成功の代用にしていない。

Steps4/8を含む全14stepsは実装・ローカル検証完了。lifecycle report/gateの実行はroot担当。
