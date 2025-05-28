# 电子合同签署系统

一个现代化的电子合同签署系统，支持在线签署、模板管理、企业管理等功能。基于Node.js、React和微信小程序开发。

## 项目结构

- `server/` - 后端服务器 (Node.js + Express + MongoDB)
- `web/` - Web前端 (React)
- `miniprogram/` - 微信小程序端

## 功能特点

- 用户身份认证：支持个人和企业用户，实名认证、人脸识别等
- 合同管理：创建、签署、查看、下载合同
- 合同模板：管理和使用合同模板，支持动态参数
- 企业管理：成员管理、签署权限管理、印章管理
- 多种签署方式：手写签名、印章签署
- 批量签署功能：支持一对多签署场景
- 附件管理：支持合同附件上传和管理

## 技术栈

### 后端
- Node.js + Express
- MongoDB (Mongoose ORM)
- JWT认证
- 文件上传和处理 (Multer)

### Web前端
- React
- React Router
- Ant Design (界面组件库)
- Axios (HTTP请求)

### 微信小程序
- 原生小程序框架
- TDesign 小程序组件库

## 开发环境启动

### 后端

1. 安装MongoDB数据库

2. 进入server目录
```bash
cd esign/server
```

3. 安装依赖
```bash
npm install
```

4. 配置环境变量
复制.env.example为.env，并设置相应的参数

5. 启动开发服务器
```bash
npm run dev
```

### Web前端

1. 进入web目录
```bash
cd esign/web
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm start
```

### 微信小程序

1. 下载并安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

2. 导入项目目录 `/esign/miniprogram`

## 生产环境部署

### 后端

1. 构建生产环境
```bash
cd esign/server
npm install --production
```

2. 启动服务器
```bash
npm start
```

建议使用PM2等进程管理工具来管理Node.js应用

### Web前端

1. 构建生产环境
```bash
cd esign/web
npm run build
```

2. 将build目录的内容部署到Web服务器

## API文档

API文档使用Swagger生成，可在开发环境中访问：
```
http://localhost:5000/api-docs
``` 