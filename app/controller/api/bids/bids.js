var { validationResult } = require('express-validator')
const bidsService = require("../../../services/bidsService");
var { apiMessages } = require('../../../../helper/message');
var { Errorresponse, Apiresponse } = require('../../../../helper/response');
const { conn } = require("../../../dbConnection");
const { response } = require('express');
const settingsController = {}
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

settingsController.addBids = async function (request, response) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var insertdiscount = await bidsService.insertBids(request.body)
            if (insertdiscount.affectedRows == 1) {
                var discount = {
                    'id': insertdiscount.insertId,
                    "bids": request.body.bids,
                    "bid_amount": request.body.bid_amount,
                }
                return response.status(200).json(
                    Apiresponse(200, 'Bids Added Successfully', discount)
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

settingsController.getBids = async function (request, response) {
    try {
        var getDiscount = await bidsService.getBids()
        return response.status(200).json(
            Apiresponse(200, 'Bids get Successfully', getDiscount)
        )

    } catch (error) {
        console.log(error);
    }

}

settingsController.getBidsById = async function (request, response) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var dids = await bidsService.getBidsById(request.query)
            return response.status(200).json(
                Apiresponse(200, 'Bids get Successfully', dids)
            )
        }
    } catch (error) {
        console.log(error);
    }
}

settingsController.updateBids = async function (request, response) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var bidsUpdate = await bidsService.updateBids(request.body)
            if (bidsUpdate.affectedRows == 1) {
                var discount = {
                    'id': request.body.id,
                    "bids": request.body.bids,
                    "bid_amount": request.body.bid_amount,
                }
                return response.status(200).json(
                    Apiresponse(200, 'Bids Updated Successfully', discount)
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

settingsController.deleteBidsById = async function (request, response) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var deletediscount = await bidsService.deleteBidsById(request.query)
            if (deletediscount.affectedRows == 0) {
                return response.status(200).json(
                    Errorresponse(101, "failed to delete bid")
                );
            } else {
                return response.status(200).json(
                    Apiresponse(200, 'Bids Delete Successfully')
                );
            }
        }
    } catch (error) {
        console.log(error);
    }
}
// 01-06-23
settingsController.allUpdateBids = async function (request, response, next) {
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
                    let sql = `UPDATE bids set bids = ? , bid_amount = ? where id = ?`;
                    var insertData = [data[i].bids, data[i].bid_amount, data[i].id]
                    var bids = await queryParamPromise(sql, insertData);
                }

            }
            return response.status(200).json(
                Apiresponse(200, 'Bids Updated Successfully', {})
            )
        }
    } catch (error) {
        console.log(error);
        return response.status(200).json(
            Errorresponse(101, 'Failed')
        )
    }
}
// 01-06-23
module.exports = settingsController