var { validationResult } = require('express-validator')
const userService = require('../../../services/UserService')
const authService = require("../../../services/AuthService");
const promoService = require("../../../services/promocodeServices");
const promoController = require('../promocode/promocode')
const { web_url } = require('../../../../constant/config')
var { apiMessages } = require('../../../../helper/message')
var { Errorresponse, Apiresponse } = require('../../../../helper/response')
const adminUserController = {}
var SECRET_KEY = process.env.STRIPE_SECRET_KEY
const stripe = require('stripe')(SECRET_KEY);
adminUserController.adminUserList = async function (request, response, next) {
    try {
        var theToken = request.headers.authorization.split(' ')[1]
        var adminCheck = await authService.getAuthUser(theToken)
        if (adminCheck[0].role_id != 1) {
            return response.status(200).json(
                Errorresponse(200, 'access denied')
            );
        } else {
            var userAdminList = await userService.getUserAdminList(request.body)
            if (userAdminList.length == 0) {
                var Verror = apiMessages('', 'notFound')
                return response.status(200).json(
                    Errorresponse(101, Verror)
                )
            } else {
                var apiMessage = apiMessages('Login', 'loginSuccess');
                return response.status(200).json(
                    Apiresponse(200, apiMessage, userAdminList)
                );
            }
        }
    } catch (error) {
        return response.status(200).json(
            Errorresponse(101, error)
        )
    }
}
adminUserController.changeUserStatus = async function (request, response, next) {
    try {
        var theToken = request.headers.authorization.split(' ')[1]
        var getAuthUser = await authService.getAuthUser(theToken)
        if (getAuthUser[0].role_id != 1) {
            return response.status(200).json(
                Errorresponse(200, 'Access Denied')
            );
        } else {
            var changeStatus = await userService.changeUserStatus(request.body)
            if (changeStatus.affectedRow == 0) {
                var Verror = apiMessages('', 'notFound')
                return response.status(200).json(
                    Errorresponse(101, Verror)
                )
            } else {

                var userAdminList = await userService.getUserAdminList(getAuthUser[0].role_id)
                var apiMessage = apiMessages('Login', 'loginSuccess');
                return response.status(200).json(
                    Apiresponse(200, apiMessage, userAdminList)
                );


            }
        }

    } catch (error) {
        return response.status(200).json(
            Errorresponse(101, error)
        )
    }
}
adminUserController.deleteUser = async function (request, response, next) {
    try {
        var deleteUser = await userService.deleteUser(request.body)
        if (deleteUser.affectedRow == 0) {
            var Verror = apiMessages('', 'notFound')
            return response.status(200).json(
                Errorresponse(101, Verror)
            )
        } else {
            var userAdminList = await userService.getUserAdminList('1')
            var apiMessage = apiMessages('', 'loginSuccess');
            return response.status(200).json(
                Apiresponse(200, apiMessage, userAdminList)
            );
        }
    } catch (error) {
        return response.status(200).json(
            Errorresponse(101, error)
        )
    }
}
adminUserController.purchaseBid = async function (request, response, next) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var theToken = request.headers.authorization.split(' ')[1]
            var getAuthUser = await authService.getAuthUser(theToken)
            if (getAuthUser[0].role_id == 1) {
                return response.status(200).json(
                    Errorresponse(200, 'only user can purchase bid')
                );
            } else {
                var paymentData = {
                    user_id: '',
                    purchased_bid: '',
                    bid_amount: '',
                    bid_id: request.body.bid_id,
                    promocode: request.body.promocode ?? null,
                    bidder_id: '',
                    customer_id: '',
                }
                var getUserData = await authService.getUserByid(getAuthUser[0])
                if (getUserData.length == 0) {
                    var apiMessage = apiMessages('user', 'notFound')
                    return response.status(200).json(
                        Errorresponse(101, apiMessage)
                    )
                } else {
                    paymentData.customer_id = getUserData[0].stripe_customer_id
                    paymentData.user_id = getUserData[0].id
                    var bidData = await userService.getBidData(paymentData.bid_id)
                    if (bidData.length == 0) {
                        return response.status(200).json(
                            Errorresponse(101, 'Invalid Bid id')
                        )
                    } else {
                        paymentData.purchased_bid = bidData[0].bids;
                        paymentData.bid_amount = bidData[0].bid_amount;
                        if (paymentData.promocode != '' && paymentData.promocode != undefined) {
                            var checkStatus = await promoService.checkPromocode(paymentData.promocode);
                            if (checkStatus.length <= 0) {
                                return response.status(200).json(
                                    Errorresponse(101, 'Invalid Promocode')
                                )
                            }
                            checkStatus[0].user_id = getAuthUser[0].user_id;
                            if (checkStatus[0]?.promocode_type == 'signup' || checkStatus.length == 0) {
                                return response.status(200).json(
                                    Errorresponse(101, 'Invalid Promocode')
                                )
                            }
                            else {
                                if (checkStatus[0].user == 'specific') {
                                    var checkSpecificUser = await promoService.checkSpecificUser(getAuthUser[0].user_id, paymentData.promocode)
                                    if (checkSpecificUser.length == 0) {
                                        return response.status(200).json(
                                            Errorresponse(101, 'Invalid Promocode')
                                        )
                                    }
                                }
                                var insertPromocodeUSer = await promoController.insertPromocodeUSer(checkStatus[0])
                                if (insertPromocodeUSer == 'used') {
                                    return response.status(200).json(
                                        Errorresponse(101, 'Promocode Already Used')
                                    );
                                } else {
                                    paymentData.bid_amount = bidData[0].bid_amount - (bidData[0].bid_amount / 100) * checkStatus[0].bonus
                                }
                            }
                        }
                    }
                    var checkPendingReq = await userService.checkPendingReq(paymentData);
                    if (checkPendingReq.length == 0) {
                        var purchaseBid = await userService.purchaseBid(paymentData)
                        if (purchaseBid.insertId == 0) {
                            var Verror = apiMessages('', 'error')
                            return response.status(200).json(
                                Errorresponse(101, Verror)
                            )
                        } else {
                            paymentData.bidder_id = purchaseBid.insertId
                        }
                    } else {
                        var updatePendingReq = await userService.updatePromocode(paymentData);
                        paymentData.bidder_id = checkPendingReq[0].id
                    }
                    paymentData.bid_amount = paymentData.bid_amount.toFixed(2);

                    var userDetail = Buffer.from(JSON.stringify(paymentData)).toString('base64')
                    var result = {}
                    // result.payment_page = `${web_url}/payment/${userDetail}`
                    const session = await stripe.checkout.sessions.create({
                        payment_method_types: ["card"],
                        line_items: [
                            {
                                price_data: {
                                    currency: 'usd',
                                    product_data: {
                                        name: paymentData.bid_id,
                                    },
                                    unit_amount: paymentData.bid_amount * 100,
                                },
                                quantity: 1
                            },
                        ],
                        mode: 'payment',
                        success_url: `${web_url}/success/{CHECKOUT_SESSION_ID}&${userDetail}`,
                        cancel_url: `${web_url}/cancel.html`,
                    });
                    var apiMessage = apiMessages('', 'loginSuccess');
                    return response.status(200).json(
                        Apiresponse(200, apiMessage, session.url)
                    );
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
adminUserController.getProfile = async function (request, response, next) {
    try {
        var theToken = request.headers.authorization.split(' ')[1]
        var getAuthUser = await authService.getAuthUser(theToken)
        if (getAuthUser.length == 0) {
            var apiMessage = apiMessages('user', 'notFound')
            return response.status(200).json(
                Errorresponse(101, apiMessage)
            )
        } else {
            var getProfile = await userService.getProfile(getAuthUser[0])
            if (getProfile.length == 0) {
                var Verror = apiMessages('user', 'notFound')
                return response.status(200).json(
                    Errorresponse(101, Verror)
                )
            } else {
                getProfile[0].token = theToken
                return response.status(200).json(
                    Apiresponse(200, 'success', getProfile[0])
                )
            }
        }
    } catch (error) {
        return response.status(200).json(
            Errorresponse(101, error)
        )
    }
}
adminUserController.editUserProfile = async function (request, response, next) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var theToken = request.headers.authorization.split(' ')[1]
            var getAuthUser = await authService.getAuthUser(theToken)
            if (getAuthUser.length == 0) {
                var apiMessage = apiMessages('user', 'notFound')
                return response.status(200).json(
                    Errorresponse(101, apiMessage)
                )
            } else {

                var getuserId = await userService.getUserDetail(getAuthUser[0])
                if (getuserId.length == 0) {
                    var Verror = apiMessages('user', 'notFound')
                    return response.status(200).json(
                        Errorresponse(101, Verror)
                    )
                } else {
                    var updateProfile = await authService.updateProfile(request.body, getuserId[0])
                    if (updateProfile.affectedRow == 0) {
                        var Verror = apiMessages('', 'error')
                        return response.status(200).json(
                            Errorresponse(101, Verror)
                        )
                    } else {

                        var getUserDetail = await userService.getUserDetail(getAuthUser[0])

                        var userdata = {
                            'id': getUserDetail[0].id,
                            'fullname': getUserDetail[0].fullname,
                            'email': getUserDetail[0].email,
                            'country': getUserDetail[0].country,
                            "city": getUserDetail[0].city,
                            "address": getUserDetail[0].address,
                            'role': getUserDetail[0].role_id,
                            "bids_remain": getUserDetail[0].bids_remain,
                            "device_token": request.body.device_token ?? "",
                            "device_type": request.body.device_type ?? "",
                            "device_name": request.body.device_name ?? "",
                            "unique_id": request.body.unique_id ?? "",
                            "version": request.body.version ?? "",
                            "token": theToken
                        }
                        if (request.body.device_token != '' && request.body.device_token != undefined && request.body.device_type != '') {
                            var checkDeviceToken = await authService.checkDeviceToken(request.body, userdata.id);
                            console.log('checkDeviceToken', checkDeviceToken);
                            if (checkDeviceToken.length == 0) {
                                var storeDeviceToken = await authService.storeDeviceToken(request.body, userdata.id);
                                if (storeDeviceToken) {
                                    apiMessage = apiMessages('Profile', 'updateSuccess');
                                    return response.status(200).json(
                                        Apiresponse(200, apiMessage, userdata)
                                    );
                                } else {
                                    return response.status(200).json(
                                        Errorresponse(101, "failed to store device token")
                                    );
                                }
                            }
                            var apiMessage = apiMessages('Profile', 'updateSuccess')
                            return response.status(200).json(
                                Apiresponse(200, apiMessage, userdata)
                            )

                        } else {
                            var apiMessage = apiMessages('Profile', 'updateSuccess')
                            return response.status(200).json(
                                Apiresponse(200, apiMessage, userdata)
                            )
                        }
                    }
                }

            }
        }

    } catch (error) {
        console.log(error);
        return response.status(200).json(
            Errorresponse(101, error)
        )
    }
}
adminUserController.getTotalBids = async function (request, response, next) {
    try {
        var theToken = request.headers.authorization.split(' ')[1]
        var getTotalBids = await userService.getTotalBids(theToken)
        if (getTotalBids.length == 0) {
            var Verror = apiMessages('', 'error')
            return response.status(200).json(
                Errorresponse(101, Verror)
            )
        } else {
            var apiMessage = apiMessages('', 'loginSuccess');
            return response.status(200).json(
                Apiresponse(200, apiMessage, getTotalBids[0])
            );
        }

    } catch (error) {
        return response.status(200).json(
            Errorresponse(101, error)
        )
    }
}
adminUserController.getUserDetail = async function (request, response, next) {
    try {
        var theToken = request.headers.authorization.split(' ')[1]
        var getAuthUser = await authService.getAuthUser(theToken)
        if (getAuthUser.length == 0 && getAuthUser[0].role_id == 3) {
            var apiMessage = apiMessages('user', 'notFound')
            return response.status(200).json(
                Errorresponse(101, apiMessage)
            )
        } else {
            var getProfile = await userService.getProfile(request.body)
            if (getProfile.length == 0) {
                var Verror = apiMessages('user', 'notFound')
                return response.status(200).json(
                    Errorresponse(101, Verror)
                )
            } else {
                return response.status(200).json(
                    Apiresponse(200, 'success', getProfile[0])
                )
            }
        }
    } catch (error) {
        return response.status(200).json(
            Errorresponse(101, error)
        )
    }
}
adminUserController.getDashboardData = async function (request, response, next) {
    try {
        var theToken = request.headers.authorization.split(' ')[1]
        var getAuthUser = await authService.getAuthUser(theToken)
        if (getAuthUser.length == 0 && getAuthUser[0].role_id == 3) {
            var apiMessage = apiMessages('user', 'notFound')
            return response.status(200).json(
                Errorresponse(101, apiMessage)
            )
        } else {
            var getDashboardData = await userService.getDashboardData(getAuthUser[0])
            if (getDashboardData.length == 0) {
                var Verror = apiMessages('user', 'notFound')
                return response.status(200).json(
                    Errorresponse(101, Verror)
                )
            } else {
                return response.status(200).json(
                    Apiresponse(200, 'success', getDashboardData[0])
                )
            }
        }
    } catch (error) {
        return response.status(200).json(
            Errorresponse(101, error)
        )
    }
}
module.exports = adminUserController