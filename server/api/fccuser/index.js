'use strict';

var express = require('express');
var controller = require('./fccuser.controller');
var config = require('../../config/environment');

var router = express.Router();

router.get('/', controller.index);
router.get('/load', controller.load);
router.get('/verify/error', controller.verify);
router.get('/verify/:skip/:limit', controller.verify);
router.get('/verify/update', controller.verifyUpdate);
router.get('/top100', controller.top100);

module.exports = router;
