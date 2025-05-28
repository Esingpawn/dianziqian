/**
 * 企业相关API
 */

const request = require('./request');

/**
 * 获取企业信息
 * @param {String} id 企业ID
 * @returns {Promise} 企业详情
 */
const getEnterpriseInfo = (id) => {
  return request.get(`/enterprises/${id}`);
};

/**
 * 创建企业
 * @param {Object} data 企业信息
 * @param {String} data.name 企业名称
 * @param {String} data.creditCode 统一社会信用代码
 * @param {String} data.legalRepresentative 法定代表人
 * @param {String} data.phone 联系电话
 * @param {String} data.email 联系邮箱（可选）
 * @param {String} data.address 企业地址
 * @returns {Promise} 创建结果
 */
const createEnterprise = (data) => {
  return request.post('/enterprises', data);
};

/**
 * 更新企业信息
 * @param {String} id 企业ID
 * @param {Object} data 更新数据
 * @returns {Promise} 更新结果
 */
const updateEnterprise = (id, data) => {
  return request.patch(`/enterprises/${id}`, data);
};

/**
 * 上传企业Logo
 * @param {String} id 企业ID
 * @param {String} filePath 文件路径
 * @returns {Promise} 上传结果
 */
const uploadLogo = (id, filePath) => {
  return request.upload(`/enterprises/${id}/upload-logo`, filePath, 'logo');
};

/**
 * 上传营业执照
 * @param {String} id 企业ID
 * @param {String} filePath 文件路径
 * @returns {Promise} 上传结果
 */
const uploadBusinessLicense = (id, filePath) => {
  return request.upload(`/enterprises/${id}/upload-license`, filePath, 'businessLicense');
};

/**
 * 获取企业成员列表
 * @param {String} id 企业ID
 * @param {Object} params 查询参数
 * @param {Number} params.page 页码
 * @param {Number} params.pageSize 每页条数
 * @returns {Promise} 成员列表
 */
const getEnterpriseMembers = (id, params = {}) => {
  return request.get(`/enterprises/${id}/members`, params);
};

/**
 * 添加企业成员
 * @param {String} id 企业ID
 * @param {Object} data 成员信息
 * @param {String} data.phone 手机号
 * @param {String} data.name 姓名
 * @param {String} data.role 角色
 * @param {String} data.department 部门ID（可选）
 * @returns {Promise} 添加结果
 */
const addEnterpriseMember = (id, data) => {
  return request.post(`/enterprises/${id}/members`, data);
};

/**
 * 更新企业成员信息
 * @param {String} enterpriseId 企业ID
 * @param {String} memberId 成员ID
 * @param {Object} data 更新数据
 * @returns {Promise} 更新结果
 */
const updateEnterpriseMember = (enterpriseId, memberId, data) => {
  return request.patch(`/enterprises/${enterpriseId}/members/${memberId}`, data);
};

/**
 * 移除企业成员
 * @param {String} enterpriseId 企业ID
 * @param {String} memberId 成员ID
 * @returns {Promise} 移除结果
 */
const removeEnterpriseMember = (enterpriseId, memberId) => {
  return request.delete(`/enterprises/${enterpriseId}/members/${memberId}`);
};

/**
 * 切换当前选中的企业
 * @param {String} id 企业ID
 * @returns {Promise} 切换结果
 */
const switchCurrentEnterprise = (id) => {
  return request.post('/users/switch-enterprise', { enterpriseId: id });
};

/**
 * 企业认证相关API
 */

/**
 * 获取企业认证信息
 * @returns {Promise} 企业认证信息
 */
const getEnterpriseVerificationInfo = () => {
  return request.get('/enterprise/info');
};

/**
 * 提交企业认证
 * @param {Object} data 企业认证信息
 * @param {String} data.name 企业名称
 * @param {String} data.licenseNumber 营业执照号
 * @param {String} data.licenseImage 营业执照图片
 * @param {String} data.contactName 联系人姓名
 * @param {String} data.contactPhone 联系人电话
 * @param {String} data.address 企业地址
 * @returns {Promise} 提交结果
 */
const verifyEnterprise = (data) => {
  return request.post('/enterprise/verify', data);
};

/**
 * 上传营业执照图片
 * @param {String} filePath 图片路径
 * @returns {Promise} 上传结果
 */
const uploadLicense = (filePath) => {
  return request.upload('/upload/license', filePath, 'file');
};

module.exports = {
  getEnterpriseInfo,
  createEnterprise,
  updateEnterprise,
  uploadLogo,
  uploadBusinessLicense,
  getEnterpriseMembers,
  addEnterpriseMember,
  updateEnterpriseMember,
  removeEnterpriseMember,
  switchCurrentEnterprise,
  getEnterpriseVerificationInfo,
  verifyEnterprise,
  uploadLicense
}; 