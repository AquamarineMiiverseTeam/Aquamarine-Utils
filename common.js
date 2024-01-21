const colors = require(process.cwd() + '/node_modules/colors');
const moment = require(process.cwd() + '/node_modules/moment');

const util = require('util')
const con = require('./database_con');
const query = util.promisify(con.query).bind(con);

const fs = require('fs')

const pako = require(process.cwd() + '/node_modules/pako')
const TGA = require(process.cwd() + '/node_modules/tga')
const PNG = require(process.cwd() + '/node_modules/pngjs').PNG
const BMP = require(process.cwd() + '/node_modules/bmp-js')
const JIMP = require(process.cwd() + '/node_modules/jimp');

//This is a utility object to get certain things about an account, or create certain things.
const utility = {
    notification : {
        createNewNotification : async function createNewNotification(account, from_account_id, type, image_url, content, content_id) {
            //from_account_id should be 0 if the notification was sent by bot or admin.
            await query("INSERT INTO notifications (account_id, type, image_url, content, content_id, from_account_id) VALUES(?,?,?,?,?,?)",
            [account, type, image_url, content, content_id, from_account_id])
    
            console.log("[INFO] (%s) Created New Notification!".blue, moment().format("HH:mm:ss"));
        },

        getAccountUnreadNotifications : async function getAccountUnreadNotifications(account) {
            return await query("SELECT * FROM notifications WHERE account_id=? AND read_notif=0", account[0].id)
        },

        getAccountAllNotifications : async function getAccountAllNotifications(account) {
            return await query("SELECT * FROM notifications WHERE account_id=?", account[0].id)
        }
    },

    empathy : {
        getAccountEmpathiesGiven : async function getAccountEmpathiesGiven(account) {
            return await query("SELECT * FROM empathies WHERE account_id=?", account[0].id)
        }
    },

    wwp : {
        encodeIcon : function encodeicon(id) {
            console.log(id)

            return new Promise((resolve, reject) => {
                JIMP.read(__dirname + `/../CDN_Files/img/icons/${id}.jpg`).then((image, err) => {
                    if (err) {reject()}
                    const tga = TGA.createTgaBuffer(image.bitmap.width, image.bitmap.height, image.bitmap.data)
    
                    resolve(Buffer.from(pako.deflate(tga)).toString("base64"))
                })
            });
        }
    }
}

module.exports = utility