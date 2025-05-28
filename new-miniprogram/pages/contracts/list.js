const app = getApp();

Page({
  data: {
    hasLogin: false,
    activeTab: 'all', // all, pending, waiting, completed, rejected, revoked
    contracts: [],
    loading: false
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
    if (this.data.hasLogin) {
      this.loadContracts();
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    if (this.data.hasLogin) {
      this.loadContracts(() => {
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    this.loadContracts();
  },

  // 检查登录状态
  checkLoginStatus() {
    const hasLogin = app.globalData.hasLogin || false;
    
    this.setData({
      hasLogin
    });
  },

  // 加载合同列表
  loadContracts(callback) {
    if (!this.data.hasLogin) {
      return;
    }

    this.setData({ loading: true });

    const that = this;
    wx.request({
      url: `${app.globalData.baseUrl}/api/contracts`,
      method: 'GET',
      data: {
        status: this.data.activeTab !== 'all' ? this.data.activeTab : '',
        page: 1,
        limit: 20
      },
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success(res) {
        if (res.statusCode === 200 && res.data.code === 0) {
          // 格式化日期
          const contracts = res.data.data.list.map(item => {
            return {
              ...item,
              startDate: that.formatDate(item.startDate),
              endDate: that.formatDate(item.endDate)
            };
          });
          
          that.setData({
            contracts
          });
        }
      },
      fail(err) {
        console.error('获取合同列表失败', err);
        wx.showToast({
          title: '获取合同列表失败',
          icon: 'none'
        });
      },
      complete() {
        that.setData({ loading: false });
        if (callback) callback();
      }
    });
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  // 跳转到合同详情
  goToContractDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/contracts/detail?id=${id}`
    });
  },

  // 跳转到签署合同
  goToSignContract(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/contracts/sign?id=${id}`
    });
  },

  // 创建合同
  createContract() {
    if (!this.data.hasLogin) {
      wx.navigateTo({
        url: '/pages/auth/login'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/contracts/create'
    });
  }
}); 