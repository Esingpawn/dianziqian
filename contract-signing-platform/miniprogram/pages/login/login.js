// pages/login/login.js
const app = getApp()

Page({
  data: {
    phone: "",
    code: "",
    isSendingCode: false,
    countdown: 60,
  },

  onLoad() {
    // 检查是否已登录
    if (app.globalData.isLoggedIn) {
      wx.switchTab({
        url: "/pages/index/index",
      })
    }
  },

  handlePhoneInput(e) {
    this.setData({
      phone: e.detail.value,
    })
  },

  handleCodeInput(e) {
    this.setData({
      code: e.detail.value,
    })
  },

  handleSendCode() {
    const { phone } = this.data

    if (!phone || phone.length !== 11) {
      wx.showToast({
        title: "请输入正确的手机号",
        icon: "none",
      })
      return
    }

    // 发送验证码
    wx.request({
      url: app.globalData.baseUrl + "/api/auth/send-code",
      method: "POST",
      data: {
        phone,
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            isSendingCode: true,
          })

          // 开始倒计时
          this.startCountdown()

          wx.showToast({
            title: "验证码已发送",
            icon: "success",
          })
        } else {
          wx.showToast({
            title: res.data.message || "发送失败，请重试",
            icon: "none",
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: "网络错误，请重试",
          icon: "none",
        })
      },
    })
  },

  startCountdown() {
    let seconds = this.data.countdown

    const timer = setInterval(() => {
      seconds--

      this.setData({
        countdown: seconds,
      })

      if (seconds <= 0) {
        clearInterval(timer)
        this.setData({
          isSendingCode: false,
          countdown: 60,
        })
      }
    }, 1000)
  },

  handlePhoneLogin() {
    const { phone, code } = this.data

    if (!phone || phone.length !== 11) {
      wx.showToast({
        title: "请输入正确的手机号",
        icon: "none",
      })
      return
    }

    if (!code || code.length !== 6) {
      wx.showToast({
        title: "请输入正确的验证码",
        icon: "none",
      })
      return
    }

    wx.showLoading({
      title: "登录中...",
    })

    // 手机号登录
    wx.request({
      url: app.globalData.baseUrl + "/api/auth/login-by-phone",
      method: "POST",
      data: {
        phone,
        code,
      },
      success: (res) => {
        wx.hideLoading()

        if (res.data.token) {
          // 保存登录状态
          app.globalData.token = res.data.token
          app.globalData.isLoggedIn = true

          // 获取用户信息
          app.getUserInfo()

          // 跳转到首页
          wx.switchTab({
            url: "/pages/index/index",
          })
        } else {
          wx.showToast({
            title: res.data.message || "登录失败，请重试",
            icon: "none",
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: "网络错误，请重试",
          icon: "none",
        })
      },
    })
  },

  handleWechatLogin() {
    wx.showLoading({
      title: "登录中...",
    })

    wx.login({
      success: (res) => {
        if (res.code) {
          // 发送 code 到后台换取 token
          wx.request({
            url: app.globalData.baseUrl + "/api/auth/login",
            method: "POST",
            data: {
              code: res.code,
            },
            success: (result) => {
              wx.hideLoading()

              if (result.data.token) {
                // 保存登录状态
                app.globalData.token = result.data.token
                app.globalData.isLoggedIn = true

                // 获取用户信息
                app.getUserInfo()

                // 跳转到首页
                wx.switchTab({
                  url: "/pages/index/index",
                })
              } else {
                wx.showToast({
                  title: result.data.message || "登录失败，请重试",
                  icon: "none",
                })
              }
            },
            fail: () => {
              wx.hideLoading()
              wx.showToast({
                title: "网络错误，请重试",
                icon: "none",
              })
            },
          })
        } else {
          wx.hideLoading()
          wx.showToast({
            title: "登录失败，请重试",
            icon: "none",
          })
        }
      },
    })
  },

  showPrivacyPolicy() {
    wx.navigateTo({
      url: "/pages/privacy/privacy",
    })
  },
})
