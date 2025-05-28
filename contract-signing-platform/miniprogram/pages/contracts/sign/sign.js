// pages/contracts/sign/sign.js
const app = getApp()

Page({
  data: {
    id: "",
    contractImageUrl: "",
    signMethod: "signature",
    signPosition: {
      top: 600,
      left: 400,
      width: 240,
      height: 120,
    },
    savedSignatures: ["/images/signature1.png", "/images/signature2.png"],
    selectedSignatureIndex: -1,
    selectedSignatureUrl: "",
    seals: [],
    selectedSealIndex: -1,
    selectedSealUrl: "",
    isDrawing: false,
    lastX: 0,
    lastY: 0,
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        id: options.id,
      })
      this.loadContractPreview()
      this.loadSeals()
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

  onReady() {
    // 初始化签名画布
    this.ctx = wx.createCanvasContext("signatureCanvas")
    this.ctx.setStrokeStyle("#000000")
    this.ctx.setLineWidth(4)
    this.ctx.setLineCap("round")
    this.ctx.setLineJoin("round")
  },

  loadContractPreview() {
    if (!app.globalData.token) return

    wx.showLoading({
      title: "加载中...",
    })

    wx.request({
      url: app.globalData.baseUrl + "/api/contracts/" + this.data.id + "/preview",
      method: "GET",
      header: {
        Authorization: "Bearer " + app.globalData.token,
      },
      success: (res) => {
        wx.hideLoading()

        if (res.data.success && res.data.previewUrl) {
          this.setData({
            contractImageUrl: res.data.previewUrl,
            signPosition: res.data.signPosition || this.data.signPosition,
          })
        } else {
          wx.showToast({
            title: res.data.message || "加载失败",
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

  loadSeals() {
    if (!app.globalData.token) return

    wx.request({
      url: app.globalData.baseUrl + "/api/seals",
      method: "GET",
      header: {
        Authorization: "Bearer " + app.globalData.token,
      },
      success: (res) => {
        if (res.data.success && res.data.seals) {
          this.setData({
            seals: res.data.seals,
          })
        }
      },
    })
  },

  switchToSignature() {
    this.setData({
      signMethod: "signature",
      selectedSealIndex: -1,
      selectedSealUrl: "",
    })
  },

  switchToSeal() {
    this.setData({
      signMethod: "seal",
      selectedSignatureIndex: -1,
      selectedSignatureUrl: "",
    })
  },

  onTouchStart(e) {
    const { x, y } = e.touches[0]
    this.setData({
      isDrawing: true,
      lastX: x,
      lastY: y,
    })
  },

  onTouchMove(e) {
    if (!this.data.isDrawing) return

    const { x, y } = e.touches[0]

    this.ctx.beginPath()
    this.ctx.moveTo(this.data.lastX, this.data.lastY)
    this.ctx.lineTo(x, y)
    this.ctx.stroke()
    this.ctx.draw(true)

    this.setData({
      lastX: x,
      lastY: y,
    })
  },

  onTouchEnd() {
    this.setData({
      isDrawing: false,
    })
  },

  clearSignature() {
    this.ctx.clearRect(0, 0, 1000, 1000)
    this.ctx.draw()
  },

  confirmSignature() {
    wx.canvasToTempFilePath({
      canvasId: "signatureCanvas",
      success: (res) => {
        // 保存签名图片
        this.setData({
          selectedSignatureUrl: res.tempFilePath,
          selectedSignatureIndex: -1,
        })

        // 可以选择上传到服务器保存
        this.uploadSignature(res.tempFilePath)
      },
      fail: () => {
        wx.showToast({
          title: "保存签名失败",
          icon: "none",
        })
      },
    })
  },

  uploadSignature(filePath) {
    wx.uploadFile({
      url: app.globalData.baseUrl + "/api/signatures/upload",
      filePath: filePath,
      name: "signature",
      header: {
        Authorization: "Bearer " + app.globalData.token,
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.success && data.url) {
          // 更新已保存的签名列表
          const savedSignatures = this.data.savedSignatures
          savedSignatures.push(data.url)
          this.setData({
            savedSignatures,
          })
        }
      },
    })
  },

  selectSignature(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      selectedSignatureIndex: index,
      selectedSignatureUrl: this.data.savedSignatures[index],
    })
  },

  showSignaturePad() {
    this.clearSignature()
    this.setData({
      selectedSignatureIndex: -1,
      selectedSignatureUrl: "",
    })
  },

  selectSeal(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      selectedSealIndex: index,
      selectedSealUrl: this.data.seals[index].imageUrl,
    })
  },

  downloadContract() {
    if (!this.data.contractImageUrl) {
      wx.showToast({
        title: "合同不存在",
        icon: "none",
      })
      return
    }

    wx.showLoading({
      title: "下载中...",
    })

    wx.downloadFile({
      url: this.data.contractImageUrl,
      success: (res) => {
        wx.hideLoading()

        if (res.statusCode === 200) {
          wx.saveFile({
            tempFilePath: res.tempFilePath,
            success: () => {
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

  rejectContract() {
    wx.showModal({
      title: "拒签确认",
      content: "您确定要拒绝签署此合同吗？",
      confirmText: "确认拒签",
      confirmColor: "#ff4d4f",
      success: (res) => {
        if (res.confirm) {
          this.submitReject()
        }
      },
    })
  },

  submitReject() {
    if (!app.globalData.token) return

    wx.showLoading({
      title: "提交中...",
    })

    wx.request({
      url: app.globalData.baseUrl + "/api/contracts/" + this.data.id + "/reject",
      method: "POST",
      header: {
        Authorization: "Bearer " + app.globalData.token,
      },
      success: (res) => {
        wx.hideLoading()

        if (res.data.success) {
          wx.showToast({
            title: "已拒签",
            icon: "success",
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: res.data.message || "操作失败",
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

  submitContract() {
    if (!this.data.selectedSignatureUrl && !this.data.selectedSealUrl) {
      wx.showToast({
        title: "请先选择签名或印章",
        icon: "none",
      })
      return
    }

    wx.showLoading({
      title: "提交中...",
    })

    // 构建签署数据
    const signData = {
      contractId: this.data.id,
      signType: this.data.signMethod,
      position: this.data.signPosition,
    }

    if (this.data.signMethod === "signature") {
      // 上传签名图片
      wx.uploadFile({
        url: app.globalData.baseUrl + "/api/contracts/sign",
        filePath: this.data.selectedSignatureUrl,
        name: "signature",
        formData: signData,
        header: {
          Authorization: "Bearer " + app.globalData.token,
        },
        success: (res) => {
          wx.hideLoading()

          const data = JSON.parse(res.data)
          if (data.success) {
            wx.showToast({
              title: "签署成功",
              icon: "success",
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } else {
            wx.showToast({
              title: data.message || "签署失败",
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
      // 使用印章签署
      signData.sealId = this.data.seals[this.data.selectedSealIndex].id

      wx.request({
        url: app.globalData.baseUrl + "/api/contracts/sign",
        method: "POST",
        data: signData,
        header: {
          Authorization: "Bearer " + app.globalData.token,
        },
        success: (res) => {
          wx.hideLoading()

          if (res.data.success) {
            wx.showToast({
              title: "签署成功",
              icon: "success",
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } else {
            wx.showToast({
              title: res.data.message || "签署失败",
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
    }
  },
})
