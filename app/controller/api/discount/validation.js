const { check } = require('express-validator')

exports.addDiscountValidation = [
    check('type', 'Type is required').notEmpty(),
    check('discount', 'Discount is required').notEmpty(),
    check('discount', 'Discount filed is required a Number').isNumeric(),
]

exports.getDiscountByIdValidation = [
    check('id', 'Id is required').notEmpty()
]

exports.updateDiscountValidation = [
    check('id', 'Id is required').notEmpty(),
    check('type', 'Type is required').notEmpty(),
    check('discount', 'Discount is required').notEmpty(),
    check('discount', 'Discount filed is required a Number').isNumeric(),
]