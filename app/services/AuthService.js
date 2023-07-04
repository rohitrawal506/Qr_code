const { conn } = require('../dbConnection');
var moment = require('moment');
const bcrypt = require("bcrypt");

const authService = {};

const queryParamPromise = (sql, queryParam) => {
    return new Promise((resolve, reject) => {
        conn.query(sql, queryParam, (err, results) => {
            if (err) return reject(err);
            return resolve(results);
        });
    });
}
const queryPromise = (sql) => {
    return new Promise((resolve, reject) => {
        conn.query(sql, (err, results) => {
            if (err) return reject(err);
            return resolve(results);
        });
    });
}
authService.getUser = async function (data) {
    try {
        if (data.email && data.role_id == 3 || data.role_id == undefined || data.role_id == '') {
            var authSql = "SELECT id , fullname , email , country ,password, city , address , status , bids_remain , bids_used , role_id FROM users  WHERE email = ? AND deleted_at IS Null";
            var requestPar = [data.email];
        } else if (data.email && data.role_id == 2 || data.role_id == 1) {
            var authSql = 'SELECT id,fullname,email,password,status,role_id FROM admins WHERE email = ? ';
            var requestPar = [data.email];
        }
        // var requestPar = [data.email, data.email];
        const authData = await queryParamPromise(authSql, requestPar);

        return authData;

    } catch (error) {
        console.log('error', error);
        // next(error);
    }
}
authService.getUserByid = async function (data, customer_id) {
    try {

        if (customer_id != '' && customer_id != undefined) {
            var authSql = 'SELECT id,email,password,stripe_customer_id FROM users  WHERE stripe_customer_id = ? ';
            var requestPar = [customer_id];
        } else if (data.role_id == 3 && data != '') {
            var authSql = "SELECT id,email,password,stripe_customer_id,verified_at FROM users  WHERE id = ? AND status = 'active'";
            var requestPar = [data.user_id];
        }
        else {
            var authSql = 'SELECT password FROM admins  WHERE id = ? ';
            var requestPar = [data.user_id];
        }
        const authData = await queryParamPromise(authSql, requestPar);

        return authData;

    } catch (error) {
        console.log('error', error);
        // next(error);
    }
}
authService.getAuthUser = async function (token) {
    try {
        if (token != '' || token != undefined) {
            var authSql = 'SELECT user_id,role_id FROM auth_tokens auth_tokens WHERE token = ?';
            var requestPar = [token];
        }
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;

    } catch (error) {
        console.log('error', error);
        // next(error);
    }
}
authService.getUserdeiviceToken = async function (data) {
    try {
        if (data != '' || data != undefined) {
            var authSql = 'SELECT device_tokens.device_type,device_tokens.device_token,device_tokens.unique_id,device_tokens.device_name,device_tokens.version FROM users LEFT JOIN device_tokens ON device_tokens.user_id = users.id WHERE users.id = ?';
            var requestPar = [data.user_id];
        }
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;

    } catch (error) {
        console.log('error', error);
        // next(error);
    }
}
authService.updateProfile = async function (data, user) {
    try {
        if (data != '' && user.role_id == 3) {
            var authSql = "UPDATE users SET fullname = ? ,country = ?, city= ?,address = ? WHERE id = ? AND status = 'active'";
            var requestPar = [data.fullname, data.country, data.city, data.address, user.id];
        }
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;
    } catch (error) {
        console.log('error', error);
        // next(error);
    }
}
authService.registerAdmin = async function (data) {
    const { username, email, country, password, bids, role_id, city, address, customer_id } = data;
    const hashPassword = await bcrypt.hash(password, 10);
    if (data != '' && role_id == undefined || role_id == 3) {
        var tokenSql = 'INSERT INTO users (fullname, email, country , city, address , password,bids_remain, role_id,stripe_customer_id) VALUES (?,?,?,?,?,?,?,?,?)';
        var requestPar = [username, email, country, city, address, hashPassword, bids, role_id, customer_id.id]
    } else if (data != undefined && role_id != undefined) {
        var tokenSql = 'INSERT INTO admins (fullname,email, country, city, address ,password,role_id) VALUES (?,?,?,?,?,?,?)';
        var requestPar = [username, email, country, city, address, hashPassword, 2]
    }
    const user_data = await queryParamPromise(tokenSql, requestPar)
    return user_data
}
authService.getDeviceToken = async function (data) {
    try {
        if (data != '' && data != undefined) {
            var tokenSql = 'SELECT * FROM device_tokens WHERE user_id = ? AND device_token = ?';
            var requestPar = [data.userId, data.device_token];
        }
        const tokenData = await queryParamPromise(tokenSql, requestPar);
        return tokenData;

    } catch (error) {
        console.log('error', error);
        next(error);
    }
}
authService.storeDeviceToken = async function (data, id) {
    try {
        if (data != '' && data != undefined) {
            var tokenSql = "INSERT INTO device_tokens (user_id, device_name, device_token,device_type, unique_id,version,role_id) VALUES (?,?,?,?,?,?,?)";
            var requestPar = [id, data.device_name, data.device_token, data.device_type, data.unique_id, data.version, 3];
        }
        const addData = await queryParamPromise(tokenSql, requestPar);
        return addData;

    } catch (error) {
        console.log('error', error);
        next(error);
    }
}
authService.checkDeviceToken = async function (data, id) {
    try {
        if (data != '' && data != undefined) {
            var tokenSql = "SELECT device_token FROM device_tokens WHERE device_token = ? and user_id = ?";
            var requestPar = [data.device_token, id];
        }
        const selectToken = await queryParamPromise(tokenSql, requestPar);
        return selectToken;

    } catch (error) {
        console.log('error', error);
        next(error);
    }
}
authService.deleteDeviceToken = async function (data) {
    try {
        console.log(data);
        if (data != undefined) {
            var tokenSql = "DELETE FROM device_tokens WHERE device_token = ?";
            var requestPar = [data.device_token];
        }
        const deleteData = await queryParamPromise(tokenSql, requestPar);
        return deleteData;
    } catch (error) {
        console.log('error', error);
    }
}
authService.getAuthToken = async function (data) {
    try {
        if (data) {
            var authSql = 'SELECT * FROM auth_tokens WHERE user_id = ?';
            var requestPar = [data];
        }
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;
    } catch (error) {
        console.log('error', error);
        next(error);
    }
}
authService.updateToken = async function (token, id) {
    try {
        if (token != '' && id != undefined) {
            var authSql = "UPDATE auth_tokens SET token = ? WHERE user_id = ?";
            var requestPar = [token, id];
        }
        const addData = await queryParamPromise(authSql, requestPar);
        return addData;
    } catch (error) {
        console.log('error', error);
        next(error);
    }
}
authService.storeAuthToken = async function (data) {
    try {
        if (data != '' && data != undefined) {
            var authSql = "INSERT INTO auth_tokens (user_id, token, role_id) VALUES (?,?,?)";
            var requestPar = [data.userId, data.auth_token, data.role_id];
        }
        const addData = await queryParamPromise(authSql, requestPar);
        return addData;

    } catch (error) {
        console.log('error', error);
        next(error);
    }
}
authService.deleteAuthToken = async function (data) {
    try {
        // console.log(data);
        if (data != '' && data != undefined) {
            var tokenSql = "DELETE FROM auth_tokens WHERE token = ?";
            var requestPar = [data];
        }
        const deleteData = await queryParamPromise(tokenSql, requestPar);
        return deleteData;

    } catch (error) {
        console.log('error', error);
        // next(error);
    }
}
authService.updatePassword = async function (password, email, role) {
    try {
        if (role == 2 || role == 1) {
            var updateSql = "UPDATE admins SET password = ? WHERE email =?  ";
            var requestPar = [password, email];
        } else if (role == 3) {
            var updateSql = "UPDATE users SET password = ? WHERE email =? AND deleted_at IS Null";
            var requestPar = [password, email];
        }

        const updateData = await queryParamPromise(updateSql, requestPar);
        return updateData;
    } catch (error) {
        console.log('error', error);
        next(error);
    }
}
authService.changePassword = async function (password, data) {
    try {
        var table = ''
        if (data.role_id == 3) {
            table = 'users'
        } else {
            console.log('admonssss', password, data.user_id);
            table = 'admins'
        }
        var updateSql = `UPDATE ${table} SET password = ? WHERE id = ? AND deleted_at IS Null`;
        var requestPar = [password, data.user_id];
        const updateData = await queryParamPromise(updateSql, requestPar);
        return updateData;
    } catch (error) {
        console.log('error', error);
    }
}
authService.deleteAlluser = async function (id, token, request) {
    try {
        if (id != '' && token != '') {
            var updateSql = "DELETE FROM auth_tokens WHERE user_id = ?";
            var requestPar = [id];
            const deleteAuth = await queryParamPromise(updateSql, requestPar);
            var updateSql = "INSERT INTO auth_tokens (user_id, token, role_id) VALUES (?,?,?) ";
            var requestPar = [id, token, 3];
            const updateData = await queryParamPromise(updateSql, requestPar);
            const updateDevice = `DELETE FROM device_tokens where user_id = ?`;
            const deleteDevice = await queryParamPromise(updateDevice, requestPar);
            const { device_name, device_token, device_type, unique_id, version } = request.body;
            if (device_token != '') {
                console.log('if');
                var updateSql = "INSERT INTO device_tokens (user_id, device_name, device_token,device_type, unique_id,version,role_id) VALUES (?,?,?,?,?,?,?)";
                var insertDeviceToken = [id, device_name, device_token, device_type, unique_id, version, 3];
                const deleteDevice = await queryParamPromise(updateSql, insertDeviceToken);
                console.log(deleteDevice);
            }
        }
    } catch (error) {
        console.log('error', error);
    }
}
authService.insertResetToken = async function (email, resetToken, role_id, createdAt, expiredAt) {
    let created_at = moment.utc(createdAt).format('YYYY-MM-DD HH:mm:ss');
    let expired_at = moment.utc(expiredAt).format('YYYY-MM-DD HH:mm:ss');
    try {
        if (email != '' && email != undefined) {
            var insertSql = "INSERT INTO reset_password_token (email, token_value,role_id, created_at, expired_at) VALUES (?,?,?,?,?)";
            var requestPar = [email, resetToken, role_id, created_at, expired_at];
        }
        const resetData = await queryParamPromise(insertSql, requestPar);
        return resetData;

    } catch (error) {
        console.log('error', error);
        // next(error);
    }
}
authService.expireOldTokens = async function (used, email) {

    updateSql = 'UPDATE reset_password_token SET used = ? WHERE email = ?';
    try {
        var requestPar = [used, email];
        const resetData = await queryParamPromise(updateSql, requestPar);
        return resetData;
    } catch (error) {
        console.log('error', error);
        next(error);
    }
},
    authService.updateResetToken = async function (email, resetToken, role_id, createdAt, expiredAt) {
        let created_at = moment.utc(createdAt).format('YYYY-MM-DD HH:mm:ss');
        let expired_at = moment.utc(expiredAt).format('YYYY-MM-DD HH:mm:ss');

        try {
            if (email != '' && email != undefined) {
                var insertSql = "UPDATE reset_password_token SET token_value=?,role_id=?, created_at=?, expired_at=? WHERE email=?";
                var requestPar = [resetToken, role_id, created_at, expired_at, email];
            }
            const resetData = await queryParamPromise(insertSql, requestPar);
            return resetData;

        } catch (error) {
            console.log('error', error);
            // next(error);
        }
    }
