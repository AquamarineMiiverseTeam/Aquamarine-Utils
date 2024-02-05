const colors = require(process.cwd() + '/node_modules/colors');
const moment = require(process.cwd() + '/node_modules/moment');
const db_con = require("../database_con")

const strict_mode = true;

async function auth(req, res, next) {
    if (req.path.includes("img") || req.path.includes("css") || req.path.includes("js") || (req.path.includes("v1") && req.path.includes("users"))) { next(); return; }

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

    //Grabbing the correct account
    var account;
    switch (parseInt(req.param_pack.platform_id)) {
        case 0:
            req.platform = "3ds";
            account = await db_con.select("*").from("accounts").where({"3ds_service_token" : service_token});
            break;
        case 1:
        default:
            req.platform = "wiiu";
            account = await db_con.select("*").from("accounts").where({wiiu_service_token : service_token});
            break;
    }

    //Grabbing account from database

    //If there is no account AND the request isn't creating an account, then send a 401 (Unauthorized)
    if (!account[0] && !req.path.includes("account") && !req.path.includes("people")) { res.redirect("/account/create_account"); return; }
    if (req.path.includes("account") || req.path.includes("people")) {next(); return;}

    //Finally, set the requests account to be the newly found account from the database
    req.account = account;

    if (req.account[0].tester != 1 && strict_mode) {
        if (req.path.includes("v1")) {res.sendStatus(403); return;} else {
            res.render("pages/error/error_tester")
        }

        return;
    }

    next();
}

module.exports = auth