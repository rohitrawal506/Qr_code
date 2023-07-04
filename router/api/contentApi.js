var express = require("express");
var router = express.Router();
var authJwt = require('../../app/middleware/authJwt')

var contentController = require('../../app/controller/api/addcontentpage/addcontent')
var { contentPageValidation } = require('../../app/controller/api/addcontentpage/validations')



router.post('/add_content', contentPageValidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    contentController.addpage(request, response, next)
})
router.post('/get_contentlist', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    contentController.getcontentlist(request, response, next)
})
router.post('/get_content_page', (request, response, next) => {
    contentController.getContentPage(request, response, next)
})
router.post('/update_content_page', contentPageValidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    contentController.updateContentPage(request, response, next)
})
router.post('/delete_content_page', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    contentController.deleteContentPage(request, response, next)
})

module.exports = router;