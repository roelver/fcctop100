'use strict';

var express = require('express');
var controller = require('./fccuser.controller');
var config = require('../../config/environment');

var router = express.Router();

router.get('/', controller.index);
router.get('/loadnew', controller.load);
router.get('/update/all', controller.updateAll);
router.get('/update/:username', controller.verifyUser);
router.get('/verify/error', controller.verifyError);
router.get('/verify/new', controller.verifyNew);
router.get('/verify/update', controller.updateExpired);
router.get('/top100/recent', controller.top100recent);
router.get('/top100/alltime', controller.top100alltime);
router.get('/ranking-o/:username', controller.userRankingOverall);
router.get('/ranking-r/:username', controller.userRankingRecent);

module.exports = router;
