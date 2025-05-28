# API接口映射表

本文档记录系统中所有API接口的统一规范，包括接口路径、请求方法、参数字段和响应字段的映射关系。所有开发人员必须严格遵循此表进行开发。

## 用户认证接口

| 接口描述 | 接口路径 | 请求方法 | 请求参数 | 响应字段 | 备注 |
|---------|---------|---------|---------|---------|------|
| 用户登录 | `/api/auth/login` | POST | `username`, `password` | `token`, `user: {id, username, name, email, phone, role, isVerified, avatar, createdAt}` | |
| 微信登录 | `/api/auth/wx-login` | POST | `code` | `token`, `user`, `isNewUser` | 小程序专用 |
| 用户注册 | `/api/auth/register` | POST | `username`, `password`, `name`, `email`, `phone` | `token`, `user` | |
| 获取用户信息 | `/api/auth/me` | GET | - | `user` | 需要认证 |
| 实名认证 | `/api/auth/verify` | POST | `name`, `idCard`, `faceImage` | `isVerified` | 需要认证 |

## 合同接口

| 接口描述 | 接口路径 | 请求方法 | 请求参数 | 响应字段 | 备注 |
|---------|---------|---------|---------|---------|------|
| 获取合同列表 | `/api/contracts` | GET | `page`, `pageSize`, `status`, `keyword` | `list: [{id, title, status, createdAt, creatorId, ...}]`, `pagination` | 需要认证 |
| 获取合同详情 | `/api/contracts/:id` | GET | - | `id`, `title`, `fileUrl`, `status`, `parties`, `signFields`, ... | 需要认证 |
| 创建合同 | `/api/contracts` | POST | `title`, `fileUrl`, `parties`, ... | `id`, `title`, ... | 需要认证 |
| 更新合同 | `/api/contracts/:id` | PATCH | `status`, ... | `id`, `title`, ... | 需要认证 |
| 签署合同 | `/api/contracts/:id/sign` | POST | `signatureUrl`, `sealId`, `signFieldId` | `success`, `message` | 需要认证 |
| 上传合同文件 | `/api/contracts/upload` | POST | `file` (FormData) | `fileUrl` | 需要认证 |
| 上传合同附件 | `/api/contracts/:id/attachments` | POST | `files` (FormData) | `attachments: [{id, name, fileUrl, ...}]` | 需要认证 |

## 印章接口

| 接口描述 | 接口路径 | 请求方法 | 请求参数 | 响应字段 | 备注 |
|---------|---------|---------|---------|---------|------|
| 获取印章列表 | `/api/seals` | GET | `page`, `pageSize`, `type` | `list: [{id, name, imageUrl, type, ...}]`, `pagination` | 需要认证 |
| 获取印章详情 | `/api/seals/:id` | GET | - | `id`, `name`, `imageUrl`, `type`, ... | 需要认证 |
| 创建印章 | `/api/seals` | POST | `name`, `image` (FormData), `type` | `id`, `name`, `imageUrl`, ... | 需要认证 |
| 删除印章 | `/api/seals/:id` | DELETE | - | `success`, `message` | 需要认证 |
| 设置默认印章 | `/api/seals/:id/default` | PATCH | - | `success`, `message` | 需要认证 |

## 企业接口

| 接口描述 | 接口路径 | 请求方法 | 请求参数 | 响应字段 | 备注 |
|---------|---------|---------|---------|---------|------|
| 获取企业信息 | `/api/enterprises/:id` | GET | - | `id`, `name`, `creditCode`, `legalRepresentative`, ... | 需要认证 |
| 创建企业 | `/api/enterprises` | POST | `name`, `creditCode`, `legalRepresentative`, ... | `id`, `name`, ... | 需要认证 |
| 更新企业信息 | `/api/enterprises/:id` | PATCH | `name`, `contactPhone`, ... | `id`, `name`, ... | 需要认证 |
| 上传企业Logo | `/api/enterprises/:id/upload-logo` | POST | `logo` (FormData) | `logo` | 需要认证 |
| 上传营业执照 | `/api/enterprises/:id/upload-license` | POST | `businessLicense` (FormData) | `businessLicense` | 需要认证 |
| 获取企业成员 | `/api/enterprises/:id/members` | GET | `page`, `pageSize` | `list: [{id, userId, name, role, ...}]`, `pagination` | 需要认证 |
| 添加企业成员 | `/api/enterprises/:id/members` | POST | `phone`, `name`, `role`, ... | `id`, `userId`, `name`, ... | 需要认证 |

## 模板接口

| 接口描述 | 接口路径 | 请求方法 | 请求参数 | 响应字段 | 备注 |
|---------|---------|---------|---------|---------|------|
| 获取模板列表 | `/api/templates` | GET | `page`, `pageSize`, `category` | `list: [{id, name, description, fileUrl, ...}]`, `pagination` | 需要认证 |
| 获取模板详情 | `/api/templates/:id` | GET | - | `id`, `name`, `description`, `fileUrl`, `variables`, ... | 需要认证 |
| 创建模板 | `/api/templates` | POST | `name`, `description`, `file` (FormData), ... | `id`, `name`, ... | 需要认证 |
| 使用模板创建合同 | `/api/templates/:id/create-contract` | POST | `title`, `variables`, `parties` | `id` (合同ID) | 需要认证 |

## 标准响应格式

所有API响应必须遵循如下标准格式：

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": { /* 业务数据 */ }
}
```

### 列表数据响应

```json
{
  "success": true,
  "message": "获取列表成功",
  "data": {
    "list": [ /* 列表项 */ ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误描述信息",
  "errorCode": "ERROR_CODE",
  "errors": [ /* 详细错误信息 */ ]
}
```

## 字段命名规范对照表

| 标准字段名 | 旧字段名 | 说明 |
|----------|---------|------|
| `id` | `_id` | 实体ID |
| `createdAt` | `createTime`, `created_at` | 创建时间 |
| `updatedAt` | `updateTime`, `modified_at` | 更新时间 |
| `title` | `name` (合同) | 合同标题 |
| `fileUrl` | `filePath`, `url` | 文件URL |
| `imageUrl` | `sealUrl`, `url` (印章) | 图片URL |
| `isVerified` | `verified` | 是否已认证 |
| `legalRepresentative` | `legalPerson` | 法定代表人 | 