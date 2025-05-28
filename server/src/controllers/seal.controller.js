const Seal = require('../models/seal.model');
const User = require('../models/user.model');
const Enterprise = require('../models/enterprise.model');
const ApiError = require('../utils/ApiError');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../', config.upload.destination, 'seals');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'seal-' + uniqueSuffix + ext);
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

// 获取印章详情
const getSealById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seal = await Seal.findById(id);
    
    if (!seal) {
      return res.status(404).json({
        success: false,
        message: '印章不存在'
      });
    }
    
    // 验证权限
    if (!seal.user.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: '无权访问此印章'
      });
    }
    
    res.status(200).json({
      success: true,
      data: seal
    });
  } catch (error) {
    next(error);
  }
};

// 创建印章
const createSeal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传印章图片'
      });
    }
    
    const { name, type, department, description, expireTime } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '印章名称为必填项'
      });
    }
    
    // 构建印章图片URL
    const image = `/uploads/seals/${req.file.filename}`;
    
    // 创建印章
    const seal = new Seal({
      name,
      type: type || 'personal',
      image,
      owner: req.user.id,
      department,
      description,
      expireTime: expireTime || null,
      status: 'active'
    });
    
    await seal.save();
    
    res.status(201).json({
      success: true,
      message: '印章创建成功',
      data: seal
    });
  } catch (error) {
    // 如果出错，删除已上传的文件
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/seals', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    console.error('创建印章失败:', error);
    next(error);
  }
};

// 更新印章
const updateSeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, department, description, status } = req.body;
    
    const seal = await Seal.findById(id);
    
    if (!seal) {
      return res.status(404).json({
        success: false,
        message: '印章不存在'
      });
    }
    
    // 验证权限
    if (!seal.owner.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: '无权修改此印章'
      });
    }
    
    // 更新基本信息
    if (name) seal.name = name;
    if (type) seal.type = type;
    if (department !== undefined) seal.department = department;
    if (description !== undefined) seal.description = description;
    if (status) seal.status = status;
    
    // 如果上传了新图片，更新图片
    if (req.file) {
      // 删除旧图片
      const oldImagePath = seal.image.replace('/uploads/', '');
      const fullOldImagePath = path.join(__dirname, '../../uploads', oldImagePath);
      
      if (fs.existsSync(fullOldImagePath)) {
        fs.unlinkSync(fullOldImagePath);
      }
      
      // 设置新图片
      seal.image = `/uploads/seals/${req.file.filename}`;
    }
    
    await seal.save();
    
    res.status(200).json({
      success: true,
      message: '印章更新成功',
      data: seal
    });
  } catch (error) {
    // 如果出错，删除已上传的文件
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/seals', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    console.error('更新印章失败:', error);
    next(error);
  }
};

// 单独上传印章图片
const uploadSealImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传印章图片'
      });
    }
    
    const image = `/uploads/seals/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      message: '印章图片上传成功',
      data: {
        image,
        imageUrl: image // 为了向后兼容，保留imageUrl字段
      }
    });
  } catch (error) {
    // 如果出错，删除已上传的文件
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/seals', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    console.error('上传印章图片失败:', error);
    next(error);
  }
};

// 获取印章列表
const getSeals = async (req, res, next) => {
  try {
    const { type, enterpriseId } = req.query;
    const userId = req.user.id;
    
    let query = { owner: userId };
    
    if (type) {
      query.type = type;
    }
    
    if (type === 'enterprise' && enterpriseId) {
      // 企业印章需要验证权限
      const enterprise = await Enterprise.findById(enterpriseId);
      
      if (!enterprise) {
        throw new ApiError(404, '企业不存在');
      }
      
      const isMember = enterprise.owner.equals(userId) || 
        enterprise.members.some(member => member.user.equals(userId));
      
      if (!isMember) {
        throw new ApiError(403, '您不是该企业的成员');
      }
      
      query = { enterprise: enterpriseId, type: 'enterprise' };
    }
    
    const seals = await Seal.find(query);
    
    res.status(200).json({
      success: true,
      data: { seals }
    });
  } catch (error) {
    console.error('获取印章列表失败:', error);
    next(error);
  }
};

// 删除印章
const deleteSeal = async (req, res, next) => {
  try {
    const { sealId } = req.params;
    const userId = req.user.id;
    
    const seal = await Seal.findById(sealId);
    
    if (!seal) {
      throw new ApiError(404, '印章不存在');
    }
    
    // 验证权限
    if (seal.type === 'personal') {
      // 个人印章只能由本人删除
      if (!seal.owner.equals(userId)) {
        throw new ApiError(403, '您没有权限删除该印章');
      }
    } else {
      // 企业印章需要企业管理员权限
      const enterprise = await Enterprise.findById(seal.enterprise);
      
      if (!enterprise) {
        throw new ApiError(404, '企业不存在');
      }
      
      const isAdmin = enterprise.owner.equals(userId) || 
        enterprise.members.some(member => member.user.equals(userId) && member.role === 'admin');
      
      if (!isAdmin) {
        throw new ApiError(403, '您没有权限删除该印章');
      }
    }
    
    // 删除文件
    const imagePath = path.join(
      __dirname, 
      '../../', 
      seal.image.replace('/uploads/', config.upload.destination)
    );
    
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    // 删除记录
    await seal.remove();
    
    res.status(200).json({
      success: true,
      message: '印章删除成功'
    });
  } catch (error) {
    console.error('删除印章失败:', error);
    next(error);
  }
};

// 设置默认印章
const setDefaultSeal = async (req, res, next) => {
  try {
    const { sealId } = req.params;
    const userId = req.user.id;
    
    const seal = await Seal.findById(sealId);
    
    if (!seal) {
      throw new ApiError(404, '印章不存在');
    }
    
    // 验证权限
    if (seal.type === 'personal') {
      // 个人印章只能由本人设置
      if (!seal.user.equals(userId)) {
        throw new ApiError(403, '您没有权限修改该印章');
      }
      
      // 将其他个人印章设为非默认
      await Seal.updateMany(
        { user: userId, type: 'personal', default: true },
        { default: false }
      );
    } else {
      // 企业印章需要企业管理员权限
      const enterprise = await Enterprise.findById(seal.enterprise);
      
      if (!enterprise) {
        throw new ApiError(404, '企业不存在');
      }
      
      const isAdmin = enterprise.owner.equals(userId) || 
        enterprise.members.some(member => member.user.equals(userId) && member.role === 'admin');
      
      if (!isAdmin) {
        throw new ApiError(403, '您没有权限修改该印章');
      }
      
      // 将其他企业印章设为非默认
      await Seal.updateMany(
        { enterprise: seal.enterprise, type: 'enterprise', default: true },
        { default: false }
      );
    }
    
    // 设置为默认
    seal.default = true;
    await seal.save();
    
    res.status(200).json({
      success: true,
      message: '默认印章设置成功',
      data: { seal }
    });
  } catch (error) {
    next(error);
  }
};

// 独立印章图片上传接口
exports.uploadSeal = [
  multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/seals');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, 'seal_' + Date.now() + ext);
      }
    }),
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
  }).single('seal'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: '未上传文件' });
    const imagePath = `/uploads/seals/${req.file.filename}`;
    res.json({ 
      image: imagePath,
      url: imagePath, // 保留旧字段向后兼容
      success: true,
      message: '印章图片上传成功'
    });
  }
];

// 导出所有方法
module.exports = {
  getSealById,
  createSeal,
  updateSeal,
  uploadSealImage,
  getSeals,
  deleteSeal,
  setDefaultSeal,
  uploadSeal: exports.uploadSeal
}; 