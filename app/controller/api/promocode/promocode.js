var { validationResult } = require('express-validator')
const promoService = require("../../../services/promocodeServices");
var authService = require('../../../services/AuthService');
var { apiMessages } = require('../../../../helper/message');
var { Errorresponse, Apiresponse } = require('../../../../helper/response');
const { response, request } = require('express');
const promoController = {}


promoController.addPromocode = async function (request, response) {
    try {
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
                if (getAuthUser[0].role_id == 1 || getAuthUser[0].role_id == 2) {
                    var existPromocode = await promoService.existPromocode(request.body)
                    if (existPromocode.length > 0) {
                        return response.status(200).json(
                            Errorresponse(101, 'Promocode Already Exist')
                        )
                    } else {
                        var insertPromoCode = await promoService.insertPromoCode(request.body)
                        if (insertPromoCode.affectedRows == 1) {
                            return response.status(200).json(
                                Apiresponse(200, 'Promocode Added Successfully', insertPromoCode)
                            )
                        } else {
                            return response.status(200).json(
                                Errorresponse(101, 'Failed')
                            )
                        }
                    }
                } else {
                    return response.status(200).json(
                        Errorresponse(101, 'access  denied')
                    )
                }
            }
        }

    } catch (error) {
        console.log(error);
    }
}
promoController.checkPromocode = async function (request, response) {
    try {
        var code = request.body.promocode;
        var type = 'bid_purchase'
        if (code != '' || code != undefined) {
            var checkStatus = await promoService.checkPromocode(code, type)
            if (checkStatus.length <= 0) {
                return response.status(200).json(
                    Errorresponse(101, 'Invalid Promocode')
                )
            } else {
                return response.status(200).json(
                    Apiresponse(200, 'Success', checkStatus[0])
                )
            }
        } else {
            return response.status(200).json(
                Errorresponse(101, 'Promocode Required')
            )
        }

    } catch (error) {
        console.log(error)
    }
}
promoController.insertPromocodeUSer = async function (userData) {
    try {
        console.log(userData);
        if (userData.promocode_type == 'signup') {
            var insertPromocodeUSer = await promoService.insertPromocodeUser(userData)
            return insertPromocodeUSer
        } else {
            if (userData.usage_per_user == 1) {
                var checkUsedCode = await promoService.checkUsedCode(userData)
                if (checkUsedCode.length > 0) {
                    return message = 'used';
                } else {

                    return message = 'valid';
                }
            } else {

                return message = 'valid';
            }
        }
    } catch (error) {
        console.log(error);
    }
}
promoController.getPromocodeList = async function (request, response) {
    try {
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
                if (getAuthUser[0].role_id == 1 || getAuthUser[0].role_id == 2) {
                    var promocodeList = await promoService.getPromocodeList(request.body)
                    if (promocodeList.length == 0) {
                        return response.status(200).json(
                            Errorresponse(101, 'No Promocode Found')
                        )
                    } else {
                        return response.status(200).json(
                            Apiresponse(200, 'Promocodes Found Successfully', promocodeList)
                        )
                    }
                } else {
                    return response.status(200).json(
                        Errorresponse(101, 'access  denied')
                    )
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
promoController.getPromocode = async function (request, response) {
    try {
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

                if (getAuthUser[0].role_id == 1 || getAuthUser[0].role_id == 2) {
                    var promocodeData = await promoService.getPromocode(request.body)
                    if (promocodeData.length == 0) {
                        return response.status(200).json(
                            Errorresponse(101, 'No Promocode Found')
                        )
                    } else {
                        var promocodeResult = {};
                        if (promocodeData[0].user == 'specific') {
                            var users = []
                            var getSpecificUser = await promoService.getSpecificUser(promocodeData[0].code)
                            if (getSpecificUser.length > 0) {
                                getSpecificUser.forEach(element => {
                                    users.push(element)
                                });
                            }
                        }
                        promocodeResult.promocode = promocodeData[0]
                        promocodeResult.specific_users = users
                        return response.status(200).json(
                            Apiresponse(200, 'Promocodes Found Successfully', promocodeResult)
                        )
                    }
                } else {
                    return response.status(200).json(
                        Errorresponse(101, 'access  denied')
                    )
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
promoController.updatePromocode = async function (request, response) {
    try {
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
                if (getAuthUser[0].role_id == 1 || getAuthUser[0].role_id == 2) {
                    var insertPromoCode = await promoService.updatePromoCode(request.body)
                    if (insertPromoCode.affectedRows == 1) {
                        return response.status(200).json(
                            Apiresponse(200, 'Promocode Update Successfully', insertPromoCode)
                        )
                    } else {
                        return response.status(200).json(
                            Errorresponse(101, 'Failed')
                        )
                    }

                } else {
                    return response.status(200).json(
                        Errorresponse(101, 'access  denied')
                    )
                }
            }
        }

    } catch (error) {
        console.log(error);
    }
}
promoController.deletePromocode = async function (request, response, next) {
    try {
        var getAuthUser = await authService.getAuthUser(request.token)
        if (getAuthUser.length == 0) {
            var apiMessage = apiMessages('user', 'notFound')
            return response.status(200).json(
                Errorresponse(101, apiMessage)
            )
        } else {
            if (getAuthUser[0].role_id == 1 || getAuthUser[0].role_id == 2) {
                var deleteUser = await promoService.deletePromocode(request.body)
                if (deleteUser.affectedRow == 0) {
                    var Verror = apiMessages('', 'notFound')
                    return response.status(200).json(
                        Errorresponse(101, Verror)
                    )
                } else {
                    var promocodeList = await promoService.getPromocodeList(request.body)
                    if (promocodeList.length == 0) {
                        return response.status(200).json(
                            Errorresponse(101, 'Not Found')
                        )
                    } else {
                        return response.status(200).json(
                            Apiresponse(200, 'Promocodes Found Successfully', promocodeList)
                        )
                    }
                }
            } else {
                return response.status(200).json(
                    Errorresponse(101, 'access  denied')
                )
            }
        }

    } catch (error) {
        return response.status(200).json(
            Errorresponse(101, error)
        )
    }
}
promoController.promocodeUsed = async function (request, response, next) {
    try {
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
                if (getAuthUser[0].role_id == 1 || getAuthUser[0].role_id == 2) {
                    var promocodeList = await promoService.promocodeUsed(request.body)
                    console.log(promocodeList);
                    if (promocodeList.length == 0) {
                        return response.status(200).json(
                            Errorresponse(101, 'No Promocode Found')
                        )
                    } else {
                        return response.status(200).json(
                            Apiresponse(200, 'Promocodes Found Successfully', promocodeList)
                        )
                    }
                } else {
                    return response.status(200).json(
                        Errorresponse(101, 'access  denied')
                    )
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
module.exports = promoController