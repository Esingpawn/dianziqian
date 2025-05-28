const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { AppError } = require('./error.utils');

// 确保上传目录存在
const createUploadDirs = () => {
  const dirs = [
    '../uploads',
    '../uploads/contracts',
    '../uploads/templates',
    '../uploads/attachments',
    '../uploads/seals',
    '../uploads/signatures',
    '../uploads/avatars',
    '../uploads/licenses'
  ];
  
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

// 初始化创建目录
createUploadDirs();

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('[Upload Utils] storage.destination - Received file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    // 目标根目录，从 __dirname (server/src/utils) 返回两级到 server/，再进入 uploads
    const uploadRootDir = path.join(__dirname, '../../uploads'); 
    let subDir = '';
    
    // 根据文件类型确定上传子目录
    if (file.fieldname === 'file' || file.fieldname === 'contract') {
      subDir = 'contracts';
    } else if (file.fieldname === 'template') {
      subDir = 'templates';
    } else if (file.fieldname === 'attachment') {
      subDir = 'attachments';
    } else if (file.fieldname === 'seal' || file.fieldname === 'sealImage') { // 兼容 sealImage
      subDir = 'seals';
    } else if (file.fieldname === 'signature') {
      subDir = 'signatures';
    } else if (file.fieldname === 'avatar') {
      subDir = 'avatars';
    } else if (file.fieldname === 'license') {
      subDir = 'licenses';
    } else {
      // 可以选择一个默认子目录或直接放在 uploads 根目录
      // subDir = 'others'; 
      console.warn(`[Upload Utils] storage.destination - Unknown fieldname '${file.fieldname}', placing in root uploads.`);
    }

    const finalUploadPath = subDir ? path.join(uploadRootDir, subDir) : uploadRootDir;

    // 确保目标目录存在
    if (!fs.existsSync(finalUploadPath)) {
      fs.mkdirSync(finalUploadPath, { recursive: true });
      console.log(`[Upload Utils] Created directory: ${finalUploadPath}`);
    }
    
    cb(null, finalUploadPath);
  },
  filename: (req, file, cb) => {
    console.log('[Upload Utils] storage.filename - Processing file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let fileExt = '';

    // 优先根据mimetype确定已知类型文件的扩展名
    if (file.mimetype === 'application/pdf') {
      fileExt = '.pdf';
    } else if (file.mimetype === 'image/jpeg') {
      fileExt = '.jpg';
    } else if (file.mimetype === 'image/png') {
      fileExt = '.png';
    } else if (file.mimetype === 'image/gif') {
      fileExt = '.gif';
    } // 可以添加更多mimetype到ext的映射

    // 如果根据mimetype未能确定扩展名，则尝试从originalname获取
    if (!fileExt) {
      try {
        // 尝试解码originalname（不完美，但作为一种尝试）
        // const decodedOriginalName = decodeURIComponent(escape(Buffer.from(file.originalname, 'latin1').toString('utf-8'))); // 更复杂的尝试
        const decodedOriginalName = Buffer.from(file.originalname, 'latin1').toString('utf8'); // 假设原始是latin1，目标是utf8
        console.log('[Upload Utils] storage.filename - Decoded originalname for ext: ', decodedOriginalName);
        fileExt = path.extname(decodedOriginalName);
      } catch (e) {
        console.warn('[Upload Utils] storage.filename - Could not reliably decode originalname or get ext, using original directly:', file.originalname, e);
        fileExt = path.extname(file.originalname); // Fallback to original (potentially problematic) name
      }
    }
    
    // 再次检查，如果扩展名仍为空或不标准（如太长），则使用默认扩展名
    if (!fileExt || fileExt.length > 5 || fileExt.length < 2) {
        if (file.mimetype === 'application/pdf') fileExt = '.pdf';
        // Add more fallbacks based on mimetype if needed
        else fileExt = '.dat'; // Default extension if all else fails
        console.log(`[Upload Utils] storage.filename - Extension was empty or unusual, set to '${fileExt}' based on mimetype or default.`);
    }

    const safeBaseName = file.fieldname + '-' + uniqueSuffix;
    const finalFileName = safeBaseName + fileExt;
    console.log('[Upload Utils] storage.filename - Final filename:', finalFileName);
    cb(null, finalFileName);
  }
});

// 文件类型过滤
const fileFilter = (req, file, cb) => {
  console.log('[Upload Utils] fileFilter - Received file:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });
  // 根据不同文件类型设置允许的MIME类型
  if (file.fieldname === 'file' || file.fieldname === 'contract' || file.fieldname === 'template') {
    // 合同和模板文件通常为PDF
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new AppError('仅支持PDF文件格式', 400), false);
    }
  } else if (file.fieldname === 'attachment') {
    // 附件支持多种格式
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('不支持的文件格式', 400), false);
    }
  } else if (file.fieldname === 'seal' || file.fieldname === 'signature' || file.fieldname === 'avatar') {
    // 印章、签名和头像仅支持图片
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('仅支持JPEG, PNG, GIF图片格式', 400), false);
    }
  } else if (file.fieldname === 'license') {
    // 营业执照支持PDF和图片
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('仅支持PDF, JPEG, PNG格式', 400), false);
    }
  } else {
    cb(null, true); // 其他类型文件默认允许
  }
};

// 创建Multer上传对象
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 默认10MB
  }
});

/**
 * 计算文件哈希值(MD5)
 * @param {String} filePath - 文件路径
 * @returns {Promise<String>} - 文件哈希值
 */
const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => {
      hash.update(data);
    });
    
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
    
    stream.on('error', (err) => {
      reject(err);
    });
  });
};

module.exports = {
  upload,
  calculateFileHash
}; 