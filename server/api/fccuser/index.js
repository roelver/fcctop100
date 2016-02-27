'use strict';

var express = require('express');
var controller = require('./fccuser.controller');
var config = require('../../auth/github/config');
var jwt = require('jwt-simple');
var moment = require('moment');


var router = express.Router();

router.get('/', controller.index);

router.get('/loadmore', controller.loadMore);

router.get('/update/all', controller.updateAll);
router.get('/update/active', controller.updateActive);
router.get('/update/top', controller.updateTop500);
//router.get('/dedub', controller.deDouble);
router.get('/update/:username', controller.verifyUser);
router.get('/verify/error', controller.verifyError);
router.get('/verify/username/:username', controller.getVerifiedUsername);
router.get('/verify/new', controller.verifyNew);
router.get('/verify/update', controller.updateExpired);
router.get('/following/recent/:meuser', ensureAuthenticated, controller.followingRecent);
//router.get('/recent', controller.api500recent);
router.get('/top100/recent', controller.top100recent);
//router.get('/alltime', controller.api500alltime);
router.get('/top100/alltime', controller.top100alltime);
router.get('/ranking-o/:username', controller.userRankingOverall);
router.get('/ranking-r/:username', controller.userRankingRecent);

// Support new API for Codepen
//router.get('/recent/:sortcol', controller.api100recent);
//router.get('/alltime/:sortcol', controller.api100alltime);

// Optimized for help API on Codepen
router.get('/top/recent', controller.topRecent);
router.get('/top/alltime', controller.topAlltime);


/// FIX for FCC zipline: Swap the optimized API with the sortcolumn
router.get('/recent/:sortcol', controller.api100recent);
router.get('/alltime/:sortcol', controller.api100alltime);

// Optimized for help API on Codepen
//router.get('/top/recent', controller.api100recent);
//router.get('/top/alltime', controller.api100alltime);


router.put('/follow/:meuser/:followuser', ensureAuthenticated, controller.followUser);
router.put('/unfollow/:meuser/:followuser', ensureAuthenticated, controller.unfollowUser);


function ensureAuthenticated(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
  }
  var token = req.headers.authorization.split(' ')[1];

  var payload = null;
  try {
    payload = jwt.decode(token, config.TOKEN_SECRET);
  }
  catch (err) {
    return res.status(401).send({ message: err.message });
  }

  if (payload.exp <= moment().unix()) {
    return res.status(401).send({ message: 'Token has expired' });
  }
  req.user = payload.sub;
  next();
}

module.exports = router;


