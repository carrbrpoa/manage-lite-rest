var ForbiddenError = require('epilogue').Errors.ForbiddenError;

module.exports = {
  update: {
    write: {
      before: function(req, res, context) {
        // modify data before writing list data
        return context.continue;
		//throw new ForbiddenError("Can't update anything!");
      }
    }
  }
};