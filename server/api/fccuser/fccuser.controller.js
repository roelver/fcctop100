/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /fccusers              ->  index
 * POST    /fccusers              ->  create
 * GET     /fccusers/:id          ->  show
 * PUT     /fccusers/:id          ->  update
 * DELETE  /fccusers/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Fccuser = require('./fccuser.model');
var fs = require('fs');
var https = require('https');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');

// Get list of fccusers
exports.index = function(req, res) {
    return res.status(200).send('<h1>Not Implemented</h1>');
};

exports.top100 = function(req, res) {

   var query = Fccuser
      .find({total: {$gt:0}});
   query.sort('-total -basejumps -ziplines -points');
   query.limit(100);
   query.exec(function(err, fccusers) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(fccusers);
   });
 //  db.fccusers.find({$or: [{points: {$gt:0}},{ziplines: {$gt:0}},{basejumps: {$gt:0}}]})
 //    .sort([{basejumps: -1},{ziplines: -1},{bonfires: -1},{waypoints: -1}, {points:-1}])
};

// Creates a new fccuser in the DB.
exports.load = function(req, res) {

  var addFccUser = function(username) {
        // return a function here
        return function(err, fccusers) {

            if (err) { return handleError(res, err); }

            if (!fccusers || fccusers.length == 0) { 
               console.log('Adding user:'+username, err, fccusers);
               var newUser = {
                  username: username,
                  existing: true,   // benefit of the doubt
                  points: 0,
                  ziplines: 0,
                  waypoints: 0,
                  bonfires: 0,
                  basejumps: 0,
                  total: 0,
                  lastUpdate: new Date()
               };
               Fccuser.create(newUser, function(err) {
                  if(err) { console.log(err); return handleError(res, err); }
               });
            }
        };
    };

  var total = 0;

  var opts = {
    host: 'gitter.im',
    method: 'GET',
    path: '/api/v1/rooms/546fd572db8155e6700d6eaf/users?access_token=f1670594b8b9cd40d03f724d989f7d1840530219'
  };
  var req = https.request(opts, function(resp) {
    console.log('In request');
    resp.setEncoding('utf-8');

    var responseString = '';

    resp.on('data', function(data) {
      responseString += data;
    });

    console.log('Processing Data ');
    resp.on('end', function() {

      console.log('End message: '+responseString.length);

      var users = JSON.parse(responseString);
      console.log('Rows: ', users.length);
      Fccuser.find().count(function(err, count) {

          total = users.length;
          if (count > 50) count = count - 50;
          console.log('Users received: '+total+' Skipping: '+count);

          for (var i=count; i< users.length; i++) {
              Fccuser.find({username: users[i].username}, addFccUser(users[i].username));
          }
          res.writeHead(200, {
            "Content-Type": "text/html"
          });

          res.write('<h1>Processed '+total+' records</h1>');
          res.end();

      });
    });
  });

  console.log('Start write');
  req.end();
};

// Updates an existing fccuser in the DB.
exports.verifyUpdate = function(req, res) {

   var rskip = 0;
   var rlimit = 10000000;

   var dt = new Date();
   dt.setDate(dt.getDate() - 2);

 //  var crit = {$and: [{"lastUpdate": { "$lt": dt}},{existing: true}]};
   var crit = {existing: true};
 //  var crit = {$and: [{total: {$exists: false}},{existing: true}]};

   setTimeout(doVerify, 100, crit, rskip, rlimit);
   res.status(200).send('<h1>Update verification started. Keep an eye on the logs</h1>').end();
};

// Updates an existing fccuser in the DB.
exports.verify = function(req, res) {

   var rskip = parseInt(req.params.skip);
   var rlimit = parseInt(req.params.limit);

   var crit = {};
   console.log(rskip);
   if (rskip == undefined || isNaN(rskip)) {
     console.log('Processing tech errors');
     crit = {img: "error"};
     rskip = 0;
     rlimit = 5000;
   }
   else {
     crit = {existing: true};
   }

   setTimeout(doVerify, 100, crit, rskip, rlimit);
   res.status(200).send('<h1>Verification started. Keep an eye on the logs</h1>').end();
};

