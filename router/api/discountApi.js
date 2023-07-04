
// const { Router } = require('express')
var express = require("express");
var router = express.Router();
var authJwt = require('../../app/middleware/authJwt')
var discountController = require('../../app/controller/api/discount/discount');
var { addDiscountValidation, getDiscountByIdValidation, updateDiscountValidation } = require('../../app/controller/api/settings/validation');


router.post('/discount_add', addDiscountValidation, [authJwt.verifyToken, authJwt.db_token_check,], (request, response, next) => {
    discountController.addDiscount(request, response, next)
})

router.get('/discount_get', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    discountController.getDiscount(request, response, next)
})

router.get('/discount_getById', getDiscountByIdValidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    discountController.getDiscountById(request, response, next)
})

router.post('/discount_update', updateDiscountValidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    discountController.updateDiscount(request, response, next)
})

router.get('/discount_deleteById', getDiscountByIdValidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    discountController.deleteDiscountById(request, response, next)
})

// code 31-05-23
router.post('/all_discount_update', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    discountController.allUpdateDiscount(request, response, next)
});
router.get('/discount_get', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    discountController.getDiscount(request, response, next)
})
// code 31-05-23
module.exports = router