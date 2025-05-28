const request = require('../utils/request');
const app = getApp();

/**
 * 发送验证码
 * @param {string} phoneNumber 手机号
 * @returns {Promise}
 */
function sendVerificationCode(phoneNumber) {
  return request.post('/api/auth/sendCode', { phoneNumber }, true);
}

/**
 * 手机号登录
 * @param {string} phoneNumber 手机号
 * @param {string} verificationCode 验证码
 * @returns {Promise}
 */
function phoneLogin(phoneNumber, verificationCode) {
  return request.post('/api/auth/login', { phoneNumber, verificationCode }, true);
}

/**
 * 微信登录
 * @param {string} code 微信登录code
 * @returns {Promise}
 */
function wxLogin(code) {
  console.log('微信登录，baseUrl:', app.globalData.baseUrl);
  console.log('微信登录，code:', code);
  
  // 确保URL格式正确，避免双斜杠问题
  const url = `${app.globalData.baseUrl}/api/auth/wxLogin`.replace(/([^:])\/\//g, '$1/');
  console.log('完整请求URL:', url);
  
  // 直接使用wx.request，便于调试
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: 'POST',
      data: { code },
      header: {
        'Content-Type': 'application/json'
      },
      success(res) {
        console.log('微信登录响应:', res);
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          console.error('微信登录失败:', res);
          reject(res);
        }
      },
      fail(err) {
        console.error('微信登录请求失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 获取用户信息
 * @returns {Promise}
 */
function getUserInfo() {
  return request.get('/api/user/info');
}

/**
 * 用户注册
 * @param {Object} data 注册信息
 * @returns {Promise}
 */
function register(data) {
  return request.post('/api/auth/register', data, true);
}

/**
 * 获取验证码
 * @param {String} phone 手机号
 * @returns {Promise}
 */
function getVerifyCode(phone) {
  return request.get('/api/auth/verifyCode', { phone }, true);
}

/**
 * 验证码登录
 * @param {Object} data 登录数据
 * @returns {Promise}
 */
function verifyCodeLogin(data) {
  return request.post('/api/auth/verifyCodeLogin', data, true);
}

/**
 * 重置密码
 * @param {Object} data 重置密码数据
 * @returns {Promise}
 */
function resetPassword(data) {
  return request.post('/api/auth/resetPassword', data, true);
}

/**
 * 更新用户信息
 * @param {Object} data 用户信息
 * @returns {Promise}
 */
function updateUserInfo(data) {
  return request.post('/api/auth/updateUserInfo', data, true);
}

module.exports = {
  sendVerificationCode,
  phoneLogin,
  wxLogin,
  getUserInfo,
  register,
  getVerifyCode,
  verifyCodeLogin,
  resetPassword,
  updateUserInfo
}; 