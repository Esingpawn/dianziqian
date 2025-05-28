App({
  globalData: {
    userInfo: null,
    token: '',
    isLogin: false,
    baseUrl: 'http://localhost:5000', // 使用http协议
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
    
    // 打印baseUrl，便于调试
    console.log('App启动，baseUrl:', this.globalData.baseUrl);
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      this.globalData.isLogin = true;

      // 获取用户信息
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.globalData.userInfo = userInfo;
      }
    }
  },

  // 设置登录状态
  setLoginStatus(data) {
    // 存储 token
    wx.setStorageSync('token', data.token);
    this.globalData.token = data.token;
    this.globalData.isLogin = true;

    // 存储用户信息
    wx.setStorageSync('userInfo', data.userInfo);
    this.globalData.userInfo = data.userInfo;
  },

  // 清除登录状态
  clearLoginStatus() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    this.globalData.token = '';
    this.globalData.userInfo = null;
    this.globalData.isLogin = false;
  }
}); 