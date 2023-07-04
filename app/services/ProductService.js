const { conn } = require("../dbConnection");
var moment = require("moment");
const { imagePath } = require('../../constant/config');
const productService = {};

function productObject(element) {
    return object = {
        "id": element.id ?? 0,
        "product_name": element.product_name ?? "",
        "description": element.description ?? "",
        "bid_price": element.bid_price ?? "",
        "max_bid_price": element.max_bid_price ?? "",
        "start_bid_time": element.start_bid_time ?? "",
        "end_bid_time": element.end_bid_time ?? "",
        "status": element.status ?? "",
        "city": element.product_country ?? "",
        "country": element.product_country ?? "",
        "bid_id": element.bid_id ?? "",
        "disabled": element.disabled ?? "",
        "winner_id": element.winner_id ?? 0,
        "winning_amount": element.winning_amount ?? "",
        "images": element.images ?? "",
        "bids": []
    };
}

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
productService.getProductDetail = async function (data) {
    try {
        var products = [];
        var authSql = `SELECT products.*, (SELECT  GROUP_CONCAT(CONCAT('${imagePath}',product_images.image)) as images  FROM product_images WHERE product_images.product_id = products.id ) AS group_image,
        users.id AS user_id,users.fullname,users.address,users.city,users.country, 
        GROUP_CONCAT(bidders.id)  AS bidder_id, GROUP_CONCAT(bidders.user_name) AS bidders_name ,
        GROUP_CONCAT(bidders.bid_price) AS user_bid_price,
        GROUP_CONCAT(bidders.amount_paid) AS amount_paid,GROUP_CONCAT(bidders.pre_deposit_payment_status) AS pre_status,GROUP_CONCAT(bidders.refund_amount) AS refund_amount ,GROUP_CONCAT(bidders.refund_transection_id) AS refund_id  FROM products 
        LEFT JOIN users ON users.id = products.winner_id 
        LEFT JOIN bidders ON bidders.product_id = products.ID 
        WHERE products.id = ?  GROUP BY  products.id`;
        var requestPar = [data.product_id]
        const authData = await queryParamPromise(authSql, requestPar)

        authData[0].images = authData[0].group_image.split(",");

        productObject(authData[0]);
        if (authData[0].bidder_id != null) {
            var bidder_id = authData[0].bidder_id.split(",");
            var bidders_name = authData[0].bidders_name.split(",");
            var user_bid_price = authData[0].user_bid_price.split(",");
            var amount_paid = authData[0].amount_paid?.split(",");
            var pre_deposit_payment_status = authData[0].pre_status.split(",")
            var refund_amount = authData[0].refund_amount?.split(",");
            var refund_id = authData[0].refund_id?.split(",");
            bidders_name.forEach((element_, index_) => {
                object.bids.push({
                    "bidder_id": bidder_id[index_],
                    "user_bid_price": user_bid_price[index_],
                    "amount_paid": amount_paid?.[index_] ?? "0",
                    "bidders_name": bidders_name[index_],
                    "pre_deposit_payment_status": pre_deposit_payment_status[index_],
                    "refund_amount": refund_amount[index_] ?? "0",
                    "refund_id": refund_id[index_] ?? "0",
                });
            })
        }
        if (authData[0].winner_id != 0) {
            var subquery = 'SELECT  bidders.discount_percentage,bidders.final_payment_status FROM bidders LEFT JOIN products ON bidders.id = products.bid_id WHERE products.bid_id = ?'
            var subParms = [authData[0].bid_id]
            const subData = await queryParamPromise(subquery, subParms)
            object.winner = {
                "user_id": authData[0].user_id,
                "user_name": authData[0].fullname,
                "address": authData[0].address,
                "city": authData[0].city,
                "country": authData[0].country,
                "final_payment_status": subData[0].final_payment_status,
                "discount_percentage": subData[0].discount_percentage
            }
        } else {
            object.winner = null
        }
        products.push(object)
        // console.log(products);
        return products
    } catch (error) {
        console.log('error', error);
    }
}
productService.getProductList = async function (data, value, page, user_id, country, role) {
    try {
        var products = [];
        var offset = (page - 1) * 10
        var user_country = ''
        var pageSql = '';
        var searchSql = '';
        var auctionStatus = '';
        var disabled = '';
        var order = 'ASC'
        if (value == 'finished') {
            order = 'DESC'
        }
        if (country != '' && country != undefined) {
            user_country = `products.country LIKE '%${country}%' AND`
        }
        if (page != '') {
            pageSql = `LIMIT 10 OFFSET ${offset}`;
            and = 'AND'
        }
        if (value != '' && value != 'disabled') {
            auctionStatus = `WHERE products.status= '${value}' AND `
        }
        if (data != '' && value != '' && value != 'disabled') {
            searchSql = `products.product_name LIKE '%${data}%' AND`;
        }
        if (data == '' && value == '') {
            searchSql = 'WHERE'
        }
        if (role == 3 || role == 1 && value == 'finished') {
            disabled = `products.disabled = '0' AND`;
        }
        if (role == 1 && value == 'disabled' && data == '') {
            disabled = `WHERE products.status= 'finished' AND  products.disabled = '1' AND`;
        }
        if (role == 1 && value == 'disabled' && data != '') {
            disabled = `WHERE products.status= 'finished' AND  products.disabled = '1' AND products.product_name LIKE '%${data}%' AND`;
        }
        const currentTime = new Date(Date.now());
        let current_time = moment.utc(currentTime).format('YYYY-MM-DD HH:mm:ss');
        var defaultQurySql = `SELECT  products.id,products.product_name,products.description,products.bid_price, products.max_bid_price, products.start_bid_time,products.disabled, products.end_bid_time, products.status,products.country AS product_country, products.winner_id,products.bid_id, products.winning_amount,users.id AS user_id,users.fullname,users.address,users.city,users.country,
        (SELECT GROUP_CONCAT(CONCAT('${imagePath}',product_images.image)) as images  FROM product_images WHERE product_images.product_id = products.id ) AS group_image,
        GROUP_CONCAT(bidders.id) as bidder_id,
        GROUP_CONCAT(bidders.bid_price) as my_bids,
         GROUP_CONCAT(bidders.amount_paid) AS amount_paid,
        GROUP_CONCAT(bidders.discount_percentage) as discount_percentage,
        GROUP_CONCAT(bidders.pre_deposit_payment_status) as pre_deposit_payment_status,
        GROUP_CONCAT(bidders.created_at) as created_at
         FROM products 
         LEFT JOIN users ON users.id = products.winner_id 
         LEFT JOIN bidders ON bidders.product_id = products.id  AND bidders.user_id = ${user_id}
         ${auctionStatus}
         ${searchSql}
         ${user_country}
         ${disabled}
         products.start_bid_time < '${current_time}' AND
         products.deleted_at IS Null 
         GROUP BY  products.id  ORDER BY products.end_bid_time ${order} ${pageSql}`;
        var countSql = `SELECT count(*) AS product_count
        FROM products  
        ${auctionStatus}  ${searchSql} ${user_country} ${disabled}
        products.deleted_at IS Null `;
        const authData = await queryParamPromise(defaultQurySql);
        const totalRecords = await queryParamPromise(countSql);
        for (let i = 0; i < authData.length; i++) {
            authData[i].images = authData[i].group_image.split(",");
            productObject(authData[i]);
            if (authData[i].my_bids != null) {
                var pre_deposit_payment_status = authData[i].pre_deposit_payment_status.split(",")
                var bidder_id = authData[i].bidder_id.split(",");
                var amount_paid = authData[0].amount_paid?.split(",");
                var bid_price = authData[i].my_bids.split(",");
                var created_at = authData[i].created_at.split(",");
                var discount_percentage = authData[i].discount_percentage.split(",")
                bid_price.forEach((element_, index_) => {
                    object.bids.push({
                        "bidder_id": bidder_id[index_],
                        "price": bid_price[index_],
                        "created_at": created_at[index_],
                        "pre_deposit_payment_status": pre_deposit_payment_status[index_],
                        "discount_percentage": discount_percentage[index_],
                        "amount_paid": amount_paid?.[index_] ?? "0",
                    });
                })
            }

            if (authData[i].winner_id != 0) {
                var subquery = 'SELECT  bidders.discount_percentage FROM bidders LEFT JOIN products ON bidders.id = products.bid_id WHERE products.bid_id = ?'
                var subParms = [authData[i].bid_id]
                const subData = await queryParamPromise(subquery, subParms)
                object.winner = {
                    "user_id": authData[i].user_id,
                    "user_name": authData[i].fullname,
                    "address": authData[i].address,
                    "city": authData[i].city,
                    "country": authData[i].country,
                    "discount_percentage": subData[0].discount_percentage
                }
            } else {
                object.winner = null
            }
            products.push(object)
        }

        var resultData = {}
        resultData.total_records = totalRecords[0].product_count
        resultData.products = products
        return resultData
    } catch (error) {
        console.log(error);
    }
};
productService.addProduct = async function (form) {
    try {
        if (form) {
            let start_time = moment
                .utc(form.start_date)
                .format("YYYY-MM-DD HH:mm:ss");
            let end_time = moment.utc(form.end_date).format("YYYY-MM-DD HH:mm:ss");
            var authSql =
                "INSERT INTO products (product_name,country ,description,bid_price,max_bid_price,start_bid_time,end_bid_time) VALUES(?,?,?,?,?,?,?)";

            var requestPar = [
                form.product_name,
                form.country,
                form.description,
                form.bid_price,
                form.max_bid_price,
                start_time,
                end_time,
            ];
        }
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;
    } catch (error) {
        console.log("error", error);
        // next(error);
    }
};
productService.checkTime = async function (time) {
    try {
        var currentTime = moment.utc(time).format('YYYY-MM-DD HH:mm:ss')
        var authSql = "UPDATE products SET status = 'finished' WHERE end_bid_time < ? AND status = 'live'"
        var requestPar = [currentTime]
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;
    } catch (error) {
        console.log(error)
    }
}
productService.getBidUser = async function (data) {
    try {
        var table = ''
        var items = ''
        if (data.role_id == 1 || data.role_id == 2) {
            table = 'admins'
            items = 'fullname,id'
        }
        else if (data.role_id == 3 || data.role_id == undefined) {
            table = 'users'
            items = 'id,fullname,bids_remain, bids_used,status,city,country,stripe_customer_id,verified_at'
        }
        var authSql = `SELECT ${items} FROM ${table} WHERE id = ?`
        var requestPar = [data.user_id]
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;
    } catch (error) {
        console.log(error)
    }
}
productService.getwinnerPaymentDetail = async function (data) {
    try {
        // console.log('data', data);
        var authSql = `SELECT * FROM products LEFT JOIN bidders ON bidders.product_id = products.ID WHERE products.bid_id = ?`
        var requestPar = [data.bid_id];
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;
    } catch (error) {
        console.log(error)
    }
}
productService.deletedProduct = async function (data) {
    try {
        // console.log('data', data);
        var authSql = `SELECT * FROM products LEFT JOIN bidders ON bidders.product_id = products.ID WHERE products.bid_id = ?`
        var requestPar = [data.bid_id];
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;
    } catch (error) {
        console.log(error)
    }
}
productService.checkcountry = async function (data) {
    try {
        var authSql = `SELECT * FROM products WHERE country LIKE '%${data.country}%' AND deleted_at IS Null`;
        const authData = await queryParamPromise(authSql);
        console.log(authData);
        return authData;
    } catch (error) {
        console.log(error)
    }
}
productService.getBidProduct = async function (data) {
    try {
        var authSql = "SELECT id , product_name,max_bid_price  FROM products WHERE id = ? AND status = 'live'"
        var requestPar = [data.product_id]
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;
    } catch (error) {
        console.log(error)
    }
}
productService.placeBid = async function (data) {
    try {
        var currentTime = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss')
        if (data.pre_payment == true) {
            var authSql = "INSERT INTO bidders (user_id,user_name,product_id,bid_price,amount_paid,pre_deposit_payment_status,refund_amount,refund_transection_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)"
            var requestPar = [data.user_id, data.user_name, data.product_id, data.bid_price, data.pre_deposite_amount, data.pre_deposit_payment_status, '0.00', 'null', currentTime]
        } else {
            var authSql = "INSERT INTO bidders (user_id,user_name,product_id,bid_price,refund_amount,refund_transection_id,created_at) VALUES (?,?,?,?,?,?,?)"
            var requestPar = [data.user_id, data.user_name, data.product_id, data.bid_price, '0.00', 'null', currentTime]
        }
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;
    } catch (error) {
        console.log(error)
    }
}
productService.updateBid = async function (data) {
    try {
        var authSql = "UPDATE users SET bids_remain = (bids_remain - 1),bids_used =(bids_used + 1) WHERE id = ?;"
        var requestPar = [data]
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;
    } catch (error) {
        console.log(error)
    }
}
productService.disabledProduct = async function (data) {
    try {
        var authSql = "UPDATE products SET disabled = ? where id = ?";
        var requestPar = [data.disabled_status, data.product_id];
        const updateData = await queryParamPromise(authSql, requestPar);
        return updateData;
    } catch (error) {
        console.log(error)
    }
}
productService.finishBidTime = async function (data) {
    try {
        var currentTime = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss')
        var authSql = "SELECT * FROM products WHERE end_bid_time < ? AND status = 'live'"
        var requestPar = [currentTime]
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;
    } catch (error) {
        console.log(error)
    }
}
productService.getWinner = async function (data) {
    try {
        var authSql = "SELECT * FROM bidders WHERE product_id = ? AND status = 'live' AND (pre_deposit_payment_status = '0' OR pre_deposit_payment_status = '2') ORDER BY bid_price DESC , discount_percentage DESC,created_at ASC LIMIT 1 "
        var requestPar = [data]
        const authData = await queryParamPromise(authSql, requestPar);
        var authSql = "UPDATE bidders SET  status = 'finished'  WHERE product_id = ? AND status = 'live' "
        var requestPar = [data]
        const update = await queryParamPromise(authSql, requestPar);
        return authData;
    } catch (error) {
        console.log(error)
    }
}
productService.updateStatus = async function (time) {
    try {
        var currentTime = moment.utc(time).format('YYYY-MM-DD HH:mm:ss')
        var authSql = "UPDATE products SET status = 'finished' WHERE end_bid_time < ? AND status = 'live'"
        var requestPar = [currentTime]
        const authData = await queryParamPromise(authSql, requestPar);
        return authData;
    } catch (error) {
        console.log(error)
    }
}
productService.insertProductWinner = async function (data) {
    try {
        var productSql = "UPDATE  products SET winner_id = ?,bid_id = ?, winning_amount= ?  WHERE id = ?";
        var requestPar = [data.user_id, data.id, data.bid_price, data.product_id];
        const insertProductWinner = await queryParamPromise(productSql, requestPar);
        return insertProductWinner;

    } catch (error) {
        next(error);
    }
}
productService.getProductImage = async function (id, product_id) {
    try {

        if (id != '' && id != undefined) {
            var productSql = 'SELECT id, product_id, image FROM product_images where id = ?';
            var requestPar = [id];
        } else {
            var productSql = 'SELECT id, product_id, image FROM product_images where product_id = ?';
            var requestPar = [product_id];
        }
        const productData = await queryParamPromise(productSql, requestPar);
        return productData;

    } catch (error) {
        console.log('error', error);
        next(error);
    }
}
productService.productImageDelete = async function (id, image) {
    try {
        if (id != '' && image != '') {
            var productSql = "DELETE FROM `product_images` WHERE product_id = ? AND image = ? ";
            var requestPar = [id, image];
        }
        const poroductDeleted = await queryParamPromise(productSql, requestPar);
        return poroductDeleted;

    } catch (error) {
        next(error);
    }
}
productService.viewProductdetail = async function (data, user_id) {
    try {
        var products = [];
        var authSql = `SELECT products.id,products.product_name,products.description,products.max_bid_price,products.bid_price,products.country as product_country, products.start_bid_time, products.end_bid_time, products.status, products.winner_id,products.bid_id, products.winning_amount,users.id AS user_id,users.fullname,users.address,users.city,users.country,
        (SELECT  GROUP_CONCAT(CONCAT('${imagePath}',product_images.image)) as images  FROM product_images WHERE product_images.product_id = products.id ) AS group_image,
        GROUP_CONCAT(bidders.id) as bidder_id,
        GROUP_CONCAT(bidders.bid_price) as my_bids,
         GROUP_CONCAT(bidders.amount_paid) AS amount_paid,
        GROUP_CONCAT(bidders.discount_percentage) as discount_percentage,
        GROUP_CONCAT(bidders.pre_deposit_payment_status) as pre_deposit_payment_status,
        GROUP_CONCAT(bidders.created_at) as created_at
         FROM products 
          LEFT JOIN users ON users.id = products.winner_id 
         LEFT JOIN bidders ON bidders.product_id = products.id  AND bidders.user_id = ?
         WHERE  products.id = ? 
         AND products.deleted_at IS Null 
         GROUP BY  products.id`;
        var requestPar = [user_id, data.product_id]
        const authData = await queryParamPromise(authSql, requestPar);
        for (let i = 0; i < authData.length; i++) {
            authData[i].images = authData[i].group_image.split(",");
            productObject(authData[i]);
            if (authData[i].my_bids != null) {
                var pre_deposit_payment_status = authData[i].pre_deposit_payment_status.split(",")
                var bidder_id = authData[i].bidder_id.split(",");
                var amount_paid = authData[0].amount_paid?.split(",");
                var bid_price = authData[i].my_bids.split(",");
                var created_at = authData[i].created_at.split(",");
                var discount_percentage = authData[i].discount_percentage.split(",")
                bid_price.forEach((element_, index_) => {
                    object.bids.push({
                        "bidder_id": bidder_id[index_],
                        "price": bid_price[index_],
                        "created_at": created_at[index_],
                        "pre_deposit_payment_status": pre_deposit_payment_status[index_],
                        "discount_percentage": discount_percentage[index_],
                        "amount_paid": amount_paid?.[index_] ?? "0",
                    });
                })
            }
            if (authData[i].winner_id != 0) {
                var subquery = 'SELECT  bidders.discount_percentage FROM bidders LEFT JOIN products ON bidders.id = products.bid_id WHERE products.bid_id = ?'
                var subParms = [authData[i].bid_id]
                const subData = await queryParamPromise(subquery, subParms)
                object.winner = {
                    "user_id": authData[i].user_id,
                    "user_name": authData[i].fullname,
                    "address": authData[i].address,
                    "city": authData[i].city,
                    "country": authData[i].country,
                    "discount_percentage": subData[0].discount_percentage
                }
            } else {
                object.winner = null
            }
            products.push(object)

        }
        return products;
    } catch (error) {
        console.log(error)
    }
}
productService.deleteProduct = async function (data) {
    try {
        if (data) {
            var currentTime = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss')
            var authSql = 'UPDATE products SET deleted_at = ? WHERE id = ? AND deleted_at IS Null'
            var requestPar = [currentTime, data.product_id]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
productService.getMyBIds = async function (data, body) {
    try {
        if (data) {
            var offset = (body.current_page - 1) * 10
            var pageSql = '';
            var order = 'ASC'
            if (body.current_page != '') {
                pageSql = `LIMIT 10 OFFSET ${offset}`;
                and = 'AND'
            }
            if (body.auction == 'finished') {
                order = 'DESC'
            }
            console.log(data);
            var defaultQurySql = `SELECT products.id, products.description,products.bid_price, products.max_bid_price, products.start_bid_time,products.country as product_country , products.end_bid_time, products.status, products.winner_id,products.bid_id,products.winning_amount, products.product_name,users.id AS user_id,users.fullname,users.address,users.city,users.country,
            (SELECT  GROUP_CONCAT(CONCAT('${imagePath}',product_images.image)) as images  FROM product_images WHERE product_images.product_id = products.id ) AS group_image,
            GROUP_CONCAT(bidders.id) as bidder_id,
            GROUP_CONCAT(bidders.bid_price) as my_bids,
             GROUP_CONCAT(bidders.amount_paid) AS amount_paid,
            GROUP_CONCAT(bidders.discount_percentage) as discount_percentage,
            GROUP_CONCAT(bidders.pre_deposit_payment_status) as pre_deposit_payment_status,
            GROUP_CONCAT(bidders.created_at) as created_at
             FROM products 
              LEFT JOIN users ON users.id = products.winner_id 
             LEFT JOIN bidders ON bidders.product_id = products.id  
            WHERE bidders.user_id = ? AND products.status = ? AND
            products.deleted_at IS Null GROUP BY  products.id ORDER BY end_bid_time ${order} ${pageSql}`;
            var requestPar = [data, body.auction]
        }
        var authData = await queryParamPromise(defaultQurySql, requestPar)
        var countSql = `SELECT COUNT(*) AS total_count
        FROM (SELECT products.id FROM products LEFT JOIN bidders ON bidders.product_id = products.id WHERE bidders.user_id = ? AND products.status = ? AND products.deleted_at IS NULL GROUP BY bidders.product_id) AS subquery;`;
        var countPar = [data, body.auction]
        var totalRecords = await queryParamPromise(countSql, countPar)
        // console.log(authData);
        var returnData = [];
        for (let i = 0; i < authData.length; i++) {
            authData[i].images = authData[i].group_image.split(",");
            productObject(authData[i]);
            var pre_deposit_payment_status = authData[i].pre_deposit_payment_status.split(",")
            var bidder_id = authData[i].bidder_id.split(",");
            var amount_paid = authData[0].amount_paid?.split(",");
            var bid_price = authData[i].my_bids.split(",");
            var created_at = authData[i].created_at.split(",");
            var discount_percentage = authData[i].discount_percentage.split(",")
            bid_price.forEach((element_, index_) => {
                object.bids.push({
                    "bidder_id": bidder_id[index_],
                    "price": bid_price[index_],
                    "created_at": created_at[index_],
                    "pre_deposit_payment_status": pre_deposit_payment_status[index_],
                    "discount_percentage": discount_percentage[index_],
                    "amount_paid": amount_paid?.[index_] ?? "0",
                });
            })
            if (authData[i].winner_id != 0) {
                var subquery = 'SELECT  bidders.discount_percentage FROM bidders LEFT JOIN products ON bidders.id = products.bid_id WHERE products.bid_id = ?'
                var subParms = [authData[i].bid_id]
                const subData = await queryParamPromise(subquery, subParms)
                object.winner = {
                    "user_id": authData[i].user_id,
                    "user_name": authData[i].fullname,
                    "address": authData[i].address,
                    "city": authData[i].city,
                    "country": authData[i].country,
                    "discount_percentage": subData[0].discount_percentage
                }
                // console.log(object);
            } else {
                object.winner = null
            }
            returnData.push(object);

        }
        var resultData = {}
        resultData.total_records = totalRecords[0].total_count
        resultData.products = returnData
        return resultData
    } catch (error) {
        console.log('error', error);
    }
}
productService.getBidder = async function (id) {
    try {
        if (id) {
            var authSql = 'SELECT * FROM bidders WHERE id = ?'
            var requestPar = [id]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
productService.getProductBidders = async function (product_id, bid_id) {
    try {
        if (product_id && bid_id) {
            var authSql = "SELECT * FROM bidders WHERE product_id = ? AND id != ? AND pre_deposit_payment_status = '2'"
            var requestPar = [product_id, bid_id]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
productService.checkPendingReq = async function (data) {
    try {
        var bidPrice = ''
        if (data.bid_price != '' && data.bid_price != undefined) {
            bidPrice = `AND bid_price = ${data.bid_price}`
        }
        if (data.bid_id != '' && data.bid_id != undefined) {
            bidPrice = `AND id = ${data.bid_id}`
        }
        var authSql = `SELECT id,user_id,product_id FROM bidders WHERE user_id = ? AND product_id = ? ${bidPrice}  AND pre_deposit_payment_status = '1'`
        var requestPar = [data.user_id, data.product_id]
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
productService.updatePendingReq = async function (data) {
    try {
        if (data) {
            var authSql = "UPDATE bidders SET pre_deposit_transection_id = ? , pre_deposit_payment_status = '2' WHERE id = ?";
            var requestPar = [data.confirm_payment_intent, data.bid_id]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
productService.getBidderById = async function (data, user) {
    try {
        if (user != '' && user != undefined) {
            var authSql = "SELECT user_id , bid_price, amount_paid, discount_percentage ,pre_deposit_payment_status FROM bidders WHERE id = ? AND user_id = ? AND (final_payment_status ='0' OR final_payment_status = '1')";
            var requestPar = [data.bid_id, user.id]
            const authData = await queryParamPromise(authSql, requestPar)
            return authData
        } else {
            var authSql = "SELECT user_id , bid_price, amount_paid, discount_percentage ,pre_deposit_payment_status FROM bidders WHERE id = ? AND (final_payment_status ='0' OR final_payment_status = '1')";
            var requestPar = [data.bid_id]
            const authData = await queryParamPromise(authSql, requestPar)
            return authData
        }

    } catch (error) {
        console.log('error', error);
    }
}
productService.updateBidderStatus = async function (data) {
    try {
        if (data) {
            var authSql = "UPDATE bidders SET final_payment_status = '1' WHERE id = ? AND (final_payment_status ='0' OR final_payment_status = '1')";
            var requestPar = [data.bid_id]
            const updateStatus = await queryParamPromise(authSql, requestPar)
            return updateStatus
        }

    } catch (error) {
        console.log('error', error);
    }
}
productService.checkPendingReqForProduct = async function (data) {
    try {

        var authSql = `SELECT id,user_id,product_id FROM bidders WHERE id = ? AND final_payment_status = '1'`
        var requestPar = [data.bid_id]
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
productService.updatePendingReqForProduct = async function (data) {
    try {
        if (data) {
            var authSql = "UPDATE bidders SET final_payment_transection_id = ? ,amount_paid = (amount_paid + ?), final_payment_status = '2' WHERE id = ?";
            var requestPar = [data.confirm_payment_intent, data.amount, data.bid_id]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
productService.updateDiscount = async function (data) {
    try {
        if (data) {
            var authSql = "UPDATE bidders SET discount_percentage = ?  WHERE id = ?";
            var requestPar = [data.discount, data.bid_id]
        }
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
productService.updateUserRefunds = async function (bid, refund) {
    try {
        var authSql = "UPDATE bidders SET refund_amount = ? ,refund_transection_id = ? WHERE id = ?";
        var requestPar = [refund.amount / 100, refund.id, bid.id]
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
productService.getBidPayload = async function (bid) {
    try {
        var authSql = "SELECT users.fullname,users.email,users.city,users.country,users.address,bidders.product_id,bidders.bid_price,bidders.amount_paid,bidders.discount_percentage ,products.product_name FROM users LEFT JOIN bidders ON users.id = bidders.user_id LEFT JOIN products ON products.id = bidders.product_id WHERE bidders.id = ?";
        var requestPar = [bid.id]
        const authData = await queryParamPromise(authSql, requestPar)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}
productService.getUserByCountry = function (data) {
    try {
        var authSql = `SELECT device_token,device_type FROM device_tokens LEFT JOIN users ON device_tokens.user_id = users.id WHERE FIND_IN_SET(users.country,'${data.country}')`;
        const authData = queryParamPromise(authSql)
        return authData
    } catch (error) {
        console.log('error', error);
    }
}

module.exports = productService;
