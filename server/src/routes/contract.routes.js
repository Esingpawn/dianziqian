const express = require('express');
const {
  getContracts,
  getContract,
  getMyContractStats,
  createCustomContract,
  createTemplateContract,
  setSignFields,
  signContract,
  rejectContract,
  cancelContract,
  downloadContract,
  downloadAttachment,
  downloadContractWithAttachments,
  batchCreateContracts,
  uploadContractFile,
  uploadAttachment,
  uploadSignature
} = require('../controllers/contract');
const { 
  protect, 
  requireVerification,
  requireSignPermission
} = require('../middlewares/auth.middleware');

const router = express.Router();

// 所有路由需要认证
router.use(protect);

// 获取合同列表
router.get('/', getContracts);

// 获取个人合同统计
router.get('/stats', getMyContractStats);

// 批量创建合同(使用模板)
router.post('/batch', requireVerification, requireSignPermission, batchCreateContracts);

// 创建自定义合同
router.post(
  '/custom', 
  requireVerification,
  requireSignPermission,
  uploadContractFile,
  // uploadAttachment,   // 暂时注释掉这个，以排查问题
  createCustomContract
);

// 创建模板合同
router.post(
  '/template/:templateId', 
  requireVerification,
  requireSignPermission,
  uploadAttachment,
  createTemplateContract
);

// 设置签名位置
router.post('/:contractId/sign-fields', setSignFields);

// 签署合同
router.post(
  '/:contractId/sign/:signFieldId', 
  requireVerification,
  requireSignPermission,
  uploadSignature,
  signContract
);

// 拒签合同
router.post('/:contractId/reject', rejectContract);

// 撤销合同
router.post('/:contractId/cancel', cancelContract);

// 下载合同
router.get('/:id/download', downloadContract);

// 下载合同及附件(打包)
router.get('/:id/download-all', downloadContractWithAttachments);

// 下载特定附件
router.get('/:id/attachments/:attachmentId/download', downloadAttachment);

// 获取合同详情
router.get('/:id', getContract);

module.exports = router; 