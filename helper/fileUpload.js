const multer = require("multer");
const fse = require('fs-extra');
const path = require("path");

const { imagePath, baseImagePath } = require('../constant/config');

const tempStrorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const options = {mode: 0o2775,};

        if((req.url == '/categories')){
            var catPath = baseImagePath + 'Category';
            fse.ensureDir(catPath, options, err => {
                if(err == null){
                    cb(null, path.join(__dirname,'../'+baseImagePath + 'Category'))
                }
            })
        }else if((req.url == '/restaurants') || (req.url == '/restaurants/logo')){
            var restPath = baseImagePath + 'Restaurant';
            fse.ensureDir(restPath, options, err => {
                if(err == null){
                    cb(null, path.join(__dirname,'../'+baseImagePath + 'Restaurant'))
                }
            })
        }else if((req.url == '/products')){
            var prodPath = baseImagePath + 'Product';
            fse.ensureDir(prodPath, options, err => {
                if(err == null){
                    cb(null, path.join(__dirname,'../'+baseImagePath + 'Product'))
                }
            })
        }else{
            cb(null, path.join(__dirname,'../../public/assets/uploads/temp'))
        }
    },
    filename: function (req, file, callback) {
        req.storeSingleImage = file.fieldname + "-" + new Date().getTime() + path.extname(file.originalname);
        callback(null, file.fieldname + "-" + new Date().getTime() + path.extname(file.originalname));
    }
});
const image = multer({ 
    storage: tempStrorage,
    limits: { fileSize: 1000000 /* 1MB SIZE IMAGE */ },
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
            } else {
            return cb(
                new Error('Only .png, .jpg and .jpeg format allowed!')
            );
        }
    }
});

module.exports = image