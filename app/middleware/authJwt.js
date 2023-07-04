const { request } = require("express");
const jwt = require("jsonwebtoken");
const { conn, conn1 } = require('../dbConnection');
verifyToken = (req, res, next) => {
    // console.log("verifedddddddd", req.headers.authorization.split(' ')[1]);
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') || !req.headers.authorization.split(' ')[1]) {
        return res.status(422).json({
            code: 400,
            message: "No token provided!",
            data: null
        });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    jwt.verify(theToken, 'RS654', (err, decoded) => {
        if (err) {
            return res.status(401).send({
                code: 401,
                message: "Unauthorized!",
                data: null
            });
        }
        req.userId = decoded.id;
        req.Id = decoded.id;
        req.token = theToken;
        next();
    });
}
db_token_check = (request, response, next) => {
    if (!request.token) {
        return response.status(422).json({
            code: 400,
            message: "No token provided!",
            data: []
        });
    }
    conn.query(`SELECT * FROM auth_tokens WHERE token = '${request.token}'`, (tokenErr, tokenResult) => {
        if (tokenResult != 0) {
            request.role = tokenResult[0].token;
            next();
        } else {
            return response.status(401).send({
                code: 401,
                message: "No Token Found !",
                data: null
            });
        }
    });

}
const authJwt = {
    verifyToken: verifyToken,
    db_token_check: db_token_check
};
module.exports = authJwt;
