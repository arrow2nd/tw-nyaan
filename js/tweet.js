'use strct';
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const colors = require('colors');
const moment = require('moment');
const util = require('./util.js');
const Twitter = require('twitter');


// 認証
dotenv.config({path: path.join(__dirname, "../.env")});
const client = new Twitter({
    consumer_key: `${process.env.CONSUMER_KEY}`,
    consumer_secret: `${process.env.CONSUMER_SECRET}`,
    access_token_key: `${process.env.ACCESS_TOKEN}`,
    access_token_secret: `${process.env.ACCESS_TOKEN_SECRET}`
});


/**
 * ツイートする
 * @param {String} tweetText     ツイート内容
 * @param {String} mediaPaths    添付する画像のパス(複数ある場合は,区切り)
 * @param {String} replyToPostId リプライ先の投稿ID
 */
async function tweetPost(tweetText, mediaPaths, replyToPostId){
    let status = {};
    let action = 'Tweeted:';

    // テキストを追加
    status.status = tweetText;
    // リプライ
    if (replyToPostId){
        action = 'Replied:';
        status.in_reply_to_status_id = replyToPostId;
        status.auto_populate_reply_metadata = true;
    };

    // 画像があればアップロードする
    if (mediaPaths){
        status.media_ids = await upload(mediaPaths).catch(err => {
            util.showAPIErrorMsg(err);
        });
    };

    // ツイートする
    const tweet = await client.post('statuses/update', status).catch(err => {
        util.showAPIErrorMsg(err);
    });
    if (tweet){
        console.log(action.bgBlue + ` ${tweet.text}`);
    };
};

/**
 * 画像をアップロードする
 * @param  {String} mediaPaths カンマで区切った画像のパス
 * @return {String}            メディアID
 */
async function upload(mediaPaths){
    const paths = mediaPaths.split(',');
    const pathLength = (paths.length > 4) ? 4 : paths.length;
    let mediaIds = '';

    for (let i = 0; i < pathLength; i++){
        const filePath = paths[i].trim();

        // 画像があるか確認
        try {
            fs.statSync(filePath);
        } catch(err) {
            console.error('Error:'.bgRed + ` ファイルが見つかりません (${filePath})`.brightRed);
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
                console.error('Error:'.bgRed + `アップロードに失敗しました (${filePath})`.brightRed);
                continue;
            };
            mediaIds += media.media_id_string + ',';
            console.log('Success:'.bgGreen + ` アップロードしました！(${filePath})`.brightGreen);
        } else {
            console.error('Error:'.bgRed + ` 未対応の拡張子です (${ext})`.brightRed);
            continue;
        };
    };
    return mediaIds;
};

/**
 * ツイートを削除する
 * @param {String} tweetId ツイートID
 */
async function deleteTweet(tweetId){
    const tweet = await client.post(`statuses/destroy/${tweetId}`, {id: tweetId}).catch(err => {
        util.showAPIErrorMsg(err);
    });
    if (tweet){
        const width = process.stdout.columns - 20;
        const text = util.strCat(util.optimizeText(tweet.text), 0, width, 1);
        console.log('Deleted:'.bgBlue + ` ${text}`);
    };
};

/**
 * いいねの操作
 * @param {String}  tweetId ツイートID
 * @param {Boolean} mode    いいねを取り消すかどうか
 */
async function favorite(tweetId, mode){
    const type = ['create', 'destroy'];
    const tweet = await client.post(`favorites/${type[mode]}`, {id: tweetId}).catch(err => {
        util.showAPIErrorMsg(err);
    });
    if (tweet){
        const msg = (mode) ? 'Un-liked:' : 'Liked:';
        const width = process.stdout.columns - msg.length - 3;
        const text = util.strCat(util.optimizeText(tweet.text), 0, width, 1);
        console.log(msg.bgBlue + ` ${text}`);
    };
};

/**
 * リツイートの操作
 * @param {String}  tweetId ツイートID
 * @param {Boolean} mode    リツイートを取り消すかどうか
 */
async function retweet(tweetId, mode){
    const type = ['retweet', 'unretweet'];
    const tweet = await client.post(`statuses/${type[mode]}/${tweetId}`, {id: tweetId}).catch(err => {
        util.showAPIErrorMsg(err);
    });
    if (tweet){
        const msg = (mode) ? 'Un-retweeted:' : 'Retweeted:';
        const width = process.stdout.columns - msg.length - 3;
        const text = util.strCat(util.optimizeText(tweet.text), 0, width, 1);
        console.log(msg.bgBlue + ` ${text}`);
    };
};

/**
 * フォローの操作
 * @param {String}  userId ユーザーのスクリーンネーム
 * @param {Boolean} mode   フォローを解除するかどうか
 */