authService.updateResetTokenUsed = async function (email, resetToken) {
    try {
        console.log(email, resetToken);
        if (email != '' && email != undefined) {
            var insertSql = "UPDATE reset_password_token SET token_used = '1' WHERE email = ? AND token_value = ?";
            var requestPar = [email, resetToken];
        }
        const resetData = await queryParamPromise(insertSql, requestPar);
        return resetData;

    } catch (error) {
        console.log('error', error);
        // next(error);
    }
}
authService.getExistUser = async function (email, token) {
    if (email != "") {
        tokenSql = "SELECT * from reset_password_token where email = ? AND token_used = '0'";
        try {
            var requestPar = [email];
            const resetData = await queryParamPromise(tokenSql, requestPar);
            return resetData;
        } catch (error) {
            console.log('error', error);
            next(error);
        }
    } else if (token != "") {
        tokenSql = 'SELECT * from reset_password_token where token_value = ?';
        try {
            var requestPar = [token];
            const resetData = await queryParamPromise(tokenSql, requestPar);
            return resetData;
        } catch (error) {
            console.log('error', error);
            next(error);
        }
    }
},
    authService.validateResetToken = async function (email, token) {

        const currentTime = new Date(Date.now());
        let current_time = moment.utc(currentTime).format('YYYY-MM-DD HH:mm:ss');

        tokenSql = "SELECT * FROM reset_password_token WHERE email = ? AND token_value = ? AND expired_at > ? AND token_used = '0'";
        try {
            var requestPar = [email, token, current_time];
            const resetData = await queryParamPromise(tokenSql, requestPar);
            return resetData;
        } catch (error) {
            console.log('error', error);
            next(error);
        }
    },
    authService.deleteUser = async function (data) {
        try {
            console.log('data', data);
            var table = ''
            if (data.role_id == 1) {
                table = 'admins'
            } else {
                table = 'users'
            }
            var currentTime = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss')
            // var authSql = `UPDATE ${table} SET deleted_at = ?  WHERE id = ?`;
            var authSql = `UPDATE ${table} SET deleted_at = '${currentTime}'  WHERE id = '${data.user_id}'`;
            // var requestPar = [currentTime, data.id];
            // var requestPar = [currentTime, data.user_id];
            // const deleteUser = await queryParamPromise(authSql, requestPar);
            const deleteUser = await queryPromise(authSql);
            var authSql = `DELETE auth_tokens, device_tokens FROM auth_tokens  LEFT JOIN device_tokens ON auth_tokens.user_id = device_tokens.user_id WHERE auth_tokens.user_id = ${data.user_id} AND auth_tokens.role_id = ${data.role_id}`;
            var requestPar = [data.id];
            const deleteUserToken = await queryParamPromise(authSql, requestPar);
            const deleteDeviceToken = `DELETE FROM device_tokens where user_id = ?`;
            const deleteDevice = await queryParamPromise(deleteDeviceToken, requestPar);
            return deleteUser
        } catch (error) {
            console.log(error)
        }
    }
authService.updateVerify = async function (data) {

    const currentTime = new Date(Date.now());
    let current_time = moment.utc(currentTime).format('YYYY-MM-DD HH:mm:ss');

    tokenSql = 'UPDATE users SET verified_at = ? WHERE id = ?';
    try {
        var requestPar = [current_time, data.user_id];
        const resetData = await queryParamPromise(tokenSql, requestPar);
        return resetData;
    } catch (error) {
        console.log('error', error);
        next(error);
    }
},
    module.exports = authService;