const User = require('../models/user.model');
const Enterprise = require('../models/enterprise.model');
const ApiError = require('../utils/ApiError');
const { catchAsync } = require('../utils/error.utils');
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
    
    if (name) user.name = name;
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
    status: 'success',
    results: users.length,
    total,
    data: {
      users
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
    status: 'success',
    message: '用户创建成功',
    data: {
      user
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
    status: 'success',
    message: '用户更新成功',
    data: {
      user
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

module.exports = {
  getUser: exports.getUser,
  updateUser: exports.updateUser,
  verifyIdentity: exports.verifyIdentity,
  getAllUsers,
  faceVerification: exports.faceVerification,
  switchEnterprise: exports.switchEnterprise,
  createUser,
  adminUpdateUser,
  deleteUser
}; 