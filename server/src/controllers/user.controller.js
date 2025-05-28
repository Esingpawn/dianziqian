const User = require('../models/user.model');
const Enterprise = require('../models/enterprise.model');
const ApiError = require('../utils/ApiError');
const { catchAsync, AppError } = require('../utils/error.utils');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// 获取用户信息
exports.getUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('enterprises', 'name');
    
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }
    
    res.status(200).json({
      success: true,
      data: { user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        isVerified: user.verified,
        createdAt: user.createdAt
      } }
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户信息
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }
    
    // 确保name字段不为空，如果为空则使用username
    if (name) {
      user.name = name;
    } else if (!user.name) {
      user.name = user.username; // 默认使用用户名
    }
    
    if (email) user.email = email;
    if (phone) user.phone = phone;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: '用户信息更新成功',
      data: { 
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          isVerified: user.verified,
          createdAt: user.createdAt
        } 
      }
    });
  } catch (error) {
    next(error);
  }
};

// 切换当前企业
exports.switchEnterprise = async (req, res, next) => {
  try {
    const { enterpriseId } = req.body;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }
    
    // 验证用户是否属于该企业
    if (enterpriseId) {
      const enterprise = await Enterprise.findOne({
        _id: enterpriseId,
        $or: [
          { owner: userId },
          { 'members.user': userId }
        ]
      });
      
      if (!enterprise) {
        throw new ApiError(403, '您不是该企业的成员');
      }
      
      user.currentEnterprise = enterpriseId;
    } else {
      // 切换到个人身份
      user.currentEnterprise = null;
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: '身份切换成功',
      data: { 
        currentEnterprise: user.currentEnterprise 
      }
    });
  } catch (error) {
    next(error);
  }
};

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../', config.upload.destination, 'users');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'user-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: config.upload.maxSize },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (ext && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件上传'));
    }
  }
});

// 处理个人实名认证
exports.verifyIdentity = async (req, res, next) => {
  try {
    // 实际项目中应对接第三方身份认证API
    const { idCard, realName } = req.body;
    const userId = req.user.id;
    
    if (!idCard || !realName) {
      throw new ApiError(400, '身份证号和真实姓名为必填项');
    }
    
    // 简单的身份证号码格式验证
    const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    if (!idCardReg.test(idCard)) {
      throw new ApiError(400, '身份证号格式不正确');
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }
    
    // TODO: 在实际项目中，应该调用实名认证API
    // 这里简化处理，直接标记为已认证
    user.idCard = idCard;
    user.name = realName; // 更新为实名
    user.verified = true;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: '实名认证成功',
      data: { verified: true }
    });
  } catch (error) {
    next(error);
  }
};

// 人脸识别验证
exports.faceVerification = async (req, res, next) => {
  // 使用multer中间件处理文件上传
  const uploadSingle = upload.single('faceImage');
  
  uploadSingle(req, res, async (err) => {
    try {
      if (err) {
        throw new ApiError(400, err.message);
      }
      
      if (!req.file) {
        throw new ApiError(400, '请上传人脸照片');
      }
      
      const userId = req.user.id;
      
      const user = await User.findById(userId);
      
      if (!user) {
        throw new ApiError(404, '用户不存在');
      }
      
      if (!user.verified) {
        throw new ApiError(400, '请先完成实名认证');
      }
      
      // TODO: 对接人脸识别API
      // 在实际项目中，需要调用第三方人脸识别服务进行验证
      // 这里简化处理，直接标记为已通过人脸识别
      
      user.faceVerified = true;
      await user.save();
      
      res.status(200).json({
        success: true,
        message: '人脸识别验证通过',
        data: { faceVerified: true }
      });
    } catch (error) {
      // 如果出错，删除已上传的文件
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  });
};

/**
 * 获取用户列表(管理员)
 */
const getAllUsers = catchAsync(async (req, res) => {
  // 分页
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // 搜索过滤
  const searchQuery = {};
  if (req.query.search) {
    searchQuery.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // 角色过滤
  if (req.query.role) {
    searchQuery.role = req.query.role;
  }
  
  // 认证状态过滤
  if (req.query.isVerified) {
    searchQuery.isVerified = req.query.isVerified === 'true';
  }
  
  // 获取用户和总数
  const users = await User.find(searchQuery)
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  const total = await User.countDocuments(searchQuery);
  
  res.status(200).json({
    success: true,
    total,
    data: {
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        isVerified: user.verified,
        createdAt: user.createdAt
      }))
    }
  });
});

/**
 * 创建新用户(管理员)
 */
