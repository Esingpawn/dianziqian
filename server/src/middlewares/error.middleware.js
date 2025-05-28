const ApiError = require('../utils/ApiError');
const config = require('../config/config');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || '服务器内部错误';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  const response = {
    code: error.statusCode,
    message: error.message,
    success: false,
    stack: config.env === 'development' ? error.stack : undefined,
  };

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler; 