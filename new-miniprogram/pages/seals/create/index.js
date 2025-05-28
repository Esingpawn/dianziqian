const app = getApp();
const sealApi = require('../../../api/seal');
const util = require('../../../utils/util');

Page({
  data: {
    name: '',
    type: 'personal', // personal: 个人印章, enterprise: 企业印章
    tempFilePath: '',
    isUploading: false,
    isSubmitting: false,
    enterpriseVerified: false
  },

  onLoad() {
    // 检查企业认证状态
    if (app.globalData.userInfo && app.globalData.userInfo.isEnterpriseVerified) {
      this.setData({
        enterpriseVerified: true
      });
    }
  },

  // 输入印章名称
  handleNameInput(e) {
    this.setData({
      name: e.detail.value
    });
  },

  // 选择印章类型
  handleTypeChange(e) {
    this.setData({
      type: e.detail.value
    });
  },

  // 选择印章图片
  handleChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          tempFilePath
        });
      }
    });
  },

  // 删除已选图片
  handleDeleteImage() {
    this.setData({
      tempFilePath: ''
    });
  },

  // 验证表单
  validateForm() {
    const { name, type, tempFilePath } = this.data;
    
    if (!name.trim()) {
      util.showToast('请输入印章名称');
      return false;
    }
    
    if (type === 'enterprise' && !this.data.enterpriseVerified) {
      util.showToast('请先完成企业认证');
      return false;
    }
    
    if (!tempFilePath) {
      util.showToast('请选择印章图片');
      return false;
    }
    
    return true;
  },

  // 提交创建印章
  handleSubmit() {
    if (!this.validateForm()) {
      return;
    }
    
    this.setData({
      isSubmitting: true
    });
    
    util.showLoading('创建中...');
    
    // 上传印章图片
    sealApi.uploadSealImage(this.data.tempFilePath, {
      name: this.data.name,
      type: this.data.type
    })
      .then(res => {
        util.hideLoading();
        this.setData({
          isSubmitting: false
        });
        
        if (res.code === 0) {
          util.showToast('创建成功', 'success');
          
          // 延迟返回印章列表
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          util.showToast(res.message || '创建印章失败');
        }
      })
      .catch(() => {
        util.hideLoading();
        this.setData({
          isSubmitting: false
        });
        util.showToast('创建印章失败，请检查网络');
      });
  },
  
  // 前往企业认证
  goToEnterpriseVerification() {
    wx.navigateTo({
      url: '/pages/enterprise/index'
    });
  }
}); 