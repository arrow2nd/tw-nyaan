# nyaan-for-CLI

ねこによるねこのためのシンプルなTwitterクライアントです。

![nyaan-github](https://user-images.githubusercontent.com/44780846/85189449-36d15000-b2ea-11ea-8e99-772aefad5df0.gif)

## これが欲しかった…！

```nyaan tw```と打つだけで「にゃーん」ができます

## できること
- ツイートの投稿/削除
- いいね！/リツイート
- リプライ
- タイムラインの閲覧
- ユーザーのツイート一覧の閲覧
- キーワードからツイート検索

## インストール手順（自分へのメモ）
- 文字コードがUTF-8かつ、node.jsの実行環境があり、パッケージの管理にyarnを使っていることが前提でのメモです。

### 1.ダウンロードする

zipをダウンロード or ```git clone git@github.com:arrow2nd/nyaan-for-CLI.git```

### 2.移動する

```cd nyaan-for-CLI```

### 3.アクセストークンの設定

[ここ](https://developer.twitter.com/en/apps)からコンシューマーキー、コンシューマーシークレット、アクセストークン、アクセストークンシークレットを取得。

.env-exampleファイルを参考に.envファイルを作成する。

### 3.グローバルにインストール

```yarn global add file:$PWD ``` 

これでおしまい！


## 使い方メモ

基本は ```nyaan [コマンド] [オプション]``` です。

コマンドを省略して ```nyaan``` とするとタイムラインが表示され、対話モードが起動します。

詳しくは--helpコマンドから確認してください。

## 注意
- セキュリティの問題等があるかもしれません。（いないとは思いますが）利用される場合は、自己責任でお願いします。
- .envが流出すると一巻の終わりです。ご注意下さい。