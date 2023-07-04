const express = require("express");
const bcrypt = require("bcrypt");
var jwt = require('jsonwebtoken');
var promoController = require('../promocode/promocode')
const authService = require("../../../services/AuthService");
const promoService = require("../../../services/promocodeServices");
var { validationResult, Result } = require('express-validator')
var { Errorresponse, Apiresponse } = require('../../../../helper/response')
var { apiMessages } = require('../../../../helper/message')
var { transporter, handlebarOptions } = require('../../../../helper/mail')
var { EncodeBase64, DecodeBase64 } = require('../../../../helper/helper');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const hbs = require('nodemailer-express-handlebars');
const crypto = require('crypto');
require('dotenv').config();
// var SECRET_KEY = 'sk_test_51Mz1z2BcYBKX5Sv1HYzB94Hx5XfgVAdYPolHJNtCorCeOU6x3TdjRffghGUKWIHCUu7B2yjN4ugwX813rlOI9bW100AustBzHV'
var SECRET_KEY = process.env.STRIPE_SECRET_KEY
const stripe = require('stripe')(SECRET_KEY);
const authController = {}
authController.Register = async function (request, response, next) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var userData = await authService.getUser(request.body);
            if (userData.length > 0) {
                var apiMessage = apiMessages('User', 'isExists');
                return response.status(200).json(
                    Errorresponse(101, apiMessage)
                );
            } else {
                var promoCode = request.body.promocode;
                request.body.bids = 0;
                if (promoCode != '' && promoCode != undefined) {
                    var checkStatus = await promoService.checkPromocode(promoCode)
                    console.log(checkStatus);
                    if (checkStatus[0]?.promocode_type == 'bid_purchase' || checkStatus.length == 0) {
                        return response.status(200).json(
                            Errorresponse(101, 'Invalid Promocode')
                        )
                    }
                    else {
                        request.body.bids = checkStatus[0].bonus;
                    }
                }
                var customer_id = await stripe.customers.create({
                    email: request.body.email,
                });
                request.body.customer_id = customer_id
                var user_admins = await authService.registerAdmin(request.body)
                if (user_admins.insertId != 0) {
                    if (request.body.bids != 0) {
                        var userData = {
                            bonus: request.body.bids,
                            promocode: promoCode,
                            user_id: user_admins.insertId,
                            promocode_type: 'signup'
                        }
                        var insertPromocodeUSer = await promoController.insertPromocodeUSer(userData);
                        if (insertPromocodeUSer.insertId != 0) {
                            var updateTotalCode = await promoService.updateTotalCode(promoCode)
                        }
                    }
                    var userdata = {
                        'id': user_admins.insertId,
                        "user_name": request.body.username,
                        "country": request.body.country,
                        'email': request.body.email,
                        'role_id': request.body.role_id ?? 3,
                    }
                    transporter.use('compile', hbs(handlebarOptions))
                    var link = process.env.MAIL_URL + EncodeBase64(user_admins.insertId);
                    console.log(link);
                    var mailOptions = {
                        from: process.env.MAIL_USERNAME,
                        to: request.body.email,
                        subject: 'Verify your email address',
                        template: 'emailverify',
                        context: {
                            link: link
                        }
                    }
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log("errrrrrrr", error);
                        }
                        console.log('Message sent: ' + info.response);
                    });
                    apiMessage = apiMessages('Registred', 'loginSuccess');
                    return response.status(200).json(
                        Apiresponse(200, apiMessage, userdata)
                    );
                } else {
                    var apiMessage = apiMessages('', 'error')
                    return response.status(200).json(
                        Errorresponse(101, apiMessage)
                    )
                }
            }
        }
    } catch (error) {
        console.log('error', error);
    }
};
authController.login = async function (request, response) {
    try {
        var privateKey = 'RS654'
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {

            var userData = await authService.getUser(request.body);
            console.log(userData);
            if (userData.length == 0) {
                var apiMessage = apiMessages('User', 'notFound');
                return response.status(200).json(
                    Errorresponse(101, apiMessage)
                );
            } else {
                if (userData[0].status == 'block') {
                    return response.status(200).json(
                        Errorresponse(101, "this account is blocked")
                    );
                } else {
                    const checkPassword = await bcrypt.compareSync(request.body.password, userData[0].password);
                    if (checkPassword == false) {
                        apiMessage = apiMessages('', 'credentailError');
                        return response.status(200).json(
                            Errorresponse(101, apiMessage)
                        );
                    } else {
                        var token = jwt.sign({ id: userData[0].id }, privateKey, { expiresIn: '100y' });
                        var authToken = {
                            userId: userData[0].id,
                            auth_token: token,
                            role_id: userData[0].role_id,
                        }
                        var storeToken = await authService.storeAuthToken(authToken);
                        var userdata = {
                            'id': userData[0].id,
                            'email': userData[0].email,
                            'role': userData[0].role_id,
                            'country': userData[0].country,
                            "city": userData[0].city,
                            "address": userData[0].address,
                            "bids_remain": userData[0].bids_remain,
                            "device_token": request.body.device_token,
                            "device_name": request.body.device_name,
                            "unique_id": request.body.unique_id,
                            "version": request.body.version,
                            "token": token
                        }
                        if (request.body.device_token != '' && request.body.device_token != undefined) {
                            var storeDeviceToken = await authService.storeDeviceToken(request.body, userData[0].id);
                            if (storeDeviceToken) {
                                apiMessage = apiMessages('Login', 'loginSuccess');
                                return response.status(200).json(
                                    Apiresponse(200, apiMessage, userdata)
                                );
                            } else {
                                return response.status(200).json(
                                    Errorresponse(200, "failed to store device token")
                                );
                            }
                        } else {
                            apiMessage = apiMessages('Login', 'loginSuccess');
                            return response.status(200).json(
                                Apiresponse(200, apiMessage, userdata)
                            );
                        }
                    }
                }
            }
        }
    } catch (error) {
        return response.status(200).json(
            Errorresponse(101, error)
        );
    }

};
authController.logout = async function (request, response) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var deleteDeviceToken = await authService.deleteDeviceToken(request.body);
            var theToken = request.headers.authorization.split(' ')[1]
            if (deleteDeviceToken.affectedRows != 0) {
                var deleteAuthToken = await authService.deleteAuthToken(theToken);
                if (deleteAuthToken) {
                    var apiMessage = apiMessages('', 'logout');
                    return response.status(200).json(
                        Apiresponse(200, apiMessage)
                    );
                } else {
                    return response.status(200).json(
                        Errorresponse(101, "failed to delete auth token")
                    );
                }
            } else {
                var deleteAuthToken = await authService.deleteAuthToken(theToken);
                if (deleteAuthToken.affectedRows != 0) {
                    var apiMessage = apiMessages('', 'logout');
                    return response.status(200).json(
                        Apiresponse(200, apiMessage)
                    );
                } else {
                    return response.status(200).json(
                        Errorresponse(101, "failed to delete auth token")
                    );
                }
            }
        }

    } catch (error) {
        console.log(error)
    }
}
authController.forgotPassword = async function (request, response) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        } else {
            var userData = await authService.getUser(request.body);
            if (userData.length > 0) {
                const resetToken = crypto.randomBytes(40).toString('hex');
                const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
                const createdAt = new Date(Date.now());
                const expiredAt = resetTokenExpires;
                var existUser = await authService.getExistUser(request.body.email);
                if (existUser.length > 0) {
                    var link = process.env.ADMIN_URl + existUser[0].id + '/' + resetToken;
                    var updateResetToken = await authService.updateResetToken(request.body.email, resetToken, userData[0].role_id, createdAt, expiredAt);
                    if (updateResetToken) {
                        transporter.use('compile', hbs(handlebarOptions))
                        var mailOptions = {
                            from: "support@lxbids.com",
                            to: request.body.email,
                            subject: 'Forgot Password!',
                            template: 'email',
                            context: { link: link }
                        }
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                return console.log("errrrrrrr", error);
                            }
                            console.log('Message sent: ' + info.response);
                            var data = {
                                email: request.body.email,
                                token: resetToken,
                                link: link
                            }
                            apiMessage = apiMessages('', 'mail');
                            return response.status(200).json(
                                Apiresponse(200, apiMessage, data)
                            );
                        });
                    } else {
                        var apiMessage = apiMessages('User', 'notFound');
                        return response.status(200).json(
                            Errorresponse(101, apiMessage)
                        );
                    }
                } else {
                    var insertResetToken = await authService.insertResetToken(request.body.email, resetToken, userData[0].role_id, createdAt, expiredAt);
                    if (insertResetToken) {
                        var link = process.env.ADMIN_URl + insertResetToken.insertId + '/' + resetToken;
                        transporter.use('compile', hbs(handlebarOptions))
                        var mailOptions = {
                            from: 'support@lxbids.com',
                            to: request.body.email,
                            subject: 'Forgot Password!',
                            template: 'email',
                            context: { link: link }
                        }
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                return console.log("errrrrrrr", error);
                            }
                            console.log('Message sent: ' + info.response);
                            var data = {
                                email: request.body.email,
                                token: resetToken,
                                link: link
                            }
                            apiMessage = apiMessages('', 'mail');
                            return response.status(200).json(
                                Apiresponse(200, apiMessage, data)
                            );
                        });
                    } else {
                        var apiMessage = apiMessages('User', 'notFound');
                        return response.status(200).json(
                            Errorresponse(101, apiMessage)
                        );
                    }

                }
            } else {
                var apiMessage = apiMessages('User', 'notFound');
                return response.status(200).json(
                    Errorresponse(101, apiMessage)
                );
            }
        }
    } catch (error) {
        console.log('error', error);
    }
};
authController.resetPassword = async function (request, response, next) {
    try {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0];
            return response.status(200).json(
                Errorresponse(101, Verror)
            );
        }
        var getExistUser = await authService.getExistUser('', request.body.access_token);
        if (getExistUser.length > 0) {
            console.log(11111);
            var vaildToken = await authService.validateResetToken(getExistUser[0].email, getExistUser[0].token_value, getExistUser[0].role_id);
            if (vaildToken.length == 0) {
                var apiMessage = apiMessages('', 'tokenExpried');
                return response.status(200).json(
                    Errorresponse(101, apiMessage, {})
                );
            } else {
                const hashedPassword = await bcrypt.hash(request.body.password, 10);
                if (hashedPassword != '' && hashedPassword != undefined) {
                    console.log(22222);
                    await authService.updatePassword(hashedPassword, vaildToken[0].email, vaildToken[0].role_id);
                    await authService.updateResetTokenUsed(getExistUser[0].email, getExistUser[0].token_value);
                    if (vaildToken.length == 0) {
                        var apiMessage = apiMessages('', 'tokenExpried');
                        return response.status(200).json(
                            Errorresponse(101, apiMessage, {})
                        );
                    } else {
                        apiMessage = apiMessages('Password', 'updateSuccess');
                        return response.status(200).json(
                            Apiresponse(200, apiMessage)
                        );
                    }
                }
            }
        } else {

            // apiMessage = apiMessages('', '');
            return response.status(200).json(
                Errorresponse(101, 'Invalied Token Provided', {})
            );
        }
    } catch (error) {
        return response.status(200).json(
            Errorresponse(101, error)
        );
    }
}
authController.changeUserPassword = async function (request, response, next) {
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
            console.log('getAuthUser', getAuthUser);
            if (getAuthUser.length == 0) {
                var apiMessage = apiMessages('user', 'notFound')
                return response.status(200).json(
                    Errorresponse(101, apiMessage)
                )
            } else {
                var getUserByid = await authService.getUserByid(getAuthUser[0])
                if (getUserByid.length == 0) {
                    var apiMessage = apiMessages('user', 'notFound')
                    return response.status(200).json(
                        Errorresponse(101, apiMessage)
                    );
                } else {
                    const checkPassword = await bcrypt.compareSync(`${request.body.old_password}`, `${getUserByid[0].password}`)
                    if (checkPassword == false) {
                        return response.status(200).json(
                            Errorresponse(101, 'Old Password is incorrect')
                        );
                    } else {
                        const hashedPassword = await bcrypt.hash(request.body.new_password, 10);
                        if (hashedPassword != '' && hashedPassword != undefined) {
                            var changePassword = await authService.changePassword(hashedPassword, getAuthUser[0]);
                            if (changePassword.affectedRows == 0) {
                                return response.status(200).json(
                                    Errorresponse(101, "Password not changed")
                                );
                            } else {
                                if (request.body.logout_all == 'true') {
                                    var deleteAlluser = await authService.deleteAlluser(getAuthUser[0].user_id, theToken, request)
                                    apiMessage = apiMessages('Password', 'updateSuccess');
                                    return response.status(200).json(
                                        Apiresponse(200, apiMessage)
                                    );
                                }
                                var apiMessage = apiMessages('Password', 'updateSuccess')
                                response.status(200).json(
                                    Apiresponse(200, apiMessage)
                                )
                            }
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.log(error)
    }
}
authController.deleteAuthUser = async function (request, response, next) {
    try {
        var theToken = request.headers.authorization.split(' ')[1]
        var getAuthUser = await authService.getAuthUser(theToken)
        if (getAuthUser.length == 0) {
            var apiMessage = apiMessages('user', 'notFound')
            return response.status(200).json(
                Errorresponse(101, apiMessage)
            )
        } else {
            var deleteUser = await authService.deleteUser(getAuthUser[0])
            if (deleteUser.affectedRows == 0) {
                return response.status(200).json(
                    Errorresponse(101, "user not deleted")
                );
            } else {
                // var apiMessage = apiMessages('', 'logout');
                return response.status(200).json(
                    Apiresponse(200, 'deleted successfully')
                );
            }
        }
    } catch (error) {
        console.log(error)
    }
}
authController.emailVerification = async function (request, response, next) {
    try {
        var { user_id } = request.body;
        request.body.user_id = DecodeBase64(user_id)
        request.body.role_id = 3;
        if (Number.isNaN(request.body.user_id)) {
            return response.status(200).json(
                Errorresponse(101, "Your Link is invalid")
            );
        }

        // addition feature
        const [first, second] = user_id.split('=');

        if (second.length > 0) {
            return response.status(200).json(
                Errorresponse(101, "Your Link is invalid")
            );
        }
        // addition feature 

        var getUserByid = await authService.getUserByid(request.body)
        console.log(getUserByid);
        if (getUserByid.length == 0) {
            var apiMessage = apiMessages('user', 'notFound')
            return response.status(200).json(
                Errorresponse(101, "Your Link is invalid")
            );
        } else {
            if (getUserByid[0].verified_at != null) {
                return response.status(200).json(
                    Errorresponse(101, 'You Are Allready Verified')
                );
            } else {
                var updateVerify = await authService.updateVerify(request.body)
                if (updateVerify.affectedRows == 0) {
                    return response.status(200).json(
                        Errorresponse(101, 'Email Not Verified')
                    );
                } else {
                    return response.status(200).json(
                        Apiresponse(200, 'Email Verified Successfully')
                    );
                }
                console.log(getUserByid[0]);

            }
        }


    } catch (error) {
        console.log(error)
    }
}
module.exports = authController 