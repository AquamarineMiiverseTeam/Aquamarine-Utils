const colors = require(process.cwd() + '/node_modules/colors');
const moment = require(process.cwd() + '/node_modules/moment');

const fs = require('fs')

const pako = require(process.cwd() + '/node_modules/pako')
const TGA = require(process.cwd() + '/node_modules/tga')
const PNG = require(process.cwd() + '/node_modules/pngjs').PNG
const BMP = require(process.cwd() + '/node_modules/bmp-js')
const JIMP = require(process.cwd() + '/node_modules/jimp');
const logger = require(process.cwd() + '/middleware/log')

const code_2_country = require("./code_2_country.json");

const db_con = require("./database_con");

//This is a utility object to get certain things about an account, or create certain things.
const utility = {
    account: {
        //Eventually this will need to include other things like friendships follows etc
        getAccountByNNID: async function (nnid) {
            const account = (await query("SELECT * FROM accounts WHERE nnid=?", nnid));
            if (!account[0]) { return []; }

            account[0].yeahs_recieved = (await query(`SELECT posts.id 
            FROM posts
            INNER JOIN accounts
            ON posts.account_id = accounts.id
            INNER JOIN empathies
            ON posts.id = empathies.post_id
            WHERE accounts.nnid = ?`, nnid)).length;

            account[0].country_name = code_2_country[account[0].country];
            account[0].favorited_communities = await query(`
            SELECT communities.id AS community_id
            FROM communities
            INNER JOIN favorites
            ON favorites.community_id = communities.id
            WHERE favorites.account_id = ?
            ORDER BY favorites.create_time DESC`, account[0].id);

            account[0].posts = await query(`
            SELECT * 
            FROM posts
            WHERE account_id = ?
            ORDER BY create_time DESC
            `, account[0].id)

            

            return account;
        }
    },
    ui: {
        getCommunities: async function(type, platform, orderBy, special, limit, offset) {
            let communities = await db_con("communities")
                .where(function() {
                    if (type) { this.where({type : type}) }
                    if (platform) { this.where({platform : platform}) }
                    if (special) { this.where({special_community : special}) }
                })
                .orderBy("create_time", orderBy)
                .limit(limit)
                .offset(offset)
            communities = await fillCommunityData(communities);

            return communities
        },

        getCommunity : async function(community_id) {
            let communities = (await db_con("communities").where({id : community_id}));

            communities = await fillCommunityData(communities);

            return communities;
        },

        getPopularCommunities: async function (limit) {
            let communities = await db_con
                                    .select("*")
                                    .from("communities AS c")
                                    .where({platform : "wiiu", type : "main"})
                                    .orderBy(function() {
                                                this.count("community_id")
                                                    .from("posts")
                                                    .whereRaw("community_id = `c`.id")
                                                    .whereBetween("create_time",
                                                                [moment().subtract(5, "days").format("YYYY-MM-DD HH:mm:ss"),
                                                                moment().add(1, "day").format("YYYY-MM-DD HH:mm:ss")]
                                                                )
                                            }, "desc")
                                    .limit(limit)

            communities = await fillCommunityData(communities);

            return communities;
        },

        getNewCommunities: async function (limit) {
            let communities = await db_con
                                      .select("*")
                                      .from("communities")
                                      .orderBy("create_time", "desc")
                                      .limit(limit);

            communities = await fillCommunityData(communities);

            return communities
        },

        getCommunityByDecimalTitleID: async function (tid) {
            const community = (await db_con("communities")
                                            .whereLike("title_ids", `%${Number(tid)}%`)
                                            .where({type : "main"})
                                            .limit(1))[0];

            return community;
        },

        getTypedPosts: async function (type, community_id, offset, limit) {
            let posts;

            switch (type) {
                case "newest":
                    posts = await query(`SELECT * FROM posts WHERE community_id=? AND moderated != 1 ORDER BY create_time DESC LIMIT ? OFFSET ? `, [community_id, Number(limit), Number(offset)]);
                    break;
                case "popular":
                    posts = await query(`SELECT * FROM posts AS p WHERE community_id=? AND moderated != 1 ORDER BY (SELECT COUNT(post_id) FROM empathies WHERE post_id=p.id) DESC LIMIT ? OFFSET ?`, [community_id, Number(limit), Number(offset)]);
                    break;
                case "ingame":
                    posts = await query("SELECT * FROM posts WHERE community_id=? AND search_key != '' AND moderated != 1 ORDER BY create_time DESC LIMIT ? OFFSET ?", [community_id, Number(limit), Number(offset)])
                    break;
                case "played":
                    posts = await query("SELECT * FROM posts WHERE community_id=? AND title_owned=1 AND moderated != 1 ORDER BY create_time DESC LIMIT ? OFFSET ?", [community_id, Number(limit), Number(offset)])
                    break;
                case "topictag":
                    posts = await query("SELECT * FROM posts WHERE community_id=? AND topic_tag != '' AND moderated != 1 ORDER BY create_time DESC LIMIT ? OFFSET ?", [community_id, Number(limit), Number(offset)])
                    break;
                default:
                    posts = await query(`SELECT * FROM posts WHERE community_id=? AND moderated != 1 ORDER BY create_time DESC LIMIT ? OFFSET ?`, [community_id, Number(limit), Number(offset)]);
                    break;
            }


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

                posts[i].empathies = await utility.empathy.getPostEmpathies(posts[i].id)
                posts[i].admin = account.admin;
            }

            return posts;
        },
        getPost: async function (post_id) {
            const post = (await query("SELECT * FROM posts WHERE id=?", post_id))[0]

            if (!post) { return []; }

            const account = (await query("SELECT * FROM accounts WHERE id=?", post.account_id))[0];

            var mii_face;

            switch (post.feeling_id) {
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

            post.mii_image = `http://mii-images.account.nintendo.net/${account.mii_hash}_${mii_face}.png`;
            post.mii_name = account.mii_name;

            post.empathies = await utility.empathy.getPostEmpathies(post.id)
            post.admin = account.admin;
            return post;
        }
    },
    notification: {
        createNewNotification: async function (account_id, from_account_id, type, content_id, linkto, post_id) {
            //from_account_id should be 0 if the notification was sent by bot or admin.
            await db_con("notifications").insert(
                {
                    account_id : account_id, 
                    from_account_id : from_account_id,
                    type : type, 
                    content_id : content_id,
                    linkto : linkto,
                    post_id : post_id
                }
            )

            logger.info("Created new notification!")
        },

        getAccountUnreadNotifications: async function (account) {
            return await db_con("notifications").where({account_id : account[0].id, read : 0}).orderBy("create_time", "desc")
        },

        getAccountAllNotifications: async function (account) {
            const notifications = await db_con("notifications").where({account_id : account[0].id}).orderBy("create_time", "desc")

            for (let i = 0; i < notifications.length; i++) {
                notifications[i].from_account = (await db_con("accounts").where({id : notifications[i].from_account_id}))[0]

                switch (notifications[i].type) {
                    case "yeah":
                        const post = (await db_con("posts").where({id : notifications[i].linkto.slice(7)}))[0]

                        if (!post) { return; }

                        if (post.body) {
                            notifications[i].secondary = `your post (${post.body.slice(0, 25)}..)`
                        } else {
                            notifications[i].secondary = `your post (handwritten)`
                        }

                        break;

                    default:
                        break;
                }
            }

            return notifications
        },

        readAccountNotifications: async function (account) {
            await db_con("notifications").where({account_id : account[0].id}).update({read_notif : 1})

            return true;
        }
    },

    empathy: {
        getAccountEmpathiesGiven: async function (account) {
            return await db_con("empathies").where({account_id : account[0].id})
        },

        getPostEmpathies: async function (post_id) {
            return await query("SELECT * FROM empathies WHERE post_id=?", post_id)
        }
    },

    wwp: {
        encodeIcon: async function (id) {
            logger.info(`Encoding ZLIB icon for community ID: ${id}`)

            return new Promise((resolve, reject) => {
                try {
                    JIMP.read(__dirname + `/../CDN_Files/img/icons/${id}.jpg`).then((image, err) => {
                        if (err) { reject() }

                        //Making sure every icon is the correct resolution.
                        image.resize(128, 128);

                        const tga = TGA.createTgaBuffer(image.bitmap.width, image.bitmap.height, image.bitmap.data)

                        resolve(Buffer.from(pako.deflate(tga)).toString("base64"))
                    })
                }
                catch {
                    JIMP.read(__dirname + `/../CDN_Files/img/icons/default.jpg`).then((image, err) => {
                        if (err) { reject() }

                        const tga = TGA.createTgaBuffer(image.bitmap.width, image.bitmap.height, image.bitmap.data)

                        resolve(Buffer.from(pako.deflate(tga)).toString("base64"))
                    })
                }
            });
        },

        decodeIcon: async function (icon) {
            let buffer = Buffer.from(icon, 'base64');
            let output = '';
            try {
                output = pako.inflate(buffer);
            }
            catch (err) {
                console.error(err);
            }
            const tga = new TGA(Buffer.from(output));

            const new_jpg = await new JIMP(tga.width, tga.height);
            new_jpg.bitmap.data = tga.pixels;

            return new_jpg.getBase64Async("image/jpeg")
        }
    }
}

async function fillCommunityData(communities) {
    for (let i = 0; i < communities.length; i++) {
        communities[i].favorites = (await db_con
                                          .select("*")
                                          .from("favorites")
                                          .where({community_id: communities[i].id})
                                   );

        if (communities[i].user_community == 1) {
            communities[i].mii_hash = (await db_con
                                             .select("mii_hash")
                                             .from("accounts")
                                             .where({id: communities[i].account_id})
                                      )[0].mii_hash;
        }

        communities[i].sub_communities = await db_con("communities").where({parent_community_id : communities[i].id})
    }

    return communities;
}

module.exports = utility