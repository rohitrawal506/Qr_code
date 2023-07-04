const { check } = require('express-validator')

exports.addpromocodevalidation = [
    check('promocode_name', 'promocode_name is required').notEmpty(),
    check('promocode', 'promocode is required').notEmpty(),
    check('promocode').if(check('promocode').not().equals('')).matches(/^[A-Z0-9]+$/)
        .withMessage('Promocode must contain only capital letters'),
    check('total_codes', 'total codes is required').notEmpty(),
    check('bonus', 'bonus bids  required').notEmpty(),
    check('user', 'user is required').notEmpty(),
    check('usage_per_user', 'usage per user is required').notEmpty(),
    check('status', 'status is required').notEmpty(),
    check('promocode_type', 'promocode type is required').notEmpty(),
]