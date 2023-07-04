var productService = require('../../../services/ProductService')
var userService = require('../../../services/UserService')
var authService = require('../../../services/AuthService')
var paymentController = require('../payment/payment')
var NotificationController = require('../notification/notification')

var { validationResult } = require('express-validator')
var { apiMessages, apiMessages } = require('../../../../helper/message')
var { Errorresponse, Apiresponse } = require('../../../../helper/response')
const { baseImagePath, web_url } = require('../../../../constant/config');
const path = require("path");
const fs = require('fs-extra');
var fileExtension = require("file-extension");
const { conn } = require('../../../dbConnection');
var cron = require('node-cron')
var ProductController = {}
ProductController.addProduct = async function (request, response, next) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            if (request.files != null) {
                var InvalidImage = []
                var files = request.files.images
                var array_of_allowed_file_types = ['image/png', 'image/jpeg', 'image/jpg'];
                for (let i = 0; i < files.length; i++) {
                    if (!array_of_allowed_file_types.includes(files[i].mimetype)) {
                        InvalidImage.push(files[i])
                        break
                    }
                }
                if (InvalidImage.length == 0) {
                    var insertProduct = await productService.addProduct(request.body)
                    if (insertProduct.insertId != 0) {
                        if (files.length == undefined) {
                            var newFilename = 'Product_' + Math.floor(Math.random() * 100000) + '.' + fileExtension(files.name)
                            var newPath = path.join(baseImagePath, newFilename)
                            await files.mv(newPath)
                            var sql = 'INSERT INTO product_images (product_id,image) VALUES(?,?)'
                            var queryParam = [insertProduct.insertId, newFilename]
                            conn.query(sql, queryParam, (err, results) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("retsult", results);
                                    // return results;
                                };
                            });
                        } else {
                            files.forEach((file) => {
                                var newFilename = 'Product_' + Math.floor(Math.random() * 100000) + '.' + fileExtension(file.name)
                                var newPath = path.join(baseImagePath, newFilename)
                                file.mv(newPath)
                                var sql = 'INSERT INTO product_images (product_id,image) VALUES(?,?)'
                                var queryParam = [insertProduct.insertId, newFilename]
                                conn.query(sql, queryParam, (err, results) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log("retsult", results);
                                        // return results;
                                    };
                                });

                            });
                        }
                        var addProductNotification = await NotificationController.addProductNotification(request.body, insertProduct.insertId);
                        var apiMessage = apiMessages('Product', 'addSuccess')
                        return response.status(200).json(
                            Apiresponse(200, apiMessage, insertProduct.insertId)
                        );
                    }
                } else {
                    var apiMessage = apiMessages('', 'invalied')
                    response.status(200).json(
                        Errorresponse(101, apiMessage)
                    );
                }
            } else {
                // var apiMessage = apiMessages('', 'invalied')
                response.status(200).json(
                    Errorresponse(101, 'Please Select Image')
                );
            }
        }
    } catch (error) {
        console.log(error)
    }

}
ProductController.getProductList = async function (request, response, next) {
    try {
        var getAuthUser = await authService.getAuthUser(request.token)
        if (getAuthUser.length == 0) {
            var apiMessage = apiMessages('user', 'notFound')
            return response.status(200).json(
                Errorresponse(101, apiMessage)
            )
        } else {
            var authUser = await productService.getBidUser(getAuthUser[0])
            if (authUser.length == 0) {
                var apiMessage = apiMessages('user', 'notFound')
                return response.status(200).json(
                    Errorresponse(101, apiMessage)
                )
            } else {

                if (getAuthUser[0].role_id == 3) {
                    var country = ''
                    var checkcountry = await productService.checkcountry(authUser[0])
                    console.log(checkcountry);
                    if (checkcountry.length > 0) {
                        country = authUser[0].country;
                    } else {
                        return response.status(200).json(
                            Errorresponse(101, "No Product Available")
                        )
                    }
                }
                var getProductList = await productService.getProductList(request.body.filter, request.body.auction, request.body.current_page, authUser[0].id, country, getAuthUser[0].role_id)
                if (getProductList.products.length > 0) {
                    var user_id = getAuthUser[0].user_id;
                    for (let i = 0; i < getProductList.products.length; i++) {
                        if (user_id == getProductList.products[i].winner_id) {
                            var product = getProductList.products[i]
                            var paymentDetail = await productService.getwinnerPaymentDetail(product);
                            if (paymentDetail.length > 0) {
                                product.amount_payable = {};
                                product.amount_payable.amount_pending = paymentDetail[0].bid_price;
                                product.amount_payable.amount_paid = paymentDetail[0].amount_paid;
                                product.amount_payable.discount_percentage = paymentDetail[0].discount_percentage;
                                product.amount_payable.final_payment_status = paymentDetail[0].final_payment_status;
                                if (paymentDetail[0].discount_percentage == 0 && paymentDetail[0].amount_paid != 0) {
                                    product.amount_payable.amount_pending = paymentDetail[0].bid_price - paymentDetail[0].amount_paid;
                                }
                                if (paymentDetail[0].discount_percentage != 0) {
                                    var discountAmount = (paymentDetail[0].bid_price / 100 * paymentDetail[0].discount_percentage) + paymentDetail[0].amount_paid;
                                    product.amount_payable.amount_pending = paymentDetail[0].bid_price - discountAmount
                                }
                                if (paymentDetail[0].final_payment_status == '2') {
                                    product.amount_payable.amount_pending = 0
                                }
                            } else {
                                product.amount_payable = null;
                            }

                        }
                    }
                    var apiMessage = apiMessages('Product Found', 'loginSuccess')
                    return response.status(200).json(
                        Apiresponse(200, apiMessage, getProductList)
                    )
                } else {
                    return response.status(200).json(
                        Errorresponse(101, "No Product Available")
                    )
                }
            }
        }
    } catch (error) {
        console.log(error)
    }
}
ProductController.placeBid = async function (request, response, next) {
    try {
        var getAuthUser = await authService.getAuthUser(request.token)
        if (getAuthUser.length == 0) {
            var apiMessage = apiMessages('user', 'notFound')
            return response.status(200).json(
                Errorresponse(101, apiMessage)
            )
        } else {
            if (getAuthUser[0].role_id != 3) {
                // var apiMessage = apiMessages('user', 'notFound')
                return response.status(200).json(
                    Errorresponse(101, 'access  denied')
                )
            } else {
                var bidUser = await productService.getBidUser(getAuthUser[0])
                if (bidUser.length == 0) {
                    var apiMessage = apiMessages('user', 'notFound')
                    return response.status(200).json(
                        Errorresponse(101, apiMessage)
                    )
                } else {
                    if (bidUser[0].verified_at == null) {
                        return response.status(200).json(
                            Errorresponse(101, 'Please open link send to your email to verify')
                        )
                    }
                    if (bidUser[0].bids_remain != 0) {
                        var bidProduct = await productService.getBidProduct(request.body);
                        if (bidProduct.length == 0) {
                            return response.status(200).json(
                                Errorresponse(101, 'Product not found')
                            )
                        } else {
                            var placeBid = {
                                pre_payment: false,
                                user_name: bidUser[0].fullname,
                                user_id: bidUser[0].id,
                                customer_id: bidUser[0].stripe_customer_id,
                                product_id: request.body.product_id,
                                bid_price: request.body.bid_price,
                                bid_id: 0,
                                pre_deposite_amount: 0,
                                pre_deposit_payment_status: '1',
                                payment_url: ''
                            }
                            if (request.body.bid_price > bidProduct[0].max_bid_price) {
                                placeBid.pre_payment = true;
                                placeBid.pre_deposite_amount = request.body.bid_price * 0.2

                                var checkPendingReq = await productService.checkPendingReq(placeBid);
                                if (checkPendingReq.length == 0) {
                                    var insertBId = await productService.placeBid(placeBid)
                                    if (insertBId.insertId == 0) {
                                        var Verror = apiMessages('', 'error')
                                        return response.status(200).json(
                                            Errorresponse(101, Verror)
                                        )
                                    } else {
                                        placeBid.bid_id = insertBId.insertId
                                    }
                                } else {
                                    var updatePendingReq = await userService.updatePromocode(placeBid);
                                    placeBid.bid_id = checkPendingReq[0].id
                                }
                                var getTotalBids = await userService.getTotalBids(request.token)
                                if (getTotalBids.length == 0) {
                                    var Verror = apiMessages('', 'error')
                                    return response.status(200).json(
                                        Errorresponse(101, Verror)
                                    )
                                } else {
                                    var bufferData = Buffer.from(JSON.stringify(placeBid)).toString('base64')
                                    var result = {};
                                    result.bid_id = placeBid.bid_id;
                                    result.bids_remain = getTotalBids[0].bids_remain
                                    result.payment_page = `${web_url}/payment/bid/${bufferData}`;
                                    var apiMessage = apiMessages('', 'loginSuccess');
                                    return response.status(200).json(
                                        Apiresponse(200, apiMessage, result)
                                    );
                                }
                            }
                            var insertBId = await productService.placeBid(placeBid)
                            if (insertBId.affectedRows == 0) {
                                var apiMessage = apiMessages('', 'error')
                                return response.status(200).json(
                                    Errorresponse(101, apiMessage)
                                )
                            } else {
                                var updateBid = await productService.updateBid(bidUser[0].id)
                                if (updateBid.affectedRows == 0) {
                                    var apiMessage = apiMessages('', 'error')
                                    return response.status(200).json(
                                        Errorresponse(101, apiMessage)
                                    )
                                } else {
                                    var getTotalBids = await userService.getTotalBids(request.token)
                                    if (getTotalBids.length == 0) {
                                        var Verror = apiMessages('', 'error')
                                        return response.status(200).json(
                                            Errorresponse(101, Verror)
                                        )
                                    } else {
                                        getTotalBids[0].bid_id = insertBId.insertId
                                        var apiMessage = apiMessages('', 'loginSuccess');
                                        return response.status(200).json(
                                            Apiresponse(200, apiMessage, getTotalBids[0])
                                        );
                                    }
                                }
                            }
                        }
                    }
                    else {
                        var apiMessage = apiMessages('', 'error')
                        return response.status(200).json(
                            Errorresponse(101, 'insufficient bids')
                        )
                    }
                }
            }
        }

    } catch (error) {
        console.log(error)
    }
}
ProductController.viewProductdetail = async function (request, response, next) {
    try {
        if (request.body.product_id) {
            var getAuthUser = await authService.getAuthUser(request.token)
            if (getAuthUser.length == 0) {
                var apiMessage = apiMessages('user', 'notFound')
                return response.status(200).json(
                    Errorresponse(101, apiMessage)
                )
            } else {
                if (getAuthUser[0].role_id == 1 || getAuthUser[0].role_id == 2) {
                    var productDetail = await productService.getProductDetail(request.body)
                    return response.status(200).json(
                        Apiresponse(200, apiMessage, productDetail[0])
                    )
                } else {
                    var bidUser = await productService.getBidUser(getAuthUser[0])
                    if (bidUser.length == 0) {
                        var apiMessage = apiMessages('user', 'notFound')
                        return response.status(200).json(
                            Errorresponse(101, apiMessage)
                        )
                    }
                    else {
                        var productDetail = await productService.viewProductdetail(request.body, bidUser[0].id)
                        if (productDetail.length == 0) {
                            var apiMessage = apiMessages('product', 'notFound')
                            return response.status(200).json(
                                Errorresponse(101, apiMessage)
                            )
                        } else {
                            var user_id = bidUser[0].id;
                            if (user_id == productDetail[0].winner_id) {
                                var product = productDetail[0]
                                var paymentDetail = await productService.getwinnerPaymentDetail(product)
                                product.amount_payable = {}
                                product.amount_payable.amount_pending = paymentDetail[0].bid_price;
                                product.amount_payable.amount_paid = paymentDetail[0].amount_paid;
                                product.amount_payable.discount_percentage = paymentDetail[0].discount_percentage;
                                product.amount_payable.final_payment_status = paymentDetail[0].final_payment_status;
                                if (paymentDetail[0].discount_percentage == 0 && paymentDetail[0].amount_paid != 0) {
                                    product.amount_payable.amount_pending = paymentDetail[0].bid_price - paymentDetail[0].amount_paid;
                                }
                                if (paymentDetail[0].discount_percentage != 0) {
                                    var discountAmount = (paymentDetail[0].bid_price / 100 * paymentDetail[0].discount_percentage) + paymentDetail[0].amount_paid;
                                    product.amount_payable.amount_pending = paymentDetail[0].bid_price - discountAmount
                                }
                                if (paymentDetail[0].final_payment_status == '2') {
                                    product.amount_payable.amount_pending = 0
                                }
                            }
                            var apiMessage = apiMessages('', 'loginSuccess')
                            return response.status(200).json(
                                Apiresponse(200, apiMessage, productDetail[0])
                            )
                        }
                    }
                }

            }
        } else {
            var apiMessage = apiMessages('', 'error')
            return response.status(200).json(
                Errorresponse(101, "product id required")
            )
        }
    } catch (error) {
        console.log(error)
    }
}
ProductController.deleteProduct = async function (request, response, next) {
    try {
        var productImage = []

        var productExists = await productService.getBidProduct(request.body);

        if (productExists.legnth == 0) {
            apiMessage = apiMessages('Product', 'notFound');
            return response.status(200).json(
                Errorresponse(101, apiMessage)
            );
        } else {
            var image = await productService.getProductImage('', productExists[0].id);
            if (image.length != 0) {
                image.forEach(element => {
                    productImage.push(element.image)
                });
                productImage.forEach((ele, index) => {
                    fs.ensureFile(baseImagePath + ele, err => {
                        if (err) {
                            return console.error(err);
                        } else {
                            fs.remove(baseImagePath + ele, err => {
                                if (err) return console.error(err);
                            })
                        }
                    })
                    productService.productImageDelete(image[index].id, ele);
                });
                var deleteProduct = await productService.deleteProduct(request.body)
                // var getProductList = await productService.getProductList('', request.body.auction, request.body.current_page)
                if (deleteProduct.affectedRows == 0) {
                    var Verror = apiMessages('', 'notFound')
                    return response.status(200).json(
                        Errorresponse(101, Verror)
                    )
                } else {
                    var apiMessage = apiMessages('deleted', 'loginSuccess');
                    return response.status(200).json(
                        Apiresponse(200, apiMessage)
                    );
                }
            }
        }
    } catch (error) {
        return response.status(200).json(
            Errorresponse(101, error)
        )
    }
}

