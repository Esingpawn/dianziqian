const app = getApp();
const authApi = require('../../../api/auth');
const util = require('../../../utils/util');

Page({
  data: {
    phoneNumber: '',
    verificationCode: '',
    password: '',
    confirmPassword: '',
    name: '',
    countdown: 0,
    isSendingCode: false,
    agreePrivacy: false
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

  // 输入密码
  handlePasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 确认密码
  handleConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },

  // 输入姓名
  handleNameInput(e) {
    this.setData({
      name: e.detail.value
    });
  },

  // 切换隐私协议同意状态
  toggleAgreePrivacy() {
    this.setData({
      agreePrivacy: !this.data.agreePrivacy
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
        if (res.code === 0) {
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
      .catch(() => {
        util.showToast('发送验证码失败');
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

  // 注册
  handleRegister() {
    const { phoneNumber, verificationCode, password, confirmPassword, name, agreePrivacy } = this.data;

    // 表单验证
    if (!util.isValidPhoneNumber(phoneNumber)) {
      util.showToast('请输入正确的手机号');
      return;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      util.showToast('请输入6位验证码');
      return;
    }

    if (!password || password.length < 6) {
      util.showToast('密码不能少于6位');
      return;
    }

    if (password !== confirmPassword) {
      util.showToast('两次输入的密码不一致');
      return;
    }

    if (!name) {
      util.showToast('请输入姓名');
      return;
    }

    if (!agreePrivacy) {
      util.showToast('请阅读并同意用户协议和隐私政策');
      return;
    }

    util.showLoading('注册中...');

    // 调用注册接口
    authApi.register({
      phoneNumber,
      verificationCode,
      password,
      name
    })
      .then(res => {
        util.hideLoading();
        
        if (res.code === 0) {
          // 保存登录状态
          app.setLoginStatus(res.data);
          
          util.showToast('注册成功', 'success');
          
          // 跳转到首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/dashboard/index'
            });
          }, 1500);
        } else {
          util.showToast(res.message || '注册失败');
        }
      })
      .catch(() => {
        util.hideLoading();
        util.showToast('注册失败，请检查网络');
      });
  },

  // 前往登录页面
  goToLogin() {
    wx.navigateBack();
  }
}); 