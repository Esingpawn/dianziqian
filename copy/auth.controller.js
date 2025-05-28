const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');

/**
 * 注册新用户
 */
const register = async (req, res, next) => {
  try {
    const { username, password, name, phone, email, userType } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ 
      $or: [{ username }, { phone }] 
    });
    
    if (existingUser) {
      throw new ApiError(400, '用户名或手机号已被注册');
    }
    
    // 创建新用户
    const user = new User({
      username,
      password,
      name,
      phone,
      email,
      userType
    });
    
    await user.save();
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: user._id, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          userType: user.userType,
          verified: user.verified
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 用户登录
 */
const login = async (req, res, next) => {
  console.log('[AUTH_LOGIN_START] Received login request for username:', req.body.username, 'at', new Date().toISOString());
  try {
    const { username, password } = req.body;
    console.log(`[AUTH_LOGIN_VALIDATE] User: ${username} - Finding user...`);
    const user = await User.findOne({ username });
    console.log(`[AUTH_LOGIN_VALIDATE] User: ${username} - User found:`, !!user);
    
    if (!user) {
      console.log(`[AUTH_LOGIN_FAIL] User: ${username} - User not found.`);
      throw new ApiError(401, '用户名或密码错误');
    }
    
    console.log(`[AUTH_LOGIN_VALIDATE] User: ${username} - Comparing password...`);
    const isPasswordMatch = await user.comparePassword(password);
    console.log(`[AUTH_LOGIN_VALIDATE] User: ${username} - Password match:`, isPasswordMatch);
        
    if (!isPasswordMatch) {
      console.log(`[AUTH_LOGIN_FAIL] User: ${username} - Password mismatch.`);
      throw new ApiError(401, '用户名或密码错误');
    }
    
    console.log(`[AUTH_LOGIN_SUCCESS] User: ${username} - Generating token...`);
    // 生成JWT令牌
    const token = jwt.sign(
      { id: user._id, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    console.log(`[AUTH_LOGIN_SUCCESS] User: ${username} - Sending response.`);
    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          userType: user.userType,
          verified: user.verified,
          currentEnterprise: user.currentEnterprise
        },
        token
      }
    });
  } catch (error) {
    console.error('[AUTH_LOGIN_ERROR] Error during login for username:', req.body.username, error);
    next(error);
  }
};

/**
 * 获取当前登录用户信息
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('currentEnterprise');
    
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }
    
    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 修改密码
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }
    
    // 验证当前密码
    const isPasswordMatch = await user.comparePassword(currentPassword);
    
    if (!isPasswordMatch) {
      throw new ApiError(401, '当前密码错误');
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  changePassword
}; 