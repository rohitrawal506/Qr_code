var mysql = require("mysql");
const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require('body-parser');
const fileUpload = require("express-fileupload");
const apiroute = require('./router');
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use('/api', express.static(path.join(__dirname, 'public')));
// app.use(bodyParser.urlencoded({
//     extended: true
// }));

app.use(fileUpload({
    limits: {
        fileSize: 10000000, // Around 10MB
    },
    abortOnLimit: true,
}));



app.use('/api', apiroute);

app.use((err, req, res, next) => {
    console.log(err);
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    res.status(err.statusCode).json({
        message: err.message,
    });
});


app.listen(3000, () => {
    console.log(`Server is running on port ${3000}`);
})