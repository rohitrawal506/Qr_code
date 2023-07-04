const { check } = require('express-validator')

exports.addBidsValidation = [
    check('bids', 'Bids is required').notEmpty(),
    check('bid_amount', 'Bids Amount is required').notEmpty(),
    check('bid_amount', 'Bids Amount is required a Number').isNumeric(),
]

exports.getBidsByIdValidation = [
    check('id', 'Id is required').notEmpty()
]

exports.updateBidsValidation = [
    check('id', 'Id is required').notEmpty(),
    check('bids', 'Bids is required').notEmpty(),
    check('bid_amount', 'Bids Amount is required').notEmpty(),
    check('bid_amount', 'Bids Amount is required a Number').isNumeric(),
]