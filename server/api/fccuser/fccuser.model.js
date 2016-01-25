'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var FccuserSchema = new Schema({
  username: String,
  existing: Boolean,
  img: String,
  points: Number,
  pointsRecent: Number,
  projects: Number,
  projectsRecent: Number,
  challenges: Number,
  challengesRecent: Number,
  algorithms: Number,
  algorithmsRecent: Number,
  total: Number,
  totalRecent: Number,
  community: Number,
  communityRecent: Number,
  lastUpdate: Date,
  following: [String]
});

module.exports = mongoose.model('Fccuser', FccuserSchema);