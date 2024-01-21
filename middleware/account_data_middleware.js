const colors = require(process.cwd() + '/node_modules/colors');
const moment = require(process.cwd() + '/node_modules/moment');

const con = require('../database_con');
const util = require('util')
const query = util.promisify(con.query).bind(con);

const common = require("../common")

async function getAccountData(req, res, next) {
    //This middleware is meant for getting all extra account data that may be used in places such as
    //the navbar, and other UI elements
    if (req.path.includes("img") || req.path.includes("css") || req.path.includes("js")) { next(); return; }
    if (!req.account) { next(); return; }

    req.account.all_notifications = await common.notification.getAccountAllNotifications(req.account);
    req.account.unread_notifications = await common.notification.getAccountUnreadNotifications(req.account);
    req.account.empathies_given = await common.empathy.getAccountEmpathiesGiven(req.account);

    next();
}

module.exports = getAccountData