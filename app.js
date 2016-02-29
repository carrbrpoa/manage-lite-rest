var //Sequelize = require('sequelize'),
    epilogue = require('epilogue'),
    http = require('http'),
    //restful = require('sequelize-restful'),
    models = require('./models/models'),
	conflictResolutionMiddleware = require('./custom_middlewares/conflict-resolution-middleware'),
    cors = require('./custom_middlewares/cors');

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
  var routes = require('./routes/index');
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false })); // to support URL-encoded bodies
  app.use(routes);
  server = http.createServer(app);
}

// Initialize epilogue
epilogue.initialize({
  app: app,
  sequelize: models.database
});

// Create REST resource --- EPILOGUE ---
var roleResource = epilogue.resource({
  model: models.Role,
  endpoints: ['/roles', '/roles/:id']
});

var settingsResource = epilogue.resource({
    model: models.Settings,
    endpoints: ['/settings', '/settings/:id']
  });

var collaboratorResource = epilogue.resource({
    model: models.Collaborator,
    endpoints: ['/collaborators', '/collaborators/:id']
  });

var projectResource = epilogue.resource({
    model: models.Project,
    associations: true,
    endpoints: ['/projects', '/projects/:id']
  });

var statusResource = epilogue.resource({
    model: models.Status,
    endpoints: ['/statuses', '/statuses/:id']
  });

/*var sprintResource = epilogue.resource({
    model: Sprint,
    associations: true,
    endpoints: ['/projects/:id/sprints', '/projects/:id/sprints/:id']
  });*/

roleResource.use(conflictResolutionMiddleware);
settingsResource.use(conflictResolutionMiddleware);
collaboratorResource.use(conflictResolutionMiddleware);
projectResource.use(conflictResolutionMiddleware);
statusResource.use(conflictResolutionMiddleware);
//sprintResource.use(conflictResolutionMiddleware);

//app.configure(function() {
//app.use(restful(models.database, { endpoint: '/', allowed: new Array('projects', 'sprints', 'backlogs', 'stories') }));
//});

app.use(cors);

//production error handler
//no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(err);
});

// Create database and listen
models.database
  .sync({ force: true })
  .then(function() {
    server.listen(3131, function() {
      var host = server.address().address,
          port = server.address().port;

      console.log('%s: listening at http://%s:%s', new Date(), host, port);
    });
  });
  
module.exports = app;