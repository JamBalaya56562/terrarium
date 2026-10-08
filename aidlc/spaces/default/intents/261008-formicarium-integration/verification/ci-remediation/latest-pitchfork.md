# Latest stable pitchfork in E2E CI

追加依頼により、E2E CIでのv2.29.0固定を最新安定版の解決へ変更。同じPR #27へ追加コミットとして提出する。

実行ごとにGitHub releases/latestを一度照会し、tagをfull commit SHAへ解決する。今回の観測はv2.30.1 / 1054549e85470b08d9507e2c82c850959a4b3914。source download、cache keys、artifact、staging、候補default、version期待値へ同じidentityを渡す。旧版へfallbackしない。ローカルci:e2eも最新を要求し、既存の古いbuildを成功として再利用しない。

現最新ソースには旧ioctl修正が既に入っていたため、2.30.1用patchでは重複hunkを除去した。公開source commitをdownloadし、全patchのforward dry-runが成功。build scriptはexact version patchがあれば優先し、古い2.29.0のbuildも既存patchを使う。将来のlatestでpatch/build不一致があればCIを失敗させ、古い版へ戻して合格にはしない。

ローカル確認: lint:all、型検査、89 unit tests、build成功。latest API/commit解決、無効releaseの拒否、同一identityのstaging、古いbuildの拒否を実行。Emscriptenでの最新CLI buildと3ブラウザ実行はremote CIで確認する。公開サイトdefaultとimmutable formicarium入力の変更はこの依頼に含めない。

固定入力の公開はユーザーが別途明示承認。入力供給の修正は同PRの別コミットへ分ける。
