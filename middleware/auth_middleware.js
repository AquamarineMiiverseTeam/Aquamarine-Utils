const colors = require(process.cwd() + '/node_modules/colors');
const moment = require(process.cwd() + '/node_modules/moment');
const util = require('util')

const con = require('../database_con');
const query = util.promisify(con.query).bind(con);

const strict_mode = true;

async function auth(req, res, next) {
    if (req.path.includes("img") || req.path.includes("css") || req.path.includes("js")) { next(); return; }

    //Assigning variables
    var param_pack = req.get('x-nintendo-parampack');
    var service_token = req.get('x-nintendo-servicetoken')

    //Check if the request is faulty or not.
    if (!service_token || !param_pack || service_token.length < 42) { res.sendStatus(401); console.log("[ERROR] (%s) Recieved either no Param Pack, no Service Token, or invalid Service Token.".red, moment().format("HH:mm:ss")); return;}

    service_token = service_token.slice(0, 42);

    //Translating Param_Pack into a more readable format to collect data from.
    var base64Result = (Buffer.from(param_pack, 'base64').toString()).slice(1, -1).split("\\");
    req.param_pack = {};
    req.service_token = service_token;

    for (let i = 0; i < base64Result.length; i += 2) {
        req.param_pack[base64Result[i].trim()] = base64Result[i + 1].trim();
    }

    //Grabbing the correct service token
    var sql;
    //console.log(req.service_token)
    switch (parseInt(req.param_pack.platform_id)) {
        case 0:
            sql = "SELECT * FROM accounts WHERE 3ds_service_token = ?";
            req.platform = "3ds";
            break;
        case 1:
        default:
            sql = "SELECT * FROM accounts WHERE wiiu_service_token = ?";
            req.platform = "wiiu";
            break;
    }

    //Grabbing account from database
    var account = await query(sql, service_token);

    //If there is no account AND the request isn't creating an account, then send a 401 (Unauthorized)
    if (account.length == 0 && !req.path.includes("account") && !req.path.includes("people")) { res.redirect("/account/create_account"); return; }
    if (req.path.includes("account") || req.path.includes("people")) {next(); return;}

    //Finally, set the requests account to be the newly found account from the database
    req.account = account;

    if (strict_mode && account[0].admin == 0) {res.sendStatus(403); return;}

    next();
}

module.exports = auth