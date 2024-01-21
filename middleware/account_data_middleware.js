const colors = require(process.cwd() + '/node_modules/colors');
const moment = require(process.cwd() + '/node_modules/moment');

const con = require('./database_con');
const query = util.promisify(con.query).bind(con);

const common = require("../common")

async function getAccountData(req, res, next) {
    //This middleware is meant for getting all extra account data that may be used in places such as
    //the navbar, and other UI elements

    req.account.all_notifications = await query("SELECT * FROM notifications WHERE account_id=?", req.account[0].id);
    req.account.unread_notifications = common.notification.getAccountUnreadNotifications(req.account);
}