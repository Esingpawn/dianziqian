const app = getApp();
const authApi = require('../../api/auth');
const contractApi = require('../../api/contract');
const util = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    contractStats: {
      total: 0,
      pending: 0,
      completed: 0,
      rejected: 0
    },
    recentContracts: [],
    isLoading: true
  },

  onLoad() {
    console.log('[Dashboard] onLoad');
    this.checkLoginStatus();
  },

  onShow() {
    console.log('[Dashboard] onShow');
    // 只有当已登录且有token时才加载数据
    // 避免与onLoad中的checkLoginStatus重复
    if (app.globalData.isLogin && app.globalData.token && !this.data.isLoading) {
      console.log('[Dashboard] onShow - 检测到登录状态，刷新数据');
      this.loadData();
    } else {
      console.log('[Dashboard] onShow - 未检测到有效登录状态或正在加载中');
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    console.log('[Dashboard] 检查登录状态:', app.globalData.isLogin, '令牌:', app.globalData.token ? '存在' : '不存在');
    
    if (app.globalData.isLogin && app.globalData.token) {
      // 确保全局userInfo是对象
      if (!app.globalData.userInfo) {
        app.globalData.userInfo = {};
        console.log('[Dashboard] 警告: 全局userInfo为空，已初始化为空对象');
      }
      
      // 安全地设置userInfo
      try {
        this.setData({
          userInfo: app.globalData.userInfo || {}
        });
        console.log('[Dashboard] 已设置用户信息:', app.globalData.userInfo || {});
      } catch (err) {
        console.error('[Dashboard] 设置userInfo错误:', err);
        this.setData({
          userInfo: {}
        });
      }
      
      this.loadData();
    } else {
      console.log('[Dashboard] 未登录，跳转到登录页');
      wx.redirectTo({
        url: '/pages/auth/login/index'
      });
    }
  },

  // 加载数据
  loadData() {
    this.setData({
      isLoading: true
    });
    
    console.log('[Dashboard] 开始加载数据');

    // 获取用户信息
    const userInfoPromise = authApi.getUserInfo()
      .then(res => {
        console.log('[Dashboard] 获取用户信息成功:', res);
        if (res.code === 0) {
          this.setData({
            userInfo: res.data
          });
          app.globalData.userInfo = res.data;
          wx.setStorageSync('userInfo', res.data);
        }
      })
      .catch(err => {
        console.error('[Dashboard] 获取用户信息失败:', err);
      });

    // 获取合同统计
    const contractStatsPromise = contractApi.getContracts({ statsOnly: true })
      .then(res => {
        console.log('[Dashboard] 获取合同统计成功:', res);
        if (res.code === 0) {
          this.setData({
            contractStats: res.data.stats || {
              total: 0,
              pending: 0,
              completed: 0,
              rejected: 0
            }
          });
        }
      })
      .catch(err => {
        console.error('[Dashboard] 获取合同统计失败:', err);
        // 设置默认值避免界面错误
        this.setData({
          contractStats: {
            total: 0,
            pending: 0,
            completed: 0,
            rejected: 0
          }
        });
      });

    // 获取最近合同
    const recentContractsPromise = contractApi.getContracts({ page: 1, limit: 5 })
      .then(res => {
        console.log('[Dashboard] 获取最近合同成功:', res);
        if (res.code === 0) {
          this.setData({
            recentContracts: res.data.list || []
          });
        }
      })
      .catch(err => {
        console.error('[Dashboard] 获取最近合同失败:', err);
        // 设置默认空数组避免界面错误
        this.setData({
          recentContracts: []
        });
      });

    // 等待所有请求完成
    Promise.all([userInfoPromise, contractStatsPromise, recentContractsPromise])
      .finally(() => {
        console.log('[Dashboard] 所有数据加载完成');
        this.setData({
          isLoading: false
        });
      });
  },

  // 查看合同列表
  goToContracts(e) {
    const status = e.currentTarget.dataset.status || '';
    
    // switchTab不支持事件通道，使用缓存传递状态参数
    if (status) {
      // 将状态保存到缓存，让合同列表页面从缓存中获取
      wx.setStorageSync('contract_filter_status', status);
      console.log('[Dashboard] 已设置合同筛选状态到缓存:', status);
    }
    
    wx.switchTab({
      url: '/pages/contracts/list',
      success: () => {
        console.log('[Dashboard] 跳转到合同列表页面成功');
      },
      fail: (err) => {
        console.error('[Dashboard] 跳转到合同列表页面失败:', err);
      }
    });
  },

  // 创建合同
  goToCreateContract() {
    wx.navigateTo({
      url: '/pages/contracts/create/index'
    });
  },

  // 企业认证
  goToEnterpriseVerification() {
    wx.navigateTo({
      url: '/pages/enterprise/index'
    });
  },

  // 印章管理
  goToSealManagement() {
    wx.switchTab({
      url: '/pages/seals/index'
    });
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearLoginStatus();
          wx.redirectTo({
            url: '/pages/auth/login/index'
          });
        }
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  }
}); 