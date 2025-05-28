// pages/index/index.js
const app = getApp()

Page({
  data: {
    userInfo: {},
    userType: "personal",
    personalCount: 0,
    enterpriseCount: 0,
  },

  onLoad() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
      })
    } else {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      app.userInfoReadyCallback = (res) => {
        this.setData({
          userInfo: res,
        })
      }
    }

    // 获取套餐数量
    this.getPackageCounts()
  },

  onShow() {
    // 每次显示页面时更新用户类型
    this.setData({
      userType: app.globalData.userType,
    })

    // 刷新套餐数量
    this.getPackageCounts()
  },

  getPackageCounts() {
    if (!app.globalData.token) return

    wx.request({
      url: app.globalData.baseUrl + "/api/packages/count",
      method: "GET",
      header: {
        Authorization: "Bearer " + app.globalData.token,
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            personalCount: res.data.personal || 0,
            enterpriseCount: res.data.enterprise || 0,
          })
        }
      },
    })
  },

  switchToPersonal() {
    this.setData({
      userType: "personal",
    })
    app.globalData.userType = "personal"
  },

  switchToEnterprise() {
    this.setData({
      userType: "enterprise",
    })
    app.globalData.userType = "enterprise"
  },

  goToVerification() {
    if (this.data.userType === "personal") {
      wx.navigateTo({
        url: "/pages/verification/personal/personal",
      })
    } else {
      wx.navigateTo({
        url: "/pages/verification/enterprise/enterprise",
      })
    }
  },

  goToEnterprise() {
    wx.navigateTo({
      url: "/pages/enterprise/enterprise",
    })
  },

  goToSeals() {
    wx.navigateTo({
      url: "/pages/seals/seals",
    })
  },

  goToContracts() {
    wx.switchTab({
      url: "/pages/contracts/contracts",
    })
  },

  goToPrivacy() {
    wx.navigateTo({
      url: "/pages/privacy/privacy",
    })
  },

  goToSettings() {
    wx.navigateTo({
      url: "/pages/settings/settings",
    })
  },

  createContract() {
    // 检查是否已实名认证
    if (!this.data.userInfo.isVerified) {
      wx.showModal({
        title: "提示",
        content: "发起合同需要先完成实名认证",
        confirmText: "去认证",
        success: (res) => {
          if (res.confirm) {
            this.goToVerification()
          }
        },
      })
      return
    }

    // 检查是否有可用套餐
    const availableCount = this.data.userType === "personal" ? this.data.personalCount : this.data.enterpriseCount

    if (availableCount <= 0) {
      wx.showModal({
        title: "提示",
        content: "您的套餐已用完，请购买新的套餐",
        confirmText: "去购买",
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: "/pages/packages/packages",
            })
          }
        },
      })
      return
    }

    // 跳转到创建合同页面
    wx.navigateTo({
      url: "/pages/contracts/create/create",
    })
  },
})
