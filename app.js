var Sequelize = require('sequelize'),
    epilogue = require('epilogue'),
    http = require('http'),
	conflictResolutionMiddleware = require('./custom_middlewares/conflict-resolution-middleware');

// Define your models
var database = new Sequelize('postgres://postgres:adm123@localhost:5432/manage-lite-rest');
var Role = database.define('Role', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  enabled: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
	defaultValue: true
  }
});

//CORS middleware
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

// Initialize server
var server, app;
if (process.env.USE_RESTIFY) {
  var restify = require('restify');

  app = server = restify.createServer()
  app.use(restify.queryParser());
  app.use(restify.bodyParser());
} else {
  var express = require('express'),
      bodyParser = require('body-parser');

  var app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false })); // to support URL-encoded bodies
  server = http.createServer(app);
}

app.use(allowCrossDomain);

// Initialize epilogue
epilogue.initialize({
  app: app,
  sequelize: database
});

// Create REST resource
var roleResource = epilogue.resource({
  model: Role,
  endpoints: ['/roles', '/roles/:id']
});

roleResource.use(conflictResolutionMiddleware);

// Create database and listen
database
  .sync({ force: true })
  .then(function() {
    server.listen(3131, function() {
      var host = server.address().address,
          port = server.address().port;

      console.log('%s: listening at http://%s:%s', new Date(), host, port);
    });
  });
  
module.exports = app;