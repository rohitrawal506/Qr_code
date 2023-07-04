// const { Router } = require('express')
var express = require("express");
var router = express.Router();
var authJwt = require('../../app/middleware/authJwt')
var BidsController = require('../../app/controller/api/bids/bids');
var { addBidsValidation, getBidsByIdValidation, updateBidsValidation } = require('../../app/controller/api/bids/validation');


router.post('/bids_add', addBidsValidation, [authJwt.verifyToken, authJwt.db_token_check,], (request, response, next) => {
    BidsController.addBids(request, response, next)
})

router.get('/bids_get', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    BidsController.getBids(request, response, next)
})

router.get('/bids_getById', getBidsByIdValidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    BidsController.getBidsById(request, response, next)
})

router.post('/bids_update', updateBidsValidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    BidsController.updateBids(request, response, next)
})

// code 31-05-23
router.post('/all_bids_update', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    BidsController.allUpdateBids(request, response, next)
});
router.get('/bids_get', [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    BidsController.getBids(request, response, next)
})

// code 31-05-23

router.get('/bids_deleteById', getBidsByIdValidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    BidsController.deleteBidsById(request, response, next)
})

module.exports = router