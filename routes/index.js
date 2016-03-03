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
                if (req.body.statuses) {
                    Promise.all(req.body.statuses.map(function(status) {
                        if (status.id) {
                            return models.ProjectStatus.create({
                                statusId : status.id,
                                projectId : project.id,
                                showInBoards : status.projectStatus.showInBoards,
                                boardOrder : status.projectStatus.boardOrder
                            }, {
                                transaction : t
                            })
                        } else {
                            return models.Status.create(status, {
                                transaction : t
                            }).then(function(newStatus) {
                                return models.ProjectStatus.create({
                                    statusId : newStatus.id,
                                    projectId : project.id,
                                    showInBoards : status.projectStatus.showInBoards || true,
                                    boardOrder : status.projectStatus.boardOrder || 1
                                }, {
                                    transaction : t
                                })
                            }, function(err) {
                                t.rollback();
                                if (err.message === 'Validation error') {
                                    res.status(403);
                                    res.send(err);
                                } else {
                                    next(err);
                                }
                            })
                        }
                    })).then(function(response) {
                        t.commit().then(function(c) {
                            var query = projectById(project.id, true, true);
                            query.then(function(project) {
                                return res.json(project);
                            });
                        });
                        return;
                    }, function(err) {
                        t.rollback();
                        if (err.message === 'Validation error') {
                            res.status(403);
                            res.send(err);
                        } else {
                            next(err);
                        }
                    });
                }
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

var projectById = function(projectId, includeSprint, includeStatus) {
    var query;
    var options = {
        include : []
    };
    if (includeSprint) {
        options.include.push({
            model : models.Sprint,
            as : 'sprints'
        });
    }
    if (includeStatus) {
        options.include.push({
            model : models.Status,
            as : 'statuses'
        });
    }

    query = models.Project.findById(projectId, options);

    return query;
}

router.param('projectId', function(req, res, next, projectId) {
    var query = projectById(projectId);

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

// Problematic
router.put('/projects/:projectId', function(req, res, next) {
    if (handleWithEpilogue(req)) {
        console.log('Passing to epilogue');
        next();
    } else {
        console.log('Not epilogue');

        models.database.transaction().then(function(t) {
            var project = models.Project.build(req.body, {
                isNewRecord : false
            /*
             * , include : [ { model : models.Sprint, as : 'sprints' } ]
             */
            });

            Promise.all([ project.save({
                transaction : t
            }), function() {
                if (req.body.sprints) {
                    req.body.sprints.map(function(sprint) {
                        if (sprint.id) {
                            var sprint = models.Sprint.build(sprint, {
                                isNewRecord : false
                            });
                            return sprint.save({
                                transaction : t
                            });
                        }
                    });
                }
            }, function() {
                if (req.body.sprints) {
                    req.body.sprints.map(function(sprint) {
                        if (!sprint.id) {
                            sprint.projectId = project.id;
                            return models.Sprint.create(sprint, {
                                transaction : t
                            });
                        }
                    });
                }
            } ]).then(function(response) {
                t.commit().then(function(c) {
                    var query = projectById(project.id, true);
                    query.then(function(project) {
                        return res.json(project);
                    });
                });
                return;
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
});

router.post('/projects/:projectId/stories', function(req, res, next) {
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
});

module.exports = router;