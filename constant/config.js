require('dotenv').config();
const config = {
    DB_HOST: process.env.DB_HOST,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_DATABASE: process.env.DB_DATABASE,
}

const message = {
    ERROR_MESSAGE: 'Something Went Wrong',
}

const url = 'http://';
const Port = 'localhost:3000';
const baseImagePath = 'public/assets/uploads/';
const imagePath = url + Port + '/api/assets/uploads/';
const NotimagePath = url + Port + '/assets/img/No_Image_Available.jpeg';
const web_url = url + 'localhost:5173';

module.exports = { config, message, imagePath, NotimagePath, baseImagePath, web_url }