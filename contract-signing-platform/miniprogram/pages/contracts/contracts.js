// pages/contracts/contracts.js
const app = getApp()

Page({
  data: {
    currentTab: "all",
    contracts: [],
  },

  onLoad() {
    this.loadContracts()
  },

  onShow() {
    // 每次显示页面时刷新合同列表
    this.loadContracts()
  },

  onPullDownRefresh() {
    this.loadContracts(() => {
      wx.stopPullDownRefresh()
    })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      currentTab: tab,
    })
    this.loadContracts()
  },

  loadContracts(callback) {
    if (!app.globalData.token) return

    wx.showLoading({
      title: "加载中...",
    })

    wx.request({
      url: app.globalData.baseUrl + "/api/contracts",
      method: "GET",
      data: {
        status: this.data.currentTab === "all" ? "" : this.data.currentTab,
        type: app.globalData.userType,
      },
      header: {
        Authorization: "Bearer " + app.globalData.token,
      },
      success: (res) => {
        wx.hideLoading()

        if (res.data.success) {
          this.setData({
            contracts: res.data.contracts || [],
          })
        } else {
          wx.showToast({
            title: res.data.message || "加载失败",
            icon: "none",
          })
        }

        if (callback) callback()
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: "网络错误，请重试",
          icon: "none",
        })

        if (callback) callback()
      },
    })
  },

  goToContractDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/contracts/detail/detail?id=${id}`,
    })
  },

  goToSignContract(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/contracts/sign/sign?id=${id}`,
    })
  },

  createContract() {
    // 检查是否已实名认证
    if (!app.globalData.userInfo || !app.globalData.userInfo.isVerified) {
      wx.showModal({
        title: "提示",
        content: "发起合同需要先完成实名认证",
        confirmText: "去认证",
        success: (res) => {
          if (res.confirm) {
            if (app.globalData.userType === "personal") {
              wx.navigateTo({
                url: "/pages/verification/personal/personal",
              })
            } else {
              wx.navigateTo({
                url: "/pages/verification/enterprise/enterprise",
              })
            }
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
