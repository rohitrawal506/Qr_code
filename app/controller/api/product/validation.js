const { check } = require('express-validator')

exports.addproductvalidation = [
    check('product_name', 'Please Enter Product Name').not().isEmpty(),
    check('country', 'Please Enter Country Name').not().isEmpty(),
    check('bid_price', 'Please Enter  Bid Price').notEmpty(),
    check('max_bid_price', 'Please Enter Maximum Bid Price')
        .custom((value, { req }) => {
            return value <= req.body.bid_price ? false : true;
        })
        .withMessage('Enter max price more than bid price')
        .not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
]

exports.purcahseProductvalidation = [
    check('bid_id', 'Bid id is required').not().isEmpty(),
]
