var models = require('../models/models');
var express = require('express');
var router = express.Router();

// epilogue routes
router.use('/projects', function(req, res, next) {
    console.log('Passing to epilogue');
    return next();
});

module.exports = router;