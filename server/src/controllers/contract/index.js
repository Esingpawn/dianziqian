const baseController = require('./base.controller');
const createController = require('./create.controller');
const signController = require('./sign.controller');
const batchController = require('./batch.controller');

module.exports = {
  ...baseController,
  ...createController,
  ...signController,
  ...batchController
}; 