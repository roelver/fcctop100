'use strict';

var express = require('express');
var controller = require('./fccuser.controller');
var config = require('../../config/environment');

var router = express.Router();

router.get('/', controller.index);
router.get('/loadnew', controller.load);
router.get('/update/:username', controller.verifyUser);
router.get('/verify/error', controller.verify);
router.get('/verify/new', controller.verifyNew);
router.get('/verify/:skip/:limit', controller.verify);
router.get('/verify/update', controller.verifyUpdate);
router.get('/top100', controller.top100);

module.exports = router;
