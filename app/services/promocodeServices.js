var moment = require("moment");
const { conn } = require("../dbConnection");
var promoService = {}


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
promoService.existPromocode = async function (data) {
    try {
        var insertSql = `SELECT promocode_name,code FROM promocodes WHERE code = ?  `;
        var requestPar = [data.promocode]
        var existPromocode = await queryParamPromise(insertSql, requestPar)
        return existPromocode
    } catch (error) {
        console.log(error);
    }
}
promoService.checkSpecificUser = async function (user_id, promocode) {
    try {
        var insertSql = `SELECT promocode_user_id,promocode FROM specific_promo_user WHERE promocode_user_id = ? AND  promocode = ?`;
        var requestPar = [user_id, promocode]
        var checkSpecificUser = await queryParamPromise(insertSql, requestPar)
        return checkSpecificUser
    } catch (error) {
        console.log(error);
    }
}
promoService.insertPromoCode = async function (data) {
    try {

        let start_time = moment
            .utc(data.date[0])
            .format("YYYY-MM-DD HH:mm:ss");
        let end_time = moment
            .utc(data.date[1])
            .format("YYYY-MM-DD HH:mm:ss");

        var insertSql = `INSERT INTO promocodes (promocode_name, code, total_codes,bonus,user,usage_per_user,status,promocode_type,start_time,end_time) VALUES (?,?,?,?,?,?,?,?,?,?)`;
        var requestPar = [data.promocode_name, data.promocode, data.total_codes, data.bonus, data.user, data.usage_per_user, data.status, data.promocode_type, start_time, end_time]
        var insertPromoCode = await queryParamPromise(insertSql, requestPar)
        if (data.user == 'specific') {
            data.value.forEach(async (user_id) => {
                var insertSql = `INSERT INTO specific_promo_user (promocode_user_id,promocode) VALUES(?,?)`;
                var requestPar = [user_id, data.promocode];
                var insertPromoCode = await queryParamPromise(insertSql, requestPar)
            });
        }
        return insertPromoCode
    } catch (error) {
        console.log(error);
    }
}
promoService.checkPromocode = async function (code, type) {
    try {
        var Promo_type = ''
        if (type != '' && type != undefined) {
            Promo_type = `promocode_type = 'bid_purchase' AND`
        }
        var currentTime = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss')
        var sqlQuery = `SELECT id,total_codes,bonus,user,usage_per_user,promocode_type,code FROM promocodes WHERE code = ?  AND ${Promo_type} status = 'active' AND total_codes != code_used AND start_time < ? AND end_time > ?`
        var requestPar = [code, currentTime, currentTime]
        var insertPromoCode = await queryParamPromise(sqlQuery, requestPar)
        return insertPromoCode
    } catch (error) {
        console.log(error)
    }
}
promoService.insertPromocodeUser = async function (data) {
    try {
        var sqlQuery = "INSERT INTO promocode_used (user_id,code,bonus,promocode_type) VALUE (?,?,?,?)"
        var requestPar = [data.user_id, data.promocode, data.bonus, data.promocode_type]
        var insertPromocodeUser = await queryParamPromise(sqlQuery, requestPar)
        return insertPromocodeUser
    } catch (error) {
        console.log(error)
    }
}
promoService.checkUsedCode = async function (userData) {
    try {
        var sqlQuery = "SELECT user_id FROM promocode_used WHERE user_id = ? AND code = ?"
        var requestPar = [userData.user_id, userData.code]
        var checkUsedCode = await queryParamPromise(sqlQuery, requestPar)
        return checkUsedCode
    } catch (error) {
        console.log(error)
    }
}
promoService.updateTotalCode = async function (promocode) {
    try {
        console.log(promocode);
        var sqlQuery = "UPDATE promocodes SET code_used = (code_used + 1) WHERE code = ?"
        var requestPar = [promocode]
        var checkUsedCode = await queryParamPromise(sqlQuery, requestPar)
        return checkUsedCode
    } catch (error) {
        console.log(error)
    }
}
promoService.getPromocodeList = async function (data) {
    try {
        var offset = (data.page - 1) * 10
        if (data.page != '') {
            pageSql = `LIMIT 10 OFFSET ${offset}`;
        }
        var sqlQuery = `SELECT id,promocode_name,code,total_codes,code_used,bonus,user,usage_per_user,status,promocode_type,start_time,end_time,
        (select count(*) from promocode_used inner join users on promocode_used.user_id = users.id where promocode_used.code = promocodes.code) as promocode_used_count
        FROM  promocodes  WHERE deleted_at IS Null ORDER BY created_at DESC ${pageSql}`
        var countSql = `SELECT count(*) AS promocode_count
        FROM promocodes  WHERE deleted_at IS Null`;
        var getPromocodeList = await queryParamPromise(sqlQuery)
        const totalRecords = await queryParamPromise(countSql);
        var resultData = {}
        resultData.totalRecords = totalRecords[0].promocode_count
        resultData.promocodes = getPromocodeList
        return resultData
    } catch (error) {
        console.log(error)
    }
}
promoService.getPromocode = async function (data) {
    try {
        var sqlQuery = `SELECT id,promocode_name,code,total_codes,code_used,bonus,user,usage_per_user,status,promocode_type,start_time,end_time FROM  promocodes WHERE id = ?`
        var requestPar = [data.promocode_id]
        var getPromocode = await queryParamPromise(sqlQuery, requestPar)
        return getPromocode
    } catch (error) {
        console.log(error)
    }
}
promoService.getSpecificUser = async function (data) {
    try {
        var sqlQuery = `SELECT users.id,users.fullname FROM specific_promo_user
        LEFT JOIN users ON users.id = specific_promo_user.promocode_user_id WHERE specific_promo_user.promocode = ?`
        var requestPar = [data]
        var getSpecificUser = await queryParamPromise(sqlQuery, requestPar)
        return getSpecificUser
    } catch (error) {
        console.log(error)
    }
}
promoService.updatePromoCode = async function (data) {
    try {
        let start_time = moment
            .utc(data.date[0])
            .format("YYYY-MM-DD HH:mm");
        let end_time = moment
            .utc(data.date[1])
            .format("YYYY-MM-DD HH:mm");

        var insertSql = `UPDATE promocodes SET promocode_name = ?, code = ?, total_codes = ?,bonus = ?,user = ?,usage_per_user = ?,status = ?,promocode_type = ?,start_time = ?,end_time= ? WHERE id =?`;
        var requestPar = [data.promocode_name, data.promocode, data.total_codes, data.bonus, data.user, data.usage_per_user, data.status, data.promocode_type, start_time, end_time, data.promocode_id]
        var insertPromoCode = await queryParamPromise(insertSql, requestPar)

        if (data.user == 'specific') {
            var deleteSql = `DELETE FROM specific_promo_user WHERE promocode = '${data.promocode}'`;
            var deleteSql = await queryParamPromise(deleteSql)
            data.value.forEach(async (element) => {
                var insertSql = `INSERT INTO specific_promo_user (promocode_user_id,promocode) VALUES(?,?)`;
                var requestPar = [element.id, data.promocode];
                var insertPromoCode = await queryParamPromise(insertSql, requestPar)
            });
        }
        return insertPromoCode
    } catch (error) {
        console.log(error);
    }
}

promoService.deletePromocode = async function (data) {
    try {
        if (data) {
            var currentTime = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss')
            var authSql = 'UPDATE promocodes SET deleted_at = ? WHERE id = ? AND deleted_at IS Null'
            var requestPar = [currentTime, data.promocode_id]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}

promoService.promocodeUsed = async function (data) {
    try {
        if (data) {
            var authSql = 'SELECT promocode_used.* , users.fullname , promocodes.promocode_name from promocode_used inner join users ON promocode_used.user_id = users.id inner join promocodes ON promocode_used.code = promocodes.code where promocode_used.code = ? ';
            var requestPar = [data.promocode_code]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
module.exports = promoService