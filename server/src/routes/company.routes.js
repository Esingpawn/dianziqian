const express = require('express');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const {
  getDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDepartmentMembers,
  addDepartmentMembers,
  removeDepartmentMember
} = require('../controllers/department.controller');

// 导入公司成员管理控制器
const companyController = require('../controllers/company.controller');

const router = express.Router();

// 所有路由需要认证
router.use(protect);

// 企业成员管理
router.get('/members', companyController.getMembers);
router.post('/members', restrictTo('admin', 'owner'), companyController.addMember);
router.delete('/members/:userId', restrictTo('admin', 'owner'), companyController.removeMember);

// 企业部门管理
router.get('/:enterpriseId/departments', getDepartments);
router.post('/:enterpriseId/departments', restrictTo('admin', 'owner'), createDepartment);
router.get('/:enterpriseId/departments/:departmentId', getDepartmentById);
router.patch('/:enterpriseId/departments/:departmentId', restrictTo('admin', 'owner'), updateDepartment);
router.delete('/:enterpriseId/departments/:departmentId', restrictTo('admin', 'owner'), deleteDepartment);

// 部门成员管理
router.get('/:enterpriseId/departments/:departmentId/members', getDepartmentMembers);
router.post('/:enterpriseId/departments/:departmentId/members', restrictTo('admin', 'owner'), addDepartmentMembers);
router.delete('/:enterpriseId/departments/:departmentId/members/:memberId', restrictTo('admin', 'owner'), removeDepartmentMember);

module.exports = router; 