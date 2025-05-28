/**
 * 印章相关API
 */

const request = require('./request');

/**
 * 获取印章列表
 * @param {Object} params 查询参数
 * @param {Number} params.page 页码，默认1
 * @param {Number} params.pageSize 每页条数，默认10
 * @param {String} params.type 印章类型筛选(personal/enterprise)
 * @returns {Promise} 印章列表
 */
const getSeals = (params = {}) => {
  return request.get('/seals', params);
};

/**
 * 获取印章详情
 * @param {String} id 印章ID
 * @returns {Promise} 印章详情
 */
const getSealDetail = (id) => {
  return request.get(`/seals/${id}`);
};

/**
 * 创建印章
 * @param {Object} data 印章基本信息
 * @param {String} data.name 印章名称
 * @param {String} data.type 印章类型(personal/enterprise)
 * @returns {Promise} 创建结果
 */
const createSeal = (data) => {
  return request.post('/seals', data);
};

/**
 * 上传印章图片
 * @param {String} filePath 图片路径
 * @param {Object} data 额外数据
 * @param {String} data.name 印章名称
 * @param {String} data.type 印章类型
 * @returns {Promise} 上传结果
 */
const uploadSealImage = (filePath, data = {}) => {
  return request.upload('/seals/upload', filePath, 'image', data);
};

/**
 * 删除印章
 * @param {String} id 印章ID
 * @returns {Promise} 删除结果
 */
const deleteSeal = (id) => {
  return request.delete(`/seals/${id}`);
};

/**
 * 设置默认印章
 * @param {String} id 印章ID
 * @returns {Promise} 设置结果
 */
const setDefaultSeal = (id) => {
  return request.patch(`/seals/${id}/default`);
};

/**
 * 获取企业印章列表
 * @param {String} enterpriseId 企业ID
 * @param {Object} params 查询参数
 * @returns {Promise} 企业印章列表
 */
const getEnterpriseSeals = (enterpriseId, params = {}) => {
  return request.get(`/enterprises/${enterpriseId}/seals`, params);
};

module.exports = {
  getSeals,
  getSealDetail,
  createSeal,
  uploadSealImage,
  deleteSeal,
  setDefaultSeal,
  getEnterpriseSeals
}; 