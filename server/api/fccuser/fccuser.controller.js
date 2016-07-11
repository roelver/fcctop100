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

exports.topRecent = function(req, res) {
  return topSimple(req, res, 'communityRecent');
};

exports.topAlltime = function(req, res) {
  return topSimple(req, res, 'community');
};

exports.api100alltime = function(req, res) {

   var sorton = '-'+req.params.sortcol;
   // assume that users hiding their results, don't want to be listed in the top100
   var query = Fccuser.find({$or: [{projects: {$gt:0}},{algorithms: {$gt:0}},{challenges: {$gt:0}}]});
   query.sort(sorton);
   query.select('username img total points projects '+
                'challenges algorithms community lastUpdate');
   query.limit(100);
   query.exec(function(err, users) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(users);
   });
};

exports.api100recent = function(req, res) {

   var sorton = '-'+req.params.sortcol+"Recent";
   // assume that users hiding their results, don't want to be listed in the top100
   var query = Fccuser.find({$or: [{projects: {$gt:0}}, {algorithms: {$gt:0}},{challenges: {$gt:0}}]});
   query.sort(sorton);
   query.select('username img totalRecent pointsRecent projectsRecent '+
                'challengesRecent algorithmsRecent communityRecent lastUpdate');
   query.limit(100);
   query.exec(function(err, users) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(users);
   });
};

exports.api500alltime = function(req, res) {

   var query = Fccuser
      .find({total: {$gt:0}});
   query.sort('-total -points');
   query.select('username img points pointsRecent projects '+
                'projectsRecent challenges challengesRecent algorithms algorithmsRecent lastUpdate');
   query.limit(500);
   query.exec(function(err, users) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(users);
   });
};

exports.api500recent = function(req, res) {

   var query = Fccuser
      .find({totalRecent: {$gt:0}});
   query.sort('-totalRecent -pointsRecent');
   query.select('username img points pointsRecent projects '+
                'projectsRecent challenges challengesRecent algorithms algorithmsRecent lastUpdate');
   query.limit(500);
   query.exec(function(err, users) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(users);
   });
};

exports.top100alltime = function(req, res) {

   var query = Fccuser
      .find({total: {$gt:0}});
   query.sort('-total -projects -points');
   query.limit(500);
   query.exec(function(err, fccusers) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(fccusers);
   });
};

exports.top100recent = function(req, res) {

   var query = Fccuser
      .find({totalRecent: {$gt:0}});
   query.sort('-totalRecent -total -projectsRecent -pointsRecent');
   query.limit(500);
   query.exec(function(err, fccusers) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(fccusers);
   });
};

exports.followingRecent = function(req, res) {
   var me = req.params.meuser;

   Fccuser.findOne({ username: me }, function(err, fccuser) { 
      if (err) return next(err);
      if (!fccuser) return res.status(401).send('Unauthorized');
      var following = fccuser.following;
      following.push(me);

      var query = Fccuser
        .find({username: {$in: following}});
      query.sort('-totalRecent -total -projectsRecent -pointsRecent');
      query.exec(function(err, fccusers) {
          if (err) { return handleError(res, err); }
          return res.status(200).json(fccusers);
      });
    });
};

exports.userRankingOverall = function(req, res) {
	userRanking (req, res, true);
};

exports.userRankingRecent = function(req, res) {
	userRanking (req, res, false);
};

exports.unfollowUser = function(req, res) {
  var me = req.params.meuser;
  var follow = req.params.followuser;

  Fccuser.findOne({ username: me }, function(err, fccuser) { 
    if (err) return next(err);
    if (!fccuser) return res.status(401).send('Unauthorized');
    var pos = fccuser.following.indexOf(follow);
    if (pos >= 0) {
       fccuser.following.splice(pos, 1);
       fccuser
         .save(function(err) {
             if (err) {
                res.send(err);
             }
             else {
                console.log("User is updated")
              res.json(fccuser);
             }
          });
    }
    else {
      res.status(404).send('Not following '+follow);
    }
  });
};

