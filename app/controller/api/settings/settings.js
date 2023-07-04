var { validationResult } = require('express-validator')
const settingsService = require("../../../services/settingsService");
const bidsService = require("../../../services/bidsService")
var { apiMessages } = require('../../../../helper/message');
var { Errorresponse, Apiresponse } = require('../../../../helper/response');
var { EncodeBase64, DecodeBase64 } = require('../../../../helper/helper');
const { response } = require('express');
const discountService = require('../../../services/discountService');
const settingsController = {}


settingsController.getSetting = async function (request, response) {
    try {
        var data = [];
        var obj = {}
        const setting = await settingsService.getDiscount();
        if(setting.length > 0){
            for(let j = 0 ; j < setting.length ; j++){
                obj[setting[j].name]  = setting[j].value;
            }
        }

        const bids = await bidsService.getBids();
        const discount = await discountService.getDiscount();
        const customerPages = await settingsService.getcustomerPages();
        const pages = [];
        var pagesobj = [];
        if(customerPages.length > 0){
            for(let i = 0 ; i < customerPages.length ; i++){
                let Response = {
                    url:`${process.env.APP_URL}contentpage/view/${ EncodeBase64(customerPages[i].id)}`,
                    name:customerPages[i].page_name,
                    category:customerPages[i].category
                }  
                pagesobj.push(Response);
            }
        }
        obj['bids'] = bids;
        obj['discount'] = discount;
        obj['pages'] = pagesobj;
        return response.status(200).json(
            Apiresponse(200, 'Setting Get Successfully', obj)
        )
    } catch (error) {
        console.log(error);
    }
}


module.exports = settingsController