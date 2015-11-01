'use strict';

var express = require('express');
var router = express.Router();
var qs = require('querystring');
var logger = require('morgan');
var jwt = require('jwt-simple');
var mongoose = require('mongoose');
var moment = require('moment');
var request = require('request');
var async = require("async");
var Fccuser = require('../../api/fccuser/fccuser.model');

var config = require('./config');


/*
 |--------------------------------------------------------------------------
 | Login with GitHub
 |--------------------------------------------------------------------------
 */
router.post('/', function(req, res) {
  var accessTokenUrl = 'https://github.com/login/oauth/access_token';
  var userApiUrl = 'https://api.github.com/user';
  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: config.GITHUB_SECRET,
    redirect_uri: req.body.redirectUri
  };

  // Step 1. Exchange authorization code for access token.
  request.get({ url: accessTokenUrl, qs: params }, function(err, response, accessToken) {
    accessToken = qs.parse(accessToken);
    var headers = { 'User-Agent': 'Satellizer' };

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: userApiUrl, qs: accessToken, headers: headers, json: true }, function(err, response, profile) {

      // Step 3a. Link user accounts.
      if (req.headers.authorization) {
        Fccuser.findOne({ username: profile.login }, function(err, existingUser) {
          if (existingUser) {
            return res.status(409).send({ message: 'There is already a GitHub account that belongs to you' });
          }
          var token = req.headers.authorization.split(' ')[1];
          var payload = jwt.decode(token, config.TOKEN_SECRET);
          Fccuser.findById(payload.sub, function(err, user) {
            if (!user) {
              return res.status(400).send({ message: 'User not found' });
            }
	         user.save(function() {
	            var token = createJWT(user);
   	         res.send({ token: token });
            });
          });
        });
      } else {
        // Step 3b. Create a new user account or return an existing one.
        Fccuser.findOne({ username: profile.login }, function(err, existingUser) {
          if (existingUser) {
            var token = createJWT(existingUser);
            return res.send({ token: token });
          }
          var user = new Fccuser();
          user.username= profile.login;
          user.existing= true;  // benefit of the doubt
          user.total= 0;
          user.totalRecent = 0;
          user.lastUpdate = new Date((new Date())-1000*60*60);
          user.save(function() {
            var token = createJWT(user);
            res.send({ token: token });
          });
        });
      }
    });
  });
});

/*
 |--------------------------------------------------------------------------
 | GET /api/me
 |--------------------------------------------------------------------------
 */
router.get('/me', ensureAuthenticated, function(req, res) {
  Fccuser.findById(req.user, function(err, user) {
     var imgs = [];
     user.followimg = [];
     async.each(user.following, function(usernm, callback) {
        Fccuser.findOne({username: usernm}, function(err, fccuser) {
          if (fccuser) {
            imgs.push(fccuser.img);
          }
          callback();
        })
     }, function(err) {
          if (err) {
             console.log('Error', err);
          }
          var usercp = JSON.parse(JSON.stringify(user));
          usercp.followimg = imgs;
          res.send(usercp);
     });
  });
});

/*
 |--------------------------------------------------------------------------
 | PUT /api/me
 |--------------------------------------------------------------------------
 */
router.put('/me', ensureAuthenticated, function(req, res) {
  Fccuser.findOne({username: req.username}, function(err, user) {
    if (!user) {
      return res.status(400).send({ message: 'User '+req.username+' not found' });
    }
    res.status(200).end();
  });
});


/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
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

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function createJWT(user) {
  var payload = {
    sub: user._id,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  };
  return jwt.encode(payload, config.TOKEN_SECRET);
}


module.exports = router;