exports.followUser = function(req, res) {
  var me = req.params.meuser;
  var follow = req.params.followuser;

  Fccuser.findOne({ username: me }, function(err, fccuser) { 
    if (err) return next(err);
    if (!fccuser) return res.status(401).send('Unauthorized');
    var pos = fccuser.following.indexOf(follow);
    if (pos < 0) {
       fccuser.following.push(follow);
       fccuser
         .save(function(err) {
             if (err) {
                res.send(err);
             }
             else {
                res.json(fccuser);
             }
          });
    }
    else {
      res.status(404).send('Already following '+follow);
    }
  });
};

exports.deDouble = function(req, res) {

   Fccuser
     .aggregate( [
        { $group: { _id: { username: "$username" },
               count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $project: { _id: 0, username: "$_id.username"}}
        ], function (err, results) {
        if (err) {
            next(err);
        } else {
          results.forEach(function(user) {
            console.log('Query', user, user.username);
            var query = Fccuser.find({username: user.username});
            query.sort({lastUpdate: 'asc'});
            query.limit(1);
            query.exec(function(err, user) {
              if (err) {
                 console.log('Error', err, user);  
              }
              else {
                console.log('Delete', user[0].username, user[0]._id);
                Fccuser.findById(user[0]._id).remove().exec();
              }
            });

          });
          res.json(results);
        }
    } );

};

var addFccUser = function(username, idx) {

   var newUser = {
      username: username,
      existing: true,   // benefit of the doubt
      points: 0,
      challenges: 0,
      algorithms: 0,
      projects: 0,
      community: 0,
      total: 0,
      pointsRecent: 0,
      challengesRecent: 0,
      algorithmsRecent: 0,
      projectsRecent: 0,
      communityRecent: 0,
      totalRecent: 0,
      lastUpdate: new Date((new Date())-1000*60*60)
   };

   Fccuser.findOne ({username: username}, function(err, data) {
      if(err) { console.log(err); return handleError(res, err); }
      if (!data) {
        Fccuser.create(newUser, function(err, data) {
           console.log('Added new user:'+username);
           setTimeout(updateUser, (200*idx), username);
        });
      }
      else {
           console.log('User existed: '+username);        
      }
    //  updateUser(data.username);
   });
};
  

// Load all users from the chat.
exports.loadMore = function(req, res) {

   Fccuser.find().count().exec(function (err, count) {
      if (err) return handleError(res, err);
      setTimeout(loadNextChunk, 0, count+2400, 5);

      return res.status(200).send('<h1>Loading new users from chat starting from '+count+'. Keep an eye on the logs.</h1>');
    });

};

var loadNextChunk = function(skip, limit) {

  var opts = {
    host: 'gitter.im',
    method: 'GET',
    path: '/api/v1/rooms/546fd572db8155e6700d6eaf/users?access_token=7ad0f9a65347ce116fb5dec4c33f798e316500d0'+
    '&limit='+limit+'&skip='+skip  
  };

  console.log("Loading next chunk of "+limit+" users after skipping " + skip);
  var req = https.request(opts, function(resp) {
    resp.setEncoding('utf-8');

    var responseString = '';

    resp.on('data', function(data) {
      responseString += data;
    });

    resp.on('end', function() {

      var users = JSON.parse(responseString);
      for (var i=0; i< users.length; i++) {
           addFccUser(users[i].username);
      }
      setTimeout(loadNextChunk, 15000, (skip+limit), limit);

    });
  });

  req.end();

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

   var crit = {$and: [{existing: true}, {lastUpdate: {$lt: new Date((new Date())-1000*60*60*5)}}]};
   setTimeout(doVerify, 100, crit);
   res.status(200).send('<h1>Verification started. Keep an eye on the logs</h1>').end();
};

// Updates an existing fccuser in the DB.
exports.updateActive = function(req, res) {

   var crit = {$and: [{existing: true}, {pointsRecent: {$gt: 0}}, {lastUpdate: {$lt: new Date((new Date())-1000*60*60*5)}}]};
   setTimeout(doVerify, 100, crit);
   res.status(200).send('<h1>Update active users started. Keep an eye on the logs</h1>').end();
};

// Updates an existing fccuser in the DB.
exports.updateTop500 = function(req, res) {

   var top500users = []; 
   var query = Fccuser
      .find({$and: [{existing: true}, {totalRecent: {$gt: 10}}]});
   query.sort('-totalRecent -total -projectsRecent -pointsRecent');
   query.limit(500);
   query.exec(function(err, fccusers) {
      if (err) { return handleError(res, err); }
      fccusers.forEach(function(user) {
        top500users.push(user.username);
      });
      console.log(top500users);
      var aWhileAgo = new Date((new Date())-1000*60*20);  // cool down to prevent that the same records will be updated over and over again 
      var crit = JSON.parse('{ "$and": [{"username": { "$in" : '+JSON.stringify(top500users)+'}}, {"lastUpdate": {"$lt": "'+aWhileAgo+'"}}]}');
      setTimeout(doVerify, 100, crit);
   });
   res.status(200).send('<h1>Update top500 active users started. Keep an eye on the logs</h1>').end();
};


//
// Updates all users that were not updated because of an error
//
exports.verifyError = function(req, res) {
   var crit = {img: "error"};
   setTimeout(doVerify, 100, crit);
   res.status(200).send('<h1>Verification started. Keep an eye on the logs</h1>').end();
};

exports.getVerifiedUsername = function(req, res) {

  var userid = req.params.username;
  if (!userid) {return handleError(res, 'No user name');}
   Fccuser.findOne({username: { $regex : new RegExp(userid, "i") }}, function(err, singleUser) {

      if (err || singleUser == null) return handleError(res, err);
      return res.status(200).json(singleUser);
    });
};

//
// Do the update. This procedure will update users in batches of 25 to avoid overloading the FCC server. 
// It waits 20 seconds, betore the new update batch starts 
//
var doVerify = function(crit) {

   var query = Fccuser.find(crit);
   query.limit(5);
   query.exec(function (err, fccusers) {
      
      if (fccusers && fccusers.length > 0) {
        if (fccusers.length > 1) {
           console.log('Processing batch with',fccusers.length,'users' );
        }
        fccusers.forEach( function(fccusr) {

            var baseUrl = 'http://www.freecodecamp.com/'+fccusr.username;

            // First we'll check to make sure no errors occurred when making the request
            var json = { username : fccusr.username, 
                         img: '', 
                         existing : true, 
                         points : 0, 
                         projects: 0, 
                         algorithms: 0, 
                         challenges: 0,
                         community: 0,
                         total: 0,
                         pointsRecent : 0, 
                         projectsRecent: 0, 
                         algorithmsRecent: 0, 
                         challengesRecent: 0,
                         communityRecent: 0,
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

                 // Forwarded to the FCC Map page with this title ???
                if (!html || !json.username || html.toLowerCase().indexOf("<title>camper "+json.username.toLowerCase()) < 0) {
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
                var thresh = new Date().getTime();

                var threshold = thresh - (thresh%(24*60*60*1000)) - 60*60*1000 - 30*24*60*60*1000;
                $('table.table-striped').filter(function(){
                   var table = $(this)['0'];
                 //  console.log("Table",table);
                   var title = table.children[0].children[0].children[0].children[0].data;
                   var isProjects = (title === "Projects");
                   var isAlgorithms = (title === "Algorithms");
                   var isChallenges = (title === "Challenges");
                   var all = [];
                   for (var i=1;i < table.children.length; i++) {
                      var rowdata = {};
                      if (isProjects) {
                        rowdata.title = table.children[i].children[0].children[0].children[0].data;
                      }
                      else {
                        if (table.children[i].children[0].children[0]) {
                          rowdata.title = table.children[i].children[0].children[0].data;
                        }
                        else {
                          rowdata.title = "Unknown";
                        }
                      }
                      rowdata.recent = (Date.parse(table.children[i].children[1].children[0].data) >= threshold);
                      all.push(rowdata);
                    }
                    var allUnique = getUnique(all);
                    for (var i=0; i < allUnique.length; i++) {
                      if (isProjects) {
                        json.projects++;
                        if (allUnique[i].recent) {
                          json.projectsRecent++;
                        }
                      }
                      if (isAlgorithms) {
                        json.algorithms++;
                        if (allUnique[i].recent) {
                          json.algorithmsRecent++;
                        }
                      }

                      if (isChallenges) {
                        json.challenges++;
                        if (allUnique[i].recent) {
                          json.challengesRecent++;
                        }
                      }

                    }

                });

                getRecentScores(html, json, threshold);
        
                json.totalRecent = (json.projectsRecent * 50) + json.pointsRecent;
                json.total = (json.projects * 50) + json.points;
                json.community = json.points - json.projects - json.algorithms - json.challenges;
                json.communityRecent = json.pointsRecent - json.projectsRecent - json.algorithmsRecent - json.challengesRecent;

                console.log("Projects:"+json.projectsRecent+'/'+json.projects+
                           "\nAlgorithms:"+json.algorithmsRecent+'/'+json.algorithms+
                            "\nChallenges:"+json.challengesRecent+'/'+json.challenges+
                            "\nPoints:"+json.pointsRecent+'/'+json.points+
                            "\nCommunity:"+json.communityRecent+'/'+json.community+
                            "\nTotal:"+json.totalRecent+'/'+json.total
                            );

                store(json);
            });

        });
        setTimeout(doVerify, 15000, crit);
      }
  });
};

var getPoints = function(data) {
      var points = data.text();
      var start = points.indexOf('[ ')+2;
      var end = points.indexOf(' ]');
      return parseInt(points.substring(start,end));
};

/*
 * Return data for the FCC project
 */
var topSimple = function(req, res, sortcol) {

   // assume that users hiding their results, don't want to be listed in the top100
   var query = Fccuser.find({$or: [{projects: {$gt:0}}, 
                                   {algorithms: {$gt:0}},
                                   {challenges: {$gt:0}}]});
   query.sort('-'+sortcol);
   query.select('username img community communityRecent lastUpdate');
   query.limit(100);
   query.exec(function(err, users) {
      if (err) { return handleError(res, err); }
      var output = users.map(function(user) {
          var newUser = {
            username: user.username,
            img: user.img,
            alltime: user.community,
            recent: user.communityRecent,
            lastUpdate: user.lastUpdate
          };
          return newUser;
      });
      return res.status(200).json(output);
   });
};

var getRecentScores = function(html, json, threshold) {

  var heatmapDataStart = html.indexOf('var calendar =');
  if (heatmapDataStart >0) {
      heatmapDataStart += 15;
      var heatmapDataEnd =   html.indexOf('}', heatmapDataStart) +1;
      var heatmap  = JSON.parse(html.substring(heatmapDataStart, heatmapDataEnd));
   //   console.log("Threshold: "+threshold, heatmap.length);
      json.pointsRecent = getRecentPoints(heatmap, threshold);
  }
};

var getRecentPoints = function(heatmap, threshold) {
  var recentPoints = 0;
  for (var key in heatmap) {
     if (heatmap.hasOwnProperty(key) && parseFloat(key) > (threshold/1000)) {
        recentPoints++;
    //    console.log("Counted"+recentPoints+": "+key, parseFloat(key)+"vs."+(threshold/1000));
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
          if (!(x.hasOwnProperty(arr[i].title))) {
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
