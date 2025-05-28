# API字段统一指南

## 目录

1. [介绍](#介绍)
2. [通用规范](#通用规范)
3. [用户相关字段](#用户相关字段)
4. [合同相关字段](#合同相关字段)
5. [企业相关字段](#企业相关字段)
6. [印章相关字段](#印章相关字段)
7. [模板相关字段](#模板相关字段)
8. [响应格式规范](#响应格式规范)

## 介绍

本文档旨在规范前后端API交互中的字段命名和数据格式，解决由于多人开发导致的字段不一致问题。所有开发人员在开发过程中必须严格遵循本文档规定的字段命名和格式规范。

### 文档目的

1. **统一字段命名**：确保前后端使用相同的字段名称
2. **规范数据格式**：定义每种数据类型的标准格式
3. **减少兼容代码**：减少为处理字段不一致而编写的兼容代码
4. **提高开发效率**：减少因字段不一致导致的沟通和调试成本

### 如何使用本文档

- 后端开发人员：在设计模型和API响应时，参考本文档确保字段命名一致
- 前端开发人员：在定义接口类型和处理API响应时，参考本文档确保字段使用正确
- 代码审查人员：在审查代码时，检查字段命名是否符合本文档规范

## 通用规范

### 命名风格

1. **使用驼峰命名法**：所有字段名使用小驼峰命名法（camelCase）
2. **避免缩写**：除非是广泛接受的缩写（如ID），否则避免使用缩写
3. **布尔值字段**：布尔值字段应使用 `is`、`has` 或 `can` 前缀
4. **日期时间字段**：日期时间字段统一使用后缀规则

### 标识符字段

| 推荐使用 | 不推荐使用 | 说明 |
|---------|----------|------|
| `id` | `_id`, `ID`, `Id` | 所有实体的主键统一使用 `id` |

### 日期时间字段

| 推荐使用 | 不推荐使用 | 说明 |
|---------|----------|------|
| `createdAt` | `createTime`, `created_at` | 创建时间 |
| `updatedAt` | `updateTime`, `modified_at` | 更新时间 |
| `deletedAt` | `deleteTime`, `removed_at` | 删除时间（软删除） |
| `expiredAt` | `expireTime`, `expiryDate` | 过期时间 |
| `signedAt` | `signTime`, `sign_time` | 签署时间 |

### 文件路径字段

| 推荐使用 | 不推荐使用 | 说明 |
|---------|----------|------|
| `fileUrl` | `filePath`, `url`, `path` | 文件访问URL |

## 用户相关字段

### 用户基本信息

| 字段名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `id` | String | 用户ID | 是 |
| `username` | String | 用户名 | 是 |
| `name` | String | 真实姓名 | 是 |
| `email` | String | 电子邮箱 | 否 |
| `phone` | String | 手机号码 | 是 |
| `avatar` | String | 头像URL | 否 |
| `role` | String | 用户角色 | 是 |
| `verified` | Boolean | 是否已实名认证 | 是 |
| `createdAt` | Date | 创建时间 | 是 |
| `updatedAt` | Date | 更新时间 | 是 |

### 用户角色枚举

用户角色（`role`）字段的有效值：

- `admin`: 平台管理员
- `user`: 普通用户
- `personal`: 个人用户
- `enterprise_admin`: 企业管理员
- `enterprise_member`: 企业成员

### 实名认证信息

| 字段名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `idCard` | String | 身份证号 | 是 |
| `verifyStatus` | String | 认证状态 | 是 |
| `verifyRemark` | String | 认证备注 | 否 |
| `faceVerified` | Boolean | 是否已完成人脸识别 | 是 |

### 企业关联信息

| 字段名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `enterprises` | Array | 所属企业列表 | 否 |
| `currentEnterprise` | String/Object | 当前选中的企业ID或对象 | 否 |

## 合同相关字段

### 合同基本信息

| 字段名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `id` | String | 合同ID | 是 |
| `title` | String | 合同标题 | 是 |
| `contractNo` | String | 合同编号 | 是 |
| `description` | String | 合同描述 | 否 |
| `fileUrl` | String | 合同文件URL | 是 |
| `status` | String | 合同状态 | 是 |
| `createdAt` | Date | 创建时间 | 是 |
| `updatedAt` | Date | 更新时间 | 是 |
| `expiredAt` | Date | 过期时间 | 否 |
| `completedAt` | Date | 完成时间 | 否 |
| `pageCount` | Number | 合同页数 | 是 |
| `fileHash` | String | 文件哈希值 | 否 |

### 合同状态枚举

合同状态（`status`）字段的有效值：

- `draft`: 草稿
- `pending`: 待签署
- `signing`: 签署中
- `completed`: 已完成
- `rejected`: 已拒签
- `canceled`: 已撤销
- `expired`: 已过期

### 签署位置信息

| 字段名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `id` | String | 签署位置ID | 是 |
| `page` | Number | 页码 | 是 |
| `x` | Number | X坐标 | 是 |
| `y` | Number | Y坐标 | 是 |
| `width` | Number | 宽度 | 是 |
| `height` | Number | 高度 | 是 |
| `signerId` | String | 签署人ID | 是 |
| `type` | String | 签署类型（signature/seal） | 是 |
| `isSigned` | Boolean | 是否已签署 | 是 |
| `signedAt` | Date | 签署时间 | 否 |

### 合同参与方信息

| 字段名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `type` | String | 参与方类型（personal/enterprise） | 是 |
| `userId` | String | 用户ID（个人） | 条件 |
| `enterpriseId` | String | 企业ID（企业） | 条件 |
| `name` | String | 参与方名称 | 是 |
| `contact` | String | 联系方式 | 是 |
| `email` | String | 电子邮箱 | 否 |
| `status` | String | 签署状态 | 是 |
| `signedAt` | Date | 签署时间 | 否 |
| `rejectReason` | String | 拒签原因 | 否 |

## 企业相关字段

### 企业基本信息

| 字段名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `id` | String | 企业ID | 是 |
| `name` | String | 企业名称 | 是 |
| `creditCode` | String | 统一社会信用代码 | 是 |
| `legalRepresentative` | String | 法定代表人 | 是 |
| `address` | String | 企业地址 | 是 |
| `contactPhone` | String | 联系电话 | 是 |
| `email` | String | 联系邮箱 | 否 |
| `logo` | String | 企业LOGO URL | 否 |
| `industry` | String | 所属行业 | 否 |
| `scale` | String | 企业规模 | 否 |
| `description` | String | 企业描述 | 否 |
| `isVerified` | Boolean | 是否已认证 | 是 |
| `verifyStatus` | String | 认证状态 | 是 |
| `verifyRemark` | String | 认证备注 | 否 |
| `businessLicense` | String | 营业执照URL | 否 |
| `createdAt` | Date | 创建时间 | 是 |
| `updatedAt` | Date | 更新时间 | 是 |

### 企业成员信息

| 字段名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `id` | String | 成员ID | 是 |
| `userId` | String | 用户ID | 是 |
| `name` | String | 姓名 | 是 |
| `email` | String | 邮箱 | 否 |
| `phone` | String | 手机号 | 否 |
| `role` | String | 角色（admin/manager/member） | 是 |
| `department` | String | 部门ID | 否 |
| `position` | String | 职位 | 否 |
| `status` | String | 状态 | 是 |
| `addedAt` | Date | 加入时间 | 是 |

## 印章相关字段

### 印章基本信息

| 字段名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `id` | String | 印章ID | 是 |
| `name` | String | 印章名称 | 是 |
| `type` | String | 印章类型（personal/enterprise/department） | 是 |
| `imageUrl` | String | 印章图片URL | 是 |
| `ownerId` | String | 所有者ID | 是 |
| `ownerType` | String | 所有者类型（user/company） | 是 |
| `validPeriod` | Object | 有效期 | 否 |
| `permissions` | Array | 使用权限 | 否 |
| `certificateInfo` | Object | 证书信息 | 否 |
| `createdAt` | Date | 创建时间 | 是 |
| `updatedAt` | Date | 更新时间 | 是 |

## 模板相关字段

### 合同模板基本信息

| 字段名 | 类型 | 说明 | 必填 |
|-------|------|------|-----|
| `id` | String | 模板ID | 是 |
| `name` | String | 模板名称 | 是 |
| `description` | String | 模板描述 | 否 |
| `fileUrl` | String | 模板文件URL | 是 |
| `thumbnail` | String | 缩略图URL | 否 |
| `category` | String | 模板分类 | 否 |
| `isPublic` | Boolean | 是否公开 | 是 |
| `owner` | Object | 所有者信息 | 是 |
| `variables` | Array | 变量定义 | 否 |
| `signFields` | Array | 签名位置定义 | 否 |
| `usage` | Number | 使用次数 | 否 |
| `createdAt` | Date | 创建时间 | 是 |
| `updatedAt` | Date | 更新时间 | 是 |

## 响应格式规范

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

---

如有字段变更，请及时同步更新本指南。 