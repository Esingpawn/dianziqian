const app = getApp();
const contractApi = require('../../../api/contract');
const util = require('../../../utils/util');

Page({
  data: {
    contractId: '',
    contract: null,
    isLoading: true,
    isActionLoading: false
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({
        contractId: options.id
      });
      this.loadContractDetail();
    } else {
      util.showToast('合同ID不存在');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
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
          // 格式化数据
          const contract = res.data;
          contract.createTime = util.formatTime(contract.createTime, 'YYYY-MM-DD HH:mm');
          contract.updateTime = util.formatTime(contract.updateTime, 'YYYY-MM-DD HH:mm');
          contract.statusText = this.getStatusText(contract.status);
          
          this.setData({
            contract,
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

  // 获取状态文本
  getStatusText(status) {
    switch (status) {
      case 'pending':
        return '待处理';
      case 'completed':
        return '已完成';
      case 'rejected':
        return '已拒绝';
      default:
        return '未知状态';
    }
  },

  // 签署合同
  handleSignContract() {
    const { contractId, contract } = this.data;
    
    if (contract.status !== 'pending') {
      util.showToast('当前合同状态不可签署');
      return;
    }
    
    wx.navigateTo({
      url: `/pages/contracts/sign/index?id=${contractId}`
    });
  },

  // 拒绝合同
  handleRejectContract() {
    const { contractId, contract } = this.data;
    
    if (contract.status !== 'pending') {
      util.showToast('当前合同状态不可拒绝');
      return;
    }
    
    wx.showModal({
      title: '拒绝合同',
      content: '确定要拒绝此合同吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            isActionLoading: true
          });
          
          contractApi.rejectContract(contractId, { reason: '用户主动拒绝' })
            .then(res => {
              this.setData({
                isActionLoading: false
              });
              
              if (res.code === 0) {
                util.showToast('拒绝成功', 'success');
                this.loadContractDetail();
              } else {
                util.showToast(res.message || '拒绝失败');
              }
            })
            .catch(() => {
              this.setData({
                isActionLoading: false
              });
              util.showToast('拒绝失败，请检查网络');
            });
        }
      }
    });
  },

  // 撤销合同
  handleRevokeContract() {
    const { contractId, contract } = this.data;
    
    if (contract.status !== 'pending' || !contract.isInitiator) {
      util.showToast('当前合同状态不可撤销或您不是发起人');
      return;
    }
    
    wx.showModal({
      title: '撤销合同',
      content: '确定要撤销此合同吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            isActionLoading: true
          });
          
          contractApi.revokeContract(contractId)
            .then(res => {
              this.setData({
                isActionLoading: false
              });
              
              if (res.code === 0) {
                util.showToast('撤销成功', 'success');
                this.loadContractDetail();
              } else {
                util.showToast(res.message || '撤销失败');
              }
            })
            .catch(() => {
              this.setData({
                isActionLoading: false
              });
              util.showToast('撤销失败，请检查网络');
            });
        }
      }
    });
  },

  // 预览合同
  handlePreviewContract() {
    const { contract } = this.data;
    
    if (!contract || !contract.fileUrl) {
      util.showToast('合同文件不存在');
      return;
    }
    
    wx.showLoading({
      title: '加载中...',
    });
    
    wx.downloadFile({
      url: contract.fileUrl,
      success(res) {
        wx.hideLoading();
        
        if (res.statusCode === 200) {
          wx.openDocument({
            filePath: res.tempFilePath,
            showMenu: true,
            success() {
              console.log('打开文档成功');
            },
            fail() {
              util.showToast('打开文档失败');
            }
          });
        } else {
          util.showToast('下载文件失败');
        }
      },
      fail() {
        wx.hideLoading();
        util.showToast('下载文件失败，请检查网络');
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadContractDetail();
    wx.stopPullDownRefresh();
  }
}); 