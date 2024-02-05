var useDevEnv = true;

var config_database;
if (useDevEnv) config_database = require('./config/database_config.dev.json');
else config_database = require('./config/database_config.json');

const knex = require(process.cwd() + '/node_modules/knex')({
    client: 'mysql',
    connection: {
      host : config_database.database_host,
      port : 3306,
      user : config_database.database_user,
      password : config_database.database_password,
      database : config_database.database
    }
});

module.exports = knex