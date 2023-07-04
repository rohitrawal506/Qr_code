var express = require("express");
var router = express.Router();
var authJwt = require('../../app/middleware/authJwt')

var promoController = require('../../app/controller/api/promocode/promocode')
var { addpromocodevalidation } = require('../../app/controller/api/promocode/validation')

router.post('/add_promocode', addpromocodevalidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    promoController.addPromocode(request, response, next)
})
router.post('/get_promocode_list', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    promoController.getPromocodeList(request, response, next)
})
router.post('/get_promocode', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    promoController.getPromocode(request, response, next)
})
router.post('/update_promocode', addpromocodevalidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    promoController.updatePromocode(request, response, next)
})
router.post('/delete_promocode', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    promoController.deletePromocode(request, response, next)
})
router.post('/check_promocode', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    promoController.checkPromocode(request, response, next)
})
router.post('/promocode_used', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    promoController.promocodeUsed(request, response, next)
})




module.exports = router;