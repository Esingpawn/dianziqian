// pages/contracts/sign/index.js
const app = getApp();
const contractApi = require('../../../api/contract');
const sealApi = require('../../../api/seal');
const util = require('../../../utils/util');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    contractId: '',
    contract: null,
    seals: [],
    selectedSealId: '',
    signaturePoints: [],
    canvasWidth: 320,
    canvasHeight: 200,
    isPainting: false,
    isSignatureEmpty: true,
    isLoading: true,
    isSubmitting: false,
    signMethod: 'draw', // draw: 手写签名, seal: 印章签名
    signatureImage: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options && options.id) {
      this.setData({
        contractId: options.id
      });
      
      // 获取设备信息，设置画布大小
      const systemInfo = wx.getSystemInfoSync();
      const canvasWidth = systemInfo.windowWidth * 0.8;
      const canvasHeight = canvasWidth * 0.625; // 比例 8:5
      
      this.setData({
        canvasWidth,
        canvasHeight
      });
      
      this.loadContractDetail();
      this.loadSeals();
    } else {
      util.showToast('合同ID不存在');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 获取画布上下文
    this.ctx = wx.createCanvasContext('signatureCanvas');
    this.ctx.setStrokeStyle('#000000');
    this.ctx.setLineWidth(4);
    this.ctx.setLineCap('round');
    this.ctx.setLineJoin('round');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 加载合同详情
  loadContractDetail() {
    const { contractId } = this.data;
    
    this.setData({
      isLoading: true
    });

    contractApi.getContractDetail(contractId)
      .then(res => {
        if (res.code === 0) {
          this.setData({
            contract: res.data,
            isLoading: false
          });
        } else {
          this.setData({
            isLoading: false
          });
          util.showToast(res.message || '获取合同详情失败');
        }
      })
      .catch(() => {
        this.setData({
          isLoading: false
        });
        util.showToast('获取合同详情失败，请检查网络');
      });
  },

  // 加载印章列表
  loadSeals() {
    sealApi.getSeals()
      .then(res => {
        if (res.code === 0) {
          const seals = res.data || [];
          let selectedSealId = '';
          
          // 如果有默认印章，选中默认印章
          const defaultSeal = seals.find(seal => seal.isDefault);
          if (defaultSeal) {
            selectedSealId = defaultSeal.id;
          } else if (seals.length > 0) {
            selectedSealId = seals[0].id;
          }
          
          this.setData({
            seals,
            selectedSealId
          });
        }
      });
  },

  // 切换签名方式
  handleSwitchSignMethod(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({
      signMethod: method
    });
    
    if (method === 'draw') {
      this.clearSignature();
    }
  },

  // 选择印章
  handleSelectSeal(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      selectedSealId: id
    });
  },

  // 开始绘制签名
  handleTouchStart(e) {
    if (this.data.signMethod !== 'draw') return;
    
    const { x, y } = e.touches[0];
    
    this.setData({
      isPainting: true,
      isSignatureEmpty: false,
      signaturePoints: [[x, y]]
    });
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  },

  // 绘制签名
  handleTouchMove(e) {
    if (!this.data.isPainting) return;
    
    const { x, y } = e.touches[0];
    const points = [...this.data.signaturePoints, [x, y]];
    
    this.setData({
      signaturePoints: points
    });
    
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.draw(true);
  },

  // 结束绘制签名
  handleTouchEnd() {
    if (!this.data.isPainting) return;
    
    this.setData({
      isPainting: false
    });
  },

  // 清除签名
  clearSignature() {
    this.setData({
      signaturePoints: [],
      isSignatureEmpty: true
    });
    
    this.ctx.clearRect(0, 0, this.data.canvasWidth, this.data.canvasHeight);
    this.ctx.draw();
  },

  // 保存签名图片
  saveSignatureImage() {
    return new Promise((resolve, reject) => {
      if (this.data.isSignatureEmpty) {
        reject(new Error('签名不能为空'));
        return;
      }
      
      wx.canvasToTempFilePath({
        canvasId: 'signatureCanvas',
        success: (res) => {
          this.setData({
            signatureImage: res.tempFilePath
          });
          resolve(res.tempFilePath);
        },
        fail: reject
      });
    });
  },

  // 上传签名图片
  uploadSignatureImage(filePath) {
    return contractApi.uploadAttachment(this.data.contractId, filePath, 'signature');
  },

  // 提交签署
  handleSubmit() {
    if (this.data.isSubmitting) return;
    
    if (this.data.signMethod === 'draw' && this.data.isSignatureEmpty) {
      util.showToast('请先完成签名');
      return;
    }
    
    if (this.data.signMethod === 'seal' && !this.data.selectedSealId) {
      util.showToast('请选择印章');
      return;
    }
    
    this.setData({
      isSubmitting: true
    });
    
    util.showLoading('提交中...');
    
    // 根据签名方式处理
    if (this.data.signMethod === 'draw') {
      // 手写签名
      this.saveSignatureImage()
        .then(filePath => this.uploadSignatureImage(filePath))
        .then(res => {
          if (res.code === 0) {
            return contractApi.signContract(this.data.contractId, {
              signatureUrl: res.data.url
            });
          } else {
            throw new Error(res.message || '上传签名失败');
          }
        })
        .then(res => {
          this.handleSignResult(res);
        })
        .catch(err => {
          this.setData({
            isSubmitting: false
          });
          util.hideLoading();
          util.showToast(err.message || '签署失败');
        });
    } else {
      // 印章签名
      contractApi.signContract(this.data.contractId, {
        sealId: this.data.selectedSealId
      })
        .then(res => {
          this.handleSignResult(res);
        })
        .catch(() => {
          this.setData({
            isSubmitting: false
          });
          util.hideLoading();
          util.showToast('签署失败，请检查网络');
        });
    }
  },

  // 处理签署结果
  handleSignResult(res) {
    util.hideLoading();
    
    if (res.code === 0) {
      util.showToast('签署成功', 'success');
      
      // 延迟返回合同详情
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } else {
      this.setData({
        isSubmitting: false
      });
      util.showToast(res.message || '签署失败');
    }
  }
})