const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config/config');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const responseMiddleware = require('./middlewares/response.middleware');
const path = require('path');

// 创建Express应用
const app = express();

// 连接MongoDB
mongoose.connect(config.mongoose.url, config.mongoose.options)
  .then(() => {
    console.log('已连接到MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB连接失败', error);
  });

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 应用响应处理中间件
app.use(responseMiddleware);

// API路由
app.use('/api', routes);

// 错误处理中间件
app.use(errorHandler);

module.exports = app; 