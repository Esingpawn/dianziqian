// app.js
App({
  globalData: {
    userInfo: null,
    token: '',
    isLogin: false,
    baseUrl: 'http://localhost:5000', // 替换为实际API地址
    version: '1.0.0',
    theme: {
      primaryColor: '#3B82F6',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      textColor: '#333333',
      borderColor: '#EEEEEE'
    }
  },

  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    console.log('[APP] 检查登录状态, token存在:', !!token);
    
    if (token) {
      this.globalData.token = token;
      this.globalData.isLogin = true;

      // 获取用户信息
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.globalData.userInfo = userInfo;
        console.log('[APP] 用户信息已加载');
      } else {
        console.log('[APP] 未找到用户信息缓存');
      }
    } else {
      // 确保如果没有token，登录状态为false
      this.globalData.token = '';
      this.globalData.isLogin = false;
      this.globalData.userInfo = null;
      console.log('[APP] 未登录状态');
    }
    
    console.log('[APP] 当前登录状态:', this.globalData.isLogin, '令牌:', !!this.globalData.token);
  },

  // 设置登录状态
  setLoginStatus(data) {
    console.log('[APP] 尝试设置登录状态, 数据:', data);
    
    if (!data) {
      console.error('[APP] 设置登录状态失败: 无效的数据');
      return;
    }
    
    // 处理不同格式的数据结构
    let token, userInfo;
    
    // 1. 直接包含token的情况
    if (data.token) {
      token = data.token;
      userInfo = data.userInfo;
    }
    // 2. token在data嵌套字段的情况
    else if (data.data && data.data.token) {
      token = data.data.token;
      userInfo = data.data.userInfo;
    }
    
    if (!token) {
      console.error('[APP] 设置登录状态失败: 找不到有效的token');
      // 输出完整返回数据以便调试
      console.log('[APP] 完整登录返回数据:', JSON.stringify(data));
      return;
    }
    
    // 存储 token
    wx.setStorageSync('token', token);
    this.globalData.token = token;
    this.globalData.isLogin = true;

    // 存储用户信息
    if (userInfo) {
      wx.setStorageSync('userInfo', userInfo);
      this.globalData.userInfo = userInfo;
    }
    
    console.log('[APP] 登录状态已设置, token:', token.substring(0, 10) + '...', '用户:', userInfo ? userInfo.username : '未知');
  },

  // 清除登录状态
  clearLoginStatus() {
    console.log('[APP] 清除登录状态');
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    this.globalData.token = '';
    this.globalData.userInfo = null;
    this.globalData.isLogin = false;
  }
}); 