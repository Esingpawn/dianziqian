const express = require('express');
const {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateCategories,
  uploadTemplateFile
} = require('../controllers/template.controller');
const { protect, requireVerification } = require('../middlewares/auth.middleware');

const router = express.Router();

// 所有路由需要认证
router.use(protect);

// 临时的调试中间件
const debugMulterOutput = (req, res, next) => {
  console.log('\n--- DEBUGGING MULTER OUTPUT ---');
  console.log('req.file after uploadTemplateFile:', req.file);
  console.log('req.files after uploadTemplateFile:', req.files); // 以防万一
  console.log('req.body after uploadTemplateFile:', JSON.stringify(req.body)); // 打印 body，因为它是被 multer 处理过的
  console.log('--- END DEBUGGING MULTER OUTPUT ---\n');
  next();
};

// 获取模板列表
router.get('/', getTemplates);

// 获取模板分类
router.get('/categories', getTemplateCategories);

// 创建模板(需要实名认证)
router.post('/', requireVerification, uploadTemplateFile, debugMulterOutput, createTemplate);

// 获取特定模板
router.get('/:id', getTemplate);

// 更新模板
router.patch('/:id', uploadTemplateFile, debugMulterOutput, updateTemplate);
router.put('/:id', uploadTemplateFile, debugMulterOutput, updateTemplate);

// 删除模板
router.delete('/:id', deleteTemplate);

module.exports = router; 