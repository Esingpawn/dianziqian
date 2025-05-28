const express = require('express');
const {
  createEnterprise,
  getEnterprise,
  updateEnterprise,
  addMember,
  updateMember,
  removeMember,
  getUserEnterprises,
  verifyEnterprise,
  getAllEnterprisesForAdmin,
  getPendingEnterpriseVerifications,
  approveEnterpriseVerification,
  getEnterpriseVerificationDetail,
  getMembers
} = require('../controllers/enterprise.controller');
const {
  createSeal,
  getSeals,
  deleteSeal,
  setDefaultSeal
} = require('../controllers/seal.controller');
const { protect, requireVerification, restrictTo } = require('../middlewares/auth.middleware');
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentById
} = require('../controllers/department.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 配置企业文件上传存储
const enterpriseStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    let uploadDir;
    if (file.fieldname === 'logo') {
      uploadDir = path.join(__dirname, '../../uploads/enterprises/logos');
    } else if (file.fieldname === 'businessLicense') {
      uploadDir = path.join(__dirname, '../../uploads/enterprises/licenses');
    } else {
      uploadDir = path.join(__dirname, '../../uploads/enterprises');
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'logo' ? 'logo-' : 'license-';
    cb(null, prefix + uniqueSuffix + ext);
  }
});

const uploadEnterprise = multer({ 
  storage: enterpriseStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片或PDF文件'), false);
    }
  }
});

// 获取我的企业列表
router.get('/my-enterprises', protect, getUserEnterprises);

// 创建企业 (需要实名认证)
router.post('/', protect, requireVerification, createEnterprise);

// 获取企业信息 (根据角色不同行为不同)
router.get('/', protect, async (req, res, next) => {
  try {
    if (req.user.role === 'admin') { // 假设超级管理员的角色是 'admin'
      return getAllEnterprisesForAdmin(req, res, next);
    } else {
      // 普通用户逻辑：获取当前关联的企业
      const userId = req.user.id;
      const user = await require('../models/user.model').findById(userId).lean(); // 使用 lean() 提高性能，因为我们只需要读取 currentEnterprise

      if (!user || !user.currentEnterprise) {
        return res.status(200).json({ // 返回200和特定结构，让前端知道用户没有当前企业
          success: true,
          data: { enterprise: null, message: '用户未设置当前企业或未加入任何企业' }
        });
      }
      
      // 使用现有的getEnterprise处理逻辑，但需要确保 enterpriseId 被设置
      req.params.enterpriseId = user.currentEnterprise.toString(); // 确保是字符串
      return getEnterprise(req, res, next); // getEnterprise 应该返回 { enterprise: {...} }
    }
  } catch (error) {
    next(error);
  }
});

// 获取企业详情
router.get('/:id', protect, getEnterprise);

// 更新企业信息 - This should be the primary route for updates
router.patch('/:id', protect, updateEnterprise);

// 企业成员管理 - 当前用户企业
router.get('/members', protect, getMembers);
router.post('/members', protect, addMember);
router.put('/members/:id', protect, updateMember);
router.delete('/members/:id', protect, removeMember);

// 企业成员管理 - 针对特定企业ID
router.get('/:enterpriseId/members', protect, getMembers);
router.post('/:enterpriseId/members', protect, addMember);
router.patch('/:enterpriseId/members/:memberId', protect, updateMember);
router.delete('/:enterpriseId/members/:memberId', protect, removeMember);

// 企业部门管理
router.get('/:enterpriseId/departments', protect, getDepartments);
router.post('/:enterpriseId/departments', protect, createDepartment);
router.get('/:enterpriseId/departments/:departmentId', protect, getDepartmentById);
router.patch('/:enterpriseId/departments/:departmentId', protect, updateDepartment);
router.delete('/:enterpriseId/departments/:departmentId', protect, deleteDepartment);

// 企业印章管理
router.get('/:enterpriseId/seals', protect, getSeals);
router.post('/:enterpriseId/seals', protect, createSeal);
router.delete('/:enterpriseId/seals/:sealId', protect, deleteSeal);
router.patch('/:enterpriseId/seals/:sealId/default', protect, setDefaultSeal);

// 企业认证 (匹配前端verifyCompany)
router.post('/verify', protect, requireVerification, uploadEnterprise.single('businessLicense'), verifyEnterprise);

// 企业认证（针对特定企业ID）
router.post('/:id/verify', protect, requireVerification, uploadEnterprise.single('businessLicense'), verifyEnterprise);

// 企业部门管理 - 当前用户企业
router.get('/departments', protect, getDepartments);

router.post('/departments', protect, createDepartment);

router.put('/departments/:id', protect, updateDepartment);

router.delete('/departments/:id', protect, deleteDepartment);

// 企业认证审批相关路由（仅管理员）
router.get('/verify/pending', protect, restrictTo('admin'), getPendingEnterpriseVerifications);
router.post('/verify/:enterpriseId/approve', protect, restrictTo('admin'), approveEnterpriseVerification);
router.get('/verify/:enterpriseId', protect, restrictTo('admin'), getEnterpriseVerificationDetail);

// 企业文件上传路由
router.post('/:id/upload-logo', protect, requireVerification, uploadEnterprise.single('logo'), async (req, res, next) => {
  try {
    // 获取当前企业ID
    const enterpriseId = req.params.id;
    const enterprise = await require('../models/enterprise.model').findById(enterpriseId);
    
    if (!enterprise) {
      return res.status(404).json({
        success: false,
        message: '企业不存在'
      });
    }
    
    // 更新企业Logo
    enterprise.logo = req.file.path;
    await enterprise.save();
    
    res.status(200).json({
      success: true,
      data: { message: '企业Logo上传成功' }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/upload-license', protect, requireVerification, uploadEnterprise.single('businessLicense'), async (req, res, next) => {
  try {
    // 获取当前企业ID
    const enterpriseId = req.params.id;
    const enterprise = await require('../models/enterprise.model').findById(enterpriseId);
    
    if (!enterprise) {
      return res.status(404).json({
        success: false,
        message: '企业不存在'
      });
    }
    
    // 更新企业营业执照
    enterprise.businessLicense = req.file.path;
    await enterprise.save();
    
    res.status(200).json({
      success: true,
      data: { message: '企业营业执照上传成功' }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 