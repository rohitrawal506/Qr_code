var { validationResult } = require('express-validator')
const discountService = require("../../../services/discountService");
var { apiMessages } = require('../../../../helper/message');
var { Errorresponse, Apiresponse } = require('../../../../helper/response');
const { conn } = require("../../../dbConnection");
const discountController = {}

const queryParamPromise = (sql, queryParam) => {
    return new Promise((resolve, reject) => {
        if (queryParam == '') {
            conn.query(sql, (err, results) => {
                if (err) return reject(err);
                return resolve(results);
            });
        } else {
            conn.query(sql, queryParam, (err, results) => {
                if (err) return reject(err);
                return resolve(results);
            });
        }
    });
};

discountController.addDiscount = async function (request, response) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var getDiscount = await discountService.getDiscount()
            if (getDiscount.length >= 12) {
                return response.status(200).json(
                    Errorresponse(200, 'Discount add limit over')
                )
            } else {
                var insertdiscount = await discountService.insertDiscount(request.body)
                if (insertdiscount.affectedRows == 1) {
                    var discount = {
                        'id': insertdiscount.insertId,
                        "discount": request.body.discount,
                        "type": request.body.type,
                    }
                    return response.status(200).json(
                        Apiresponse(200, 'Discount Added Successfully', discount)
                    )
                } else {

                    return response.status(200).json(
                        Errorresponse(101, 'Failed')
                    )
                }
            }
        }

    } catch (error) {
        console.log(error);
    }
}

discountController.getDiscount = async function (request, response) {
    try {
        var getDiscount = await discountService.getDiscount()
        return response.status(200).json(
            Apiresponse(200, 'Discount get Successfully', getDiscount)
        )

    } catch (error) {
        console.log(error);
    }

}

discountController.getDiscountById = async function (request, response) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var discount = await discountService.getDiscountById(request.query)
            return response.status(200).json(
                Apiresponse(200, 'Discount get Successfully', discount)
            )
        }
    } catch (error) {
        console.log(error);
    }
}

discountController.updateDiscount = async function (request, response) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var discountUpdate = await discountService.updateDiscount(request.body)
            if (discountUpdate.affectedRows == 1) {
                var discount = {
                    'id': request.body.id,
                    "discount": request.body.discount,
                    "type": request.body.type,
                }
                return response.status(200).json(
                    Apiresponse(200, 'Discount Updated Successfully', discount)
                )
            } else {

                return response.status(200).json(
                    Errorresponse(101, 'Failed')
                )
            }
        }

    } catch (error) {
        console.log(error);
    }
}

discountController.deleteDiscountById = async function (request, response) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var deletediscount = await discountService.deleteDiscountById(request.query)
            if (deletediscount.affectedRows == 0) {
                return response.status(200).json(
                    Errorresponse(101, "Failed to delete discount")
                );
            } else {
                return response.status(200).json(
                    Apiresponse(200, 'Discount Delete Successfully')
                );
            }
        }
    } catch (error) {
        console.log(error);
    }
}

// 1-06-23
discountController.allUpdateDiscount = async function (request, response) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            const data = request.body;
            if (data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    let sql = `UPDATE discount set discount = ?  where id = ?`;
                    var insertData = [data[i].discount, data[i].id]
                    var bids = await queryParamPromise(sql, insertData);
                }

            }
            return response.status(200).json(
                Apiresponse(200, 'Discount Updated Successfully', {})
            )
        }
    } catch (error) {
        console.log(error)
        return response.status(200).json(
            Errorresponse(101, 'Failed')
        )
    }
}
// 1-06-23
module.exports = discountController