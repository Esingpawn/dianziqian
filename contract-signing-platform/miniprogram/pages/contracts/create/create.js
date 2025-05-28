// pages/contracts/create/create.js
const app = getApp()

Page({
  data: {
    title: "",
    contractTypeIndex: 0,
    contractTypes: [
      { id: 1, name: "劳动合同" },
      { id: 2, name: "租赁合同" },
      { id: 3, name: "销售合同" },
      { id: 4, name: "服务合同" },
      { id: 5, name: "采购合同" },
    ],
    fileUrl: "",
    fileName: "",
    fileSize: "",
    recipientPhone: "",
    today: "",
    endDate: "",
    userType: "personal",
    packageCount: 0,
    canSubmit: false,
  },

  onLoad() {
    // 设置今天的日期
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")

    this.setData({
      today: `${year}-${month}-${day}`,
      userType: app.globalData.userType,
    })

    // 获取套餐数量
    this.getPackageCount()
  },

  getPackageCount() {
    if (!app.globalData.token) return

    wx.request({
      url: app.globalData.baseUrl + "/api/packages/count",
      method: "GET",
      header: {
        Authorization: "Bearer " + app.globalData.token,
      },
      success: (res) => {
        if (res.data.success) {
          const count = this.data.userType === "personal" ? res.data.personal : res.data.enterprise
          this.setData({
            packageCount: count || 0,
          })
          this.checkCanSubmit()
        }
      },
    })
  },

  handleTitleInput(e) {
    this.setData({
      title: e.detail.value,
    })
    this.checkCanSubmit()
  },

  handleContractTypeChange(e) {
    this.setData({
      contractTypeIndex: e.detail.value,
    })
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      extension: ["pdf", "doc", "docx"],
      success: (res) => {
        const file = res.tempFiles[0]

        // 文件大小限制（10MB）
        if (file.size > 10 * 1024 * 1024) {
          wx.showToast({
            title: "文件大小不能超过10MB",
            icon: "none",
          })
          return
        }

        this.setData({
          fileUrl: file.path,
          fileName: file.name,
          fileSize: this.formatFileSize(file.size),
        })

        this.checkCanSubmit()
      },
    })
  },

  formatFileSize(size) {
    if (size < 1024) {
      return size + "B"
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + "KB"
    } else {
      return (size / (1024 * 1024)).toFixed(2) + "MB"
    }
  },

  previewFile() {
    if (!this.data.fileUrl) return

    wx.openDocument({
      filePath: this.data.fileUrl,
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
  },

  deleteFile() {
    this.setData({
      fileUrl: "",
      fileName: "",
      fileSize: "",
    })
    this.checkCanSubmit()
  },

  handleRecipientPhoneInput(e) {
    this.setData({
      recipientPhone: e.detail.value,
    })
    this.checkCanSubmit()
  },

  handleEndDateChange(e) {
    this.setData({
      endDate: e.detail.value,
    })
    this.checkCanSubmit()
  },

  checkCanSubmit() {
    const { title, fileUrl, recipientPhone, endDate, packageCount } = this.data

    const isValid =
      title.trim() !== "" && fileUrl !== "" && recipientPhone.length === 11 && endDate !== "" && packageCount > 0

    this.setData({
      canSubmit: isValid,
    })
  },

  goToBuyPackage() {
    wx.navigateTo({
      url: "/pages/packages/packages",
    })
  },

  cancel() {
    wx.navigateBack()
  },

  submitContract() {
    if (!this.data.canSubmit) return

    wx.showLoading({
      title: "提交中...",
    })

    // 先上传文件
    wx.uploadFile({
      url: app.globalData.baseUrl + "/api/files/upload",
      filePath: this.data.fileUrl,
      name: "file",
      header: {
        Authorization: "Bearer " + app.globalData.token,
      },
      success: (uploadRes) => {
        const data = JSON.parse(uploadRes.data)

        if (data.success && data.fileUrl) {
          // 创建合同
          this.createContract(data.fileUrl)
        } else {
          wx.hideLoading()
          wx.showToast({
            title: data.message || "文件上传失败",
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

  createContract(fileUrl) {
    const contractData = {
      title: this.data.title,
      contractTypeId: this.data.contractTypes[this.data.contractTypeIndex].id,
      fileUrl: fileUrl,
      recipientPhone: this.data.recipientPhone,
      endDate: this.data.endDate,
      packageType: this.data.userType,
    }

    wx.request({
      url: app.globalData.baseUrl + "/api/contracts/create",
      method: "POST",
      data: contractData,
      header: {
        Authorization: "Bearer " + app.globalData.token,
      },
      success: (res) => {
        wx.hideLoading()

        if (res.data.success) {
          wx.showToast({
            title: "合同创建成功",
            icon: "success",
          })

          // 更新套餐数量
          this.getPackageCount()

          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.data.message || "创建失败",
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
})
