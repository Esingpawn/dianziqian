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
      userType: userType || 'personal',
      role: userType === 'admin' ? 'admin' : (userType || 'personal'),
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
          email: user.email,
          phone: user.phone,
          role: user.role,
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
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
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
        user: {
          id: user._id,
          username: user.username,
          name: user.name || user.username,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          verified: user.verified,
          currentEnterprise: user.currentEnterprise
        }
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

/**
 * 微信小程序登录
 */
const wxLogin = async (req, res, next) => {
  try {
    // 获取微信登录code
    const { code } = req.body;
    
    if (!code) {
      throw new ApiError(400, '未提供微信登录code');
    }
    
    console.log('微信登录请求，code:', code);
    
    // 真实环境微信API参数
    const appid = process.env.WECHAT_APPID || 'wx123456789abcdef'; // 从环境变量获取或使用默认值
    const appSecret = process.env.WECHAT_SECRET || 'your_app_secret_here'; // 从环境变量获取或使用默认值
    const useRealApi = process.env.USE_REAL_WECHAT_API === 'true';
    
    // 根据环境变量决定是否使用真实微信API
    let openid;
    let sessionKey;
    
    if (useRealApi) {
      try {
        console.log('使用真实微信API登录');
        // 调用微信API
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
        
        // 使用Node.js内置的https模块发送请求
        const https = require('https');
        const wxResponse = await new Promise((resolve, reject) => {
          https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => {
              resolve(JSON.parse(data));
            });
          }).on('error', (err) => {
            reject(err);
          });
        });
        
        console.log('微信API响应:', wxResponse);
        
        // 检查微信API返回的错误
        if (wxResponse.errcode) {
          throw new ApiError(400, `微信登录失败: ${wxResponse.errmsg || '未知错误'}`);
        }
        
        // 获取openid
        openid = wxResponse.openid;
        sessionKey = wxResponse.session_key;
        
        if (!openid) {
          throw new ApiError(400, '获取微信openid失败');
        }
      } catch (wxError) {
        console.error('调用微信API出错:', wxError);
        throw new ApiError(500, '微信登录服务暂时不可用');
      }
    } else {
      // 开发环境，使用模拟的openid
      console.log('使用模拟微信登录');
      openid = `mock_openid_${code}`;
      sessionKey = 'mock_session_key';
    }
    
    // 通过openid查找用户
    let user = await User.findOne({ openid });
    let isNewUser = false;
    
    if (!user) {
      // 如果用户不存在，创建一个新用户
      const timestamp = Date.now().toString().slice(-8);
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const uniquePhone = `138${timestamp.slice(0, 4)}${randomNum}`;
      
      user = new User({
        username: `wx_user_${timestamp}${randomNum}`, // 生成唯一用户名
        password: Math.random().toString(36).slice(-8), // 随机密码
        name: '微信用户',
        openid: openid, // 使用真实或模拟的openid
        sessionKey: sessionKey, // 保存session_key
        role: 'personal',
        phone: uniquePhone, // 使用生成的唯一手机号
        email: `wx_user_${timestamp}${randomNum}@example.com` // 唯一邮箱
      });
      
      await user.save();
      isNewUser = true;
      console.log('创建新微信用户成功:', user.username, user.phone);
    } else {
      // 更新session_key
      user.sessionKey = sessionKey;
      await user.save();
      console.log('找到已有微信用户:', user.username);
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: user._id, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // 返回小程序期望的响应格式
    res.status(200).json({
      code: 0, // 小程序期望code为0表示成功
      message: '登录成功',
      data: {
        token: token,
        userInfo: { // 使用userInfo而不是user
          id: user._id,
          username: user.username,
          name: user.name || '微信用户',
          avatar: user.avatar,
          phone: user.phone || '',
          email: user.email || '',
          role: user.role,
          verified: user.verified
        },
        isNewUser
      }
    });
  } catch (error) {
    console.error('微信登录处理错误:', error);
    next(error);
  }
};

/**
 * 发送验证码
 */
const sendVerificationCode = async (req, res, next) => {
  try {
    // 获取手机号
    const { phone } = req.body;
    
    if (!phone) {
      throw new ApiError(400, '请提供手机号码');
    }
    
    // 检查手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new ApiError(400, '手机号格式不正确');
    }
    
    // 在实际生产环境中，这里应该调用短信服务发送验证码
    // 但在开发环境，我们只模拟这个过程
    // 所有验证码都使用 "123132"
    
    console.log(`模拟发送验证码到手机: ${phone}`);
    console.log('固定验证码为: 123132');
    
    // 在实际生产环境中，应该将验证码存储在缓存或数据库中，并设置过期时间
    
    res.status(200).json({
      success: true,
      message: '验证码已发送',
      code: 0 // 小程序接口期望code为0表示成功
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 手机号登录或注册
 */
const phoneLogin = async (req, res, next) => {
  try {
    const { phone, verificationCode } = req.body;
    
    if (!phone || !verificationCode) {
      throw new ApiError(400, '请提供手机号和验证码');
    }
    
    // 检查手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new ApiError(400, '手机号格式不正确');
    }
    
    // 在实际生产环境中，这里应该验证验证码是否正确
    // 但在开发环境，我们只检查是否是固定验证码 "123132"
    if (verificationCode !== '123132') {
      throw new ApiError(401, '验证码错误');
    }
    
    // 查找手机号对应的用户
    let user = await User.findOne({ phone });
    let isNewUser = false;
    
    if (!user) {
      // 如果用户不存在，创建一个新用户
      const timestamp = Date.now().toString().slice(-8);
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      user = new User({
        username: `user_${timestamp}${randomNum}`, // 生成唯一用户名
        password: Math.random().toString(36).slice(-8), // 随机密码
        name: '手机用户',
        phone,
        role: 'personal'
      });
      
      await user.save();
      isNewUser = true;
      console.log('创建新手机用户成功:', user.username, phone);
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: user._id, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // 返回响应
    res.status(200).json({
      code: 0, // 小程序期望code为0表示成功
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user._id,
          username: user.username,
          name: user.name || '手机用户',
          phone: user.phone,
          avatar: user.avatar || '',
          email: user.email || '',
          role: user.role,
          verified: user.verified
        },
        isNewUser
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  changePassword,
  wxLogin,
  sendVerificationCode,
  phoneLogin
}; 