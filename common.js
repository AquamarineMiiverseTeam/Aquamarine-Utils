const colors = require(process.cwd() + '/node_modules/colors');
const moment = require(process.cwd() + '/node_modules/moment');

const con = require('./database_con');
const query = util.promisify(con.query).bind(con);

const utility = {
    notification : {
        createNewNotification : async function createNewNotification(account, from_account_id, type, image_url, content, content_id) {
            //from_account_id should be 0 if the notification was sent by bot or admin.
            await query("INSERT INTO notifications (account_id, type, image_url, content, content_id, from_account_id) VALUES(?,?,?,?,?,?)",
            [account[0].id, type, image_url, content, content_id, from_account_id])
    
            console.log("[INFO] (%s) Created New Notification!".blue, moment().format("HH:mm:ss"));
        },

        getAccountUnreadNotifications : async function getAccountUnreadNotifications(account) {
            return await query("SELECT FROM notifications WHERE account_id=? AND read_notif=0", account[0].id)
        },

        getAccountAllNotifications : async function getAccountAllNotifications(account) {
            return await query("SELECT FROM notifications WHERE account_id=?", account[0].id)
        }
    }
}

module.exports = utility