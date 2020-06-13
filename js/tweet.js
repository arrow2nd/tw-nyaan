'use strct';

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const colors = require('colors');
const moment = require('moment');
const util = require('./util.js');
const Twitter = require('twitter');

dotenv.config();

// 認証
const client = new Twitter({
    consumer_key: `${process.env.CONSUMER_KEY}`,
    consumer_secret: `${process.env.CONSUMER_SECRET}`,
    access_token_key: `${process.env.ACCESS_TOKEN}`,
    access_token_secret: `${process.env.ACCESS_TOKEN_SECRET}`
});

/**
 * ツイートする
 * @param {String} tweetText  ツイート内容
 * @param {String} mediaPaths 添付する画像のパス(複数ある場合はカンマ区切り)
 */
async function tweetPost(tweetText, mediaPaths){
    let status = {};
    let mediaIds = '';

    // テキストを追加
    status.status = tweetText;

    // 画像があればアップロードする
    if (mediaPaths){
        const paths = mediaPaths.split(',');
        const pathLength = (paths.length > 4) ? 4 : paths.length;
        for (let i = 0; i < pathLength; i++){
            const filePath = paths[i].trim();
            // 画像があるか確認
            try {
                fs.statSync(filePath);
            } catch(err) {
                console.error(`ファイルが見つかりません(${filePath})`.brightRed);
                continue;
            };
            // 拡張子を確認
            const ext = path.extname(filePath).toLowerCase();
            if (ext == '.jpg' || ext == '.jpeg' || ext == '.png' || ext == '.gif'){
                const file = fs.readFileSync(filePath);
                // アップロード
                let media;
                try {
                    media = await client.post('media/upload', {media: file});
                } catch(err) {
                    console.error(`アップロードに失敗しました(${filePath})`.brightRed);
                    continue;
                };
                mediaIds += media.media_id_string + ',';
            } else {
                console.error(`未対応の拡張子です(${ext})`.brightRed);
                continue;
            };
        };
        status.media_ids = mediaIds;
    };

    // ツイートする
    client.post('statuses/update', status, (err, tweet, res) => {
        if (!err) {
            console.log('ツイートしました！: '.cyan + tweetText);
        } else {
            util.showErrorMsg(err);
        };
    });
};

/**
 * ツイートを削除する
 * @param {String} tweetId ツイートID
 */
function deleteTweet(tweetId){
    client.post(`statuses/destroy/${tweetId}`, {id: tweetId}, (err, tweet, res) => {
        if (!err) {
            console.log('削除しました！: '.cyan + tweet.text);
        } else {
            util.showErrorMsg(err);
        };
    });
};

/**
 * いいねの操作
 * @param {String}  tweetId ツイートID
 * @param {Boolean} mode    0:いいね 1:取り消す
 */
function favorite(tweetId, mode){
    const type = ['create', 'destroy'];
    client.post(`favorites/${type[mode]}`, {id: tweetId}, (err, tweet, res) => {
        if (!err) {
            const msg = (mode) ? 'いいねを取り消しました！' : 'いいねしました！';
            console.log(msg.cyan);
        } else {
            util.showErrorMsg(err);
        };
    });
};

/**
 * リツイートの操作
 * @param {String}  tweetId ツイートID
 * @param {Boolean} mode    0:リツイート 1:取り消す
 */
function retweet(tweetId, mode){
    const type = ['retweet', 'unretweet'];
    client.post(`statuses/${type[mode]}/${tweetId}`, {id: tweetId}, (err, tweet, res) => {
        if (!err) {
            const msg = (mode) ? 'リツイートを取り消しました！' : 'リツイートしました！';
            console.log(msg.cyan);
        } else {
            util.showErrorMsg(err);
        };
    });
};

/**
 * タイムラインを取得する
 * @param  {Number} count 取得件数（最大200件）
 * @return {Array}        取得したツイート
 */
function getTimeline(count){
    const param = {
        count: count,
        exclude_replies: true,
    };
    client.get('statuses/home_timeline', param, (err, tweets, res) => {
        if (!err) {
            showTweet(tweets);
        } else {
            util.showErrorMsg(err);
        };
        return tweets;
    });
};

/**
 * 特定ユーザーの投稿（TL）を取得する
 * @param  {String} userName ユーザーID
 * @param  {Number} count    取得件数（最大200件）
 * @return {Array}           取得したツイート
 */
function getUserTimeline(userName, count){
    const param = {
        screen_name: '@' + userName,
        count: count,
        exclude_replies: true
    };
    client.get('statuses/user_timeline', param, (err, tweets, res) => {
        if (!err) {
            showTweet(tweets);
            showUserInfo(tweets[0].user);
        } else {
            util.showErrorMsg(err);
        };
        return tweets;
    });
};

/**
 * キーワードからツイートを検索する
 * @param  {String} query 検索キーワード
 * @param  {Number} count 取得件数（最大200件）
 * @return {Array}        取得したツイート
 */
function searchTweet(query, count){
    client.get('search/tweets', {q: query + ' exclude:retweets', count: count}, (err, tweets, res) => {
        if (!err){
            showTweet(tweets.statuses);
        } else {
            util.showErrorMsg(err);
        };
        return tweets;
    });
};

/**
 * ツイートを表示
 * @param {Object} tweets ツイートオブジェクト
 */
