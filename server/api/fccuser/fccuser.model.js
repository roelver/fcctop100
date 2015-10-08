'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var FccuserSchema = new Schema({
  username: String,
  existing: Boolean,
  img: String,
  points: Number,
  ziplines: Number,
  basejumps: Number,
  waypoints: Number,
  bonfires: Number,
  lastUpdate: Date
});

module.exports = mongoose.model('Fccuser', FccuserSchema);