async function follow(userId, mode){
    const type = ['create', 'destroy'];
    const user = await client.post(`friendships/${type[mode]}`, {screen_name: userId}).catch(err => {
        util.showAPIErrorMsg(err);
    });
    if (user){
        const msg = (mode) ? 'Un-followed:' : 'Followed:';
        const width = process.stdout.columns - msg.length - 3;
        const text = util.strCat(util.optimizeText(user.name), 0, width, 1);
        console.log(msg.bgBlue + ` ${text}`);
    };
};

/**
 * ブロックの操作
 * @param {String}  userId ユーザーのスクリーンネーム
 * @param {Boolean} mode   ブロックを解除するかどうか
 */
async function block(userId, mode){
    const type = ['create', 'destroy'];
    const user = await client.post(`blocks/${type[mode]}`, {screen_name: userId}).catch(err => {
        util.showAPIErrorMsg(err);
    });
    if (user){
        const msg = (mode) ? 'Un-blocked:' : 'Blocked:';
        const width = process.stdout.columns - msg.length - 3;
        const text = util.strCat(util.optimizeText(user.name), 0, width, 1);
        console.log(msg.bgBlue + ` ${text}`);
    };
};

/**
 * ミュートの操作
 * @param {String}  userId ユーザーのスクリーンネーム
 * @param {Boolean} mode   ミュートを解除するかどうか
 */
async function mute(userId, mode){
    const type = ['create', 'destroy'];
    const user = await client.post(`mutes/users/${type[mode]}`, {screen_name: userId}).catch(err => {
        util.showAPIErrorMsg(err);
    });
    if (user){
        const msg = (mode) ? 'Un-muted:' : 'Muted:';
        const width = process.stdout.columns - msg.length - 3;
        const text = util.strCat(util.optimizeText(user.name), 0, width, 1);
        console.log(msg.bgBlue + ` ${text}`);
    };
};


/**
 * タイムラインを取得する
 * @param  {Number} count 取得件数（最大200件）
 * @return {Array}        取得したツイート
 */
async function getTimeline(count){
    const param = {
        count: count,
        exclude_replies: true,
    };
    const tweets = await client.get('statuses/home_timeline', param).catch(err => {
        util.showAPIErrorMsg(err);
    });
    if (tweets) {
        showTweet(tweets);
    };
    return tweets;
};

/**
 * ユーザーのプロフィールと投稿を取得する
 * @param  {String} userId ユーザーID(空にすると自分の投稿を取得)
 * @param  {Number} count  取得件数（最大200件）
 * @return {Array}         取得したツイート
 */
async function getUserTimeline(userId, count){
    let param = { count: count };
    
    // ユーザーIDがあれば追加する
    if (userId){
        param.screen_name = userId.replace(/@|＠/, '');
    };

    // 取得
    const tweets = await client.get('statuses/user_timeline', param).catch(err => {
        util.showAPIErrorMsg(err);
    });
    if (tweets){
        // 対象ユーザーと自分との関係を取得
        const connections = await getUserLookup(tweets[0].user.id_str).catch(err => {console.error(err)});
        // ツイートを表示
        showTweet(tweets);
        // プロフィールを表示
        showUserInfo(tweets[0].user, connections);
    };
    return tweets;
};

/**
 * 対象のユーザーと自分との関係を取得
 * @param  {String} userId ユーザーID
 * @return {Object}        対象ユーザーとの関係
 */
async function getUserLookup(userId){
    let connections = {};
    const lookup = await client.get('friendships/lookup', {user_id: userId}).catch(err => {
        util.showAPIErrorMsg(err);
    });
    if (lookup){
        for (let connection of lookup[0].connections){
            connections[connection] = true;
        };
    };
    return connections;
};

/**
 * キーワードからツイートを検索する
 * @param  {String} query 検索キーワード
 * @param  {Number} count 取得件数（最大200件）
 * @return {Array}        取得したツイート
 */
async function searchTweet(query, count){
    const tweets = await client.get('search/tweets', {q: `${query}  exclude:retweets`, count: count}).catch(err => {
        util.showAPIErrorMsg(err);
    });
    if (tweets){
        showTweet(tweets.statuses);
    };
    return tweets;
};

/**
 * ツイートのインデックスからIDを取得する
 * @param  {Array}  tweets ツイートオブジェクト
 * @param  {Number} index  ツイートのインデックス
 * @return {String}        ツイートID
 */
function getTweetId(tweets, index){
    if (index > tweets.length - 1){
        console.error('Error:'.bgRed + ' ツイートが存在しません'.brightRed);
        return '';
    };
    return tweets[index].id_str;
};

/**
 * ツイートのインデックスからユーザーのスクリーンネームを取得する
 * @param  {Object}  tweets ツイートオブジェクト
 * @param  {Number}  index  ツイートのインデックス
 * @param  {Boolean} mode   RTだった場合、RT元のユーザーを取得する
 * @return {String}         スクリーンネーム
 */
function getUserId(tweets, index, mode){
    if (index > tweets.length - 1){
        console.error('Error:'.bgRed + ' ツイートが存在しません'.brightRed);
        return '';
    };
    // RTの場合はRT元のスクリーンネーム
    if (mode ==1 && tweets[index].retweeted_status){
        return tweets[index].retweeted_status.user.screen_name;
    } else {
        return tweets[index].user.screen_name;
    };
};


