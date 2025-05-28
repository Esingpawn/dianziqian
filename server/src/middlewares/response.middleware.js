/**
 * API响应格式转换中间件
 * 用于统一API响应格式，将旧格式转换为标准格式
 */

/**
 * 转换响应对象的字段名为标准格式
 * @param {Object} obj - 需要转换的对象
 * @returns {Object} - 转换后的对象
 */
const convertFieldNames = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => convertFieldNames(item));
  }

  // 字段映射表
  const fieldMap = {
    '_id': 'id',
    'createTime': 'createdAt',
    'updateTime': 'updatedAt',
    'expireTime': 'expiredAt',
    'completeTime': 'completedAt',
    'account': 'username',
    'realName': 'name',
    'mobile': 'phone',
    'verified': 'isVerified',
    'userType': 'role',
    'filePath': 'fileUrl',
    'signType': 'type',
    'userId': 'creatorId',
    'legalPerson': 'legalRepresentative',
    'licenseUrl': 'businessLicense',
    'ownerId': 'adminId',
    'sealUrl': 'imageUrl',
    'url': 'imageUrl',
    'default': 'isDefault',
    'status': 'status', // 保持不变
    'msg': 'message',
    'code': 'statusCode'
  };

  // 特殊模块字段映射
  const specialModuleMap = {
    'contract': {
      'name': 'title'
    }
  };

  const newObj = {};
  let hasSpecialModule = false;
  let moduleType = '';

  // 检测是否包含特殊模块标识
  for (const [module, _] of Object.entries(specialModuleMap)) {
    if (obj[module + 'Type'] || obj.type === module) {
      hasSpecialModule = true;
      moduleType = module;
      break;
    }
  }

  // 转换字段
  for (const [key, value] of Object.entries(obj)) {
    // 决定使用哪个映射表
    let newKey = key;
    
    // 先检查特殊模块映射
    if (hasSpecialModule && specialModuleMap[moduleType] && specialModuleMap[moduleType][key]) {
      newKey = specialModuleMap[moduleType][key];
    } 
    // 再检查通用映射
    else if (fieldMap[key]) {
      newKey = fieldMap[key];
    }

    // 递归处理嵌套对象
    newObj[newKey] = convertFieldNames(value);
  }

  return newObj;
};

/**
 * 转换API响应格式
 * @param {Object} res - Express响应对象
 * @param {Object} data - 原始响应数据
 * @returns {Object} - 标准格式的响应数据
 */
const standardizeResponse = (data) => {
  // 如果已经是标准格式，直接返回
  if (data && data.success !== undefined) {
    return data;
  }

  // 从旧格式转换为新格式
  const standardResponse = {
    success: data && (data.code === 200 || data.status === 'success'),
    message: data && (data.message || data.msg || '操作成功'),
    data: data && data.data ? convertFieldNames(data.data) : undefined
  };

  return standardResponse;
};

/**
 * 响应中间件
 * 覆盖res.json方法，在发送响应前统一格式
 */
const responseMiddleware = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    // 转换为标准响应格式
    const standardResponse = standardizeResponse(data);
    
    // 调用原始json方法发送响应
    return originalJson.call(this, standardResponse);
  };

  next();
};

module.exports = responseMiddleware; 