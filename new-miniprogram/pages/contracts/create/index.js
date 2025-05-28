// pages/contracts/create/index.js
const app = getApp();
const contractApi = require('../../../api/contract');
const util = require('../../../utils/util');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: '',
    parties: [
      { id: util.generateUUID(), name: '', phone: '', email: '', role: 'recipient' }
    ],
    fileList: [],
    fileUrl: '',
    isUploading: false,
    isSubmitting: false,
    showAddPartyPopup: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

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

  // 输入合同标题
  handleTitleInput(e) {
    this.setData({
      title: e.detail.value
    });
  },

  // 添加签署方
  handleAddParty() {
    const parties = [...this.data.parties];
    parties.push({
      id: util.generateUUID(),
      name: '',
      phone: '',
      email: '',
      role: 'recipient'
    });
    
    this.setData({ parties });
  },

  // 删除签署方
  handleDeleteParty(e) {
    const index = e.currentTarget.dataset.index;
    const parties = [...this.data.parties];
    parties.splice(index, 1);
    this.setData({ parties });
  },

  // 监听签署方信息输入
  handlePartyInput(e) {
    const { field, index } = e.currentTarget.dataset;
    const value = e.detail.value;
    const parties = [...this.data.parties];
    parties[index][field] = value;
    
    this.setData({
      [`parties[${index}].${field}`]: value
    });
  },

  // 选择合同签署角色
  handleRoleChange(e) {
    const { index } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({
      [`parties[${index}].role`]: value
    });
  },

  // 选择合同文件
  handleChooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf', 'doc', 'docx'],
      success: (res) => {
        const file = res.tempFiles[0];
        const extension = util.getFileExtension(file.name).toLowerCase();
        
        if (['pdf', 'doc', 'docx'].indexOf(extension) === -1) {
          util.showToast('请选择PDF或Word格式的文件');
          return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
          util.showToast('文件大小不能超过10MB');
          return;
        }
        
        this.setData({
          fileList: [{
            name: file.name,
            size: (file.size / 1024).toFixed(2) + 'KB',
            path: file.path
          }]
        });
      }
    });
  },

  // 删除合同文件
  handleDeleteFile() {
    this.setData({
      fileList: [],
      fileUrl: ''
    });
  },

  // 上传合同文件
  uploadContractFile() {
    if (this.data.fileList.length === 0) {
      return Promise.resolve(null);
    }
    
    this.setData({ isUploading: true });
    
    return contractApi.uploadContractFile(this.data.fileList[0].path)
      .then(res => {
        this.setData({ isUploading: false });
        
        if (res.code === 0) {
          this.setData({ fileUrl: res.data.url });
          return res.data.url;
        } else {
          util.showToast(res.message || '上传文件失败');
          return null;
        }
      })
      .catch(() => {
        this.setData({ isUploading: false });
        util.showToast('上传文件失败，请检查网络');
        return null;
      });
  },

  // 验证表单
  validateForm() {
    const { title, parties, fileList } = this.data;
    
    if (!title.trim()) {
      util.showToast('请输入合同标题');
      return false;
    }
    
    if (fileList.length === 0) {
      util.showToast('请上传合同文件');
      return false;
    }
    
    if (parties.length < 1) {
      util.showToast('请添加至少一个签署方');
      return false;
    }
    
    // 验证每个签署方信息
    for (let i = 0; i < parties.length; i++) {
      const party = parties[i];
      if (!party.name.trim()) {
        util.showToast(`请输入第${i + 1}个签署方的姓名`);
        return false;
      }
      
      if (!party.phone.trim()) {
        util.showToast(`请输入第${i + 1}个签署方的手机号`);
        return false;
      }
      
      if (!util.isValidPhone(party.phone)) {
        util.showToast(`第${i + 1}个签署方的手机号格式不正确`);
        return false;
      }
    }
    
    return true;
  },

  // 提交创建合同
  handleSubmit() {
    if (!this.validateForm()) {
      return;
    }
    
    this.setData({ isSubmitting: true });
    
    // 先上传文件
    this.uploadContractFile()
      .then(fileUrl => {
        if (!fileUrl) {
          this.setData({ isSubmitting: false });
          return;
        }
        
        // 组装合同数据
        const contractData = {
          title: this.data.title,
          fileUrl: fileUrl,
          parties: this.data.parties.map(party => ({
            name: party.name,
            phone: party.phone,
            email: party.email || '',
            role: party.role
          }))
        };
        
        // 创建合同
        return contractApi.createContract(contractData);
      })
      .then(res => {
        this.setData({ isSubmitting: false });
        
        if (res && res.code === 0) {
          util.showToast('创建成功', 'success');
          
          // 延迟跳转到合同详情
          setTimeout(() => {
            wx.redirectTo({
              url: `/pages/contracts/detail/index?id=${res.data.id}`
            });
          }, 1500);
        }
      })
      .catch(() => {
        this.setData({ isSubmitting: false });
        util.showToast('创建合同失败，请检查网络');
      });
  }
})