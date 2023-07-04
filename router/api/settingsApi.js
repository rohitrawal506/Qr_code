// const { Router } = require('express')
var express = require("express");
var router = express.Router();
var authJwt = require('../../app/middleware/authJwt')
var SettingsController = require('../../app/controller/api/settings/settings');


router.get('/setting_get', (request, response, next) => {
    SettingsController.getSetting(request, response, next)
})



module.exports = router