var express = require("express");
var router = express.Router();
var paymentController = require('../../app/controller/api/payment/payment')
var authJwt = require('../../app/middleware/authJwt')
// var middlewareReq = {};
// middlewareReq.role = 'admin';

router.post("/success", (request, response, next) => {
    paymentController.processBidPayment(request, response, next);
});
router.post("/advance_payment", (request, response, next) => {
    paymentController.advancePayment(request, response, next);
});
router.post("/product_product", (request, response, next) => {
    paymentController.PurchaseProduct(request, response, next);
});

// router.post("/create_customer_id", [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
//     paymentController.createCustomer(request, response, next);
// });


module.exports = router;