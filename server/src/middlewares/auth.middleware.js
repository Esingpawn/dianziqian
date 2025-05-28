const { AppError } = require('../utils/error.utils');
const { verifyToken, getTokenFromHeader } = require('../utils/jwt.utils');
const User = require('../models/user.model');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');
const Enterprise = require('../models/enterprise.model');

/**
 * 保护路由，需要用户登录
 */
const protect = async (req, res, next) => {
  try {
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
    const userId = decoded.id || decoded._id; // 兼容新旧格式
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return next(new AppError('拥有此Token的用户不存在', 401));
    }
    
    // 4) 将用户信息添加到请求对象
    req.user = currentUser;
    
    // 确保用户对象上同时有id和_id
    if (currentUser.toObject) {
      const userObj = currentUser.toObject();
      if (userObj._id && !userObj.id) {
        currentUser.id = userObj._id.toString();
      } else if (userObj.id && !userObj._id) {
        currentUser._id = userObj.id;
      }
    }
    
    console.log('Current user in protect:', req.user ? JSON.parse(JSON.stringify(req.user.toObject ? req.user.toObject() : req.user)) : null);
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

/**
 * 验证企业成员签署权限
 */
const requireSignPermission = async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('用户未认证', 401));
  }
  const userObject = typeof req.user.toObject === 'function' ? req.user.toObject() : req.user;

  // 个人用户或管理员直接通过
  if (!userObject.enterpriseId || userObject.role === 'admin' || userObject.role === 'enterprise_admin') {
    return next();
  }
  
  // 企业成员需要检查签署权限
  if (!userObject.signPermission) {
    return next(new AppError('您没有签署合同的权限', 403));
  }
  
  next();
};

// 验证JWT令牌
const authenticate = async (req, res, next) => {
  try {
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, '未提供认证令牌');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError(401, '无效的认证令牌格式');
    }
    
    try {
      // 验证令牌
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // 查找用户
      const userId = decoded.id || decoded._id; // 兼容新旧格式
      const user = await User.findById(userId);
      
      if (!user) {
        throw new ApiError(401, '用户不存在');
      }
      
      // 确保用户对象上同时有id和_id
      if (user.toObject) {
        const userObj = user.toObject();
        if (userObj._id && !userObj.id) {
          user.id = userObj._id.toString();
        } else if (userObj.id && !userObj._id) {
          user._id = userObj.id;
        }
      }
      
      // 将用户信息附加到请求对象
      req.user = user; // 直接附加 Mongoose user 对象
      console.log('User in authenticate (raw):', req.user);
      next();
    } catch (error) {
      throw new ApiError(401, '无效的认证令牌');
    }
  } catch (error) {
    next(error);
  }
};

// 验证是否为企业管理员
const isEnterpriseAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, '用户未认证');
    }
    const userObject = typeof req.user.toObject === 'function' ? req.user.toObject() : req.user;
    const userId = userObject.id || userObject._id.toString(); // Mongoose _id vs plain id
    const enterpriseId = req.params.enterpriseId || req.body.enterpriseId || req.query.enterpriseId;
    
    if (!enterpriseId) {
      throw new ApiError(400, '未提供企业ID');
    }
    
    const enterprise = await Enterprise.findById(enterpriseId);
    
    if (!enterprise) {
      throw new ApiError(404, '企业不存在');
    }
    
    // 检查是否为企业所有者
    if (enterprise.owner && enterprise.owner.toString() === userId) {
      return next();
    }
    
    // 检查是否为管理员
    if (enterprise.members && enterprise.members.length > 0) {
      const member = enterprise.members.find(
        m => m.user && m.user.toString() === userId && m.role === 'admin'
      );
      
      if (member) {
        return next();
      }
    }
    
    // 超级管理员也可以访问
    if (userObject.role === 'admin') {
      return next();
    }
    
    throw new ApiError(403, '没有权限执行此操作');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
  restrictTo,
  requireVerification,
  requireSignPermission,
  authenticate,
  isEnterpriseAdmin
}; 