/**
 * ユーザーのプロフィールを表示
 * @param {Object} user        ユーザーオブジェクト
 * @param {Object} connections ユーザーとの関係情報
 */
function showUserInfo(user, connections){
    // 画面幅
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

    // フォロー数とフォローされているか
    let follow = user.friends_count;
    follow = (connections.followed_by) ? `${follow} ${'[followed by]'.cyan}` : follow;

    // フォロワー数とフォローしているか
    let follower = user.followers_count;
    follower = (connections.following) ? `${follower} ${'[following]'.cyan}` : follower;

    // ブロック・ミュート状況
    if (connections.blocking){
        follower += ' [blocking]'.red;
    };
    if (connections.muting){
        follower += ' [muting]'.yellow;
    };

    // ツイート数
    const tweetCount = `${user.statuses_count} tweets`;

    // 表示
    console.log(`${'='.repeat(width)}\n`.rainbow);
    console.log(`  ${userName}  ${tweetCount.brightCyan}\n`);
    console.log(`      desc: ${description}`);
    console.log(`    locate: ${location}`);
    console.log(`       URL: ${url}`);
    console.log(`    follow: ${follow}`);
    console.log(`  follower: ${follower}`);
    console.log(' '.repeat(width - createdAt.length) + createdAt.brightBlue);
    console.log(`${'='.repeat(width)}`.rainbow);
};

/**
 * ツイートを表示
 * @param {Array} tweets ツイートオブジェクト
 */
function showTweet(tweets){
    // 画面幅
    const width = process.stdout.columns;

    // 水平線
    const hr = '-'.repeat(width);
    console.log(hr);
    
    // ツイートの解析
    for (let i = tweets.length - 1;i >= 0;i--){
        let tweet = tweets[i];
        // 公式RTだった場合、RT元のツイートに置き換える
        let rtByUser;
        if (tweet.retweeted_status){
            rtByUser = `RT by ${util.optimizeText(tweet.user.name)} (@${tweet.user.screen_name})`;
            tweet = tweet.retweeted_status;
        };

        // 表示内容を作成
        const index = ` ${i}:`.brightWhite.bgBrightBlue;
        const header = index + ' ' + createHeader(tweet.user);
        const postText = createTweet(tweet);
        const fotter = createFotter(tweet);

        // RTの表示
        if (rtByUser){
            console.log(rtByUser.green);
        };

        // リプライの表示
        let rpToUser = tweet.in_reply_to_screen_name;
        if (rpToUser){
            console.log(`Reply to @${rpToUser}`.brightGreen);
        };

        // ツイートを表示
        console.log(header + '\n');
        console.log(postText);
        console.log(fotter);
        console.log(hr);
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
    let badge = '';

    // 公式アカウント
    if (user.verified){
        badge += ' [verified]'.cyan;
    };

    // 鍵アカウント
    if (user.protected){
        badge += ' [private]'.gray;
    };

    // 連結
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
    let posts = post.split('\n');

    // 一行に収まらない場合、折り返す
    for (text of posts){
        text = util.optimizeText(text);
        text = '  ' + util.insert(text, (width - 4), '\n  ');
        result += text + '\n';
    };

    // メンションをハイライト (途中で改行されると無力)
    let mentions = tweet.entities.user_mentions;
    if (mentions){
        mentions = util.sortTag(mentions, 'screen_name');
        for (let mention of mentions){
            const text = mention.screen_name;
            result = result.replace(`@${text}`, '@'.brightGreen + text.brightGreen);
        };
    };

    // ハッシュタグをハイライト (途中で改行されると無力)
    let hashtags = tweet.entities.hashtags;
    if (hashtags){
        hashtags = util.sortTag(hashtags, 'text');
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
        textCount += rtText.length + 2;
        rtText = (tweet.retweeted) ? ` ${rtText.black.bgBrightGreen} ` : ` ${rtText.brightGreen} `;
    };

    // いいねとRT情報
    const impression = (textCount) ? ' '.repeat(width - textCount) + `${favText}${rtText}\n` : '';

    // via
    const start = tweet.source.indexOf('>') + 1;
    const end = tweet.source.indexOf('</a>');
    let via = `via ${tweet.source.slice(start, end)} `;

    // 連結
    const postTime = `${moment(new Date(tweet.created_at)).format('YYYY/MM/DD HH:mm:ss')}  `;
    textCount = postTime.length + util.getStrWidth(via);
    const fotter = ' '.repeat(width - textCount) + postTime.cyan + via.brightBlue;
    return impression + fotter;
};

module.exports = {
    tweetPost,
    deleteTweet,
    favorite,
    retweet,
    follow,
    block,
    mute,
    getTimeline,
    getUserTimeline,
    getTweetId,
    getUserId,
    searchTweet
};
