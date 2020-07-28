# tw-nyaan🐾

ねこによるねこのためのシンプルなTwitterクライアントです。

![cat](https://user-images.githubusercontent.com/44780846/87781211-3ab1ad00-c86b-11ea-8d7e-f0cfaca317e0.gif)

## これが欲しかった…！

```nyaan tw```と打つだけで「にゃーん」ができます

## できること
- ツイートの投稿/削除
- いいね！/リツイート
- リプライ
- フォロー・ブロック・ミュート
- タイムラインの閲覧
- 特定ユーザーのツイート一覧の閲覧
- 自分宛てのメンションの閲覧
- キーワードからツイート検索

## できないこと
- DM全般
- 画像の表示
- リストの表示、閲覧

## インストール手順（自分用）

### 動作環境
- 文字コードがUTF-8
- node.jsがうごく

### 1.ダウンロード

zipをダウンロード or ```git clone git@github.com:arrow2nd/tw-nyaan.git```

### 2.移動

```cd tw-nyaan```

### 3.アクセストークンの設定

[ここ](https://developer.twitter.com/en/apps)からコンシューマーキー、コンシューマーシークレット、アクセストークン、アクセストークンシークレットを取得。

.env-exampleファイルを参考に.envファイルを作成する。

### 4.グローバルにインストール

(Yarnの場合)

```yarn global add file:$PWD ``` 

これでおしまい！


## 使い方メモ

基本は ```nyaan [コマンド] [オプション]``` です。

コマンドを省略して ```nyaan``` とするとタイムラインが表示され、対話モードが起動します。

詳しくは--helpコマンドからご覧ください。

## 注意
- （いないとは思いますが）利用される場合は、自己責任でお願いします…
- .envの取り扱いには十分ご注意ください
