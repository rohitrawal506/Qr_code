const userService = require("../../../services/UserService");
const productService = require("../../../services/ProductService");
const authService = require("../../../services/AuthService");
const promoService = require("../../../services/promocodeServices.js");
var { Errorresponse, Apiresponse } = require('../../../../helper/response')
var { apiMessages } = require('../../../../helper/message');
const { web_url } = require('../../../../constant/config');

// var SECRET_KEY = 'sk_test_51Mz1z2BcYBKX5Sv1HYzB94Hx5XfgVAdYPolHJNtCorCeOU6x3TdjRffghGUKWIHCUu7B2yjN4ugwX813rlOI9bW100AustBzHV'
var SECRET_KEY = process.env.STRIPE_SECRET_KEY
const stripe = require('stripe')(SECRET_KEY);
const paymentController = {}

paymentController.processBidPayment = async function (request, response, next) {
    try {
        const { customer_id, bid_id, promocode, bidder_id, purchased_bid, user_id, session_id } = request.body;
        const session = await stripe.checkout.sessions.retrieve(session_id);
        console.log(session);
        var paymentData = {
            bidder_id: bidder_id,
            user_id: user_id,
            confirm_payment_intent: session.payment_intent,
            purchased_bid: purchased_bid,
            bonus: 0,
            promocode: promocode,
            promocode_type: 'bid_purchase',
            bid_amount: 0

        }
        var checkPendingReq = await userService.checkPendingReq(paymentData);
        if (checkPendingReq.length == 0) {
            return response.status(200).json(
                Errorresponse(101, 'Payment already Done')
            )
        } else {
            if (promocode != '' && promocode != undefined) {
                var checkStatus = await promoService.checkPromocode(promocode)

                if (checkStatus.length == 0) {
                    return response.status(200).json(
                        Errorresponse(101, 'Invalid Promocode')
                    )
                } else {
                    paymentData.bonus = checkStatus[0].bonus
                }
            }
            var bidData = await userService.getBidData(bid_id)
            if (bidData.length == 0) {
                return response.status(200).json(
                    Errorresponse(101, 'Invalid bid id')
                )
            } else {
                if (paymentData.bonus != 0) {
                    paymentData.bid_amount = bidData[0].bid_amount - (bidData[0].bid_amount / 100) * paymentData.bonus
                } else {
                    paymentData.bid_amount = bidData[0].bid_amount
                }
                paymentData.purchased_bid = bidData[0].bids
                var getUserData = await authService.getUserByid('', customer_id)
                if (getUserData.length == 0) {
                    var apiMessage = apiMessages('user', 'notFound')
                    return response.status(200).json(
                        Errorresponse(101, apiMessage)
                    )
                } else {
                    paymentData.user_id = getUserData[0].id
                    var response_url = {}
                    if (paymentData.confirm_payment_intent == '') {
                        var Verror = apiMessages('', 'error')
                        return response.status(200).json(
                            Errorresponse(101, Verror)
                        )
                    } else {
                        var purchaseBid = await userService.updatePendingReq(paymentData)
                        if (purchaseBid.affectedRows == 0) {
                            var Verror = apiMessages('', 'error')
                            return response.status(200).json(
                                Errorresponse(101, Verror)
                            )
                        } else {
                            if (paymentData.bonus != '') {
                                var insertPromocodeUSer = await promoService.insertPromocodeUser(paymentData)
                                if (insertPromocodeUSer.affectedRows == 0) {
                                    var Verror = apiMessages(' ', 'error')
                                    return response.status(200).json(
                                        Errorresponse(101, Verror)
                                    )
                                }
                            }
                            var updateUserBid = await userService.updateUserBid(paymentData.user_id)
                            if (updateUserBid.affectedRows == 0) {
                                var Verror = apiMessages('', 'error')
                                return response.status(200).json(
                                    Errorresponse(101, Verror)
                                )
                            } else {
                                if (promocode != '' && promocode != undefined) {
                                    var updatePromocodeUsed = await promoService.updateTotalCode(paymentData.promocode)
                                }
                                var apiMessage = apiMessages('', 'loginSuccess');
                                return response.status(200).json(
                                    Apiresponse(200, apiMessage)
                                );
                            }
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.log('error', error);
    }
};
paymentController.advancePayment = async function (request, response,) {
    try {
        const { CardNumber, ExpMonth, ExpYear, Cvv, customer_id, user_id, product_id, bid_id, pre_deposite_amount } = request.body

        var paymentData = {
            bid_id: bid_id,
            user_id: user_id,
            confirm_payment_intent: '',
            product_id: product_id,
            bonus: '',
            customer_id: customer_id,
            pre_deposite_amount: pre_deposite_amount,
        }
        var checkPendingReq = await productService.checkPendingReq(paymentData);
        if (checkPendingReq.length == 0) {
            return response.status(200).json(
                Errorresponse(101, 'Payment already Done')
            )
        } else {
            var getBidder = await productService.getBidder(bid_id)
            if (getBidder.length == 0) {
                return response.status(200).json(
                    Errorresponse(101, 'Invalid bidder')
                )
            } else {
                var paymentSuccess = await stripe.tokens.create({
                    card: {
                        number: CardNumber,
                        exp_month: ExpMonth,
                        exp_year: ExpYear,
                        cvc: Cvv,
                    },
                }).then((cardToken) => {
                    return stripe.paymentIntents.create({
                        amount: paymentData.pre_deposite_amount * 100, // amount in cents
                        currency: 'usd',
                        payment_method_types: ['card'],
                        customer: paymentData.customer_id,
                        payment_method_data: {
                            type: 'card',
                            card: {
                                token: cardToken.id
                            }
                        },
                        description: 'Pre Payment for place bid',
                    })
                }).then((paymentIntent) => {
                    return stripe.paymentIntents.confirm(paymentIntent.id);
                }).then((confirmedPaymentIntent) => {
                    // PaymentIntent confirmed successfully
                    paymentData.confirm_payment_intent = confirmedPaymentIntent.id
                    return confirmedPaymentIntent
                    // return response.status(200).json(
                    //     Apiresponse(200, 'getting', confirmedPaymentIntent)
                    // );
                }).catch((error) => {
                    // PaymentIntent confirmation failed
                    console.log('Payment Failed');
                })
                if (paymentSuccess == '' && paymentSuccess == undefined) {
                    var Verror = apiMessages('', 'error')
                    return response.status(200).json(
                        Errorresponse(101, Verror)
                    )
                } else {
                    if (paymentData.confirm_payment_intent == '') {
                        var Verror = apiMessages('', 'error')
                        return response.status(200).json(
                            Errorresponse(101, Verror)
                        )
                    } else {
                        var purchaseBid = await productService.updatePendingReq(paymentData)
                        if (purchaseBid.affectedRows == 0) {
                            var Verror = apiMessages('', 'error')
                            return response.status(200).json(
                                Errorresponse(101, Verror)
                            )
                        } else {
                            var updateBid = await productService.updateBid(paymentData.user_id)
                            if (updateBid.affectedRows == 0) {
                                var apiMessage = apiMessages('', 'error')
                                return response.status(200).json(
                                    Errorresponse(101, apiMessage)
                                )
                            } else {
                                var apiMessage = apiMessages('', 'loginSuccess');
                                return response.status(200).json(
                                    Apiresponse(200, apiMessage)
                                );
                            }
                            // var updateBid = await productService.updateBid(paymentData.user_id)
                            // if (updateBid.affectedRows == 0) {
                            //     var Verror = apiMessages('', 'error')
                            //     return response.status(200).json(
                            //         Errorresponse(101, Verror)
                            //     )
                            // } else {
                            // var updateUserBid = await userService.updateUserBid(paymentData.user_id)
                            // if (updateUserBid.affectedRows == 0) {
                            //     var Verror = apiMessages('', 'error')
                            //     return response.status(200).json(
                            //         Errorresponse(101, Verror)
                            //     )
                            // } else {

                            // }
                            // }

                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
paymentController.PurchaseProduct = async function (request, response,) {
    try {
        const { CardNumber, ExpMonth, ExpYear, Cvv, customer_id, user_id, bid_id, amount_pending } = request.body
        var paymentData = {
            bid_id: bid_id,
            user_id: user_id,
            confirm_payment_intent: '',
            customer_id: customer_id,
            amount: amount_pending
        }
        console.log('amount_pending', amount_pending);
        var checkPendingReq = await productService.checkPendingReqForProduct(paymentData);
        if (checkPendingReq.length == 0) {
            return response.status(200).json(
                Errorresponse(101, 'Payment already Done')
            )
        } else {
            var getBidder = await productService.getBidder(bid_id)
            if (getBidder.length == 0) {
                return response.status(200).json(
                    Errorresponse(101, 'Invalid bidder')
                )
            } else {
                var paymentSuccess = await stripe.tokens.create({
                    card: {
                        number: CardNumber,
                        exp_month: ExpMonth,
                        exp_year: ExpYear,
                        cvc: Cvv,
                    },
                }).then((cardToken) => {
                    return stripe.paymentIntents.create({
                        amount: paymentData.amount.toFixed(2) * 100, // amount in cents
                        currency: 'usd',
                        payment_method_types: ['card'],
                        customer: paymentData.customer_id,
                        payment_method_data: {
                            type: 'card',
                            card: {
                                token: cardToken.id
                            }
                        },
                        description: 'Pre Payment for Puchase Product',
                    })
                }).then((paymentIntent) => {
                    return stripe.paymentIntents.confirm(paymentIntent.id);
                }).then((confirmedPaymentIntent) => {
                    // PaymentIntent confirmed successfully
                    paymentData.confirm_payment_intent = confirmedPaymentIntent.id
                    return confirmedPaymentIntent
                    // return response.status(200).json(
                    //     Apiresponse(200, 'getting', confirmedPaymentIntent)
                    // );
                }).catch((error) => {
                    // PaymentIntent confirmation failed
                    console.log(error);
                    console.log('Payment Failed');
                })
                if (paymentSuccess == '' && paymentSuccess == undefined) {
                    var Verror = apiMessages('', 'error')
                    return response.status(200).json(
                        Errorresponse(101, Verror)
                    )
                } else {
                    if (paymentData.confirm_payment_intent == '') {
                        var Verror = apiMessages('', 'error')
                        return response.status(200).json(
                            Errorresponse(101, Verror)
                        )
                    } else {
                        var updatePaymentStatus = await productService.updatePendingReqForProduct(paymentData)
                        if (updatePaymentStatus.affectedRows == 0) {
                            var Verror = apiMessages('', 'error')
                            return response.status(200).json(
                                Errorresponse(101, Verror)
                            )
                        } else {
                            var apiMessage = apiMessages('', 'loginSuccess');
                            return response.status(200).json(
                                Apiresponse(200, apiMessage)
                            );
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
paymentController.refundAmount = async (product_id, bid_id) => {
    try {
        var getBidders = await productService.getProductBidders(product_id, bid_id)
        if (getBidders.length > 0) {
            getBidders.forEach(async (element) => {
                var paymentIntentId = element.pre_deposit_transection_id;
                var refundAmount = element.amount_paid
                await stripe.refunds.create({
                    payment_intent: paymentIntentId,
                    amount: refundAmount * 100,
                }, async function (err, refund) {
                    if (err) {
                        console.error(err);
                        return response.status(200).json(
                            Errorresponse(101, 'refund Failed')
                        )
                        // Handle error
                    } else {
                        var updateUserRefunds = await productService.updateUserRefunds(element, refund)
                        if (updateUserRefunds.affectedRows == 0) {
                            return response.status(200).json(
                                Errorresponse(101, 'refund Failed')
                            )
                        }
                        // Process refund
                    }
                })
            });
        }
        // console.log(getBidders);
    }
    catch (error) {
    }
}
module.exports = paymentController  