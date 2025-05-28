const express = require('express');
const sealController = require('../controllers/seal.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 配置印章上传存储
const sealStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/seals');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'seal-' + uniqueSuffix + ext);
  }
});

const uploadSeal = multer({ 
  storage: sealStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

// 印章路由
router.get('/', protect, sealController.getSeals);
router.get('/:id', protect, sealController.getSealById);
router.post('/', protect, uploadSeal.single('image'), sealController.createSeal);
router.put('/:id', protect, uploadSeal.single('image'), sealController.updateSeal);
router.delete('/:id', protect, sealController.deleteSeal);
router.post('/upload', protect, uploadSeal.single('seal'), sealController.uploadSealImage);

module.exports = router; 