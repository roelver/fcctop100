'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var FccuserSchema = new Schema({
  username: String,
  existing: Boolean,
  img: String,
  points: Number,
  pointsRecent: Number,
  ziplines: Number,
  ziplinesRecent: Number,
  basejumps: Number,
  basejumpsRecent: Number,
  waypoints: Number,
  waypointsRecent: Number,
  bonfires: Number,
  bonfiresRecent: Number,
  total: Number,
  totalRecent: Number,
  lastUpdate: Date
});

module.exports = mongoose.model('Fccuser', FccuserSchema);