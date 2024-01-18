const con_mysql = require(process.cwd() + '/node_modules/mysql');

var useDevEnv = true;


var config_database;
if (useDevEnv) config_database = require('./database_config.dev.json');
else config_database = require('./database_config.json');

var con = con_mysql.createConnection({
    host: config_database.database_host,
    user: config_database.database_user,
    password: config_database.database_password,
    database: config_database.database
})

module.exports = con