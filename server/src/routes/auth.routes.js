const express = require('express');
const { register, login, getCurrentUser, changePassword, wxLogin, sendVerificationCode, phoneLogin } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// 公开路由
router.post('/register', register);
router.post('/login', login);
router.post('/wx-login', wxLogin);
router.post('/send-code', sendVerificationCode); // 发送验证码
router.post('/phone-login', phoneLogin); // 手机号登录

// 需要认证的路由
router.use(protect);
router.get('/me', getCurrentUser);
router.patch('/update-password', changePassword);

module.exports = router; 