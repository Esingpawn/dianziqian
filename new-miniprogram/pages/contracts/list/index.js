const app = getApp();
const contractApi = require('../../../api/contract');
const util = require('../../../utils/util');

Page({
  data: {
    contracts: [],
    currentStatus: 'all', // all, pending, completed, rejected
    statusOptions: [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待处理' },
      { value: 'completed', label: '已完成' },
      { value: 'rejected', label: '已拒绝' }
    ],
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
    isLoading: false,
    isEmpty: false,
    searchValue: ''
  },

  onLoad(options) {
    // 如果有状态参数，设置当前状态
    if (options && options.status) {
      this.setData({
        currentStatus: options.status
      });
    }
    
    // 检查缓存中是否有筛选状态参数
    const cacheStatus = wx.getStorageSync('contract_filter_status');
    if (cacheStatus) {
      console.log('从缓存读取筛选状态:', cacheStatus);
      this.setData({
        currentStatus: cacheStatus,
        page: 1
      });
      // 清除缓存，避免影响下次进入
      wx.removeStorageSync('contract_filter_status');
    }
    
    // 监听事件通道，接收来自其他页面的状态筛选请求
    try {
      const eventChannel = this.getOpenerEventChannel();
      // 确保eventChannel存在且有on方法
      if (eventChannel && typeof eventChannel.on === 'function') {
        eventChannel.on('filterContractStatus', (data) => {
          this.setData({
            currentStatus: data.status || 'all',
            page: 1
          });
          this.loadContracts(true);
        });
        console.log('成功设置事件通道监听');
      } else {
        console.log('事件通道不存在或不支持on方法');
      }
    } catch (err) {
      console.error('设置事件通道监听出错:', err);
    }
    
    this.loadContracts(true);
  },

  onShow() {
    // 检查缓存中是否有筛选状态参数 (用于Tab页面返回时)
    const cacheStatus = wx.getStorageSync('contract_filter_status');
    if (cacheStatus) {
      console.log('onShow - 从缓存读取筛选状态:', cacheStatus);
      this.setData({
        currentStatus: cacheStatus,
        page: 1
      });
      // 清除缓存，避免影响下次进入
      wx.removeStorageSync('contract_filter_status');
      // 重新加载数据
      this.loadContracts(true);
    } else {
      // 每次显示页面时刷新数据
      if (app.globalData.isLogin) {
        this.loadContracts(true);
      } else {
        wx.redirectTo({
          url: '/pages/auth/login/index'
        });
      }
    }
  },

  // 加载合同列表
  loadContracts(refresh = false) {
    if (this.data.isLoading) return;

    const page = refresh ? 1 : this.data.page;
    const { limit, currentStatus, searchValue } = this.data;

    this.setData({
      isLoading: true
    });

    // 构建查询参数
    const params = {
      page,
      limit,
      status: currentStatus !== 'all' ? currentStatus : '',
      keyword: searchValue
    };

    contractApi.getContracts(params)
      .then(res => {
        if (res.code === 0) {
          const list = res.data.list || [];
          const total = res.data.total || 0;
          
          // 格式化数据
          const formattedList = list.map(item => ({
            ...item,
            createTime: util.formatTime(item.createTime, 'YYYY-MM-DD'),
            statusText: this.getStatusText(item.status)
          }));
          
          this.setData({
            contracts: refresh ? formattedList : [...this.data.contracts, ...formattedList],
            page: page + 1,
            total,
            hasMore: page * limit < total,
            isEmpty: refresh && list.length === 0,
            isLoading: false
          });
        } else {
          this.setData({
            isLoading: false
          });
          util.showToast(res.message || '获取合同列表失败');
        }
      })
      .catch(() => {
        this.setData({
          isLoading: false
        });
        util.showToast('获取合同列表失败，请检查网络');
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

  // 切换状态筛选
  handleStatusChange(e) {
    const status = e.currentTarget.dataset.status;
    if (status === this.data.currentStatus) return;
    
    this.setData({
      currentStatus: status,
      page: 1
    });
    
    this.loadContracts(true);
  },

  // 搜索合同
  handleSearch(e) {
    this.setData({
      searchValue: e.detail.value,
      page: 1
    });
    
    this.loadContracts(true);
  },

  // 清除搜索
  handleClearSearch() {
    this.setData({
      searchValue: '',
      page: 1
    });
    
    this.loadContracts(true);
  },

  // 查看合同详情
  goToContractDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/contracts/detail/index?id=${id}`
    });
  },

  // 创建合同
  goToCreateContract() {
    wx.navigateTo({
      url: '/pages/contracts/create/index'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadContracts(true);
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore) {
      this.loadContracts();
    }
  }
}); 