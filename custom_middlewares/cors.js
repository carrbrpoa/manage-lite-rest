var EpilogueError = require('epilogue').Errors.EpilogueError;

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'accept,X-Requested-With,Content-Type,Cache-Control');

    next();
}

module.exports = allowCrossDomain;