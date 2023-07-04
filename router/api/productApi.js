// const { Router } = require('express')
var express = require("express");
var router = express.Router();
var authJwt = require('../../app/middleware/authJwt')
var ProductController = require('../../app/controller/api/product/product');
var { addproductvalidation, purcahseProductvalidation } = require('../../app/controller/api/product/validation')

router.post('/add_product', addproductvalidation, (request, response, next) => {
    ProductController.addProduct(request, response, next)
})
router.post('/product_list', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    ProductController.getProductList(request, response, next)
})
router.post('/place_bid', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    ProductController.placeBid(request, response, next)
})
router.post('/delete_product', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    ProductController.deleteProduct(request, response, next)
})
router.post('/get_product_detail', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    ProductController.viewProductdetail(request, response, next)
})
router.post('/get_winner', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    ProductController.getWinner(request, response, next)
})
router.get('/lx_setting_api', (request, response, next) => {
    ProductController.settingApi(request, response, next)
})
router.post('/get_my_bids', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    ProductController.getMyBids(request, response, next)
})
router.post('/purchase_product', purcahseProductvalidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    ProductController.puchase_product(request, response, next)
})
router.post('/add_discount', purcahseProductvalidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    ProductController.addDiscount(request, response, next)
})

router.post('/disabled_product', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    ProductController.disabled(request, response, next)
});
router.post('/deleted_product', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    ProductController.deleted_product(request, response, next)
});
module.exports = router