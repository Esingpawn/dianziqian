/**
 * 合同相关API
 */

const request = require('./request');

/**
 * 获取合同列表
 * @param {Object} params 查询参数
 * @param {Number} params.page 页码，默认1
 * @param {Number} params.pageSize 每页条数，默认10
 * @param {String} params.status 合同状态筛选
 * @param {String} params.keyword 关键词搜索
 * @param {String} params.startDate 开始日期
 * @param {String} params.endDate 结束日期
 * @param {Boolean} params.createdByMe 是否仅查看我创建的合同
 * @param {Boolean} params.needMySign 是否仅查看需要我签署的合同
 * @returns {Promise} 合同列表
 */
const getContracts = (params = {}) => {
  return request.get('/contracts', params);
};

/**
 * 获取合同详情
 * @param {String} id 合同ID
 * @returns {Promise} 合同详情
 */
const getContractDetail = (id) => {
  return request.get(`/contracts/${id}`);
};

/**
 * 创建合同
 * @param {Object} data 合同数据
 * @param {String} data.title 合同标题
 * @param {Array} data.parties 参与方列表
 * @param {Array} data.signFields 签名位置
 * @returns {Promise} 创建结果
 */
const createContract = (data) => {
  return request.post('/contracts', data);
};

/**
 * 上传合同文件
 * @param {String} filePath 文件路径
 * @returns {Promise} 上传结果
 */
const uploadContractFile = (filePath) => {
  return request.upload('/contracts/upload', filePath, 'file');
};

/**
 * 上传合同附件
 * @param {String} contractId 合同ID
 * @param {String} filePath 文件路径
 * @param {String} name 文件名称
 * @returns {Promise} 上传结果
 */
const uploadAttachment = (contractId, filePath, name = 'file') => {
  return request.upload(`/contracts/${contractId}/attachments`, filePath, name);
};

/**
 * 签署合同
 * @param {String} contractId 合同ID
 * @param {Object} data 签署数据
 * @param {String} data.signatureUrl 签名图片URL
 * @param {String} data.sealId 印章ID（使用印章时提供）
 * @param {String} data.signFieldId 签名位置ID
 * @returns {Promise} 签署结果
 */
const signContract = (contractId, data) => {
  return request.post(`/contracts/${contractId}/sign`, data);
};

/**
 * 拒绝签署合同
 * @param {String} contractId 合同ID
 * @param {Object} data 拒签数据
 * @param {String} data.reason 拒签原因
 * @returns {Promise} 拒签结果
 */
const rejectContract = (contractId, data) => {
  return request.post(`/contracts/${contractId}/reject`, data);
};

/**
 * 取消合同
 * @param {String} contractId 合同ID
 * @returns {Promise} 取消结果
 */
const cancelContract = (contractId) => {
  return request.post(`/contracts/${contractId}/cancel`);
};

/**
 * 下载合同
 * @param {String} contractId 合同ID
 * @returns {Promise} 下载结果，包含文件URL
 */
const downloadContract = (contractId) => {
  return request.get(`/contracts/${contractId}/download`);
};

module.exports = {
  getContracts,
  getContractDetail,
  createContract,
  uploadContractFile,
  uploadAttachment,
  signContract,
  rejectContract,
  cancelContract,
  downloadContract
}; 