var doVerify = function(crit, rskip, rlimit) {
  // var crit = {username: 'roelver'};
   var query = Fccuser.find(crit);

   query.skip(rskip);
   query.limit(25);

   query.exec(function (err, fccusers) {
    if (!fccusers || fccusers.length == 0) {rlimit = 0; }
    fccusers.forEach( function(fccusr) {
        var baseUrl = 'http://www.freecodecamp.com/'+fccusr.username;

        request(baseUrl, function(error, response, html){

            // First we'll check to make sure no errors occurred when making the request
            var json = { username : fccusr.username, 
                         img: '', 
                         existing : true, 
                         points : 0, 
                         ziplines: 0, 
                         basejumps: 0, 
                         waypoints: 0, 
                         bonfires: 0,
                         total: 0,
                         lastUpdate: new Date()};
            if(!error){
                // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality

                var $ = cheerio.load(html);

                if (html.indexOf("<title>Learn to Code and Build Projects for Nonprofits | Free Code Camp</title>") > 0) {
                   json.existing = false;
                   error = "404: Not found";
                   console.log(json.username + ' error:'+error);
                };

                if(!error){
                     $('h1.text-primary').filter(function(){
                       json.points = getPoints($(this));
                    });

                    $('.public-profile-img').filter(function(){
                       json.img = $(this)['0'].attribs.src;
                    });

                    var urls = [];
                    $('.table-striped td.col-xs-4 a').filter(function(){
                       urls.push($(this)['0'].attribs.href);
                    });

                    urls  = getUnique(urls);
                    urls.forEach(function(murl) {
                      if (murl.toLowerCase().indexOf('zipline') > 0) {json.ziplines++}
                      if (murl.toLowerCase().indexOf('basejump') > 0) {json.basejumps++}
                    });
 
                    var txts = [];
                    $('.table-striped td.col-xs-4').filter(function(){
                      var txt = $(this)['0'].children[0].data;
                      if (txt) {
                         txts.push(txt);
                      }
                    });

                    txts  = getUnique(txts);
                    txts.forEach(function(mtxt) {
                      if (mtxt.toLowerCase().indexOf('waypoint') >= 0) {json.waypoints++}
                      if (mtxt.toLowerCase().indexOf('bonfire') >= 0) {json.bonfires++}
                    });
                    console.log('Processing '+json.username);
                }
            }
            else {
                console.log('>>>>>>>>>'+json.username + ' error:'+error);
                json.existing = false;
                json.img = "error";
            }
            json.total = (json.basejumps * 60) + (json.ziplines * 30) + (json.bonfires * 3) + json.points;
            store(json);
        });

    });
    if (rskip < rlimit) {
      console.log('Submit another chunk: '+ rskip+' vs '+rlimit);
    //  rskip = rskip + 25;
      setTimeout(doVerify, 20000, crit, rskip, rlimit);
    }
    else {
      console.log('Processing completed: '+ rskip+' vs '+rlimit);
    }
  });
};

var getPoints = function(data) {
      var points = data.text();
      var start = points.indexOf('[ ')+2;
      var end = points.indexOf(' ]');
      return parseInt(points.substring(start,end));
};


var getUnique = function(arr) {
      var uniqueUrls = [];
      var x = {};
      for (var i = 0;i< arr.length; i++) {
          if (!x.hasOwnProperty(arr[i])) {
              uniqueUrls.push(arr[i]);
              x[arr[i]] = 1;
          }
      }
      return uniqueUrls;
};

// Updates an existing fccuser in the DB.
var store = function(obj) {
  Fccuser.find({username: obj.username}, function (err, fccusers) {
    if (err) { console.log('Failed to find '+obj.username+' Reason: '+err); return false; }
    if(!fccusers || fccusers.length == 0) { console.log(obj.username+' was not found'); return false;}
    var updated = _.merge(fccusers[0], obj);
    updated.save(function (err) {
      if (err) { console.log('Failed to update '+obj.username+' Reason: '+err); return false; }
      return true;
    });
  });
};


function handleError(res, err) {
  return res.status(500).send(err);
}