const { check, validationResult } = require('express-validator');

exports.signupValidation = [
    check('username', 'please enter username').not().isEmpty(),
    check('email', 'please enter email').notEmpty(),
    check('email', 'Please enter a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password is required').not().isEmpty(),
    check('password', 'Password requires minimum 6 digit number').isLength({ min: 6, max: 20 }),
    check('country', 'country is required').notEmpty(),
    check('city', 'City name is required').notEmpty(),
    check('address', 'Address  is required').notEmpty(),
    check('promocode').if(check('promocode').not().equals('')).matches(/^[A-Z0-9]+$/)
        .withMessage('Promocode must contain only capital letters')
]

exports.loginValidation = [
    check('email', 'please enter email').notEmpty(),
    check('email', 'Please enter a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password is required').not().isEmpty(),
    // check('device_token', 'Device Token is required').if(check('role_id').equals('3')).notEmpty(),
]

exports.logoutValidation = [
    check('device_token', 'Device Token is required').if(check('role_id').equals('3')).notEmpty()
]

exports.changePasswordValidation = [
    check('old_password', 'Old password is required').not().isEmpty(),
    check('new_password', 'New password is required').not().isEmpty()
]

exports.forgotPasswordValidation = [
    check('email', 'Please enter a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
]

exports.resetPasswordValidation = [
    check('password', 'Password is required').not().isEmpty(),
    check('password', 'Password requires minimum 6 digit number').isLength({ min: 6, max: 20 }),
    check('confirm_password', 'Confirm password is required').not().isEmpty()
        .custom((value, { req }) => value === req.body.password).withMessage("The passwords do not match"),
    check('confirm_password', 'Password requires minimum 6 digit number').isLength({ min: 6, max: 20 }),
    check('access_token', 'Access token is required').not().isEmpty(),
]
exports.changePasswordValidation = [
    check('old_password', 'Password requires minimum 6 digit number').isLength({ min: 6, max: 20 }),
    check('new_password', 'Password requires minimum 6 digit number').isLength({ min: 6, max: 20 }),
    check('old_password', 'Old Password required').notEmpty(),
    check('new_password', 'New Password is required').not().isEmpty()
        .custom((value, { req }) => value !== req.body.old_password).withMessage("New password cant be same as old password"),
    check('confirm_password', 'Password requires minimum 6 digit number').isLength({ min: 6, max: 20 }),
    check('confirm_password', 'Confirm password is required').not().isEmpty()
        .custom((value, { req }) => value === req.body.new_password).withMessage("New password and confirm password does not match"),

]