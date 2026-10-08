# U3 Code Summary — draft

## 実装

terrarium の aube/pitchfork を通常 dependency の同一 U1 tarballと公開 C1 Sessionへ接続した。legacy Session/Tool は保持する。C3 は既存 Choice と tool/ref/commit を照合し、全 ref 資産と固定23 package fileを digestで配置する。nested cwd は /work に全 entries を置いてから public setCwd で選択する。C4 は queue、UTF-8 stream、event、switch/disconnect と keyboard/focus を保持し、C5 は exact parent/source/origin、隔離とcredentialless対応を guest起動前に検査する。

## main 観測済み

- public adapter/catalog/assets: 26 pass、142 expects。tests/tsconfig 型検査 exit0。
- quote 隣接互換: Red 10 pass/1 fail → 同じ suite Green 11 pass/0 fail。
- C4: 30 pass（10 scenario × 3 browser）。C5: 配信 fixture修正後15 pass、22.3秒。
- bridge consumer: cwd解決 Red → 同じ6 cases Green、12.2秒。
- latest pitchfork2.30.1 build成功、native/U1 Worker version一致。aube2.7.0 は公式musl再利用。
検証済み：fresh generation `47181b67-22c6-4eff-9993-4488e2c103ed` の Node26 cases、browser45 cases は全成功。
固定23 files は1567 lines中1283 covered、skipped0、81.87%で80% floorを満たした。
source identityは `10e59a2ce434302860783e7d0436efda25e21ab2d5a22354d0a06f6f9c23b9f6`、
candidateは `3e3401c5a93bca5c7635d2ba0761bd72125b3421319c6ce054b178e011602983`。
Node receiptはmain親processの実exit0観測から確定し、attemptは
`1284a873-3a20-42d6-88dc-b9d51a1275b5`。今世代46 receiptsと既存U1 immutable component importを区別する。
collectorのmissing raw/旧attempt/nonzero等の負例は9 pass。
結果は `.artifacts/u3-coverage-v1/{inventory,report,coverage-final}.json`。統合前CIは未検証。


## 保持する限界

U2 R-01/R-02 Major は未解消。local host の CORP/COOP/COEP 条件での成功を実 GitHub Pages成功とは扱わない。実 Pages headers/configuration、service-worker公開経路、公開RC受入れ、実 Safari、統合前CIは未検証。固定23分母と80% floorを維持する。外部repoの正規 recorded identity は mainのnative診断待ちであり、この草稿は source-manifest を代替しない。
