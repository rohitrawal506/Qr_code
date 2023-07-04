const moment = require('moment');
const { conn } = require('../dbConnection');
const userService = {}
const queryParamPromise = (sql, queryParam) => {
    return new Promise((resolve, reject) => {
        if (queryParam == '') {
            conn.query(sql, (err, results) => {
                if (err) return reject(err);
                return resolve(results);
            });
        } else {
            conn.query(sql, queryParam, (err, results) => {
                if (err) return reject(err);
                return resolve(results);
            });
        }
    });
};
userService.getUserDetail = async function (data) {
    try {
        if (data.role_id == 3) {
            var authSql = "SELECT users.id,users.fullname,users.email,users.country,users.city,users.address,users.bids_remain,users.bids_used,users.status,users.role_id,device_tokens.device_token,device_tokens.device_name,device_tokens.unique_id,device_tokens.version, device_tokens.device_type FROM users LEFT JOIN device_tokens ON users.id = device_tokens.user_id WHERE users.id = ? AND deleted_at IS Null"
            var requestPar = [data.user_id]
        } else {
            var authSql = "SELECT id,fullname,email,country,city,address FROM admins WHERE id = ?"
            var requestPar = [data.user_id]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
        next(error);
    }
}
userService.getUserAdminList = async function (data) {
    try {
        var SearchQuery = ''
        if (data.searchUser != '' && data.searchUser != undefined) {
            SearchQuery = `users.fullname LIKE '%${data.searchUser}%' AND`
        }
        var authSql = `SELECT id,fullname,email,country,bids_remain,bids_used,status,verified_at FROM users  WHERE ${SearchQuery} deleted_at IS Null`
        // var requestPar = [data]
        const authData = await queryParamPromise(authSql)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
userService.getProfile = async function (data) {
    try {
        if (data.role_id == 3) {
            var authSql = "SELECT users.id,users.fullname,users.email,users.country,users.city,users.address,users.bids_remain,users.bids_used,users.status,users.role_id,device_tokens.device_token,device_tokens.device_name,device_tokens.unique_id,device_tokens.version, device_tokens.device_type FROM users LEFT JOIN device_tokens ON users.id = device_tokens.user_id WHERE users.id = ? AND deleted_at IS Null"
            var requestPar = [data.user_id]
        } else {
            var authSql = "SELECT id,fullname,email,country,city,address FROM admins WHERE id = ?"
            var requestPar = [data.user_id]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
        next(error);
    }
}
userService.purchaseBid = async function (data) {
    try {
        if (data) {
            var authSql = 'INSERT INTO user_bids (user_id,purchased_bid,payment_status,promocode)VALUES (?,?,?,?) '
            var requestPar = [data.user_id, data.purchased_bid, 'pending', data.promocode]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
userService.checkPendingReq = async function (data) {
    try {
        console.log(data);
        if (data) {
            var authSql = "SELECT id,user_id,purchased_bid FROM user_bids WHERE user_id = ? AND purchased_bid = ? AND payment_status = 'pending'"
            var requestPar = [data.user_id, data.purchased_bid]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
userService.updatePromocode = async function (data) {
    try {
        if (data) {
            var authSql = "UPDATE user_bids SET promocode = ? WHERE user_id = ?"
            var requestPar = [data.promocode, data.user_id]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
userService.updatePendingReq = async function (data) {
    try {
        if (data) {
            var authSql = "UPDATE user_bids SET transection_id = ? , payment_status = 'success' WHERE id = ?"
            var requestPar = [data.confirm_payment_intent, data.bidder_id]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
userService.updateUserBid = async function (data) {
    try {
        var authSql = `UPDATE users SET users.bids_remain = 
        (SELECT COALESCE(
            (SELECT SUM(user_bids.purchased_bid)
            FROM user_bids
            LEFT JOIN users ON users.id = user_bids.user_id
            WHERE user_bids.user_id = ${data} AND user_bids.payment_status = 'success'
            GROUP BY user_bids.user_id), 0)
        + COALESCE(
            (SELECT SUM(promocode_used.bonus)
            FROM promocode_used 
            LEFT JOIN users ON users.id = promocode_used.user_id
            WHERE users.id = ${data} AND promocode_type = 'signup'
            GROUP BY promocode_used.user_id), 0)) - 
        users.bids_used
        WHERE id = ? AND deleted_at IS Null`
        var requestPar = [data]
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
userService.changeUserStatus = async function (data) {
    try {
        console.log(data);
        if (data) {
            var authSql = 'UPDATE users SET status = ? WHERE id = ? AND deleted_at IS Null'
            var requestPar = [data.status, data.id]
            var deletesql = `DELETE auth_tokens, device_tokens FROM auth_tokens  LEFT JOIN device_tokens ON auth_tokens.user_id = device_tokens.user_id WHERE auth_tokens.user_id = ? AND auth_tokens.role_id = ?`;
            var deletePar = [data.id, data.role_id];
        }
        const deleteUserToken = await queryParamPromise(deletesql, deletePar);
        const authData = await queryParamPromise(authSql, requestPar)

        return authData
    } catch (error) {
        console.log('error', error);
        next(error);
    }
}
userService.deleteUser = async function (data) {
    try {
        if (data) {
            var currentTime = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss')
            var authSql = 'UPDATE users SET deleted_at = ? WHERE id = ? AND deleted_at IS Null'
            var requestPar = [currentTime, data.id]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
        next(error);
    }
}
userService.getTotalBids = async function (token) {
    try {
        if (token) {
            var authSql = 'SELECT users.bids_remain FROM users LEFT JOIN auth_tokens ON users.id = auth_tokens.user_id Where auth_tokens.token = ?'
            var requestPar = [token]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
userService.getBidData = async function (bid_id) {
    try {
        if (bid_id) {
            var authSql = 'SELECT bids,bid_amount FROM bids WHERE id = ?'
            var requestPar = [bid_id]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}

userService.getDashboardData = async function (data) {
    try {
        if (data.role_id = 3) {
            var authSql = `SELECT (SELECT COUNT(*) FROM users WHERE deleted_at IS Null) AS registered_users,(SELECT COUNT(*) FROM products WHERE deleted_at IS Null and status = 'live') AS product_live_count , (SELECT COUNT(*) FROM products WHERE deleted_at IS Null and status = 'finished') AS product_finished_count`;
        }
        const authData = await queryParamPromise(authSql)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}


module.exports = userService;