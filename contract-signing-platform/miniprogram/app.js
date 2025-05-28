// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync("logs") || []
    logs.unshift(Date.now())
    wx.setStorageSync("logs", logs)

    // 登录
    wx.login({
      success: (res) => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        if (res.code) {
          wx.request({
            url: this.globalData.baseUrl + "/api/auth/login",
            method: "POST",
            data: {
              code: res.code,
            },
            success: (result) => {
              if (result.data.token) {
                this.globalData.token = result.data.token
                this.globalData.isLoggedIn = true

                // 获取用户信息
                this.getUserInfo()
              }
            },
          })
        }
      },
    })
  },

  getUserInfo() {
    // 获取用户信息
    if (this.globalData.token) {
      wx.request({
        url: this.globalData.baseUrl + "/api/user/info",
        method: "GET",
        header: {
          Authorization: "Bearer " + this.globalData.token,
        },
        success: (result) => {
          if (result.data.user) {
            this.globalData.userInfo = result.data.user

            // 通知页面用户信息已更新
            if (this.userInfoReadyCallback) {
              this.userInfoReadyCallback(result.data.user)
            }
          }
        },
      })
    }
  },

  globalData: {
    userInfo: null,
    token: "",
    isLoggedIn: false,
    baseUrl: "https://api.example.com", // 替换为您的实际API地址
    userType: "personal", // 'personal' 或 'enterprise'
  },
})
