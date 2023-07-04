var express = require("express");
var router = express.Router();
var adminUserController = require('../../app/controller/api/adminUser/adminUser')
var { purchaseBidValidation, editUserProfile } = require('../../app/controller/api/adminUser/validation')

var webAuth = require('../../app/middleware/webAuth')
var authJwt = require('../../app/middleware/authJwt')
var middlewareReq = {};
middlewareReq.role = 'admin';


router.post("/admin_userlist", [webAuth(middlewareReq), authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    adminUserController.adminUserList(request, response, next);
});
router.post("/change_user_status", [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    adminUserController.changeUserStatus(request, response, next);
});

router.post("/purchase_bid", purchaseBidValidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {

    adminUserController.purchaseBid(request, response, next);
});
router.post("/delete_user", [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    adminUserController.deleteUser(request, response, next);
});
router.post("/get_profile", [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    adminUserController.getProfile(request, response, next);
});
router.post("/edit_profile", editUserProfile, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    adminUserController.editUserProfile(request, response, next);
});
router.post("/get_total_bid", [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    adminUserController.getTotalBids(request, response, next);
});
router.post("/get_user_detail", [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    adminUserController.getUserDetail(request, response, next);
});
router.post("/get_dashboard_data", [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    adminUserController.getDashboardData(request, response, next);
});
module.exports = router;