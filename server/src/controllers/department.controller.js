const Department = require('../models/department.model');
const Enterprise = require('../models/enterprise.model');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { catchAsync } = require('../utils/error.utils');
const mongoose = require('mongoose');

/**
 * 获取企业部门列表
 */
const getDepartments = catchAsync(async (req, res) => {
  const { enterpriseId } = req.params;
  
  // 验证企业ID是否为有效的ObjectId
  if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
    return res.status(400).json({
      success: false,
      message: '无效的企业ID格式'
    });
  }
  
  // 验证企业是否存在
  const enterprise = await Enterprise.findById(enterpriseId);
  if (!enterprise) {
    throw new ApiError(404, '企业不存在');
  }
  
  // 获取该企业的所有部门
  const departments = await Department.find({ enterprise: enterpriseId })
    .populate('parent', 'name')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    data: {
      departments
    }
  });
});

/**
 * 获取部门详情
 */
const getDepartmentById = catchAsync(async (req, res) => {
  const { enterpriseId, departmentId } = req.params;
  
  // 验证ID格式
  if (!mongoose.Types.ObjectId.isValid(enterpriseId) || !mongoose.Types.ObjectId.isValid(departmentId)) {
    return res.status(400).json({
      success: false,
      message: '无效的ID格式'
    });
  }
  
  const department = await Department.findOne({
    _id: departmentId,
    enterprise: enterpriseId
  }).populate('parent', 'name');
  
  if (!department) {
    throw new ApiError(404, '部门不存在');
  }
  
  res.status(200).json({
    success: true,
    data: {
      department
    }
  });
});

/**
 * 创建部门
 */
const createDepartment = catchAsync(async (req, res) => {
  const { enterpriseId } = req.params;
  const { name, parentId } = req.body;
  
  // 验证企业ID格式
  if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
    return res.status(400).json({
      success: false,
      message: '无效的企业ID格式'
    });
  }
  
  // 验证企业是否存在
  const enterprise = await Enterprise.findById(enterpriseId);
  if (!enterprise) {
    throw new ApiError(404, '企业不存在');
  }
  
  // 验证上级部门是否存在
  if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
    return res.status(400).json({
      success: false,
      message: '无效的上级部门ID格式'
    });
  }
  
  if (parentId) {
    const parentDept = await Department.findOne({
      _id: parentId,
      enterprise: enterpriseId
    });
    
    if (!parentDept) {
      throw new ApiError(404, '上级部门不存在');
    }
  }
  
  // 创建部门
  const department = await Department.create({
    name,
    enterprise: enterpriseId,
    parent: parentId || null,
    createdBy: req.user.id
  });
  
  res.status(201).json({
    success: true,
    message: '部门创建成功',
    data: {
      department
    }
  });
});

/**
 * 更新部门
 */
const updateDepartment = catchAsync(async (req, res) => {
  const { enterpriseId, departmentId } = req.params;
  const { name, parentId } = req.body;
  
  // 验证部门是否存在
  const department = await Department.findOne({
    _id: departmentId,
    enterprise: enterpriseId
  });
  
  if (!department) {
    throw new ApiError(404, '部门不存在');
  }
  
  // 验证上级部门是否存在
  if (parentId) {
    // 不能将部门设为自己的子部门
    if (parentId === departmentId) {
      throw new ApiError(400, '不能将部门设为自己的子部门');
    }
    
    const parentDept = await Department.findOne({
      _id: parentId,
      enterprise: enterpriseId
    });
    
    if (!parentDept) {
      throw new ApiError(404, '上级部门不存在');
    }
    
    // 检查是否会形成循环依赖
    let currentParent = parentDept;
    while (currentParent.parent) {
      if (currentParent.parent.toString() === departmentId) {
        throw new ApiError(400, '不能形成循环依赖');
      }
      currentParent = await Department.findById(currentParent.parent);
    }
  }
  
  // 更新部门
  if (name) department.name = name;
  department.parent = parentId || null;
  
  await department.save();
  
  res.status(200).json({
    success: true,
    message: '部门更新成功',
    data: {
      department
    }
  });
});

/**
 * 删除部门
 */
const deleteDepartment = catchAsync(async (req, res) => {
  const { enterpriseId, departmentId } = req.params;
  
  // 验证部门是否存在
  const department = await Department.findOne({
    _id: departmentId,
    enterprise: enterpriseId
  });
  
  if (!department) {
    throw new ApiError(404, '部门不存在');
  }
  
  // 检查是否有子部门
  const hasChildren = await Department.exists({
    parent: departmentId
  });
  
  if (hasChildren) {
    throw new ApiError(400, '请先删除该部门的所有子部门');
  }
  
  // 检查是否有成员
  const hasMembers = await User.exists({
    'departments': departmentId
  });
  
  if (hasMembers) {
    throw new ApiError(400, '请先移除该部门的所有成员');
  }
  
  // 删除部门
  await Department.findByIdAndDelete(departmentId);
  
  res.status(200).json({
    success: true,
    message: '部门删除成功'
  });
});

/**
 * 获取部门成员
 */
const getDepartmentMembers = catchAsync(async (req, res) => {
  const { enterpriseId, departmentId } = req.params;
  
  // 验证部门是否存在
  const department = await Department.findOne({
    _id: departmentId,
    enterprise: enterpriseId
  });
  
  if (!department) {
    throw new ApiError(404, '部门不存在');
  }
  
  // 获取部门成员
  const members = await User.find({
    'departments': departmentId
  }).select('-password');
  
  res.status(200).json({
    success: true,
    data: {
      members
    }
  });
});

/**
 * 添加部门成员
 */
const addDepartmentMembers = catchAsync(async (req, res) => {
  const { enterpriseId, departmentId } = req.params;
  const { memberIds } = req.body;
  
  if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    throw new ApiError(400, '请提供有效的成员ID列表');
  }
  
  // 验证部门是否存在
  const department = await Department.findOne({
    _id: departmentId,
    enterprise: enterpriseId
  });
  
  if (!department) {
    throw new ApiError(404, '部门不存在');
  }
  
  // 验证用户是否存在且属于该企业
  const users = await User.find({
    _id: { $in: memberIds },
    enterprises: enterpriseId
  });
  
  if (users.length !== memberIds.length) {
    throw new ApiError(400, '部分用户不存在或不属于该企业');
  }
  
  // 添加部门关联
  for (const user of users) {
    if (!user.departments.includes(departmentId)) {
      user.departments.push(departmentId);
      await user.save();
    }
  }
  
  res.status(200).json({
    success: true,
    message: '成员添加成功',
    data: {
      addedCount: users.length
    }
  });
});

/**
 * 移除部门成员
 */
const removeDepartmentMember = catchAsync(async (req, res) => {
  const { enterpriseId, departmentId, memberId } = req.params;
  
  // 验证部门是否存在
  const department = await Department.findOne({
    _id: departmentId,
    enterprise: enterpriseId
  });
  
  if (!department) {
    throw new ApiError(404, '部门不存在');
  }
  
  // 验证用户是否存在
  const user = await User.findById(memberId);
  
  if (!user) {
    throw new ApiError(404, '用户不存在');
  }
  
  // 移除部门关联
  user.departments = user.departments.filter(
    deptId => deptId.toString() !== departmentId
  );
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: '成员移除成功'
  });
});

module.exports = {
  getDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDepartmentMembers,
  addDepartmentMembers,
  removeDepartmentMember
}; 