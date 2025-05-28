const jwt = require('jsonwebtoken');

/**
 * 生成JWT Token
 * @param {Object} payload - Token中包含的数据
 * @returns {String} - JWT Token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

/**
 * 验证JWT Token
 * @param {String} token - JWT Token
 * @returns {Object|null} - 解析后的数据或null
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * 从请求头中提取Token
 * @param {Object} req - Express请求对象
 * @returns {String|null} - JWT Token或null
 */
const getTokenFromHeader = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

module.exports = {
  generateToken,
  verifyToken,
  getTokenFromHeader
}; 