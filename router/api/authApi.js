var express = require("express");
var router = express.Router();
var authController = require('../../app/controller/api/auth/auth')
var NotificationController = require('../../app/controller/api/notification/notification')
var authJwt = require('../../app/middleware/authJwt')
var { signupValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation, changePasswordValidation } = require('../../app/controller/api/auth/validation')

// var middlewareReq = {};
// middlewareReq.role = 'admin';

router.post("/register", signupValidation, (request, response, next) => {
    authController.Register(request, response, next);
});

router.post("/login", loginValidation, (request, response, next) => {
    authController.login(request, response, next);
});

router.post("/update", (request, response, next) => {
    authController.update(request, response, next);
});

router.post("/logout", (request, response, next) => {
    authController.logout(request, response, next);
});

router.post("/forgot_password", forgotPasswordValidation, (request, response, next) => {
    authController.forgotPassword(request, response, next);
});
router.post("/reset_password", resetPasswordValidation, (request, response, next) => {
    authController.resetPassword(request, response, next)
});

router.post("/change_password", changePasswordValidation, [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    authController.changeUserPassword(request, response, next);
});

router.post("/delete_user", [authJwt.verifyToken, authJwt.db_token_check], (request, response, next) => {
    console.log('delete_user');
    authController.deleteAuthUser(request, response, next);
});
router.post("/send_notification", (request, response, next) => {
    NotificationController.ApisendNotification(request, response, next);
});
router.post("/send_mail", (request, response, next) => {
    NotificationController.ApisendMail(request, response, next);
});

router.post("/email_verify", (request, response, next) => {
    authController.emailVerification(request, response, next);
});
module.exports = router;