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


settingsService.getDiscount = async function (data) {
    try {
        var sqlQuery = `SELECT * FROM settings`
        var setting = await queryParamPromise(sqlQuery)
        return setting
    } catch (error) {
        console.log(error)
    }
}

settingsService.getcustomerPages = async function (data) {
    try {
        var sqlQuery = `SELECT id, page_name, category, display_in FROM content_page`
        var setting = await queryParamPromise(sqlQuery)
        var customerShowPage = []
        if(setting.length > 0){
            for(let i = 0; i < setting.length; i++ ){
                var displayIn = JSON.parse(setting[i].display_in)
                if(displayIn.customer == 1){
                    customerShowPage.push(setting[i])
                }
            }   
        }
        return customerShowPage
    } catch (error) {
        console.log(error)
    }
}



module.exports = settingsService