const createUser = catchAsync(async (req, res) => {
  const { username, email, password, role, phone, name } = req.body;

  if (!phone) { // Add validation for required phone number
    throw new ApiError(400, '手机号码是必填项');
  }
  
  // 检查用户名或邮箱是否已存在
  const existingUserByUsernameOrEmail = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUserByUsernameOrEmail) {
    throw new ApiError(400, '用户名或邮箱已被使用');
  }

  // 检查手机号是否已存在
  const existingUserByPhone = await User.findOne({ phone });
  if (existingUserByPhone) {
    throw new ApiError(400, '手机号码已被使用');
  }
  
  // 创建新用户的数据载荷
  const newUserPayload = {
    username,
    email,
    password,
    role: role || 'user',
    name: name || (username || email || '新用户'),
    account: username || email || Math.random().toString(36).substring(2, 10),
    phone // Directly use phone as it's now required
  };
  
  const user = await User.create(newUserPayload);
  
  // 不返回密码
  user.password = undefined;
  
  res.status(201).json({
    success: true,
    message: '用户创建成功',
    data: {
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        isVerified: user.verified,
        createdAt: user.createdAt
      }
    }
  });
});

/**
 * 更新用户(管理员)
 */
const adminUpdateUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { username, email, role, phone, name, status } = req.body;
  
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, '用户不存在');
  }
  
  // 如果更改用户名，检查是否已存在
  if (username && username !== user.username) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new ApiError(400, '用户名已被使用');
    }
    user.username = username;
  }
  
  // 如果更改邮箱，检查是否已存在
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, '邮箱已被使用');
    }
    user.email = email;
  }
  
  // 更新其他字段
  if (role) user.role = role;
  if (phone) user.phone = phone;
  if (name) user.name = name;
  if (status) user.status = status;
  
  await user.save();
  
  // 不返回密码
  user.password = undefined;
  
  res.status(200).json({
    success: true,
    message: '用户更新成功',
    data: {
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        isVerified: user.verified,
        createdAt: user.createdAt
      }
    }
  });
});

/**
 * 删除用户(管理员)
 */
const deleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, '用户不存在');
  }
  
  // 在实际应用中，可能需要检查用户是否有关联数据
  // 如果有关联数据，可能需要先处理关联数据或者软删除
  
  await User.findByIdAndDelete(userId);
  
  res.status(200).json({
    status: 'success',
    message: '用户删除成功'
  });
});

// 用户实名认证审批API

// 获取待审核用户列表
const getPendingVerifications = async (req, res, next) => {
  try {
    // 仅管理员可操作
    if (!req.user || req.user.role !== 'admin') {
      return next(new AppError('无权限', 403));
    }
    const users = await User.find({ verifyStatus: 'pending' }).select('-password');
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

// 审批实名认证（通过/拒绝）
const approveVerification = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next(new AppError('无权限', 403));
    }
    const { userId } = req.params;
    const { action, remark } = req.body; // action: 'verified' | 'rejected'
    if (!['verified', 'rejected'].includes(action)) {
      return next(new AppError('无效操作', 400));
    }
    const user = await User.findById(userId);
    if (!user) return next(new AppError('用户不存在', 404));
    user.verifyStatus = action;
    user.verifyRemark = remark || '';
    user.verified = (action === 'verified');
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// 拒绝实名认证
const rejectVerification = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next(new AppError('无权限', 403));
    }
    const { userId } = req.params;
    const { remark } = req.body;
    const user = await User.findById(userId);
    if (!user) return next(new AppError('用户不存在', 404));
    user.verifyStatus = 'rejected';
    user.verifyRemark = remark || '';
    user.verified = false;
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// 获取单个用户实名认证详情
const getVerificationDetail = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next(new AppError('无权限', 403));
    }
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    if (!user) return next(new AppError('用户不存在', 404));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * 上传用户头像
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未提供头像文件'
      });
    }

    console.log('上传的头像文件信息:', req.file);
    const userId = req.user.id || req.user._id; // 兼容新旧格式
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 确保用户对象有name字段（可能在旧数据中是realName）
    if (!user.name && user.realName) {
      user.name = user.realName;
    }
    
    // 如果仍然没有name字段，设置一个默认值
    if (!user.name) {
      user.name = user.username || '用户';
    }
    
    // 构建头像URL - 确保路径正确
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    console.log('设置的头像URL:', avatarUrl);
    
    // 更新用户头像
    user.avatar = avatarUrl;
    await user.save();
    
    // 构建完整的URL，包括协议和主机名
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fullAvatarUrl = `${baseUrl}${avatarUrl}`;
    
    res.status(200).json({
      success: true,
      message: '头像上传成功',
      data: {
        avatar: avatarUrl,
        fullUrl: fullAvatarUrl
      }
    });
  } catch (error) {
    console.error('头像上传错误:', error);
    next(error);
  }
};

module.exports = {
  getUser: exports.getUser,
  updateUser: exports.updateUser,
  verifyIdentity: exports.verifyIdentity,
  getAllUsers,
  faceVerification: exports.faceVerification,
  switchEnterprise: exports.switchEnterprise,
  createUser,
  adminUpdateUser,
  deleteUser,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getVerificationDetail,
  uploadAvatar
}; 