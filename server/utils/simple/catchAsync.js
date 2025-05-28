/**
 * 包装异步控制器方法，避免重复使用try/catch
 * @param {Function} fn 异步控制器函数
 * @returns {Function} 包装后的异步函数
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync; 