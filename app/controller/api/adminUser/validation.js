const { check, validationResult } = require('express-validator');



exports.purchaseBidValidation = [
    check('bid_id', 'bid_id required').notEmpty(),
    check('promocode').if(check('promocode').not().equals('')).matches(/^[A-Z0-9]+$/)
        .withMessage('Promocode must contain only capital letters')
]
exports.editUserProfile = [
    check('fullname', 'please enter username').not().isEmpty(),
    check('city', 'City name is required').notEmpty(),
    check('address', 'Address  is required').notEmpty(),
    check('country', 'country is required').notEmpty(),
    check('email', 'email is required').notEmpty(),
]

// exports.forgotPasswordValidation = [
//     check('email', 'Please enter a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
// ]

// exports.resetPasswordValidation = [
//     check('password', 'Password is required').not().isEmpty(),
//     check('confirm_password', 'Confirm password is required').not().isEmpty()
//         .custom((value, { req }) => value === req.body.password).withMessage("The passwords do not match"),
//     check('access_token', 'Access token is required').not().isEmpty(),
// ]
