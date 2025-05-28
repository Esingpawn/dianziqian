const app = getApp();

Page({
  data: {
    phoneNumber: '',
    verificationCode: '',
    countdown: 0,
    isSendingCode: false,
    activeTab: 'phone' // phone 或 wechat
  },

  onLoad() {
    // 如果已经登录，跳转到首页
    if (app.globalData.hasLogin) {
      wx.switchTab({
        url: '/pages/dashboard/index'
      });
    }
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
  },

  // 输入手机号
  handlePhoneInput(e) {
    this.setData({
      phoneNumber: e.detail.value
    });
  },

  // 输入验证码
  handleCodeInput(e) {
    this.setData({
      verificationCode: e.detail.value
    });
  },

  // 发送验证码
  handleSendCode() {
    if (this.data.isSendingCode) {
      return;
    }

    const phoneNumber = this.data.phoneNumber;
    if (!phoneNumber || phoneNumber.length !== 11) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    this.setData({ 
      isSendingCode: true,
      countdown: 60
    });

    const that = this;
    // 调用发送验证码接口
    wx.request({
      url: `${app.globalData.baseUrl}/api/auth/sendCode`,
      method: 'POST',
      data: {
        phoneNumber
      },
      success(res) {
        if (res.statusCode === 200 && res.data.code === 0) {
          wx.showToast({
            title: '验证码已发送',
            icon: 'success'
          });
          that.startCountdown();
        } else {
          wx.showToast({
            title: res.data.message || '发送验证码失败',
            icon: 'none'
          });
          that.setData({ 
            isSendingCode: false,
            countdown: 0
          });
        }
      },
      fail() {
        wx.showToast({
          title: '发送验证码失败',
          icon: 'none'
        });
        that.setData({ 
          isSendingCode: false,
          countdown: 0
        });
      }
    });
  },

  // 倒计时
  startCountdown() {
    const that = this;
    const timer = setInterval(() => {
      if (that.data.countdown <= 1) {
        clearInterval(timer);
        that.setData({
          isSendingCode: false,
          countdown: 0
        });
      } else {
        that.setData({
          countdown: that.data.countdown - 1
        });
      }
    }, 1000);
  },

  // 手机号登录
  handlePhoneLogin() {
    const phoneNumber = this.data.phoneNumber;
    const verificationCode = this.data.verificationCode;

    if (!phoneNumber || phoneNumber.length !== 11) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      wx.showToast({
        title: '请输入6位验证码',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '登录中...',
    });

    const that = this;
    // 调用登录接口
    wx.request({
      url: `${app.globalData.baseUrl}/api/auth/login`,
      method: 'POST',
      data: {
        phoneNumber,
        verificationCode
      },
      success(res) {
        wx.hideLoading();
        
        if (res.statusCode === 200 && res.data.code === 0) {
          // 保存登录状态
          app.setLoginStatus(res.data.data);
          
          // 返回上一页或首页
          const pages = getCurrentPages();
          if (pages.length > 1) {
            wx.navigateBack();
          } else {
            wx.switchTab({
              url: '/pages/dashboard/index'
            });
          }
        } else {
          wx.showToast({
            title: res.data.message || '登录失败',
            icon: 'none'
          });
        }
      },
      fail() {
        wx.hideLoading();
        wx.showToast({
          title: '登录失败，请检查网络',
          icon: 'none'
        });
      }
    });
  },

  // 微信登录
  handleWechatLogin() {
    wx.showLoading({
      title: '登录中...',
    });

    const that = this;
    // 获取微信登录code
    wx.login({
      success(res) {
        if (res.code) {
          // 调用微信登录接口
          wx.request({
            url: `${app.globalData.baseUrl}/api/auth/wxLogin`,
            method: 'POST',
            data: {
              code: res.code
            },
            success(loginRes) {
              wx.hideLoading();
              
              if (loginRes.statusCode === 200 && loginRes.data.code === 0) {
                // 保存登录状态
                app.setLoginStatus(loginRes.data.data);
                
                // 返回上一页或首页
                const pages = getCurrentPages();
                if (pages.length > 1) {
                  wx.navigateBack();
                } else {
                  wx.switchTab({
                    url: '/pages/dashboard/index'
                  });
                }
              } else {
                wx.showToast({
                  title: loginRes.data.message || '登录失败',
                  icon: 'none'
                });
              }
            },
            fail() {
              wx.hideLoading();
              wx.showToast({
                title: '登录失败，请检查网络',
                icon: 'none'
              });
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '微信登录失败',
            icon: 'none'
          });
        }
      },
      fail() {
        wx.hideLoading();
        wx.showToast({
          title: '微信登录失败',
          icon: 'none'
        });
      }
    });
  },

  // 前往注册页面
  goToRegister() {
    wx.navigateTo({
      url: '/pages/auth/register'
    });
  }
}); 