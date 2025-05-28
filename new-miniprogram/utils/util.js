/**
 * 格式化时间
 * @param {Date|String|Number} date 日期对象/时间戳/日期字符串
 * @param {String} format 格式化模板，默认 YYYY-MM-DD HH:mm:ss
 * @returns {String} 格式化后的时间字符串
 */
function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) {
    return '';
  }
  
  // 如果是时间戳或日期字符串，转为日期对象
  if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date);
  }
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  // 替换年月日时分秒
  return format
    .replace('YYYY', year)
    .replace('MM', padZero(month))
    .replace('DD', padZero(day))
    .replace('HH', padZero(hour))
    .replace('mm', padZero(minute))
    .replace('ss', padZero(second));
}

/**
 * 数字补零
 * @param {Number} n 数字
 * @returns {String} 补零后的字符串
 */
function padZero(n) {
  return n < 10 ? '0' + n : '' + n;
}

/**
 * 获取文件扩展名
 * @param {string} filename 文件名
 * @return {string} 文件扩展名
 */
function getFileExtension(filename) {
  return filename.substring(filename.lastIndexOf('.') + 1);
}

/**
 * 检查手机号格式
 * @param {string} phoneNumber 手机号
 * @return {boolean} 是否合法
 */
function isValidPhoneNumber(phoneNumber) {
  return /^1[3-9]\d{9}$/.test(phoneNumber);
}

/**
 * 生成随机字符串
 * @param {number} length 长度
 * @return {string} 随机字符串
 */
function randomString(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 显示提示框
 * @param {String} title 提示内容
 * @param {String} icon 图标类型
 * @param {Number} duration 提示持续时间
 */
function showToast(title, icon = 'none', duration = 1500) {
  wx.showToast({
    title,
    icon,
    duration
  });
}

/**
 * 显示加载提示
 * @param {string} title 提示内容
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示模态对话框
 * @param {string} title 标题
 * @param {string} content 内容
 * @param {boolean} showCancel 是否显示取消按钮
 * @return {Promise} Promise对象
 */
function showModal(title, content, showCancel = true) {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title,
      content,
      showCancel,
      success(res) {
        if (res.confirm) {
          resolve(true);
        } else if (res.cancel) {
          resolve(false);
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

/**
 * 手机号码验证
 * @param {String} phone 手机号码
 * @returns {Boolean} 是否是有效的手机号
 */
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 邮箱验证
 * @param {String} email 邮箱
 * @returns {Boolean} 是否是有效的邮箱
 */
function isValidEmail(email) {
  return /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(email);
}

/**
 * 身份证号验证
 * @param {String} idCard 身份证号
 * @returns {Boolean} 是否是有效的身份证号
 */
function isValidIdCard(idCard) {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard);
}

/**
 * 企业统一社会信用代码验证
 * @param {String} code 统一社会信用代码
 * @returns {Boolean} 是否是有效的统一社会信用代码
 */
function isValidCreditCode(code) {
  return /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(code);
}

/**
 * 获取当前位置
 * @returns {Promise} 位置信息
 */
function getLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: resolve,
      fail: reject
    });
  });
}

/**
 * 防抖函数
 * @param {Function} fn 要执行的函数
 * @param {Number} delay 延迟时间，默认300ms
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param {Function} fn 要执行的函数
 * @param {Number} interval 间隔时间，默认300ms
 * @returns {Function} 节流后的函数
 */
function throttle(fn, interval = 300) {
  let last = 0;
  return function(...args) {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 生成UUID
 * @returns {String} UUID字符串
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = {
  formatTime,
  getFileExtension,
  isValidPhoneNumber,
  randomString,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  isValidPhone,
  isValidEmail,
  isValidIdCard,
  isValidCreditCode,
  getLocation,
  debounce,
  throttle,
  generateUUID
}; 