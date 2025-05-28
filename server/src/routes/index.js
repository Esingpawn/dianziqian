const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const contractRoutes = require('./contract.routes');
const templateRoutes = require('./template.routes');
// const companyRoutes = require('./company.routes'); // 注释掉旧的引用
const enterpriseRoutes = require('./enterprise.routes'); // 引入正确的企业路由
const sealRoutes = require('./seal.routes');
// const simpleUserRoutes = require('./simple/user.routes');

const router = express.Router();

// 基础API路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
// router.use('/users/simple', simpleUserRoutes);
router.use('/contracts', contractRoutes);
router.use('/templates', templateRoutes);
// router.use('/company', companyRoutes); // 注释掉旧的挂载
router.use('/enterprises', enterpriseRoutes); // 将企业路由挂载到 /enterprises
router.use('/seals', sealRoutes);

module.exports = router;