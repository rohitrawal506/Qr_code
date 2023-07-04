var express = require("express");
var app = express();

var auth = require('./router/api/authApi');
var user = require('./router/api/userApi');
var content = require('./router/api/contentApi');
var product = require('./router/api/productApi');
var promocode = require('./router/api/promocodeApi');
var payment = require('./router/api/paymentApi');
var discount = require('./router/api/discountApi');
var bids = require('./router/api/bidsApi');
var setting = require('./router/api/settingsApi');

app.use("/", auth);
app.use("/", user);
app.use("/", content);
app.use("/", product);
app.use("/", promocode);
app.use("/", payment);
app.use("/", discount);
app.use("/", bids);
app.use("/", setting);

// app.use("/", restaurant);

module.exports = app;