ProductController.getMyBids = async function (request, response, next) {
    try {
        var getAuthUser = await authService.getAuthUser(request.token)
        if (getAuthUser.length == 0) {
            var apiMessage = apiMessages('user', 'notFound')
            return response.status(200).json(
                Errorresponse(101, apiMessage)
            )
        } else {
            if (getAuthUser[0].role_id != 3) {
                return response.status(200).json(
                    Errorresponse(101, 'access  denied')
                )
            } else {
                var bidUser = await productService.getBidUser(getAuthUser[0])
                if (bidUser.length > 0) {
                    var getMyBIds = await productService.getMyBIds(bidUser[0].id, request.body);
                    if (getMyBIds.legnth == 0) {
                        var Verror = apiMessages('', 'error')
                        return response.status(200).json(
                            Errorresponse(101, Verror)
                        )
                    } else {
                        var user_id = getAuthUser[0].user_id;
                        for (let i = 0; i < getMyBIds.products.length; i++) {
                            if (user_id == getMyBIds.products[i].winner_id) {
                                var product = getMyBIds.products[i]
                                var paymentDetail = await productService.getwinnerPaymentDetail(product)
                                product.amount_payable = {}
                                product.amount_payable.amount_pending = paymentDetail[0].bid_price;
                                product.amount_payable.amount_paid = paymentDetail[0].amount_paid;
                                product.amount_payable.discount_percentage = paymentDetail[0].discount_percentage;
                                product.amount_payable.final_payment_status = paymentDetail[0].final_payment_status;

                                if (paymentDetail[0].discount_percentage == 0 && paymentDetail[0].amount_paid != 0) {
                                    product.amount_payable.amount_pending = paymentDetail[0].bid_price - paymentDetail[0].amount_paid;
                                }
                                if (paymentDetail[0].discount_percentage != 0) {
                                    var discountAmount = (paymentDetail[0].bid_price / 100 * paymentDetail[0].discount_percentage) + paymentDetail[0].amount_paid;
                                    product.amount_payable.amount_pending = paymentDetail[0].bid_price - discountAmount
                                }
                                if (paymentDetail[0].final_payment_status == '2') {
                                    product.amount_payable.amount_pending = 0
                                }
                                // console.log(product);
                            }
                        }

                        return response.status(200).json(
                            Apiresponse(200, 'successfull', getMyBIds)
                        )
                    }
                } else {
                    var Verror = apiMessages('user', 'notFound')
                    return response.status(200).json(
                        Errorresponse(101, Verror)
                    )
                }
            }
        }
    } catch (error) {
        console.log(error);
        var Verror = apiMessages('', 'error')
        return response.status(200).json(
            Errorresponse(101, Verror)
        )
    }
}
ProductController.puchase_product = async function (request, response, next) {
    try {
        // var paymentData = {
        //     bid_id: '',
        // }
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var getAuthUser = await authService.getAuthUser(request.token)
            if (getAuthUser.length == 0) {
                var apiMessage = apiMessages('user', 'notFound')
                return response.status(200).json(
                    Errorresponse(101, apiMessage)
                )
            } else {
                if (getAuthUser[0].role_id != 3) {
                    return response.status(200).json(
                        Errorresponse(101, 'access  denied')
                    )
                } else {
                    var getUserData = await authService.getUserByid(getAuthUser[0])
                    if (getUserData.length == 0) {
                        var apiMessage = apiMessages('user', 'notFound')
                        return response.status(200).json(
                            Errorresponse(101, apiMessage)
                        )
                    } else {
                        var paymentDetail = await productService.getBidderById(request.body, getUserData[0])
                        if (paymentDetail.length == 0) {
                            return response.status(200).json(
                                Errorresponse(101, 'Cant Purchase Product')
                            )
                        } else {
                            var updatestatus = await productService.updateBidderStatus(request.body)
                            if (updatestatus.affectedRows == 0) {
                                var apiMessage = apiMessages('', 'notFound')
                                return response.status(200).json(
                                    Errorresponse(101, apiMessage)
                                )
                            } else {
                                amount_payable = {}
                                amount_payable.bid_id = request.body.bid_id;
                                amount_payable.customer_id = getUserData[0].stripe_customer_id;
                                amount_payable.user_id = paymentDetail[0].user_id;
                                amount_payable.amount_pending = paymentDetail[0].bid_price;
                                amount_payable.amount_paid = paymentDetail[0].amount_paid;
                                amount_payable.discount_percentage = paymentDetail[0].discount_percentage;
                                amount_payable.final_payment_status = paymentDetail[0].final_payment_status;
                                if (paymentDetail[0].discount_percentage == 0 && paymentDetail[0].amount_paid != 0) {
                                    amount_payable.amount_pending = paymentDetail[0].bid_price - paymentDetail[0].amount_paid;
                                }
                                if (paymentDetail[0].discount_percentage != 0) {
                                    if (paymentDetail[0].discount_percentage != 0) {
                                        var discountAmount = (paymentDetail[0].bid_price / 100 * paymentDetail[0].discount_percentage) + paymentDetail[0].amount_paid;
                                        amount_payable.amount_pending = paymentDetail[0].bid_price - discountAmount
                                    }
                                }
                                var userDetail = Buffer.from(JSON.stringify(amount_payable)).toString('base64')
                                var result = {}
                                result.payment_page = `${web_url}/payment/product/${userDetail}`
                                var apiMessage = apiMessages('', 'loginSuccess');
                                return response.status(200).json(
                                    Apiresponse(200, apiMessage, result)
                                );
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
        var Verror = apiMessages('', 'error')
        return response.status(200).json(
            Errorresponse(101, Verror)
        )
    }
}
ProductController.addDiscount = async function (request, response, next) {
    try {
        var getAuthUser = await authService.getAuthUser(request.token)
        if (getAuthUser.length == 0) {
            var apiMessage = apiMessages('user', 'notFound')
            return response.status(200).json(
                Errorresponse(101, apiMessage)
            )
        } else {
            if (getAuthUser[0].role_id != 3) {
                return response.status(200).json(
                    Errorresponse(101, 'access  denied')
                )
            } else {
                var bidUser = await productService.getBidUser(getAuthUser[0])
                if (bidUser.length == 0) {
                    var Verror = apiMessages('user', 'notFound')
                    return response.status(200).json(
                        Errorresponse(101, Verror)
                    )
                } else {
                    var getBidderById = productService.getBidderById(request.body)
                    if (getBidderById.length == 0) {
                        var apiMessage = apiMessages('', 'notFound')
                        return response.status(200).json(
                            Errorresponse(101, apiMessage)
                        )
                    } else {
                        var updateDiscount = productService.updateDiscount(request.body)
                        if (updateDiscount.affectedRows == 0) {
                            var apiMessage = apiMessages('', 'notFound')
                            return response.status(200).json(
                                Errorresponse(101, apiMessage)
                            )
                        } else {
                            return response.status(200).json(
                                Apiresponse(200, 'discount added successfully')
                            );
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
        var Verror = apiMessages('', 'error')
        return response.status(200).json(
            Errorresponse(101, Verror)
        )
    }
}
ProductController.disabled = async function (request, response, next) {
    try {
        var errors = validationResult(request)
        const { product_id, disabled_status } = request.body;
        if (!product_id) {
            return response.status(200).json(
                Errorresponse(101, 'Product Id is required')
            );
        }
        if (!disabled_status) {
            return response.status(200).json(
                Errorresponse(101, 'Product Status is required')
            );
        }
        let disbledProd = await productService.disabledProduct(request.body);
        let status = request.body.disabled_status == '0' ? 'Disabled' : 'Enabled';
        if (disbledProd.affectedRows > 0) {
            return response.status(200).json(
                Apiresponse(200, 'Product Update Successfully', status)
            );
        } else {
            return response.status(200).json(
                Errorresponse(101, 'Product Not Disabled')
            );
        }
    } catch (error) {
        console.log(error);
        return response.status(200).json(
            Errorresponse(101, 'error')
        );
    }
}
ProductController.deleted_product = async function (request, response, next) {
    try {
        var getAuthUser = await authService.getAuthUser(request.token)
        if (getAuthUser.length == 0) {
            var apiMessage = apiMessages('user', 'notFound')
            return response.status(200).json(
                Errorresponse(101, apiMessage)
            )
        } else {
            if (getAuthUser[0].role_id == 1) {
                var deleted_product = await productService.deletedProduct()
            }
        }
    } catch (error) {
        console.log(error);
    }
}
cron.schedule('*/5 * * * * *', async () => {
    var currentTime = new Date()
    var resultData = await productService.finishBidTime()
    if (resultData.length > 0) {
        var result = await productService.updateStatus(currentTime)
        if (result.affectedRows > 0) {
            for (let i = 0; i < resultData.length; i++) {
                var winner = await productService.getWinner(resultData[i].id)
                console.log(winner);
                if (winner.length > 0) {
                    var refundUser = await paymentController.refundAmount(resultData[i].id, winner[0].id)
                    var insertProductWinner = await productService.insertProductWinner(winner[0])
                    var sendNotification = await NotificationController.sendNotification(winner[0])
                }
            }
        }
    }
})

module.exports = ProductController