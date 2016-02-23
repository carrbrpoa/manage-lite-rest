var models = require('../models/models');
var express = require('express');
var cors = require('../custom_middlewares/cors');
var router = express.Router();
// var Promise = require('bluebird');

router.use(cors);

var handleWithEpilogue = function(req) {
    if (req.method === 'POST' || req.method === 'PUT') {
        if (req.body) {
            for (key in req.body) {
                if (typeof req.body[key] === 'object') {
                    return false;
                }
            }
        }
    } else if (req.method === 'PATCH') {
        return false;
    }

    return true;
}

router.use(function timeLog(req, res, next) {
    console.log('Time: ', new Date());
    next();
});

/*
 * router.use('/projects', function(req, res, next) { if
 * (handleWithEpilogue(req)) { console.log('Passing to epilogue'); next(); }
 * else { console.log('Not epilogue'); // TODO next(); } });
 */

router.post('/projects', function(req, res, next) {
    if (handleWithEpilogue(req)) {
        console.log('Passing to epilogue');
        next();
    } else {
        console.log('Not epilogue');

        var project = req.body;

        models.database.transaction().then(function(t) {
            models.Project.create(project, {
                transaction : t,
                include : [ {
                    model : models.Sprint,
                    as : 'sprints'
                } ]
            }).then(function(project) {
                t.commit();
                return res.json(project);
            }, function(err) {
                t.rollback();
                if (err.message === 'Validation error') {
                    res.status(403);
                    res.send(err);
                } else {
                    next(err);
                }
            });
        });
    }
});

router.param('projectId', function(req, res, next, projectId) {
    var query = models.Project.findById(projectId);

    query.then(function(project) {
        if (!project) {
            return res.status(404).json({
                error : true,
                message : 'Project not found'
            });
        }

        req.project = project;
        next();
    });
});

router.param('storyId', function(req, res, next, storyId) {
    var query = models.Story.findById(storyId);

    query.then(function(story) {
        if (!story) {
            return res.status(404).json({
                error : true,
                message : 'Story not found'
            });
        }

        req.story = story;
        next();
    });
});

//Problematic
router.put('/projects/:projectId', function(req, res, next) {
    if (handleWithEpilogue(req)) {
        console.log('Passing to epilogue');
        next();
    } else {
        console.log('Not epilogue');

        models.database.transaction().then(function(t) {
            var project = models.Project.build(req.body, {
                isNewRecord : false,
                include : [ {
                    model : models.Sprint,
                    as : 'sprints'
                } ]
            });

            Promise.all([ project.save({
                transaction : t
            }), project.sprints.map(function(sprint) {
                if (sprint.getDataValue('id')) {
                    return sprint.save({
                        transaction : t
                    });
                } else {
                    sprint.projectId = project.id;
                    return models.Sprint.create(sprint, {
                        transaction : t
                    });
                }

                /*
                 * models.Sprint.upsert(sprint, { transaction : t });
                 */
            }) ]).then(function(response) {
                t.commit();
                return res.json(project);
            }, function(err) {
                t.rollback();
                if (err.message === 'Validation error') {
                    res.status(403);
                    res.send(err);
                } else {
                    next(err);
                }
            });
        });
    }
});

router.patch('/projects/:projectId/stories/:storyId', function(req, res, next) {
    if (handleWithEpilogue(req)) {
        console.log('Passing to epilogue');
        next();
    } else {
        console.log('Not epilogue');

        var story = req.story;
        var updateData = {};

        for (key in req.body) {
            updateData[key] = req.body[key];
        }

        models.Story.update(updateData, {
            where : {
                id : story.id
            }
        }).then(function(response) {
            return res.json(response);
        }, function(err) {
            if (err.message === 'Validation error') {
                res.status(403);
                res.send(err);
            } else {
                next(err);
            }
        });
    }
});

router.post('/projects/:projectId/stories', function(req, res, next) {
    /*if (handleWithEpilogue(req)) {
        console.log('Passing to epilogue');
        next();
    } else {
        console.log('Not epilogue');*/

        var story = req.body;

        models.Story.create(story).then(function(response) {
            return res.json(response);
        }, function(err) {
            if (err.message === 'Validation error') {
                res.status(403);
                res.send(err);
            } else {
                next(err);
            }
        });
    //}
});

module.exports = router;