var authService = require('../../../services/AuthService')
var productService = require('../../../services/ProductService')
var { apiMessages, apiMessages } = require('../../../../helper/message')
var { Errorresponse, Apiresponse } = require('../../../../helper/response')
var { transporter, handlebarOptions } = require('../../../../helper/mail')
const hbs = require('nodemailer-express-handlebars');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
var FCM = require('fcm-node');
var serverKey = "AAAACKJ2TVw:APA91bFMqEbyk_gXKuMRp1mTYC_YmI_bzEbbIYIcpETcA3LIDkiNEE2LmHBnkcc5JsbO5R2btmLuEIZUxf_TEigtwcFABsrzcbzZJ8eGZyzyAsl8fzvLwOYVvycxGucipJgoQHmNf6UA"
var fcm = new FCM(serverKey);
const apn = require('apn');
const path = require('path');
var NotificationController = {}
NotificationController.sendNotification = async function (bidData) {
    try {
        var getDiviceTokens = await authService.getUserdeiviceToken(bidData)
        if (getDiviceTokens.length == 0) {
            console.log('deviceToken notFound');
        } else {
            var getBidPayload = await productService.getBidPayload(bidData)
            if (getBidPayload.length == 0) {
                console.log("User Not Found");
            } else {
                getBidPayload[0].currency = "&#x20B9;";
                if (getBidPayload[0].discount_percentage == 0 && getBidPayload[0].amount_paid != 0) {
                    getBidPayload[0].amount_pending = getBidPayload[0].bid_price - getBidPayload[0].amount_paid;
                }
                if (getBidPayload[0].discount_percentage != 0) {
                    var discountAmount = (getBidPayload[0].bid_price / 100 * getBidPayload[0].discount_percentage) + getBidPayload[0].amount_paid;
                    getBidPayload[0].amount_pending = getBidPayload[0].bid_price - discountAmount
                }
            }
            transporter.use('compile', hbs(handlebarOptions))
            var mailOptions = {
                from: 'support@lxbids.com',
                to: getBidPayload[0].email,
                subject: 'Winner of Product',
                template: 'winner',
                context: {
                    user_name: getBidPayload[0].fullname,
                    product_name: getBidPayload[0].product_name,
                    bid_price: getBidPayload[0].bid_price
                }
            }
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log("errrrrrrr", error);
                } else {
                    console.log('Message sent: ' + info.response);
                }
            });
            for (let i = 0; i < getDiviceTokens.length; i++) {
                if (getDiviceTokens[i].device_type == 'A') {
                    var message = {
                        to: getDiviceTokens[i].device_token,
                        notification: {
                            title: 'BID WON  ',
                            body: 'Your bid has been accepted! Congratulations!',
                        },
                        data: {
                            type: 1,
                            data: getBidPayload[0]
                        }
                    };
                    fcm.send(message, function (err, response) {
                        if (err) {
                            console.log("Something has gone wrong!");
                        } else {
                            console.log("Successfully sent in Android");
                        }
                    });
                }
                if (getDiviceTokens[i].device_type == 'I') {
                    const options = {
                        token: {
                            key: path.join(__dirname, `../../../../AuthKey_323VW8WQL4.p8`),
                            keyId: '323VW8WQL4',
                            teamId: 'YDVV34JDD5'
                        },
                        production: false // change to false if you're using the sandbox environment
                    };
                    const apnProvider = new apn.Provider(options);
                    var note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                    note.badge = 1;
                    note.sound = "ping.aiff";
                    note.alert = 'Bid Won';
                    note.body = 'Your bid has been accepted! Congratulations!';
                    note.payload = {
                        type: 1,
                        data: getBidPayload[0]
                    }
                    note.topic = "com.lxbids.user.devlopment";
                    apnProvider.send(note, getDiviceTokens[i].device_token).then((result) => {
                        // see documentation for an explanation of result
                        console.log("ios", result);
                    });
                }

            }
        }


    } catch (error) {
        console.log(error);
    }
}
NotificationController.ApisendNotification = async function (request, response) {
    try {
        let payload = {
            device_token: request.body.device_token,
            device_type: request.body.device_type,
            user_id: request.body.user_id,
            id: request.body.id
        };
        var getBidPayload = await productService.getBidPayload(payload)
        if (getBidPayload.length == 0) {
            console.log("User Not Found");
        } else {
            getBidPayload[0].currency = "&#x20B9;";
            if (getBidPayload[0].discount_percentage == 0 && getBidPayload[0].amount_paid != 0) {
                getBidPayload[0].amount_pending = getBidPayload[0].bid_price - getBidPayload[0].amount_paid;
            }
            if (getBidPayload[0].discount_percentage != 0) {
                var discountAmount = (getBidPayload[0].bid_price / 100 * getBidPayload[0].discount_percentage) + getBidPayload[0].amount_paid;
                getBidPayload[0].amount_pending = getBidPayload[0].bid_price - discountAmount
            }
        }
        console.log('getBidPayload[0].fullname', getBidPayload[0].fullname);
        transporter.use('compile', hbs(handlebarOptions))
        var mailOptions = {
            from: "support@lxbids.com",
            to: getBidPayload[0].email,
            subject: 'Winner of Product',
            template: 'winner',
            context: {
                user_name: getBidPayload[0].fullname,
                product_name: getBidPayload[0].product_name,
                bid_price: getBidPayload[0].bid_price
            }
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log("errrrrrrr", error);
            }
            console.log('Message sent: ' + info.response);
        });
        var getDiviceTokens = await authService.getUserdeiviceToken(payload)
        if (getDiviceTokens.length == 0) {
            console.log('notFound');
            var apiMessage = apiMessages('', 'notFound')
            return response.status(200).json(
                Apiresponse(200, 'sucess', getBidPayload)
            )
        } else {
            console.log(getBidPayload[0]);
            for (let i = 0; i < getDiviceTokens.length; i++) {
                if (getDiviceTokens[i].device_type == 'A') {
                    var message = {
                        to: getDiviceTokens[i].device_token,
                        notification: {
                            title: 'BID WON  ',
                            body: 'Your bid has been accepted! Congratulations!',
                        },
                        data: getBidPayload[0]
                    };
                    fcm.send(message, function (err, response) {
                        if (err) {
                            console.log("Something has gone wrong!");
                        } else {
                            console.log("Successfully sent in Andriod");
                        }
                    });

                }
                if (getDiviceTokens[i].device_type == 'I') {
                    const options = {
                        token: {
                            key: path.join(__dirname, `../../../../AuthKey_323VW8WQL4.p8`),
                            keyId: '323VW8WQL4',
                            teamId: 'YDVV34JDD5'
                        },
                        production: false // change to false if you're using the sandbox environment
                    };
                    const apnProvider = new apn.Provider(options);
                    var note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                    note.badge = 1;
                    note.sound = "ping.aiff";
                    note.alert = 'Bid Won';
                    note.body = 'Your bid has been accepted! Congratulations!';
                    note.payload = getBidPayload[0]
                    // note.payload = {
                    //     'winner': {
                    //         "user_id": 1,
                    //         "user_name": "rohitrawal",
                    //         "address": "shindubhavan",
                    //         "city": "ahmedabad",
                    //         "country": "india"
                    //     }
                    // };//payload;
                    note.topic = "com.lxbids.user.devlopment";
                    apnProvider.send(note, getDiviceTokens[i].device_token).then((result) => {
                        // see documentation for an explanation of result
                        console.log(result);
                    });
                }
                // return response.status(200).json(
                //     Apiresponse(200, 'successfully', getDiviceTokens)
                // );
            }
        }


    } catch (error) {
        console.log(error);
        // var Verror = apiMessages('', 'error')
        // return response.status(200).json(
        //     Errorresponse(101, Verror)
        // )
    }
}
NotificationController.ApisendMail = async function () {
    transporter.use('compile', hbs(handlebarOptions))
    console.log(path.join(__dirname, "../../../../public/group.png"));
    var mailOptions = {
        from: 'support@lxbids.com',
        to: ['rohit.icoderz@gmail.com', 'rohit123@yopmail.com'],
        subject: 'Sending with Testing',
        template: 'winner',
        context: {
            user_name: 'RohitRawal',
            product_name: 'Race bike',
            bid_price: '$25411',
        },
        attachments: [{
            filename: 'group.png',
            path: 'https://admin.lxbids.com/group.png',
            cid: 'group.png' //same cid value as in the html img src
        }]
    }
    transporter.sendMail(mailOptions, function (error, info) {
        console.log('hereee');
        if (error) {
            return console.log("errrrrrrr", error);
        }
        console.log('Message sent: ' + info.response);
    });
    // sgMail.send(msg).then(() => { }, error => {
    //     console.error(error);
    //     if (error.response) {
    //         console.error(error.response.body)
    //     }
    // });
    //ES8

}
NotificationController.addProductNotification = async function (data, product_id) {
    try {
        var getDevicetokenByCountry = await productService.getUserByCountry(data);
        console.log(getDevicetokenByCountry)
        if (getDevicetokenByCountry.length == 0) {
            console.log('deviceToken notFound');
        } else {
            for (let i = 0; i < getDevicetokenByCountry.length; i++) {
                console.log(getDevicetokenByCountry[i].device_type)
                if (getDevicetokenByCountry[i].device_type == 'A') {
                    var message = {
                        to: getDevicetokenByCountry[i].device_token,
                        notification: {
                            title: 'New Product Added',
                            body: 'New Product Added',
                        },
                        data: {
                            type: '2',
                            data: {
                                product_id: product_id
                            },
                        }
                    };
                    fcm.send(message, function (err, response) {
                        if (err) {
                            console.log("Something has gone wrong!");
                        } else {
                            console.log("Successfully sent in Android");
                        }
                    });
                }
                if (getDevicetokenByCountry[i].device_type == 'I') {
                    const options = {
                        token: {
                            key: path.join(__dirname, `../../../../AuthKey_323VW8WQL4.p8`),
                            keyId: '323VW8WQL4',
                            teamId: 'YDVV34JDD5'
                        },
                        production: false // change to false if you're using the sandbox environment
                    };
                    const apnProvider = new apn.Provider(options);
                    var note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                    note.badge = 1;
                    note.sound = "ping.aiff";
                    note.alert = 'New Product Added';
                    note.body = 'New Product Added';
                    note.payload = {
                        type: '2',
                        data: {
                            product_id: product_id
                        },
                    }
                    note.topic = "com.lxbids.user.devlopment";
                    apnProvider.send(note, getDevicetokenByCountry[i].device_token).then((result) => {
                        // see documentation for an explanation of result
                        console.log("ios", result);
                    });
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
module.exports = NotificationController