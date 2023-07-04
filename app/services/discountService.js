var moment = require("moment");
const { conn } = require("../dbConnection");
var discountService = {}


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
discountService.insertDiscount = async function (data) {
    try {
        var sqlQuery = "INSERT INTO discount (discount,type) VALUE (?,?)"
        var requestPar = [data.discount, data.type]
        var insertdiscount = await queryParamPromise(sqlQuery, requestPar)
        return insertdiscount
    } catch (error) {
        console.log(error)
    }
}

discountService.getDiscount = async function (data) {
    try {
        var sqlQuery = `SELECT * FROM discount WHERE deleted_at IS NULL`
        var insertdiscount = await queryParamPromise(sqlQuery)
        return insertdiscount
    } catch (error) {
        console.log(error)
    }
}

discountService.getDiscountById = async function (data) {
    try {
        var sqlQuery = `SELECT * FROM discount WHERE id = ?`
        var id = [data.id]
        var discount = await queryParamPromise(sqlQuery, id)
        return discount
    } catch (error) {
        console.log(error)
    }
}

discountService.updateDiscount =async function (data) {
    try {
        var sqlQuery = `UPDATE discount SET type = ?, discount = ? WHERE id = ?`
        var insertData = [data.type, data.discount, data.id]
        var discount = await queryParamPromise(sqlQuery, insertData)
        return discount
    } catch (error) {
        console.log(error)
    }
}

discountService.deleteDiscountById = async function (data) {
    try {
        var currentTime = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss')
        var sqlQuery = `UPDATE discount SET deleted_at = ? WHERE id = ?`
        var id = [currentTime, data.id]
        var discount = await queryParamPromise(sqlQuery, id)
        return discount
    } catch (error) {
        console.log(error)
    }
}



module.exports = discountService