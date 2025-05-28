const Enterprise = require('../models/enterprise.model');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// 创建企业
exports.createEnterprise = async (req, res, next) => {
  try {
    const { name, creditCode, address, legalPerson, contactPhone } = req.body;
    const userId = req.user.id;
    
    // 验证必填字段
    if (!name || !creditCode) {
      throw new ApiError(400, '企业名称和统一社会信用代码为必填项');
    }
    
    // 检查信用代码是否已存在
    const existingEnterprise = await Enterprise.findOne({ creditCode });
    if (existingEnterprise) {
      throw new ApiError(400, '该统一社会信用代码已被注册');
    }
    
    // 创建新企业
    const enterprise = new Enterprise({
      name,
      creditCode,
      address,
      legalPerson,
      contactPhone,
      adminId: userId,
      members: [{ user: userId, role: 'admin', permissions: { canSign: true, canCreate: true, canManageMembers: true } }]
    });
    
    await enterprise.save();
    
    // 更新用户的企业列表
    const user = await User.findById(userId);
    user.enterprises.push(enterprise._id);
    user.currentEnterprise = enterprise._id;
    await user.save();
    
    res.status(201).json({
      success: true,
      message: '企业创建成功',
      data: { enterprise }
    });
  } catch (error) {
    next(error);
  }
};

// 获取企业信息
exports.getEnterprise = async (req, res, next) => {
  try {
    const { enterpriseId } = req.params;
    const userId = req.user.id;
    
    const enterprise = await Enterprise.findById(enterpriseId)
      .populate('adminId', 'name username')
      .populate('members.user', 'name username');
    
    if (!enterprise) {
      throw new ApiError(404, '企业不存在');
    }
    
    // 验证用户是否为企业成员
    const isAdminUser = enterprise.adminId && enterprise.adminId._id.equals(userId);
    const isRegularMember = enterprise.members.some(member => member.user && member.user._id.equals(userId));

    if (!isAdminUser && !isRegularMember) {
      throw new ApiError(403, '您没有权限访问该企业信息');
    }
    
    res.status(200).json({
      success: true,
      data: { enterprise }
    });
  } catch (error) {
    next(error);
  }
};

