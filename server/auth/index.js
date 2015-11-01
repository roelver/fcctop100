'use strict';

var express = require('express');
var router = express.Router();

router.use('/github', require('./github'));

module.exports = router;