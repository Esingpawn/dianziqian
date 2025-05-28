const app = getApp();

/**
 * 封装请求方法
 * @param {String} url 请求地址
 * @param {String} method 请求方法
 * @param {Object} data 请求数据
 * @param {Boolean} loading 是否显示加载中
 * @returns {Promise}
 */
function request(url, method, data = {}, loading = false) {
  // 显示加载中
  if (loading) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
  }

  // 获取token
  const token = wx.getStorageSync('token');
  
  // 处理URL，确保格式正确
  // 如果url以/开头，则直接拼接，否则添加/
  let fullUrl = url.startsWith('/') 
    ? `${app.globalData.baseUrl}${url}` 
    : `${app.globalData.baseUrl}/${url}`;
  
  // 修复可能的双斜杠问题（保留协议中的双斜杠）
  fullUrl = fullUrl.replace(/([^:])\/\//g, '$1/');
  
  // 打印请求信息，便于调试
  console.log('请求URL:', fullUrl);
  console.log('请求方法:', method);
  console.log('请求数据:', data);

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success(res) {
        // 隐藏加载中
        if (loading) {
          wx.hideLoading();
        }

        // 打印响应信息
        console.log('响应状态:', res.statusCode);
        console.log('响应数据:', res.data);

        // 请求成功
        if (res.statusCode === 200) {
          // 检查业务状态码
          if (res.data && res.data.code === 0) {
            resolve(res.data);
          } else {
            // 业务错误
            wx.showToast({
              title: res.data?.message || '请求失败',
              icon: 'none'
            });
            reject(res.data || { message: '请求失败' });
          }
        } 
        // 未授权
        else if (res.statusCode === 401) {
          console.log('未授权错误，响应详情:', res);
          
          // 清除登录状态
          app.clearLoginStatus();
          
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000
          });
          
          // 跳转到登录页
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/auth/login/index'
            });
          }, 2000);
          
          reject({ message: '登录已过期，请重新登录' });
        } 
        // 其他错误
        else {
          console.log('请求错误，状态码:', res.statusCode, '响应详情:', res);
          
          wx.showToast({
            title: res.data?.message || `请求失败(${res.statusCode})`,
            icon: 'none'
          });
          
          reject(res.data || { message: `请求失败(${res.statusCode})` });
        }
      },
      fail(err) {
        // 隐藏加载中
        if (loading) {
          wx.hideLoading();
        }
        
        // 打印错误信息
        console.error('请求失败:', err);
        
        wx.showToast({
          title: '网络异常，请检查网络连接',
          icon: 'none'
        });
        
        reject({ message: '网络异常，请检查网络连接', error: err });
      }
    });
  });
}

/**
 * GET请求
 * @param {String} url 请求地址
 * @param {Object} data 请求数据
 * @param {Boolean} loading 是否显示加载中
 * @returns {Promise}
 */
function get(url, data = {}, loading = false) {
  return request(url, 'GET', data, loading);
}

/**
 * POST请求
 * @param {String} url 请求地址
 * @param {Object} data 请求数据
 * @param {Boolean} loading 是否显示加载中
 * @returns {Promise}
 */
function post(url, data = {}, loading = false) {
  return request(url, 'POST', data, loading);
}

/**
 * PUT请求
 * @param {String} url 请求地址
 * @param {Object} data 请求数据
 * @param {Boolean} loading 是否显示加载中
 * @returns {Promise}
 */
function put(url, data = {}, loading = false) {
  return request(url, 'PUT', data, loading);
}

/**
 * DELETE请求
 * @param {String} url 请求地址
 * @param {Object} data 请求数据
 * @param {Boolean} loading 是否显示加载中
 * @returns {Promise}
 */
function del(url, data = {}, loading = false) {
  return request(url, 'DELETE', data, loading);
}

module.exports = {
  request,
  get,
  post,
  put,
  del
}; 