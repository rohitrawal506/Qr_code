var moment = require("moment");
const { conn } = require("../dbConnection");
var settingsService = {}


const queryParamPromise = (sql, queryParam) => {
    return new Promise((resolve, reject) => {
        if (queryParam == '') {
            conn.query(sql, (err, results) => {
                if (err) return reject(err);
                return resolve(results);
            });
        } else {
            conn.query(sql, queryParam, (err, results) => {
                if (err) return reject(err);
                return resolve(results);
            });
        }
    });
};
settingsService.insertBids = async function (data) {
    try {
        var sqlQuery = "INSERT INTO bids (bids,bid_amount) VALUE (?,?)"
        var requestPar = [data.bids, data.bid_amount]
        var insertdiscount = await queryParamPromise(sqlQuery, requestPar)
        return insertdiscount
    } catch (error) {
        console.log(error)
    }
}

settingsService.getBids = async function (data) {
    try {
        var sqlQuery = `SELECT * FROM bids WHERE deleted_at IS NULL`
        var insertdiscount = await queryParamPromise(sqlQuery)
        return insertdiscount
    } catch (error) {
        console.log(error)
    }
}

settingsService.getBidsById = async function (data) {
    try {
        var sqlQuery = `SELECT * FROM bids WHERE id = ?`
        var id = [data.id]
        var discount = await queryParamPromise(sqlQuery, id)
        return discount
    } catch (error) {
        console.log(error)
    }
}

settingsService.updateBids =async function (data) {
    try {
        var sqlQuery = `UPDATE bids SET bids = ?, bid_amount = ? WHERE id = ?`
        var insertData = [data.bids, data.bid_amount, data.id]
        var bids = await queryParamPromise(sqlQuery, insertData)
        return bids
    } catch (error) {
        console.log(error)
    }
}

settingsService.deleteBidsById = async function (data) {
    try {
        var currentTime = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss')
        var sqlQuery = `UPDATE bids SET deleted_at = ? WHERE id = ?`
        var id = [currentTime, data.id]
        var bids = await queryParamPromise(sqlQuery, id)
        return bids
    } catch (error) {
        console.log(error)
    }
}



module.exports = settingsService