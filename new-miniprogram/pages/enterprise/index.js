const app = getApp();
const enterpriseApi = require('../../api/enterprise');
const util = require('../../utils/util');

Page({
  data: {
    hasLogin: false,
    enterpriseInfo: null,
    status: 'unverified', // unverified, pending, verified, rejected
    formData: {
      name: '',
      licenseNumber: '',
      licenseImage: '',
      contactName: '',
      contactPhone: '',
      address: ''
    },
    isSubmitting: false
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
    if (this.data.hasLogin) {
      this.getEnterpriseInfo();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const hasLogin = app.globalData.isLogin || false;
    
    this.setData({
      hasLogin
    });
    
    if (!hasLogin) {
      wx.redirectTo({
        url: '/pages/auth/login/index'
      });
    }
  },

  // 获取企业认证信息
  getEnterpriseInfo() {
    if (!this.data.hasLogin) {
      return;
    }

    util.showLoading('加载中...');
    
    enterpriseApi.getEnterpriseVerificationInfo()
      .then(res => {
        util.hideLoading();
        
        if (res.code === 0) {
          const data = res.data;
          
          if (data) {
            this.setData({
              enterpriseInfo: data,
              status: data.status || 'unverified',
              formData: {
                name: data.name || '',
                licenseNumber: data.licenseNumber || '',
                licenseImage: data.licenseImage || '',
                contactName: data.contactName || '',
                contactPhone: data.contactPhone || '',
                address: data.address || ''
              }
            });
            
            // 更新全局用户信息中的企业认证状态
            if (app.globalData.userInfo) {
              app.globalData.userInfo.isEnterpriseVerified = data.status === 'verified';
              wx.setStorageSync('userInfo', app.globalData.userInfo);
            }
          }
        } else {
          util.showToast(res.message || '获取企业信息失败');
        }
      })
      .catch(() => {
        util.hideLoading();
        util.showToast('获取企业信息失败，请检查网络');
      });
  },

  // 输入企业名称
  handleNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    });
  },

  // 输入营业执照号
  handleLicenseNumberInput(e) {
    this.setData({
      'formData.licenseNumber': e.detail.value
    });
  },

  // 输入联系人姓名
  handleContactNameInput(e) {
    this.setData({
      'formData.contactName': e.detail.value
    });
  },

  // 输入联系人电话
  handleContactPhoneInput(e) {
    this.setData({
      'formData.contactPhone': e.detail.value
    });
  },

  // 输入企业地址
  handleAddressInput(e) {
    this.setData({
      'formData.address': e.detail.value
    });
  },

  // 上传营业执照
  uploadLicense() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        util.showLoading('上传中...');
        
        // 上传图片
        enterpriseApi.uploadLicense(tempFilePath)
          .then(res => {
            util.hideLoading();
            
            if (res.code === 0) {
              this.setData({
                'formData.licenseImage': res.data.url
              });
              
              util.showToast('上传成功', 'success');
            } else {
              util.showToast(res.message || '上传失败');
            }
          })
          .catch(() => {
            util.hideLoading();
            util.showToast('上传失败，请检查网络');
          });
      }
    });
  },

  // 提交认证
  submitVerification() {
    const formData = this.data.formData;
    
    // 表单验证
    if (!formData.name) {
      util.showToast('请输入企业名称');
      return;
    }
    
    if (!formData.licenseNumber) {
      util.showToast('请输入营业执照号');
      return;
    }
    
    if (!formData.licenseImage) {
      util.showToast('请上传营业执照');
      return;
    }
    
    if (!formData.contactName) {
      util.showToast('请输入联系人姓名');
      return;
    }
    
    if (!formData.contactPhone) {
      util.showToast('请输入联系人电话');
      return;
    }
    
    if (!util.isValidPhone(formData.contactPhone)) {
      util.showToast('联系人电话格式不正确');
      return;
    }
    
    this.setData({
      isSubmitting: true
    });
    
    util.showLoading('提交中...');
    
    enterpriseApi.verifyEnterprise(formData)
      .then(res => {
        util.hideLoading();
        this.setData({
          isSubmitting: false
        });
        
        if (res.code === 0) {
          util.showToast('提交成功，等待审核', 'success');
          
          // 更新状态
          this.setData({
            status: 'pending'
          });
          
          // 重新获取企业信息
          setTimeout(() => {
            this.getEnterpriseInfo();
          }, 1500);
        } else {
          util.showToast(res.message || '提交失败');
        }
      })
      .catch(() => {
        util.hideLoading();
        this.setData({
          isSubmitting: false
        });
        util.showToast('提交失败，请检查网络');
      });
  },
  
  // 重新认证
  reVerify() {
    this.setData({
      status: 'unverified'
    });
  }
}); 