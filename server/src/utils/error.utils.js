/**
 * 自定义错误类
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 错误响应格式处理
 * @param {Error} err - 错误对象
 * @param {Object} res - Express响应对象
 */
const handleError = (err, res) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  
  res.status(statusCode).json({
    status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 异步函数错误处理包装器
 * @param {Function} fn - 异步控制器函数
 * @returns {Function} - Express中间件函数
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * 处理Mongoose验证错误
 * @param {Error} err - Mongoose错误对象
 * @returns {AppError} - 自定义错误对象
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `无效输入数据: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * 处理Mongoose重复键错误
 * @param {Error} err - Mongoose错误对象
 * @returns {AppError} - 自定义错误对象
 */
const handleDuplicateKeyError = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `重复字段值: ${value}. 请使用其他值!`;
  return new AppError(message, 400);
};

module.exports = {
  AppError,
  handleError,
  catchAsync,
  handleValidationError,
  handleDuplicateKeyError
}; 