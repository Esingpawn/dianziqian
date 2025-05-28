const express = require('express');
const userController = require('../controllers/user.controller');
const { 
  protect, 
  restrictTo 
} = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 配置头像上传存储
const avatarStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../../uploads/avatars');
    console.log('上传目录:', uploadDir);
    
    if (!fs.existsSync(uploadDir)) {
      console.log('创建上传目录');
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

// 用户头像上传
router.post('/upload-avatar', protect, uploadAvatar.single('avatar'), userController.uploadAvatar);

// 用户路由
router.get('/', protect, userController.getAllUsers);
router.get('/:id', protect, userController.getUser);
router.patch('/update-profile', protect, userController.updateUser);
router.post('/verify-identity', protect, userController.verifyIdentity);
router.get('/verify/pending', protect, restrictTo('admin'), userController.getPendingVerifications);
router.post('/verify/:userId/approve', protect, restrictTo('admin'), userController.approveVerification);
router.post('/verify/:userId/reject', protect, restrictTo('admin'), userController.rejectVerification);
router.get('/verify/:userId', protect, restrictTo('admin'), userController.getVerificationDetail);

// 添加管理员修改用户的路由
router.post('/', protect, restrictTo('admin'), userController.createUser);
router.patch('/:id', protect, restrictTo('admin'), userController.adminUpdateUser);
router.delete('/:id', protect, restrictTo('admin'), userController.deleteUser);

module.exports = router; 