const app = getApp();
const sealApi = require('../../api/seal');
const util = require('../../utils/util');

Page({
  data: {
    seals: [],
    isLoading: true,
    isEmpty: false
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    if (app.globalData.isLogin) {
      this.loadSeals();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    if (!app.globalData.isLogin) {
      wx.redirectTo({
        url: '/pages/auth/login/index'
      });
    }
  },

  // 加载印章列表
  loadSeals() {
    this.setData({
      isLoading: true
    });

    sealApi.getSeals()
      .then(res => {
        if (res.code === 0) {
          const list = res.data || [];
          
          this.setData({
            seals: list,
            isEmpty: list.length === 0,
            isLoading: false
          });
        } else {
          this.setData({
            isLoading: false
          });
          util.showToast(res.message || '获取印章列表失败');
        }
      })
      .catch(() => {
        this.setData({
          isLoading: false
        });
        util.showToast('获取印章列表失败，请检查网络');
      });
  },

  // 创建印章
  goToCreateSeal() {
    wx.navigateTo({
      url: '/pages/seals/create/index'
    });
  },

  // 查看印章详情
  goToSealDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/seals/detail/index?id=${id}`
    });
  },

  // 授权印章
  handleAuthorizeSeal(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    
    wx.showModal({
      title: '印章授权',
      content: `确定要授权印章"${name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          util.showLoading('授权中...');
          
          sealApi.authorizeSeal(id)
            .then(res => {
              util.hideLoading();
              
              if (res.code === 0) {
                util.showToast('授权成功', 'success');
                this.loadSeals();
              } else {
                util.showToast(res.message || '授权失败');
              }
            })
            .catch(() => {
              util.hideLoading();
              util.showToast('授权失败，请检查网络');
            });
        }
      }
    });
  },

  // 删除印章
  handleDeleteSeal(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    
    wx.showModal({
      title: '删除印章',
      content: `确定要删除印章"${name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          util.showLoading('删除中...');
          
          sealApi.deleteSeal(id)
            .then(res => {
              util.hideLoading();
              
              if (res.code === 0) {
                util.showToast('删除成功', 'success');
                this.loadSeals();
              } else {
                util.showToast(res.message || '删除失败');
              }
            })
            .catch(() => {
              util.hideLoading();
              util.showToast('删除失败，请检查网络');
            });
        }
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadSeals();
    wx.stopPullDownRefresh();
  }
}); 