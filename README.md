# 电子合同签署系统

本项目为现代化电子合同签署平台，支持合同在线签署、模板管理、企业管理、印章管理等功能，涵盖Web端、后端服务和微信小程序。

## 项目结构

- `server/` - 后端服务（Node.js + Express + MongoDB）
- `web/` - Web前端（React + Ant Design）
- `miniprogram/` - 微信小程序端
- `docs/` - 权威技术文档（API、数据模型、类型校验、开发规范等）

## 快速启动

### 后端
1. 安装MongoDB
2. 进入server目录，安装依赖并启动：
   ```bash
   cd server
   npm install
   npm start
   ```
3. 配置.env文件（参考.env.example）

### Web前端
1. 进入web目录，安装依赖并启动：
   ```bash
   cd web
   npm install
   npm start
   ```
2. 配置.env文件，确保REACT_APP_API_URL指向后端API地址

### 微信小程序
1. 用微信开发者工具导入 `miniprogram/` 目录

## 权威文档索引（务必以docs/为准）
- `docs/数据模型.md`：数据库与核心实体字段定义
- `docs/API规范文档.md`：后端API接口说明
- `docs/类型验证方案.md`：前后端类型校验与一致性方案
- `docs/前后端对接指南.md`：联调、适配、常见问题处理
- `docs/要求和规范.md`：开发、命名、路由、注释、错误处理等团队规范

> **注意：**
> - 以 `docs/` 目录下文档为唯一权威，其他历史md文件已删除。
> - 如有疑问或需补充文档，请优先更新 `docs/` 下对应文件。
> - 项目所有字段、API、类型、开发规范均以 `docs/` 为准，避免被历史内容误导。 