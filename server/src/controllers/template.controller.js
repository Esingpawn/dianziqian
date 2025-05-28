const Template = require('../models/template.model');
const { AppError, catchAsync } = require('../utils/error.utils');
const { upload, calculateFileHash } = require('../utils/upload.utils');
const path = require('path');
const fs = require('fs');

// 配置模板文件上传
const uploadTemplateFile = upload.single('template');

/**
 * 创建合同模板
 */
const createTemplate = catchAsync(async (req, res, next) => {
  const { 
    name, 
    description, 
    category, 
    isPublic, 
    isPersonal,
    params,
    roles
  } = req.body;
  
  // 验证模板文件上传
  if (!req.file) {
    return next(new AppError('请上传模板文件', 400));
  }
  
  // 解析JSON格式的参数
  let templateParams = [];
  let templateRoles = [];
  
  try {
    if (params) {
      templateParams = JSON.parse(params);
    }
    
    if (roles) {
      const parsedRoles = JSON.parse(roles);
      templateRoles = parsedRoles.map(role => ({
        name: role.name,
        type: 'personal',
      }));
    }
  } catch (error) {
    return next(new AppError('参数格式错误，请提供有效的JSON格式', 400));
  }
  
  // 创建模板
  const template = await Template.create({
    name,
    description,
    category,
    fileUrl: `/uploads/templates/${req.file.filename}`,
    pageCount: 1, // 默认页数，实际应该通过PDF解析获取
    parameters: templateParams,
    roles: templateRoles,
    isPublic: isPublic === 'true',
    isPersonal: isPersonal === 'true',
    creator: req.user._id,
    enterprise: !isPersonal && req.user.currentEnterprise ? req.user.currentEnterprise._id || req.user.currentEnterprise : undefined
  });
  
  // 添加id属性，确保与前端期望的字段名一致
  const templateResponse = template.toObject();
  templateResponse.id = templateResponse._id;
  
  res.status(201).json({
    status: 'success',
    data: {
      template: templateResponse
    }
  });
});

/**
 * 获取模板列表
 */
const getTemplates = catchAsync(async (req, res) => {
  // 分页
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // 查询条件
  const query = {
    isActive: true,
    $or: [
      { isPublic: true },
      { creator: req.user._id }
    ]
  };
  
  // 如果用户属于企业，也显示企业的模板
  if (req.user.currentEnterprise) {
    const enterpriseId = req.user.currentEnterprise._id || req.user.currentEnterprise;
    if (enterpriseId) {
      query.$or.push({ enterprise: enterpriseId });
    }
  }
  
  // 按分类过滤
  if (req.query.category) {
    query.category = req.query.category;
  }
  
  // 按名称搜索
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }
  
  // 按类型过滤(个人/企业)
  if (req.query.type) {
    query.isPersonal = req.query.type === 'personal';
  }
  
  // 获取模板和总数
  const templates = await Template.find(query)
    .populate('creator', 'name username')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  // 添加id属性到每个模板对象
  const templatesWithId = templates.map(template => {
    const templateObj = template.toObject();
    templateObj.id = templateObj._id;
    return templateObj;
  });
  
  const total = await Template.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: templatesWithId.length,
    total,
    data: {
      templates: templatesWithId
    }
  });
});

/**
 * 获取模板详情
 */
const getTemplate = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const template = await Template.findById(id).populate('creator', 'name username');
  
  if (!template) {
    return next(new AppError('未找到该模板', 404));
  }
  
  // 检查访问权限
  if (
    !template.isPublic && 
    template.creator._id.toString() !== req.user._id.toString() &&
    (!req.user.currentEnterprise ||
     (template.enterprise && req.user.currentEnterprise && 
      template.enterprise.toString() !== (req.user.currentEnterprise._id || req.user.currentEnterprise).toString()))
  ) {
    return next(new AppError('您没有权限访问此模板', 403));
  }
  
  // 更新使用次数
  template.usageCount += 1;
  await template.save();
  
  // 添加id属性，确保与前端期望的字段名一致
  const templateResponse = template.toObject();
  templateResponse.id = templateResponse._id;
  
  res.status(200).json({
    status: 'success',
    data: {
      template: templateResponse
    }
  });
});

/**
 * 更新模板
 */
const updateTemplate = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { 
    name, 
    description, 
    category, 
    isPublic,
    isActive,
    fields,
    roles
  } = req.body;
  
  // 查找模板
  const template = await Template.findById(id);
  
  if (!template) {
    return next(new AppError('未找到该模板', 404));
  }
  
  // 检查权限 - 使用正确的字段名 'creator'
  if (!template.creator) { 
    return next(new AppError('模板缺少创建者信息，无法验证权限', 500));
  }
  if (template.creator.toString() !== req.user._id.toString()) {
    return next(new AppError('只有创建者才能更新模板', 403));
  }
  
  // 解析JSON参数 - fields 和 roles 可能已经是对象了，因为 multer 处理了 FormData
  // 如果它们是字符串化的JSON，则需要解析。
  let templateParameters = template.parameters; // 使用正确的字段名parameters
  let templateRoles = template.roles;
  
  try {
    if (fields && typeof fields === 'string') {
      templateParameters = JSON.parse(fields);
    } else if (fields) { // if fields is already an object/array
      templateParameters = fields;
    }
    
    if (roles && typeof roles === 'string') {
      const parsedRoles = JSON.parse(roles);
      // Ensure roles format matches the schema if transformation is needed
      templateRoles = parsedRoles.map((role) => ({
        name: role.name,
        type: role.type || 'personal', // Ensure type is provided or default
        // map other role properties if necessary from parsedRoles
      }));
    } else if (roles) { // if roles is already an object/array
      templateRoles = roles; 
    }
  } catch (error) {
    console.error('[UpdateTemplate] Error parsing fields or roles:', error);
    return next(new AppError('参数(fields/roles)格式错误，请提供有效的JSON格式或对象数组', 400));
  }
  
  // 更新数据
  const updateData = {}; // Removed :any type annotation
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (isPublic !== undefined) updateData.isPublic = isPublic === 'true' || isPublic === true;
  if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
  if (templateParameters) updateData.parameters = templateParameters; // 使用正确的字段名parameters
  if (templateRoles) updateData.roles = templateRoles;
  
  // 如果有上传新文件
  if (req.file) {
    updateData.fileUrl = `/uploads/templates/${req.file.filename}`;
    // updateData.pageCount = 1; // Consider removing or actually parsing PDF for page count
  }
  updateData.updatedAt = Date.now(); // Manually set updatedAt
  
  // 更新模板
  const updatedTemplate = await Template.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      template: updatedTemplate
    }
  });
});

/**
 * 删除模板
 */
const deleteTemplate = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // 查找模板
  const template = await Template.findById(id);
  
  if (!template) {
    return next(new AppError('未找到该模板', 404));
  }
  
  // 检查权限
  if (template.creator.toString() !== req.user._id.toString()) {
    return next(new AppError('只有创建者才能删除模板', 403));
  }
  
  // 软删除(设置为非活动)
  template.isActive = false;
  await template.save();
  
  res.status(200).json({
    status: 'success',
    message: '模板删除成功'
  });
});

/**
 * 获取模板分类列表
 */
const getTemplateCategories = catchAsync(async (req, res) => {
  // 聚合查询获取所有分类
  const categories = await Template.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category' } },
    { $project: { _id: 0, name: '$_id' } },
    { $sort: { name: 1 } }
  ]);
  
  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: {
      categories
    }
  });
});

module.exports = {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateCategories,
  uploadTemplateFile
}; 