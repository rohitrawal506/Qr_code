Apiresponse = (code, msg, data = []) => {
    if (data.length == 0) {
        return {
            code: code,
            message: msg,
            result: null
        }
    } else {
        return {
            code: code,
            message: msg,
            result: data
        }
    }
}
Errorresponse = (code, msg) => {
    return {
        code: code,
        message: msg,
        result: null
    }
}

function NewErrorResponse(response, msg) {
    response.status(200).json({
        code: 101,
        message: msg,
        result: null
    });
}

module.exports = { Apiresponse, Errorresponse, NewErrorResponse };