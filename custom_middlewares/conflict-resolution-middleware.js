var EpilogueError = require('epilogue').Errors.EpilogueError;

module.exports = {
  update: {
    write: {
      before: function(req, res, context) {
        // modify data before writing list data
          if (new Date(req.body.startedEditAt) < new Date(context.instance.dataValues.updatedAt.toISOString())) {
              throw new EpilogueError(409, 'Someone updated this entity before you. Please refresh it and try again.');
          }
        return context.continue;
		//throw new ForbiddenError("Can't update anything!");
      }
    }
  }
};