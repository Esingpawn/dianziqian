const express = require('express');
const { register, login, getCurrentUser, changePassword } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// 公开路由
router.post('/register', register);
router.post('/login', login);

// 微信小程序登录接口 - 确保这个路由不需要身份验证
router.post('/wxLogin', (req, res) => {
  try {
    // 临时实现，返回模拟数据
    console.log('微信登录请求:', req.body);
    
    // 返回成功响应
    return res.status(200).json({
      code: 0,
      message: '登录成功',
      data: {
        token: 'mock_token_for_wechat_login_' + Date.now(),
        userInfo: {
          id: 'wx_user_001',
          name: '微信用户',
          avatar: 'https://example.com/default-avatar.png',
          phone: '',
          email: '',
          role: 'user'
        }
      }
    });
  } catch (error) {
    console.error('wxLogin处理错误:', error);
    return res.status(500).json({
      code: 1,
      message: '登录失败: ' + (error.message || '未知错误'),
    });
  }
});

// 获取验证码接口
router.post('/sendCode', (req, res) => {
  const { phoneNumber } = req.body;
  console.log('发送验证码请求:', phoneNumber);
  
  // 返回模拟的验证码结果
  res.status(200).json({
    code: 0,
    message: '验证码发送成功',
    data: {
      expireTime: 300 // 5分钟有效期
    }
  });
});

// 需要认证的路由 - 所有需要认证的路由必须放在这一行之后
router.use(protect);
router.get('/me', getCurrentUser);
router.patch('/update-password', changePassword);

module.exports = router; 