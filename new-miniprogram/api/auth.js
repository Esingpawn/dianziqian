/**
 * 用户认证相关API
 */

const request = require('./request');

/**
 * 微信登录
 * @param {String} code 微信登录code
 * @returns {Promise} 登录结果
 */
const wxLogin = (code) => {
  return request.post('/auth/wx-login', { code });
};

/**
 * 账号密码登录
 * @param {Object} data 登录信息
 * @param {String} data.username 用户名
 * @param {String} data.password 密码
 * @returns {Promise} 登录结果
 */
const login = (data) => {
  return request.post('/auth/login', data);
};

/**
 * 用户注册
 * @param {Object} data 注册信息
 * @param {String} data.username 用户名
 * @param {String} data.password 密码
 * @param {String} data.name 真实姓名
 * @param {String} data.phone 手机号码
 * @param {String} data.email 电子邮箱（可选）
 * @returns {Promise} 注册结果
 */
const register = (data) => {
  return request.post('/auth/register', data);
};

/**
 * 获取当前用户信息
 * @returns {Promise} 用户信息
 */
const getUserInfo = () => {
  return request.get('/auth/me');
};

/**
 * 实名认证
 * @param {Object} data 认证信息
 * @param {String} data.name 真实姓名
 * @param {String} data.idCard 身份证号
 * @param {String} data.faceImage 人脸识别照片（base64或图片地址）
 * @returns {Promise} 认证结果
 */
const verify = (data) => {
  return request.post('/auth/verify', data);
};

/**
 * 上传用户头像
 * @param {String} filePath 头像文件路径
 * @returns {Promise} 上传结果
 */
const uploadAvatar = (filePath) => {
  return request.upload('/users/upload-avatar', filePath, 'avatar');
};

/**
 * 绑定手机号
 * @param {Object} data 手机号信息
 * @param {String} data.phone 手机号
 * @param {String} data.code 验证码
 * @returns {Promise} 绑定结果
 */
const bindPhone = (data) => {
  return request.post('/auth/bind-phone', data);
};

/**
 * 发送验证码
 * @param {String} phone 手机号
 * @returns {Promise} 发送结果
 */
const sendVerificationCode = (phone) => {
  return request.post('/auth/send-code', { phone });
};

/**
 * 手机号验证码登录
 * @param {String} phone 手机号
 * @param {String} verificationCode 验证码
 * @returns {Promise} 登录结果
 */
const phoneLogin = (phone, verificationCode) => {
  return request.post('/auth/phone-login', { phone, verificationCode });
};

module.exports = {
  wxLogin,
  login,
  register,
  getUserInfo,
  verify,
  uploadAvatar,
  bindPhone,
  sendVerificationCode,
  phoneLogin
}; 