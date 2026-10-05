# v1.8.0 テスト結果

## 構文

- `docs/app.js`: `node --check` OK
- `docs/sw.js`: `node --check` OK
- `api/index.ts`: TypeScript `transpileModule` 構文エラー 0
- `docs/styles.css`: `{}` バランス一致

## Qookka取込ロジック

前回「編成自動化ツール」で作成したPoC v0.7のQookka処理を基準に統合しました。

PoCの回帰テスト:

- Qookka fixture: 85武将 / 75所持戦法
- hash形式共有URLの `snapshot_id` 解析
- `hero` / `skill` snapshot API URL生成
- 複数snapshot ID重複排除
- その他編成評価テスト

`npm test`: 19/19 PASS

## 今回追加した安全策

- Qookka再同期で `dupe_count` を送らないため既存凸を上書きしない
- 所持から消えた項目は物理削除せず `is_owned=false`
- 同一編成の武将重複をAPIで拒否
- 同一編成の戦法重複をAPIで拒否
- UI検索候補から使用済み武将/戦法を除外
- 編成名/武将名/戦法名はAPI側でも長さ制限
- 保存時の名称はDB上の所持情報から再解決し、ブラウザ送信値だけを信用しない
- 編成は`is_shared=false`がDBデフォルト
- 共有解除時に`share_token`をNULLへ戻す
- 再共有時は新規ランダムトークン
- 私有テーブルはRLS有効、公開クライアント向けポリシーなし

## 実環境で確認が必要な項目

- Qookka側が将来API形式を変更した場合の追従
- Supabase Edge FunctionからQookka公開APIへの実ネットワーク到達
- iPhone PWAで検索シート表示時のソフトウェアキーボード高さ
- 別端末でDiscord連携した場合の私有owner統合
