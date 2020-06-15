# nyaan-for-CLI

ねこによるねこのためのシンプルなTwitterクライアントです。

![git-nyaan](https://user-images.githubusercontent.com/44780846/84656398-94ae1280-af4d-11ea-8c63-f7291ce09748.gif)

## できること
- ツイートの投稿/削除
- いいね！/リツイート
- タイムラインの閲覧
- ユーザーのツイート一覧の閲覧
- キーワードからツイート検索

## インストール手順（自分へのメモ）
- node.jsの実行環境があり、パッケージの管理にyarnを使っていることが前提でのメモです。

### 1.ダウンロードする

zipをダウンロード or ```git clone git@github.com:arrow2nd/nyaan-for-CLI.git```

### 2.移動する

```cd nyaan-for-CLI```

### 3.アクセストークンの設定

[ここ](https://developer.twitter.com/en/apps)からコンシューマーキー、コンシュマーシークレット、アクセストークン、アクセストークンシークレットを取得。

.env-expampleを参考に.envファイルを作成する。

### 3.グローバルにインストール

```yarn global add file:$PWD ``` 

これでおしまい！

## 使い方メモ

基本は ```nyaan [コマンド] [オプション]``` です。

コマンドを省略して ```nyaan``` とするとタイムラインが表示され、対話モードが起動します。

詳しくは--helpコマンドから確認してください。

## 注意
- セキュリティの問題等があるかもしれません。（いないとは思いますが）利用される場合は、自己責任でお願いします。
