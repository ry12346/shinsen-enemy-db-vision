# v1.8.0 更新手順 — マイ編成 / Qookka所持同期 / 凸入力 / 編成共有

## 追加内容

既存の敵部隊データベースへ「マイ編成」を追加します。

### Qookka所持情報同期

- Qookka共有URLから `snapshot_id` を抽出
- 既存PoCで確認済みの公開APIから所持武将・所持戦法を取得
- Qookka公開cfgを使って日本語名へ変換
- 取得内容をSupabase DBへ保存するため、共有URLが期限切れになっても保持
- 再同期時は前回との差分を取り、増減した武将・戦法を反映
- 消えた武将・戦法は物理削除せず `is_owned=false` にするため、再取得時に復帰可能
- 凸はQookka同期と分離し、再同期しても上書きしない

### 凸入力UI

武将ごとに5個の丸を横並び表示します。

- 1個目をタップ → `● ○ ○ ○ ○` = 1凸
- 3個目をタップ → `● ● ● ○ ○` = 3凸
- 5個目をタップ → `● ● ● ● ●` = 5凸
- 現在と同じ位置をもう一度タップ → 0凸

見た目の丸よりタップ領域を大きくし、スマホでは約44pxを確保します。

### マイ編成

- 所持武将だけから武将を選択
- 所持戦法だけから第1・第2戦法を選択
- 選択画面は検索シート方式。入力文字で即時絞り込み
- 既に同一編成で使用している武将・戦法は候補から除外
- 固有戦法はQookka同期情報から自動表示
- 凸は所持情報に保存した現在値を自動表示
- 兵種 / 兵種Lv / メモも保存可能

### 公開範囲

- 作成した編成は初期状態で非公開
- 所持武将一覧・所持戦法一覧・他の非公開編成は共有されない
- 「共有する」を押した編成だけランダムな共有トークンを発行
- 共有解除するとそのURLは即無効化
- 再共有時は新しいURLを発行するため、過去URLは復活しない

## 個人データの識別

既存サイトでは一般利用者を共通メンバーとして扱っていますが、マイ編成は共通メンバーIDへ保存しません。

- Supabase匿名認証のユーザーIDごとに私有ownerを作成
- Discord連携済みの場合はContributor IDへ私有ownerを統合可能
- Discord連携を解除しても一度確定したownerは保持
- 新しい端末を同じDiscordへ連携した場合、同じContributor側の私有データへ寄せられる設計

DBテーブルはRLSを有効にし、ブラウザのPublishable keyから直接読み書きできるポリシーは作成しません。操作は既存の`api` Edge Function経由だけです。

## 1. Supabase SQLを実行

最初に次のSQLをSupabase Dashboard → SQL Editorで1回実行してください。

```text
supabase/migrations/202610050001_my_formations.sql
```

追加テーブル:

- `user_private_owner_links`
- `user_owned_generals`
- `user_owned_tactics`
- `user_inventory_imports`
- `user_formations`
- `user_formation_members`

既存の敵部隊・観測データは変更しません。

## 2. Edge Function `api` を更新

Supabase Dashboard → Edge Functions → `api` → Code で、既存の `index.ts` を次のファイルで全置換してDeployします。

```text
api/index.ts
```

新しいSecretは不要です。
QookkaへのアクセスはEdge Functionから行うため、GitHub Pages側のCSPへQookkaドメインを追加する必要もありません。

## 3. GitHub Pagesを更新

`docs` の次の4ファイルを置き換えてCommitしてください。

```text
docs/index.html
docs/app.js
docs/styles.css
docs/sw.js
```

`docs/config.js` は変更不要です。

## 4. 反映確認

1. GitHub ActionsでPages更新完了を確認
2. Safari/PWAを完全終了して開き直す
3. 設定画面で `アプリバージョン：1.8.0` を確認
4. 下部メニューの `編成` を開く
5. Qookka共有URLを貼って所持武将・戦法が取得できることを確認
6. `所持・凸を編集` で丸をタップし、0〜5凸を入力
7. 新しい編成を作成し、武将・戦法の検索絞り込みを確認
8. 保存直後は `非公開` になっていることを確認
9. `共有する` でURLをコピーし、別ブラウザからその編成だけ見えることを確認
10. `共有解除` 後、同じURLが無効になることを確認

## DB容量

画像は保存しません。所持武将・所持戦法・編成はID/文字列/数値中心なので、数百〜数千ユーザー規模でも画像OCRデータと比べて非常に小さいデータ量です。
