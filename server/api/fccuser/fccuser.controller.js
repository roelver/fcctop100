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

exports.top100alltime = function(req, res) {

   var query = Fccuser
      .find({total: {$gt:0}});
   query.sort('-total -basejumps -ziplines -points');
   query.limit(100);
   query.exec(function(err, fccusers) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(fccusers);
   });
};

exports.top100recent = function(req, res) {

   var query = Fccuser
      .find({totalRecent: {$gt:0}});
   query.sort('-totalRecent -total -basejumpsRecent -ziplinesRecent -pointsRecent');
   query.limit(100);
   query.exec(function(err, fccusers) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(fccusers);
   });
};

exports.userRankingOverall = function(req, res) {
	userRanking (req, res, true);
};

exports.userRankingRecent = function(req, res) {
	userRanking (req, res, false);
};



// Creates a new fccuser in the DB.
exports.load = function(req, res) {

  var addFccUser = function(username) {
        // return a function here
        return function(err, fccusers) {

            if (err) { return handleError(res, err); }

            if (!fccusers || fccusers.length == 0) { 
               console.log('Adding user:'+username);
               var newUser = {
                  username: username,
                  existing: true,   // benefit of the doubt
                  points: 0,
                  ziplines: 0,
                  waypoints: 0,
                  bonfires: 0,
                  basejumps: 0,
                  total: 0,
                  pointsRecent: 0,
                  ziplinesRecent: 0,
                  waypointsRecent: 0,
                  bonfiresRecent: 0,
                  basejumpsRecent: 0,
                  totalRecent: 0,
                  lastUpdate: new Date((new Date())-1000*60*60)
               };
               Fccuser.create(newUser, function(err, data) {
                  if(err) { console.log(err); return handleError(res, err); }
                //  updateUser(data.username);
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
    resp.setEncoding('utf-8');

    var responseString = '';

    resp.on('data', function(data) {
      responseString += data;
    });

    console.log('Processing User Data from Chat');
    resp.on('end', function() {

      var users = JSON.parse(responseString);
      Fccuser.find().count(function(err, count) {

          for (var i=count; i< users.length; i++) {
              Fccuser.find({username: users[i].username}, addFccUser(users[i].username));
          }
          res.writeHead(200, {
            "Content-Type": "text/html"
          });
          res.write('<h1>Processed '+count+' records</h1>');
          res.end();

      });
    });
  });

  req.end();
  // Start processing the new users in 1 minute
  var crit = {$or: [{img: { "$exists": false}}, {$and: [{img: {"$exists": true}},{img: ""},{existing: true}]}]};
  setTimeout(doVerify, 60000, crit);

};

// Updates an existing fccuser in the DB.
exports.verifyUser = function(req, res) {

   var user = req.params.username;
   updateUser(user);
   res.status(200).send("OK");
};

// Updates an fccuser without an image but with existing=true.
exports.verifyNew = function(req, res) {

   var crit = {$or: [{img: { "$exists": false}}, {$and: [{img: {"$exists": true}},{img: ""},{existing: true}]}]};
   setTimeout(doVerify, 100, crit);
   res.status(200).send('<h1>Update new users started. Keep an eye on the logs</h1>').end();
};

// Updates users that wer no
exports.updateExpired = function(req, res) {

   var crit = {"$and": [{"lastUpdate": { "$lt": new Date((new Date())-1000*60*60*24)}},{existing: true}]};
   setTimeout(doVerify, 100, crit);
   res.status(200).send('<h1>Update verification started. Keep an eye on the logs</h1>').end();
};

// Updates an existing fccuser in the DB.
exports.updateAll = function(req, res) {

   var crit = {$and: [{existing: true}, {lastUpdate: {$lt: new Date((new Date())-1000*60*60*3)}}]};
   setTimeout(doVerify, 100, crit);
   res.status(200).send('<h1>Verification started. Keep an eye on the logs</h1>').end();
};

//
// Updates all users that were not updated because of an error
//
exports.verifyError = function(req, res) {
   var crit = {img: "error"};
   setTimeout(doVerify, 100, crit);
   res.status(200).send('<h1>Verification started. Keep an eye on the logs</h1>').end();
};

//
// Do the update. This procedure will update users in batches of 25 to avoid overloading the FCC server. 
// It waits 20 seconds, betore the new update batch starts 
//
var doVerify = function(crit) {

   var query = Fccuser.find(crit);
   query.limit(25);
   query.exec(function (err, fccusers) {
      
      if (fccusers && fccusers.length > 0) {
        console.log('Processing batch with ',fccusers.length,'users' );
        fccusers.forEach( function(fccusr) {

            var baseUrl = 'http://www.freecodecamp.com/'+fccusr.username;

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
                         pointsRecent : 0, 
                         ziplinesRecent: 0, 
                         basejumpsRecent: 0, 
                         waypointsRecent: 0, 
                         bonfiresRecent: 0,
                         totalRecent: 0,
                         lastUpdate: new Date()
                      };

            request(baseUrl, function(error, response, html) {

                if (error) {
                   console.log('>>>>>>>>>'+json.username + ' error:'+error);
                   json.existing = false;
                   json.img = "error";
                   store(json);
                   return;
                }

                 // Forwarded to the FCC homepage???
                if (html.indexOf("<title>Learn to Code and Build Projects for Nonprofits | Free Code Camp</title>") > 0) {
                   json.existing = false;
                   error = "404: Not found";
                   console.log(json.username + ' error:'+error);
                   store(json);
                   return;
                };

                console.log('Processing user: ', json.username);
                var $ = cheerio.load(html);

                $('h1.text-primary').filter(function(){
                   json.points = getPoints($(this));
                });

                $('.public-profile-img').filter(function(){
                   json.img = $(this)['0'].attribs.src;
                });

                var threshold = new Date().getTime() - 30*24*60*60*1000;

                var challenges = [];
                $('.table-striped tr').filter(function(){
                   var row = $(this)['0'];
                   var rowdata = {};
                   if (row.children[0].children[0].data == undefined) {
                      if (row.children[0].children[0].children[0]) {
                          rowdata.title = row.children[0].children[0].children[0].data;
                      }
                      else {
                        rowdata.title = "What!?! "+json.username;
                      }
                   }
                   else {
                      rowdata.title = row.children[0].children[0].data;
                   }
                   rowdata.date = Date.parse(row.children[1].children[0].data);
                   challenges.push(rowdata);
                });

                var uniqueChallenges = getUnique(challenges);

                uniqueChallenges.forEach(function(challenge) {
                  if (challenge.title.toLowerCase().indexOf('basejump') == 0) {
                      json.basejumps++;
                      if (challenge.date > threshold) {
                        json.basejumpsRecent++;
                      }
                  }
                  if (challenge.title.toLowerCase().indexOf('zipline') == 0) {
                      json.ziplines++;
                      if (challenge.date > threshold) {
                        json.ziplinesRecent++;
                      }
                  }
                  if (challenge.title.toLowerCase().indexOf('bonfire') == 0) {
                      json.bonfires++;
                      if (challenge.date > threshold) {
                        json.bonfiresRecent++;
                      }
                  }
                  if (challenge.title.toLowerCase().indexOf('waypoint') == 0) {
                      json.waypoints++;
                      if (challenge.date > threshold) {
                        json.waypointsRecent++;
                      }
                  }
                }); 

                getRecentScores(html, json, threshold);
        
                json.totalRecent = (json.basejumpsRecent * 60) + (json.ziplinesRecent * 30) 
                                  + (json.bonfiresRecent * 3) + json.pointsRecent;
                json.total = (json.basejumps * 60) + (json.ziplines * 30) + (json.bonfires * 3) + json.points;
                store(json);
            });

        });
        setTimeout(doVerify, 20000, crit);
      }
  });
};

var getPoints = function(data) {
      var points = data.text();
      var start = points.indexOf('[ ')+2;
      var end = points.indexOf(' ]');
      return parseInt(points.substring(start,end));
};

var getRecentScores = function(html, json, threshold) {

  var heatmapDataStart = html.indexOf('var calendar =');
  if (heatmapDataStart >0) {
      heatmapDataStart += 15;
      var heatmapDataEnd =   html.indexOf('}', heatmapDataStart) +1;
      var heatmap  = JSON.parse(html.substring(heatmapDataStart, heatmapDataEnd));
      json.pointsRecent = getRecentPoints(heatmap, threshold);
  }
};

var getRecentPoints = function(heatmap, threshold) {
  var recentPoints = 0;
  for (var key in heatmap) {
     if (heatmap.hasOwnProperty(key) && parseFloat(key) > (threshold/1000)) {
        recentPoints++;
    }
  }
  return recentPoints;
};

var updateUser = function(user) {
    var crit = {$and: [{username: user}, {lastUpdate: {$lt: new Date((new Date())-1000*60*60*0.01)}}]};
    doVerify(crit);  
};

var getUnique = function(arr) {
      var uniqueChals = [];
      var x = {};
      for (var i = arr.length-1;i>=0; i--) {
          if (!(isNaN(arr[i].date)  ||   x.hasOwnProperty(arr[i].title))) {
              uniqueChals.push(arr[i]);
              x[arr[i].title] = 1;
          }
      }
      return uniqueChals;
};

var userRanking = function(req, res, overall) {

	var userid = req.params.username;
	if (!userid) {return handleError(res, 'No user name');}

   Fccuser.findOne({username: { $regex : new RegExp(userid, "i") }}, function(err, singleUser) {

	  	if (err || singleUser == null) return handleError(res, err);
   	var crit = {};
   	if (overall) {
   		crit = {total: {$gt: singleUser.total }};
   	}
   	else {
   		crit = {totalRecent: {$gt: singleUser.totalRecent }};
   	}
   	Fccuser.find(crit).count().exec(function (err, count) {
	   	if (err) return handleError(res, err);
	   	var sUser = JSON.parse(JSON.stringify(singleUser));
   		sUser.ranking = count+1;
	      return res.status(200).json(sUser);
		});
   });
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
