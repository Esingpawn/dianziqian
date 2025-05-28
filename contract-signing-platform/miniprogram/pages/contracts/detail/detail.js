// pages/contracts/detail/detail.js
const app = getApp()

Page({
  data: {
    id: "",
    contract: {},
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        id: options.id,
      })
      this.loadContractDetail()
    } else {
      wx.showToast({
        title: "合同ID不存在",
        icon: "none",
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  loadContractDetail() {
    if (!app.globalData.token) return

    wx.showLoading({
      title: "加载中...",
    })

    wx.request({
      url: app.globalData.baseUrl + "/api/contracts/" + this.data.id,
      method: "GET",
      header: {
        Authorization: "Bearer " + app.globalData.token,
      },
      success: (res) => {
        wx.hideLoading()

        if (res.data.success && res.data.contract) {
          this.setData({
            contract: res.data.contract,
          })
        } else {
          wx.showToast({
            title: res.data.message || "加载失败",
            icon: "none",
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
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

  previewFile() {
    if (!this.data.contract.fileUrl) {
      wx.showToast({
        title: "文件不存在",
        icon: "none",
      })
      return
    }

    wx.showLoading({
      title: "加载中...",
    })

    // 下载文件到本地临时目录
    wx.downloadFile({
      url: this.data.contract.fileUrl,
      success: (res) => {
        wx.hideLoading()

        if (res.statusCode === 200) {
          // 打开文件预览
          wx.openDocument({
            filePath: res.tempFilePath,
            showMenu: true,
            success: () => {
              console.log("打开文档成功")
            },
            fail: () => {
              wx.showToast({
                title: "文件预览失败",
                icon: "none",
              })
            },
          })
        } else {
          wx.showToast({
            title: "文件下载失败",
            icon: "none",
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: "文件下载失败",
          icon: "none",
        })
      },
    })
  },

  downloadFile() {
    if (!this.data.contract.fileUrl) {
      wx.showToast({
        title: "文件不存在",
        icon: "none",
      })
      return
    }

    wx.showLoading({
      title: "下载中...",
    })

    // 下载文件到本地临时目录
    wx.downloadFile({
      url: this.data.contract.fileUrl,
      success: (res) => {
        wx.hideLoading()

        if (res.statusCode === 200) {
          // 保存文件到本地
          wx.saveFile({
            tempFilePath: res.tempFilePath,
            success: (saveRes) => {
              wx.showToast({
                title: "文件已保存",
                icon: "success",
              })
            },
            fail: () => {
              wx.showToast({
                title: "文件保存失败",
                icon: "none",
              })
            },
          })
        } else {
          wx.showToast({
            title: "文件下载失败",
            icon: "none",
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: "文件下载失败",
          icon: "none",
        })
      },
    })
  },

  goToSignContract() {
    wx.navigateTo({
      url: `/pages/contracts/sign/sign?id=${this.data.id}`,
    })
  },
})
