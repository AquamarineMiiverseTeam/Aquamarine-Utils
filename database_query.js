const util = require('util')

const con = require('./database_con');
const query = util.promisify(con.query).bind(con);

/** 
    * Used for grabbing a single account
    * @param {Number} account_id The account ID to grab.
    * @returns {Object} Community Data
*/
async function getAccount(account_id) {
    const sql = `SELECT * FROM accounts WHERE id=?`
    const account = (await query(sql, account_id))[0];

    return account;
}

/** 
    * Used for grabbing a single account
    * @param {Number} account_pid The account PID to grab.
    * @returns {Object} Community Data
*/
async function getAccountByPid(account_pid) {
    const sql = `SELECT * FROM accounts WHERE pid=?`
    const account = (await query(sql, account_pid))[0];

    return account;
}


/**
    * Used for grabbing all accounts in the current database
    * @param {String} order_by "desc", "asc"
    * @param {Number} limit Can be any integer.
*/
async function getAccounts(order_by, limit) {
    var sql_order_by = (order_by == "desc" || order_by == "asc") ? `ORDER BY id ${order_by}` : ``;
    var sql_limit = (limit) ? `LIMIT ${limit}` : ``;

    const sql = `SELECT * FROM accounts ${sql_order_by} ${sql_limit}`
    const accounts = await query(sql);

    return accounts;
}

/** 
    * Used for grabbing a single community
    * @param {Number} community_id The community ID to grab.
    * @param {Express.Request} req The current request, needed for empathy data.
    * @returns {Promise<Object>} Community Data
*/
async function getCommunity(community_id, req) {
    const sql = `SELECT * FROM communities WHERE id=?`
    const communities = (await query(sql, community_id))[0];
    communities.sub_communities = await getSubCommunities(community_id, "desc", null)
    communities.favorites = (await query("SELECT * FROM favorites WHERE community_id=?", community_id)).length
    const favorited = (await query("SELECT * FROM favorites WHERE community_id=? AND account_id=?", [communities.id, req.account[0].id]))

    if (favorited.length == 1) {communities.is_favorited = 1;} else {communities.is_favorited = 0}

    return communities;
}

/** 
    * Used for grabbing a batch of communities.
    * @param {String} order_by "desc", "asc"
    * @param {String} type "main", "sub", "normal"
    * @param {Number} limit Can be any integer.
    * @returns {Array[]} Community Data
*/
async function getCommunities(order_by, limit, type, offset, special) {
    var sql_type = (type == "main" || type == "sub" || type == "normal" || type == "announcement") ? `WHERE type='${type}'` : `WHERE type IS NOT NULL`;
    var sql_order_by = (order_by == "desc" || order_by == "asc") ? `ORDER BY create_time ${order_by}` : ``;
    var sql_limit = (limit) ? `LIMIT ${limit}` : ``;
    var sql_offset = (offset) ? `OFFSET ${offset}` : ``
    var sql_special = (special) ? `AND special_community=1` : ``

    const sql = `SELECT * FROM communities ${sql_type} ${sql_special} ${sql_order_by} ${sql_limit} ${sql_offset}`
    const communities = await query(sql);

    for (let i = 0; i < communities.length; i++) {
        communities[i].favorites = (await query("SELECT * FROM favorites WHERE community_id=?", communities[i].id)).length;

        if (communities[i].user_community == 1) {
            communities[i].mii_hash = (await query("SELECT mii_hash FROM accounts WHERE id=?", communities[i].account_id))[0].mii_hash;
        }
    }

    return communities;
}

/** 
    * Used for grabbing sub communities.
    * @param {Number} parent_community_id The parent community ID (AKA main community ID)
    * @param {String} order_by "desc", "asc"
    * @param {Number} limit Can be any integer.
    * @returns {Array[]} Sub Community Data
*/
async function getSubCommunities(parent_community_id, order_by, limit) {
    var sql_com_id = (parent_community_id) ? `WHERE parent_community_id=${parent_community_id}` : ``;
    var sql_order_by = (order_by == "desc" || order_by == "asc") ? `ORDER BY create_time ${order_by}` : ``;
    var sql_limit = (limit) ? `LIMIT ${limit}` : ``;

    const sql = `SELECT * FROM communities ${sql_com_id} ${sql_order_by} ${sql_limit}`
    const communities = await query(sql);

    for (let i = 0; i < communities.length; i++) {
        if (communities[i].user_community == 1) {
            communities[i].mii_hash = (await query("SELECT mii_hash FROM accounts WHERE id=?", communities[i].account_id))[0].mii_hash;
        }

        communities[i].favorites = (await query("SELECT * FROM favorites WHERE community_id=?", communities[i].id)).length
    }

    return communities;
}

/** 
    * Used for grabbing posts
    * @param {Number} community_id The community ID to grab
    * @param {String} order_by "desc", "asc"
    * @param {Number} limit Can be any integer.
    * @param {String} topic_tag Can be any string, will grab posts only with this specific topic_tag
    * @param {Number} offset The offset of the posts to grab
    * @param {Express.Request} req The current request, needed for empathy data.
    * @returns {Promise<Array[]>} Post Data
*/
async function getPosts(community_id, order_by, limit, topic_tag, offset, req) {
    var sql_com_id = (community_id) ? `WHERE community_id=${community_id}` : `WHERE community_id=0`;
    var sql_order_by = (order_by == "desc" || order_by == "asc") ? `ORDER BY create_time ${order_by}` : ``;
    var sql_limit = (limit) ? `LIMIT ${limit}` : ``;
    var sql_topic_tag = (topic_tag) ? `AND topic_tag='${topic_tag}'` : ``;
    var sql_offset = (offset) ? `OFFSET ${offset}` : ``

    const sql = `SELECT * FROM posts ${sql_com_id} ${sql_topic_tag} AND moderated=0 ${sql_order_by} ${sql_limit} ${sql_offset}`
    const posts = await query(sql);

    for (let i = 0; i < posts.length; i++) {
        const account = (await query("SELECT * FROM accounts WHERE id=?", posts[i].account_id))[0];

        var mii_face;

        switch (posts[i].feeling_id) {
            case 0:
                mii_face = "normal_face";
                break;
            case 1:
                mii_face = "happy_face";
                break;
            case 2:
                mii_face = "like_face";
                break;
            case 3:
                mii_face = "surprised_face";
                break;
            case 4:
                mii_face = "frustrated_face";
                break;
            case 5:
                mii_face = "puzzled_face";
                break;
            default:
                mii_face = "normal_face";
                break;
        }

        posts[i].mii_image = `http://mii-images.account.nintendo.net/${account.mii_hash}_${mii_face}.png`;
        posts[i].mii_name = account.mii_name;

        posts[i].is_empathied_by_user = (await query("SELECT * FROM empathies WHERE post_id=? AND account_id=?", [posts[i].id, req.account[0].id])).length;
        posts[i].empathy_count = (await query("SELECT * FROM empathies WHERE post_id=?", posts[i].id)).length;
        posts[i].admin = account.admin;
    }

    return posts;
}

module.exports = {
    getAccount,
    getAccountByPid,
    getAccounts,
    getCommunity,
    getCommunities,
    getSubCommunities,
    getPosts,
}