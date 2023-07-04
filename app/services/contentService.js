const { conn } = require('../dbConnection');
var contentService = {}

const queryParamPromise = (sql, queryParam) => {
    return new Promise((resolve, reject) => {
        conn.query(sql, queryParam, (err, result) => {
            if (err) return reject(err);
            return resolve(result)
        })
    })
}
contentService.addcontent = async function (data) {
    if (data) {
        var display_in = JSON.stringify(data.display_in)

        var sql = 'INSERT INTO content_page (page_name ,category ,content_page,content_type,display_in) VALUES(?,?,?,?,?)'
        var queryParam = [data.name, data.category, data.content_page, data.contentType, display_in]
        var contentdata = await queryParamPromise(sql, queryParam)
        return contentdata
    }
}
contentService.existPageContent = async function (data) {
    if (data) {
        var sql = 'SELECT * FROM content_page WHERE category = ?'
        var queryParam = [data]
        var contentdata = await queryParamPromise(sql, queryParam)

        return contentdata
    }
}
contentService.getList = async function () {
    var sql = 'SELECT * FROM content_page'
    var queryParam = []
    var contentdata = await queryParamPromise(sql, queryParam)
    return contentdata

}
contentService.getpage = async function (data) {
    var sql = 'SELECT * FROM content_page WHERE id = ?'
    var queryParam = [data]
    var contentdata = await queryParamPromise(sql, queryParam)
    return contentdata
}
contentService.updateContent = async function (data) {
    var display_in = JSON.stringify(data.display_in)
    var sql = 'UPDATE content_page SET page_name = ?,category = ?,content_page = ?,content_type = ?,display_in = ? WHERE id = ?'
    var queryParam = [data.name, data.category, data.content_page, data.contentType, display_in, data.page_id]
    var contentdata = await queryParamPromise(sql, queryParam)
    return contentdata
}
contentService.deletePage = async function (data) {
    var sql = 'DELETE FROM content_page WHERE id=?'
    var queryParam = [data]
    var contentdata = await queryParamPromise(sql, queryParam)
    return contentdata
}
module.exports = contentService