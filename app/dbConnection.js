var mysql = require('mysql');
var { config } = require('../constant/config')
var conn = mysql.createConnection({
    host: config.DB_HOST,
    user: config.DB_USERNAME,
    password: config.DB_PASSWORD,
    database: config.DB_DATABASE,
    timezone: 'utc',
});
conn.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Database is connected successfullys');
});
module.exports = { conn };