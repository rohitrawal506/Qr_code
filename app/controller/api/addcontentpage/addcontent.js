// var express = require('express')
var contentService = require('../../../services/contentService')
var authService = require('../../../services/AuthService')
var { apiMessages } = require('../../../../helper/message')
var { Apiresponse, Errorresponse } = require('../../../../helper/response')
var { validationResult } = require('express-validator')
// const e = require('express')
var contentController = {}
contentController.addpage = async function (request, response, next) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0]
            return response.status(200).json(
                Errorresponse(101, Verror)
            )
        } else {
            var existContent = await contentService.existPageContent(request.body.category)
            if (existContent.length = 0) {

                var apiMessage = apiMessages('Content', 'isExists')
                return response.status(200).json(
                    Errorresponse(101, apiMessage)
                )
            } else {
                var addcontent = await contentService.addcontent(request.body)
                if (addcontent) {
                    var apiMessage = apiMessages('Content', 'addSuccess')
                    return response.status(200).json(
                        Apiresponse(200, apiMessage, addcontent)
                    )
                }
            }

        }
    } catch (err) {
        response.json({
            error: err
        })
    }
}
contentController.getcontentlist = async function (request, response) {
    try {
        var getAuthUser = await authService.getAuthUser(request.token)
        if (getAuthUser.length == 0) {
            var apiMessage = apiMessages('user', 'notFound')
            return response.status(200).json(
                Errorresponse(101, apiMessage)
            )
        } else {
            if (getAuthUser[0].role_id == 3) {
                return response.status(200).json(
                    Errorresponse(101, 'access denied')
                )
            } else {
                var getcontentlist = await contentService.getList()
                var apiMessage = apiMessages('', 'loginSuccess');
                return response.status(200).json(
                    Apiresponse(200, apiMessage, getcontentlist)
                );

            }
        }
    } catch (error) {
        console.log(error);
    }
}
contentController.getContentPage = async function (request, response) {
    try {
        // var getAuthUser = await authService.getAuthUser(request.token)
        // if (getAuthUser.length == 0) {
        //     var apiMessage = apiMessages('user', 'notFound')
        //     return response.status(200).json(
        //         Errorresponse(101, apiMessage)
        //     )
        // } else {
        //     if (getAuthUser[0].role_id == 3) {
        //         return response.status(200).json(
        //             Errorresponse(101, 'access denied')
        //         )
        //     } else {
        var getcontentlist = await contentService.getpage(request.body.page_id)
        if (getcontentlist.length == 0) {
            var apiMessage = apiMessages('page', 'notFound');
            return response.status(200).json(
                Apiresponse(200, apiMessage, getcontentlist)
            );
        } else {

            var apiMessage = apiMessages('', 'loginSuccess');
            return response.status(200).json(
                Apiresponse(200, apiMessage, getcontentlist[0])
            );
        }
        //     }
        // }
    } catch (error) {
        console.log(error);
    }
}
contentController.updateContentPage = async function (request, response, next) {
    try {
        var errors = validationResult(request)
        if (!errors.isEmpty()) {
            let Verror = [errors].map((data) => data.errors[0].msg)[0]
            return response.status(200).json(
                Errorresponse(101, Verror)
            )
        } else {
            var updateContent = await contentService.updateContent(request.body)
            if (updateContent) {
                var apiMessage = apiMessages('Content', 'updateSuccess')
                return response.status(200).json(
                    Apiresponse(200, apiMessage, updateContent)
                )
            }

        }
    } catch (err) {
        response.json({
            error: err
        })
    }
}
contentController.deleteContentPage = async function (request, response, next) {
    try {
        if (request.body.role_id == 1) {
            var deletecontentPage = await contentService.deletePage(request.body.page_id)
            var getcontentlist = await contentService.getList()
            var apiMessage = apiMessages('', 'deleteSuccess');
            return response.status(200).json(
                Apiresponse(200, apiMessage, getcontentlist)
            );
        } else {
            var Verror = apiMessages('', 'accedDenied')
            return response.status(200).json(
                Errorresponse(101, Verror)
            )
        };
    } catch (err) {
        response.json({
            error: err
        })
    }
}


module.exports = contentController