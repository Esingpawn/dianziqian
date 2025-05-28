# 电子签约系统 API 规范文档

## 目录

1. [标准响应格式](#标准响应格式)
2. [错误处理规范](#错误处理规范)
3. [API接口文档](#API接口文档)
4. [数据模型](#数据模型)
5. [类型验证方案](#类型验证方案)
6. [前后端对接指南](#前后端对接指南)

## 标准响应格式

为确保前后端数据交互的一致性，所有API响应应遵循以下标准格式：

### 成功响应

```json
{
  "success": true,
  "message": "操作成功描述",
  "data": {
    // 具体的业务数据
  }
}
```

### 列表数据响应

所有返回列表数据的接口应使用如下格式：

```json
{
  "success": true,
  "message": "获取列表成功",
  "data": {
    "list": [
      // 列表项数据
    ],
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
  "errors": [
    // 可选，详细错误信息列表
  ]
}
```

### 响应字段说明

| 字段名 | 类型 | 描述 |
|-------|------|------|
| success | boolean | 请求是否成功，true表示成功，false表示失败 |
| message | string | 操作结果描述或错误提示信息 |
| data | object | 业务数据，仅在success为true时存在 |
| errorCode | string | 错误代码，仅在success为false时存在 |
| errors | array | 详细错误信息列表，仅在success为false时存在 |

## 错误处理规范

### HTTP状态码使用规范

| 状态码 | 使用场景 |
|-------|----------|
| 200 OK | 请求成功 |
| 201 Created | 资源创建成功 |
| 400 Bad Request | 请求参数错误或不合法 |
| 401 Unauthorized | 未授权（未登录） |
| 403 Forbidden | 权限不足 |
| 404 Not Found | 资源不存在 |
| 409 Conflict | 资源冲突（例如已存在同名资源） |
| 422 Unprocessable Entity | 请求格式正确但语义错误 |
| 500 Internal Server Error | 服务器内部错误 |

### 错误码规范

错误码由业务模块代码和具体错误代码组成，格式为：`MODULE_ERROR_CODE`

常见错误码示例：

| 错误码 | 描述 |
|-------|------|
| AUTH_INVALID_CREDENTIALS | 登录凭证无效 |
| AUTH_TOKEN_EXPIRED | 令牌已过期 |
| USER_NOT_FOUND | 用户不存在 |
| CONTRACT_ACCESS_DENIED | 无权访问合同 |
| CONTRACT_ALREADY_SIGNED | 合同已签署 |

### 后端错误处理实现

在Node.js/Express后端中，应创建统一的错误处理中间件：

```javascript
// 示例：统一错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  
  res.status(statusCode).json({
    success: false,
    message: err.message || '服务器内部错误',
    errorCode: errorCode,
    errors: err.errors,
    // 在开发环境下提供错误堆栈
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});
```

## API接口文档

本节提供主要API接口的详细说明。所有接口都遵循上述标准响应格式。

### 认证相关接口

#### 用户登录

- **URL**: `/api/auth/login`
- **方法**: `POST`
- **描述**: 用户登录并获取认证令牌
- **请求参数**:

```json
{
  "username": "用户名",
  "password": "密码"
}
```

- **成功响应**:

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "JWT令牌",
    "user": {
      "id": "用户ID",
      "username": "用户名",
      "name": "用户姓名",
      "email": "用户邮箱",
      "phone": "用户电话",
      "role": "用户角色(admin, user, personal, enterprise_admin, enterprise_member)",
      "isVerified": true,
      "companyId": "公司ID",
      "companyRole": "公司角色",
      "createdAt": "创建时间"
    }
  }
}
```

- **错误响应**:

```json
{
  "success": false,
  "message": "用户名或密码错误",
  "errorCode": "AUTH_INVALID_CREDENTIALS"
}
```

#### 用户注册

- **URL**: `/api/auth/register`
- **方法**: `POST`
- **描述**: 注册新用户
- **请求参数**:

```json
{
  "username": "用户名",
  "password": "密码",
  "name": "用户姓名",
  "email": "用户邮箱",
  "phone": "用户电话"
}
```

- **成功响应**:

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "token": "JWT令牌",
    "user": {
      "id": "用户ID",
      "username": "用户名",
      "name": "用户姓名",
      "email": "用户邮箱",
      "phone": "用户电话",
      "role": "user",
      "isVerified": false,
      "createdAt": "创建时间"
    }
  }
}
```

- **错误响应**:

```json
{
  "success": false,
  "message": "用户名或手机号已被注册",
  "errorCode": "AUTH_USER_EXISTS"
}
```

#### 获取当前用户信息

- **URL**: `/api/auth/me`
- **方法**: `GET`
- **描述**: 获取当前登录用户的详细信息
- **认证要求**: 需要有效的JWT令牌
- **成功响应**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "用户ID",
      "username": "用户名",
      "name": "用户姓名",
      "email": "用户邮箱",
      "phone": "用户电话",
      "role": "用户角色(admin, user, personal, enterprise_admin, enterprise_member)",
      "isVerified": true,
      "companyId": "公司ID",
      "companyRole": "公司角色",
      "createdAt": "创建时间"
    }
  }
}
```

### 合同相关接口

#### 获取合同列表

- **URL**: `/api/contracts`
- **方法**: `GET`
- **描述**: 获取合同列表，支持分页和筛选
- **认证要求**: 需要有效的JWT令牌
- **查询参数**:
  - `page`: 页码，默认为1
  - `pageSize`: 每页条数，默认为10
  - `status`: 合同状态筛选，可选值: draft, pending, signing, completed, rejected, canceled, expired
  - `keyword`: 关键词搜索
  - `startDate`: 开始日期，格式YYYY-MM-DD
  - `endDate`: 结束日期，格式YYYY-MM-DD
  - `createdByMe`: 是否仅查看我创建的合同，布尔值
  - `needMySign`: 是否仅查看需要我签署的合同，布尔值

- **成功响应**:

```json
{
  "success": true,
  "message": "获取合同列表成功",
  "data": {
    "list": [
      {
        "id": "合同ID",
        "title": "合同标题",
        "status": "合同状态",
        "createTime": "创建时间",
        "creatorId": "创建者ID",
        "creatorName": "创建者姓名",
        "signerCount": 3,
        "signedCount": 1,
        "isCreator": true,
        "needMySign": false,
        "expireTime": "过期时间",
        "templateId": "模板ID",
        "templateName": "模板名称"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
``` 