# API字段统一指南

为了解决前后端API字段命名不一致的问题，本文档规定了各模块的字段命名规范。所有开发人员必须严格遵循以下规范，确保API的一致性和可维护性。

## 通用规范

1. **命名风格**：
   - 后端API返回字段使用驼峰命名法（camelCase）
   - 数据库字段使用下划线命名法（snake_case）
   - 前端组件属性使用驼峰命名法（camelCase）

2. **ID字段**：
   - 后端返回时统一使用 `id`，不使用 `_id`
   - 前端发送请求时使用 `id`

3. **时间字段**：
   - 创建时间统一使用 `createdAt`
   - 更新时间统一使用 `updatedAt`

4. **状态字段**：
   - 状态字段统一使用 `status`
   - 布尔类型状态使用 `is` 前缀，如 `isActive`、`isVerified`

## 用户模块

| 标准字段名 | 兼容字段名 | 说明 |
|----------|----------|------|
| id | _id | 用户ID |
| username | account | 用户名 |
| name | realName | 真实姓名 |
| email | | 电子邮箱 |
| phone | mobile | 手机号码 |
| avatar | | 头像URL |
| role | userType | 用户角色（admin/user） |
| isVerified | verified | 是否已实名认证 |
| status | | 用户状态（active/inactive/banned） |
| createdAt | createTime | 创建时间 |
| updatedAt | updateTime | 更新时间 |

## 合同模块

| 标准字段名 | 兼容字段名 | 说明 |
|----------|----------|------|
| id | _id | 合同ID |
| title | name | 合同标题 |
| fileUrl | filePath | 合同文件URL |
| status | | 合同状态（draft/signing/completed/rejected/canceled） |
| type | signType | 合同类型（personal/enterprise） |
| creatorId | userId | 创建者ID |
| createdAt | createTime | 创建时间 |
| updatedAt | updateTime | 更新时间 |
| expireAt | expireTime | 过期时间 |
| completedAt | completeTime | 完成时间 |

## 企业模块

| 标准字段名 | 兼容字段名 | 说明 |
|----------|----------|------|
| id | _id | 企业ID |
| name | | 企业名称 |
| logo | logoUrl | 企业logo URL |
| businessLicense | licenseUrl | 营业执照URL |
| legalRepresentative | legalPerson | 法定代表人 |
| isVerified | verified | 是否已认证 |
| status | | 企业状态（active/inactive/pending） |
| createdAt | createTime | 创建时间 |
| updatedAt | updateTime | 更新时间 |
| adminId | ownerId | 管理员ID |

## 印章模块

| 标准字段名 | 兼容字段名 | 说明 |
|----------|----------|------|
| id | _id | 印章ID |
| name | | 印章名称 |
| imageUrl | sealUrl, url | 印章图片URL |
| type | | 印章类型（personal/enterprise） |
| isDefault | default | 是否为默认印章 |
| createdAt | createTime | 创建时间 |
| updatedAt | updateTime | 更新时间 |
| expireAt | expireTime | 过期时间 |

## 模板模块

| 标准字段名 | 兼容字段名 | 说明 |
|----------|----------|------|
| id | _id | 模板ID |
| name | title | 模板名称 |
| description | | 模板描述 |
| fileUrl | documentUrl | 模板文件URL |
| category | | 模板分类 |
| isPublic | public | 是否公开 |
| creatorId | userId | 创建者ID |
| createdAt | createTime | 创建时间 |
| updatedAt | updateTime | 更新时间 |
| usageCount | | 使用次数 |

## 响应格式规范

所有API响应应遵循以下格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 实际数据
  }
}
```

错误响应：

```json
{
  "success": false,
  "message": "错误信息",
  "error": {
    "code": "ERROR_CODE",
    "details": "详细错误信息"
  }
}
```

## 前后端字段映射

为解决历史遗留问题，我们在后端添加了响应处理中间件（`response.middleware.js`），自动处理字段映射，确保API响应符合上述规范。前端也应在API调用层做好字段映射，确保组件收到的数据格式一致。

## 注意事项

1. 开发新功能时，必须严格遵循本文档规定的字段命名
2. 修改已有功能时，应逐步将不规范的字段名替换为标准字段名
3. 所有API文档必须使用标准字段名
4. 前端组件应使用标准字段名，通过API层做好字段映射 

## 文件上传路径规范

为了确保文件上传和访问的一致性，所有API路径应遵循以下规范：

1. **用户头像上传**：
   - 上传路径: `/api/users/upload-avatar`
   - 请求方式: `POST`
   - 参数: `avatar` (文件字段)
   - 响应格式:
     ```json
     {
       "success": true,
       "message": "头像上传成功",
       "data": {
         "avatar": "/uploads/avatars/avatar-filename.jpg"
       }
     }
     ```

2. **印章上传**：
   - 上传路径: `/api/seals` 或 `/api/seals/upload`
   - 请求方式: `POST`
   - 参数: `image` 或 `seal` (文件字段), `name` (印章名称)
   - 响应格式:
     ```json
     {
       "success": true,
       "message": "印章上传成功",
       "data": {
         "id": "印章ID",
         "name": "印章名称",
         "imageUrl": "/uploads/seals/seal-filename.png"
       }
     }
     ```

3. **企业Logo上传**：
   - 上传路径: `/api/enterprises/:id/upload-logo`
   - 请求方式: `POST`
   - 参数: `logo` (文件字段)
   - 响应格式:
     ```json
     {
       "success": true,
       "data": { 
         "message": "企业Logo上传成功" 
       }
     }
     ```

4. **企业营业执照上传**：
   - 上传路径: `/api/enterprises/:id/upload-license`
   - 请求方式: `POST`
   - 参数: `businessLicense` (文件字段)
   - 响应格式:
     ```json
     {
       "success": true,
       "data": { 
         "message": "企业营业执照上传成功" 
       }
     }
     ```

## 常见问题及解决方案

1. **字段不一致问题**：
   - 前端应在API调用层做好字段映射，确保组件收到的数据格式一致
   - 后端应在响应处理中间件中自动处理字段映射，确保API响应符合规范

2. **文件上传失败**：
   - 检查请求路径是否正确
   - 检查请求头是否包含 `Content-Type: multipart/form-data`
   - 检查文件字段名是否与后端期望的一致
   - 检查认证信息是否正确

3. **权限问题**：
   - 确保所有需要认证的API都添加了 `protect` 中间件
   - 检查用户角色是否有权限访问该API
   - 确保企业相关API检查了用户是否为企业成员 