// 更新企业信息
exports.updateEnterprise = async (req, res, next) => {
  try {
    const { enterpriseId } = req.params;
    const { name, address, legalPerson, contactPhone } = req.body;
    const userId = req.user.id;
    
    const enterprise = await Enterprise.findById(enterpriseId).populate('adminId', '_id');
    
    if (!enterprise) {
      throw new ApiError(404, '企业不存在');
    }
    
    // 验证是否为企业所有者或管理员
    const isOwner = enterprise.adminId && enterprise.adminId._id.equals(userId);
    const isMemberAdmin = enterprise.members.some(member => member.user.equals(userId) && member.role === 'admin');
    
    if (!isOwner && !isMemberAdmin) {
      throw new ApiError(403, '您没有权限修改企业信息');
    }
    
    // 更新企业信息
    if (name) enterprise.name = name;
    if (address) enterprise.address = address;
    if (legalPerson) enterprise.legalPerson = legalPerson;
    if (contactPhone) enterprise.contactPhone = contactPhone;
    
    await enterprise.save();
    
    res.status(200).json({
      success: true,
      message: '企业信息更新成功',
      data: { enterprise }
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户的企业列表
exports.getUserEnterprises = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const enterprises = await Enterprise.find({
      $or: [
        { adminId: userId },
        { 'members.user': userId }
      ]
    }).select('name creditCode isVerified');
    
    res.status(200).json({
      success: true,
      data: { enterprises }
    });
  } catch (error) {
    next(error);
  }
};

// 添加企业成员
exports.addMember = async (req, res, next) => {
  try {
    const { enterpriseId } = req.params;
    const { phone, name, role, permissions, departmentId } = req.body;
    const userId = req.user.id;
    
    if (!phone) {
      throw new ApiError(400, '手机号为必填项');
    }
    
    const enterprise = await Enterprise.findById(enterpriseId).populate('adminId', '_id');
    
    if (!enterprise) {
      throw new ApiError(404, '企业不存在');
    }
    
    // 验证是否有权限管理成员
    const isOwner = enterprise.adminId && enterprise.adminId._id.equals(userId);
    const canManageByPermission = enterprise.members.some(m => m.user.equals(userId) && m.permissions.canManageMembers);
    
    if (!isOwner && !canManageByPermission) {
      throw new ApiError(403, '您没有权限管理企业成员');
    }
    
    // 查找用户
    let user = await User.findOne({ phone });
    
    // 如果用户不存在，创建新用户
    if (!user) {
      // 生成随机用户名和密码
      const username = `user_${Date.now()}`;
      const password = Math.random().toString(36).slice(-8); // 生成8位随机密码
      
      user = new User({
        username,
        password,
        name: name || phone,
        phone,
        userType: 'personal'
      });
      
      await user.save();
      
      // TODO: 发送邀请短信通知
    }
    
    // 检查用户是否已经是企业成员
    const isAlreadyMember = enterprise.members.some(m => m.user.equals(user._id));
    
    if (isAlreadyMember) {
      throw new ApiError(400, '该用户已经是企业成员');
    }
    
    // 添加用户到企业成员列表
    enterprise.members.push({
      user: user._id,
      role: role || 'member',
      permissions: permissions || { canSign: true, canCreate: false, canManageMembers: false },
      department: departmentId || null
    });
    
    await enterprise.save();
    
    // 更新用户的企业列表
    if (!user.enterprises.includes(enterprise._id)) {
      user.enterprises.push(enterprise._id);
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      message: '企业成员添加成功',
      data: { 
        member: {
          user: {
            id: user._id,
            name: user.name,
            phone: user.phone
          },
          role: role || 'member',
          permissions: permissions || { canSign: true, canCreate: false, canManageMembers: false },
          departmentId: departmentId || null
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 更新成员权限
exports.updateMember = async (req, res, next) => {
  try {
    const { enterpriseId, memberId } = req.params;
    const { role, permissions, departmentId } = req.body;
    const userId = req.user.id;
    
    const enterprise = await Enterprise.findById(enterpriseId).populate('adminId', '_id');
    
    if (!enterprise) {
      throw new ApiError(404, '企业不存在');
    }
    
    // 验证是否有权限管理成员
    const isOwner = enterprise.adminId && enterprise.adminId._id.equals(userId);
    const canManageByPermission = enterprise.members.some(m => m.user.equals(userId) && m.permissions.canManageMembers);
    
    if (!isOwner && !canManageByPermission) {
      throw new ApiError(403, '您没有权限管理企业成员');
    }
    
    // 查找企业成员
    const memberIndex = enterprise.members.findIndex(m => m._id.equals(memberId));
    
    if (memberIndex === -1) {
      throw new ApiError(404, '成员不存在');
    }
    
    // 不能修改企业所有者
    if (enterprise.members[memberIndex].user.equals(enterprise.adminId)) {
      throw new ApiError(403, '不能修改企业所有者的权限');
    }
    
    // 更新成员信息
    if (role) enterprise.members[memberIndex].role = role;
    if (departmentId !== undefined) enterprise.members[memberIndex].department = departmentId;
    if (permissions) enterprise.members[memberIndex].permissions = {
      ...enterprise.members[memberIndex].permissions,
      ...permissions
    };
    
    await enterprise.save();
    
    res.status(200).json({
      success: true,
      message: '成员信息更新成功',
      data: { member: enterprise.members[memberIndex] }
    });
  } catch (error) {
    next(error);
  }
};

// 移除企业成员
exports.removeMember = async (req, res, next) => {
  try {
    const { enterpriseId, memberId } = req.params;
    const userId = req.user.id;
    
    const enterprise = await Enterprise.findById(enterpriseId);
    
    if (!enterprise) {
      throw new ApiError(404, '企业不存在');
    }
    
    // 验证是否有权限管理成员
    const canManage = enterprise.adminId.equals(userId) || 
      enterprise.members.some(m => m.user.equals(userId) && m.permissions.canManageMembers);
    
    if (!canManage) {
      throw new ApiError(403, '您没有权限管理企业成员');
    }
    
    // 查找成员
    const member = enterprise.members.id(memberId);
    
    if (!member) {
      throw new ApiError(404, '成员不存在');
    }
    
    // 不能移除企业所有者
    if (member.user.equals(enterprise.adminId)) {
      throw new ApiError(403, '不能移除企业所有者');
    }
    
    // 移除成员
    enterprise.members.pull(memberId);
    await enterprise.save();
    
    // 更新用户的企业列表
    await User.findByIdAndUpdate(member.user, {
      $pull: { enterprises: enterprise._id }
    });
    
    res.status(200).json({
      success: true,
      message: '成员移除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 企业认证
exports.verifyEnterprise = async (req, res, next) => {
  // 配置文件上传
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../', config.upload.destination, 'enterprises');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'enterprise-' + uniqueSuffix + ext);
    }
  });
  
  const upload = multer({ 
    storage,
    limits: { fileSize: config.upload.maxSize }
  }).fields([
    { name: 'businessLicense', maxCount: 1 },
    { name: 'idCard', maxCount: 1 }
  ]);
  
  upload(req, res, async (err) => {
    try {
      if (err) {
        throw new ApiError(400, err.message);
      }
      
      const { enterpriseId } = req.params;
      const userId = req.user.id;
      
      if (!req.files || !req.files.businessLicense || !req.files.idCard) {
        throw new ApiError(400, '请上传营业执照和法人身份证');
      }
      
      const enterprise = await Enterprise.findById(enterpriseId);
      
      if (!enterprise) {
        throw new ApiError(404, '企业不存在');
      }
      
      // 验证是否为企业所有者
      if (!enterprise.adminId.equals(userId)) {
        throw new ApiError(403, '只有企业所有者才能申请企业认证');
      }
      
      // TODO: 在实际项目中，应该调用第三方企业认证API
      // 这里简化处理，直接标记为已认证
      enterprise.verified = true;
      
      await enterprise.save();
      
      res.status(200).json({
        success: true,
        message: '企业认证申请提交成功，等待审核',
        data: { 
          verified: enterprise.verified,
          files: {
            businessLicense: req.files.businessLicense[0].filename,
            idCard: req.files.idCard[0].filename
          }
        }
      });
    } catch (error) {
      // 如果出错，删除已上传的文件
      if (req.files) {
        Object.keys(req.files).forEach(key => {
          req.files[key].forEach(file => {
            fs.unlinkSync(file.path);
          });
        });
      }
      next(error);
    }
  });
};

// 获取所有企业列表 (仅限管理员)
exports.getAllEnterprisesForAdmin = async (req, res, next) => {
  try {
    // 可以在这里添加分页等逻辑 req.query.page, req.query.limit
    const enterprises = await Enterprise.find({})
      .populate('adminId', 'name username') // 可选，如果列表需要显示创建者信息
      .sort({ createdAt: -1 }); // 按创建时间降序

    res.status(200).json({
      success: true,
      data: { // 保持与 getEnterprise 相似的 data 嵌套结构，但包含数组
        enterprises // 直接是企业数组
      }
    });
  } catch (error) {
    next(error);
  }
}; 