function showTweet(tweets){
    const width = process.stdout.columns;
    process.stdout.write('-'.repeat(width) + '\n');

    for (let i = tweets.length - 1;i >= 0;i--){
        let tweet = tweets[i];

        // 公式RTだった場合、RT元のツイートに置き換える
        let rtByUser;
        if (tweet.retweeted_status){
            rtByUser = `RT by ${util.optimizeText(tweet.user.name)} (@${tweet.user.screen_name})`;
            tweet = tweet.retweeted_status;
        };

        // ヘッダー
        const header = ` ${i}:`.brightWhite.bgBrightBlue + ' ' + createHeader(tweet.user);

        // 投稿内容
        const postText = createTweet(tweet);

        // フッター
        const fotter = createFotter(tweet);

        // 表示する
        if (rtByUser){
            process.stdout.write(rtByUser.green + '\n');
        };
        process.stdout.write(header + '\n\n');
        process.stdout.write(postText + '\n');
        process.stdout.write(fotter + '\n');
        process.stdout.write('-'.repeat(width) + '\n');
    };
};

/**
 * ヘッダーを作成
 * @param  {Object} tweet ユーザーオブジェクト
 * @return {String}       ヘッダー
 */
function createHeader(user){
    // ユーザー情報
    const userName = util.optimizeText(user.name);
    const userId = `  @${user.screen_name}`;
    // 公式・鍵アカウント
    const badge = (
          (user.verified) ? ' [verified]'.cyan
        : (user.protected) ? ' [private]'.gray
        : ''
    );
    // ヘッダー
    const header = userName.bold.underline + userId.dim + badge;
    return header;
};

/**
 * ツイート内容を見やすい形に成形する
 * @param  {Object} tweet ツイートオブジェクト
 * @return {String}       ツイート内容
 */
function createTweet(tweet){
    const width = process.stdout.columns;
    const post = tweet.text;
    let result = '';
    // 改行で分割
    let posts = post.split('\n');
    for (text of posts){
        // 一行に収まらない場合、折り返す
        text = util.optimizeText(text);
        text = '  ' + util.insert(text, (width - 4), '\n  ');
        result += text + '\n';
    };
    // メンションをハイライト (途中で改行されると無力)
    let mentions = tweet.entities.user_mentions;
    if (mentions){
        mentions = util.sortTag(mentions);
        for (let mention of mentions){
            const text = mention.screen_name;
            result = result.replace(`@${text}`, '@'.brightGreen + text.brightGreen);
        };
    };
    // ハッシュタグをハイライト (途中で改行されると無力)
    let hashtags = tweet.entities.hashtags;
    if (hashtags){
        hashtags = util.sortTag(hashtags);
        for (let tag of hashtags){
            const text = tag.text;
            result = result.replace(`#${text}`, '#'.brightCyan + text.brightCyan);
        };
    };
    return result;
};

/**
 * フッターを作成
 * @param  {Object} tweet ツイートオブジェクト
 * @return {String}       フッター
 */
function createFotter(tweet){
    const width = process.stdout.columns;
    let textCount = 0;
    // いいね
    const favCount = tweet.favorite_count;
    let favText = '';
    if (favCount){
        favText = `fav: ${favCount}`;
        textCount += favText.length + 1;
        favText = (tweet.favorited) ? `${favText.black.bgBrightMagenta} ` : `${favText.brightMagenta} `;
    };
    // RT
    const rtCount = tweet.retweet_count;
    let rtText = '';
    if (rtCount){
        rtText = `RT: ${rtCount}`;
        textCount += rtText.length + 1;
        rtText= (tweet.retweeted) ? `${rtText.black.bgBrightGreen} ` : `${rtText.brightGreen} `;
    };
    // via
    const start = tweet.source.indexOf('>') + 1;
    const end = tweet.source.indexOf('</a>');
    let via = `  via ${tweet.source.slice(start, end)}`;
    textCount += util.getStrWidth(via);
    // フッター
    let postTime = ` ${moment(new Date(tweet.created_at)).format('YYYY/MM/DD HH:mm:ss')}`;
    textCount += postTime.length;
    const fotter = ' '.repeat(width - textCount) + favText + rtText + postTime.cyan + via.brightBlue;
    return fotter;
};

/**
 * ユーザーのプロフィールを表示
 * @param {Object} user ユーザーオブジェクト
 */
function showUserInfo(user){
    const width = process.stdout.columns;

    // ユーザー名・ユーザーID
    const userName = createHeader(user);
    // 場所
    const location = util.optimizeText(user.location);
    // 説明
    let description = util.optimizeText(user.description);
    description = util.insert(description, (width - 14), '\n            ');
    // URL
    const url = user.url;
    // アカウント作成日
    let createdAt = moment(new Date(user.created_at)).format('YYYY/MM/DD HH:mm:ss');
    createdAt =  `  created at ${createdAt}`;
    // フォロー・フォロワー・ツイート数
    let follower = user.followers_count;
    follower = (user.following) ? `${follower} ${'[following]'.cyan}` : follower;
    const follow = user.friends_count;
    const tweetCount = `${user.statuses_count} tweets`;

    // 表示する
    process.stdout.write(`${'='.repeat(width)}\n\n`.rainbow);
    process.stdout.write(`  ${userName}  ${tweetCount.brightCyan}\n\n`);
    process.stdout.write(`      desc: ${description}\n`);
    process.stdout.write(`    locate: ${location}\n`);
    process.stdout.write(`       URL: ${url}\n`);
    process.stdout.write(`    follow: ${follow}\n`);
    process.stdout.write(`  follower: ${follower}\n`);
    process.stdout.write(' '.repeat(width - createdAt.length) + createdAt.brightBlue + '\n');
    process.stdout.write(`${'='.repeat(width)}\n`.rainbow);
};

module.exports = {
    tweetPost,
    favorite,
    retweet,
    deleteTweet,
    getTimeline,
    getUserTimeline,
    searchTweet,
    showUserInfo
};