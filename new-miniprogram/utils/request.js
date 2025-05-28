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
  
  // 调试信息
  console.log(`[请求]${method} ${url}, token: ${token ? '存在' : '不存在'}`);
  
  // 如果是需要认证的API但没有token，直接拒绝请求避免401循环
  if (needsAuth(url) && !token) {
    console.log(`[请求拒绝] ${url} 需要认证但没有token`);
    if (loading) {
      wx.hideLoading();
    }
    
    // 避免重复跳转
    const isRedirecting = wx.getStorageSync('is_redirecting_to_login');
    if (!isRedirecting) {
      wx.setStorageSync('is_redirecting_to_login', 'true');
      
      // 清除登录状态
      app.clearLoginStatus();
      
      // 跳转到登录页
      wx.redirectTo({
        url: '/pages/auth/login/index',
        complete: () => {
          console.log('[跳转] 因缺少token跳转到登录页');
          // 延迟清除跳转标记，避免快速多次跳转
          setTimeout(() => {
            wx.removeStorageSync('is_redirecting_to_login');
          }, 1500);
        }
      });
    }
    
    return Promise.reject({ message: '未登录，请先登录' });
  }
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + url,
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

        // 请求成功
        if (res.statusCode === 200) {
          resolve(res.data);
        } 
        // 未授权
        else if (res.statusCode === 401) {
          console.log(`[401错误] ${url}, token状态:`, token ? '有token但失效' : '无token');
          
          // 避免重复跳转
          const isRedirecting = wx.getStorageSync('is_redirecting_to_login');
          if (!isRedirecting) {
            wx.setStorageSync('is_redirecting_to_login', 'true');
            
            // 清除登录状态
            app.clearLoginStatus();
            
            // 跳转到登录页
            wx.redirectTo({
              url: '/pages/auth/login/index',
              complete: () => {
                console.log('[跳转] 因401错误跳转到登录页');
                // 延迟清除跳转标记
                setTimeout(() => {
                  wx.removeStorageSync('is_redirecting_to_login');
                }, 1500);
              }
            });
          }
          
          reject({ message: '登录已过期，请重新登录' });
        } 
        // 其他错误
        else {
          console.log(`[请求错误] ${url}, 状态码: ${res.statusCode}`, res.data);
          reject(res.data || { message: '请求失败' });
        }
      },
      fail(err) {
        // 隐藏加载中
        if (loading) {
          wx.hideLoading();
        }
        console.log(`[请求失败] ${url}`, err);
        reject({ message: '网络异常，请检查网络连接' });
      }
    });
  });
}

/**
 * 判断API是否需要认证
 * @param {String} url API路径
 * @returns {Boolean} 是否需要认证
 */
function needsAuth(url) {
  // 不需要认证的API列表
  const publicApis = [
    '/auth/login',
    '/auth/register',
    '/auth/wx-login',
    '/auth/send-code',
    '/auth/phone-login'
  ];
  
  // 检查是否匹配公开API
  for (const api of publicApis) {
    if (url.includes(api)) {
      return false;
    }
  }
  
  // 默认需要认证
  return true;
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

/**
 * 上传文件
 * @param {string} url 请求地址
 * @param {string} filePath 文件路径
 * @param {string} name 文件对应的 key
 * @param {Object} formData 其他表单数据
 * @param {Object} header 请求头
 */
function uploadFile(url, filePath, name = 'file', formData = {}, header = {}) {
  // 添加 token
  if (app.globalData.token) {
    header['Authorization'] = `Bearer ${app.globalData.token}`;
  }

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url,
      filePath,
      name,
      formData,
      header,
      success(res) {
        try {
          const data = JSON.parse(res.data);
          if (res.statusCode === 200 && data.code === 0) {
            resolve(data);
          } else {
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            });
            reject(data);
          }
        } catch (e) {
          reject(e);
        }
      },
      fail(err) {
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  uploadFile
}; 