const jwt = require("jsonwebtoken");
const { Errorresponse } = require('../../helper/response');

function auth (data){
    return function (request, response, next){
        if(data.role != 'admin'){
            console.log('error');
            return response.status(401).json(
                Errorresponse(401, 'Access denied')
            );
        }
        next();
    }
}
module.exports = auth;
