/**
 * 统一API请求模块
 * 处理请求参数、响应数据格式化和错误处理
 */

const BASE_URL = 'http://localhost:5000/api'; // 开发环境API地址
// const BASE_URL = 'https://api.esign-project.com/api'; // 生产环境API地址

/**
 * 检查并转换字段名 - 发送请求前调用
 * @param {Object} data 请求数据
 * @returns {Object} 转换后的数据
 */
function convertRequestFields(data) {
  // 如果没有数据或不是对象，直接返回
  if (!data || typeof data !== 'object') return data;
  
  // 转换后的数据对象
  const converted = {};
  
  // 标准字段到后端接收字段的映射关系
  const fieldMappings = {
    // 必要时可在此处添加特殊映射，当前优先使用标准字段名
  };
  
  // 处理数据字段
  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      // 如果有映射关系，使用映射后的字段名
      const mappedKey = fieldMappings[key] || key;
      
      // 递归处理嵌套对象
      if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key]) && !(data[key] instanceof Date)) {
        converted[mappedKey] = convertRequestFields(data[key]);
      } else if (Array.isArray(data[key])) {
        // 处理数组
        converted[mappedKey] = data[key].map(item => {
          if (item && typeof item === 'object') {
            return convertRequestFields(item);
          }
          return item;
        });
      } else {
        // 基本类型直接赋值
        converted[mappedKey] = data[key];
      }
    }
  }
  
  return converted;
}

/**
 * 标准化API响应数据 - 确保符合前端期望的字段名格式
 * @param {Object} response 原始响应数据
 * @returns {Object} 标准化后的响应数据
 */
function standardizeResponse(response) {
  // 如果没有响应或不是对象，直接返回
  if (!response || typeof response !== 'object') return response;
  
  // 处理非标准响应格式 - 确保有success、message和data字段
  if (!('success' in response)) {
    response = {
      success: true,
      message: '操作成功',
      data: response
    };
  }
  
  // 处理列表数据 - 确保列表数据格式一致
  if (response.data && Array.isArray(response.data)) {
    response.data = {
      list: response.data,
      pagination: {
        page: 1,
        pageSize: response.data.length,
        total: response.data.length,
        totalPages: 1
      }
    };
  }
  
  return response;
}

/**
 * 统一错误处理
 * @param {Object} error 错误对象
 */
function handleError(error) {
  // 网络错误
  if (!error.response) {
    wx.showToast({
      title: '网络连接失败',
      icon: 'none',
      duration: 2000
    });
    return Promise.reject({ success: false, message: '网络连接失败' });
  }
  
  // 服务器返回错误
  const response = error.response;
  let errorMessage = '请求失败';
  
  // 尝试从响应中获取错误信息
  if (response.data && response.data.message) {
    errorMessage = response.data.message;
  }
  
  // 身份验证失败
  if (response.statusCode === 401) {
    // 清除登录凭证
    wx.removeStorageSync('token');
    
    // 跳转到登录页
    wx.reLaunch({
      url: '/pages/auth/login/index'
    });
    
    errorMessage = '请重新登录';
  }
  
  // 显示错误信息
  wx.showToast({
    title: errorMessage,
    icon: 'none',
    duration: 2000
  });
  
  return Promise.reject(response.data || { success: false, message: errorMessage });
}

/**
 * 发送HTTP请求
 * @param {String} url 请求URL
 * @param {String} method 请求方法
 * @param {Object} data 请求数据
 * @param {Object} options 其他选项
 * @returns {Promise} 请求Promise
 */
function request(url, method = 'GET', data = {}, options = {}) {
  // 获取请求头
  const header = {
    'Content-Type': 'application/json',
    ...options.header
  };
  
  // 添加认证令牌
  const token = wx.getStorageSync('token');
  if (token) {
    header.Authorization = `Bearer ${token}`;
  }
  
  // 转换请求字段
  const convertedData = convertRequestFields(data);
  
  // 发送请求
  return new Promise((resolve, reject) => {
    wx.request({
      url: options.baseUrl ? options.baseUrl + url : BASE_URL + url,
      method: method.toUpperCase(),
      data: convertedData,
      header,
      success: (res) => {
        // 请求成功，但状态码不是2xx
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return handleError({ response: res });
        }
        
        // 标准化响应
        const standardizedResponse = standardizeResponse(res.data);
        resolve(standardizedResponse);
      },
      fail: (err) => {
        handleError(err);
        reject(err);
      }
    });
  });
}

// 封装常用HTTP方法
const api = {
  get: (url, params = {}, options = {}) => {
    return request(url, 'GET', params, options);
  },
  post: (url, data = {}, options = {}) => {
    return request(url, 'POST', data, options);
  },
  put: (url, data = {}, options = {}) => {
    return request(url, 'PUT', data, options);
  },
  patch: (url, data = {}, options = {}) => {
    return request(url, 'PATCH', data, options);
  },
  delete: (url, data = {}, options = {}) => {
    return request(url, 'DELETE', data, options);
  },
  // 文件上传专用方法
  upload: (url, filePath, name = 'file', formData = {}, options = {}) => {
    const header = {
      'Content-Type': 'multipart/form-data',
      ...options.header
    };
    
    // 添加认证令牌
    const token = wx.getStorageSync('token');
    if (token) {
      header.Authorization = `Bearer ${token}`;
    }
    
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: options.baseUrl ? options.baseUrl + url : BASE_URL + url,
        filePath,
        name,
        formData: convertRequestFields(formData),
        header,
        success: (res) => {
          try {
            // 解析响应JSON
            const data = JSON.parse(res.data);
            // 标准化响应
            const standardizedResponse = standardizeResponse(data);
            resolve(standardizedResponse);
          } catch (err) {
            // JSON解析失败
            resolve({ success: true, data: res.data });
          }
        },
        fail: (err) => {
          handleError(err);
          reject(err);
        }
      });
    });
  }
};

module.exports = api; 