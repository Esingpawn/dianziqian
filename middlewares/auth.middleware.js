const { AppError } = require('../utils/error.utils');
const { verifyToken, getTokenFromHeader } = require('../utils/jwt.utils');
const User = require('../models/user.model');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');

/**
 * 保护路由，需要用户登录
 */
const protect = async (req, res, next) => {
  try {
    // 特定路径不需要认证
    if (req.path === '/auth/wxLogin' || req.path === '/auth/login' || req.path === '/auth/register' || req.path === '/auth/sendCode') {
      console.log('跳过认证的路径:', req.path);
      return next();
    }

    // 1) 获取Token
    const token = getTokenFromHeader(req);

    if (!token) {
      return next(new AppError('您未登录，请登录后再访问', 401));
    }

    // 2) 验证Token
    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new AppError('Token无效或已过期', 401));
    }

    // 3) 检查用户是否存在
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('拥有此Token的用户不存在', 401));
    }

    // 4) 将用户信息添加到请求对象
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 限制指定角色访问
 * @param  {...String} roles - 允许的角色
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // 在 restrictTo 中也应该使用 toObject() 来获取角色进行比较
    const userObject = req.user && typeof req.user.toObject === 'function' ? req.user.toObject() : req.user;
    if (!userObject || !roles.includes(userObject.role)) {
      return next(new AppError('您没有权限执行此操作', 403));
    }
    next();
  };
};

/**
 * 验证用户实名认证状态
 */
const requireVerification = async (req, res, next) => {
  if (!req.user) {
    console.log('req.user is undefined or null in requireVerification');
    return next(new AppError('用户未认证', 401)); // 或者适合的错误
  }

  // 始终从 toObject() 获取属性以保证一致性
  const userObject = typeof req.user.toObject === 'function' ? req.user.toObject() : req.user;

  console.log('User in requireVerification (object):', JSON.parse(JSON.stringify(userObject)));
  console.log('Role type:', typeof userObject.role, 'Role value:', userObject.role);
  console.log('Is role \'admin\'?:', userObject.role === 'admin');
  console.log('Is userObject truthy?:', !!userObject);

  if (userObject.role === 'admin') { // 直接使用 userObject.role
    console.log('Admin check PASSED. Skipping verification.');
    return next();
  }

  console.log('Admin check FAILED or user is not admin. Proceeding to verification check.');
  if (!userObject.isVerified) { // 直接使用 userObject.isVerified
    console.log('Verification FAILED. User:', userObject.username, 'isVerified:', userObject.isVerified);

    return next(new AppError('请先完成实名认证', 403));
  }

  console.log('Verification PASSED for non-admin or already verified user.');
  next();
};

module.exports = {
  protect,
  restrictTo,
  requireVerification
}; 