const { check } = require('express-validator')

exports.contentPageValidation = [
    check('name', 'Please Enter Page Name').not().isEmpty(),
    check('category', 'Please Select Category').not().isEmpty(),
    check('content_page', 'Content Page Should Not be Empty').not().isEmpty(),
]