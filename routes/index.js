var models = require('../models/models');
var express = require('express');
var router = express.Router();

var handleWithEpilogue = function(req) {
    if (req.method === 'POST') {
        if (req.body) {
            for (key in req.body) {
                if (typeof req.body[key] === 'object') {
                    return false;
                }
            }
        }
    }

    return true;
}

router.use(function timeLog(req, res, next) {
    console.log('Time: ', new Date());
    next();
});

// epilogue routes
router.use('/projects', function(req, res, next) {
    if (handleWithEpilogue(req)) {
        console.log('Passing to epilogue');
        next();
    } else {
        console.log('Not epilogue');
        // TODO
        next();
    }
});

module.exports = router;