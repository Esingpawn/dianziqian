const app = getApp();
const authApi = require('../../../api/auth');
const util = require('../../../utils/util');

Page({
  data: {
    phoneNumber: '',
    verificationCode: '',
    countdown: 0,
    isSendingCode: false,
    isLoggingIn: false,
    loginType: 'phone', // phone: 手机号登录，wechat: 微信登录
  },

  onLoad() {
    // 检查是否已经登录
    if (app.globalData.isLogin) {
      wx.switchTab({
        url: '/pages/dashboard/index'
      });
    }
  },

  // 切换登录方式
  switchLoginType(e) {
    this.setData({
      loginType: e.currentTarget.dataset.type
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
    if (!util.isValidPhoneNumber(phoneNumber)) {
      util.showToast('请输入正确的手机号');
      return;
    }

    this.setData({ 
      isSendingCode: true,
      countdown: 60
    });

    // 调用发送验证码接口
    authApi.sendVerificationCode(phoneNumber)
      .then(res => {
        if (res.code === 0 || res.success) {
          util.showToast('验证码已发送', 'success');
          this.startCountdown();
        } else {
          util.showToast(res.message || '发送验证码失败');
          this.setData({ 
            isSendingCode: false,
            countdown: 0
          });
        }
      })
      .catch(err => {
        console.error('发送验证码出错:', err);
        util.showToast('发送验证码失败，请检查网络');
        this.setData({ 
          isSendingCode: false,
          countdown: 0
        });
      });
  },

  // 倒计时
  startCountdown() {
    const timer = setInterval(() => {
      if (this.data.countdown <= 1) {
        clearInterval(timer);
        this.setData({
          isSendingCode: false,
          countdown: 0
        });
      } else {
        this.setData({
          countdown: this.data.countdown - 1
        });
      }
    }, 1000);
  },

  // 手机号登录
  handlePhoneLogin() {
    const { phoneNumber, verificationCode } = this.data;

    // 表单验证
    if (!util.isValidPhoneNumber(phoneNumber)) {
      util.showToast('请输入正确的手机号');
      return;
    }

    if (!verificationCode) {
      util.showToast('请输入验证码');
      return;
    }

    this.setData({
      isLoggingIn: true
    });

    util.showLoading('登录中...');

    // 调用登录接口
    authApi.phoneLogin(phoneNumber, verificationCode)
      .then(res => {
        util.hideLoading();
        
        console.log('手机登录接口返回:', res);
        
        if (res.code === 0 || res.success) {
          // 保存登录状态
          app.setLoginStatus(res.data);
          
          // 清除重定向标记
          wx.removeStorageSync('is_redirecting_to_login');
          
          util.showToast('登录成功', 'success');
          
          console.log('登录成功，token已保存:', app.globalData.token);
          
          // 延迟跳转确保状态更新完成
          setTimeout(() => {
            // 使用switchTab跳转到tabBar页面
            wx.switchTab({
              url: '/pages/dashboard/index',
              success: () => {
                console.log('跳转到dashboard成功');
              },
              fail: (error) => {
                console.error('跳转到dashboard失败:', error);
                // 如果跳转失败，尝试刷新当前页
                if (error.errMsg && error.errMsg.includes('tabbar')) {
                  // 如果错误是因为tabbar，则重新加载小程序
                  wx.reLaunch({
                    url: '/pages/dashboard/index'
                  });
                }
              }
            });
          }, 500);
        } else {
          util.showToast(res.message || '登录失败');
        }
        
        this.setData({
          isLoggingIn: false
        });
      })
      .catch(err => {
        console.error('手机登录出错:', err);
        util.hideLoading();
        util.showToast('登录失败，请检查网络');
        
        this.setData({
          isLoggingIn: false
        });
      });
  },

  // 微信登录
  handleWechatLogin() {
    this.setData({
      isLoggingIn: true
    });

    util.showLoading('登录中...');

    wx.login({
      success: (res) => {
        if (res.code) {
          // 打印code
          console.log('微信登录code:', res.code);
          
          // 调用登录接口
          authApi.wxLogin(res.code)
            .then(res => {
              util.hideLoading();
              
              console.log('微信登录接口返回:', res);
              
              if (res.code === 0 || res.success) {
                // 保存登录状态
                app.setLoginStatus(res.data);
                
                // 清除重定向标记
                wx.removeStorageSync('is_redirecting_to_login');
                
                util.showToast('登录成功', 'success');
                
                console.log('登录成功，token已保存:', app.globalData.token);
                
                // 延迟跳转确保状态更新完成
                setTimeout(() => {
                  // 使用switchTab跳转到tabBar页面
                  wx.switchTab({
                    url: '/pages/dashboard/index',
                    success: () => {
                      console.log('跳转到dashboard成功');
                    },
                    fail: (error) => {
                      console.error('跳转到dashboard失败:', error);
                      // 如果跳转失败，尝试刷新当前页
                      if (error.errMsg && error.errMsg.includes('tabbar')) {
                        // 如果错误是因为tabbar，则重新加载小程序
                        wx.reLaunch({
                          url: '/pages/dashboard/index'
                        });
                      }
                    }
                  });
                }, 500);
              } else {
                util.showToast(res.message || '登录失败');
              }
              
              this.setData({
                isLoggingIn: false
              });
            })
            .catch(err => {
              console.error('微信登录接口出错:', err);
              util.hideLoading();
              util.showToast('登录失败，请检查网络');
              
              this.setData({
                isLoggingIn: false
              });
            });
        } else {
          console.error('微信登录获取code失败');
          util.hideLoading();
          util.showToast('微信登录失败');
          
          this.setData({
            isLoggingIn: false
          });
        }
      },
      fail: (err) => {
        console.error('wx.login调用失败:', err);
        util.hideLoading();
        util.showToast('微信登录失败');
        
        this.setData({
          isLoggingIn: false
        });
      }
    });
  },

  // 注册页面
  goToRegister() {
    wx.navigateTo({
      url: '/pages/auth/register/index'
    });
  }
}); 