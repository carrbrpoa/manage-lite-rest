var models = require('../models/models');
var express = require('express');
var cors = require('../custom_middlewares/cors');
var router = express.Router();

router.use(cors);

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

/*router.use('/projects', function(req, res, next) {
    if (handleWithEpilogue(req)) {
        console.log('Passing to epilogue');
        next();
    } else {
        console.log('Not epilogue');
        // TODO
        next();
    }
});*/

router.post('/projects', function(req, res, next) {
    if (handleWithEpilogue(req)) {
        console.log('Passing to epilogue');
        next();
    } else {
        console.log('Not epilogue');
        
        var project = req.body;
        
        models.database.transaction().then(function (t) {
            models.Project.create(project, { transaction: t, include: [ { model: models.Sprint, as: 'sprints' } ] }).then(function(project){
                t.commit();
                return res.json(project);
            }, function(err) {
                t.rollback();
                if (err.message === 'Validation error') {
                    res.status(403);
                    res.send(err);
                }
                else {
                    next(err);
                }
            });
        });
    }
});

module.exports = router;