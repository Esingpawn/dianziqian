/**
 * API字段验证工具
 * 用于检查API请求和响应是否符合字段统一指南
 */

// 加载标准字段定义
const standardFields = {
  // 通用字段
  common: {
    id: '实体ID',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    expiredAt: '过期时间',
    completedAt: '完成时间'
  },

  // 用户字段
  user: {
    id: '用户ID',
    username: '用户名',
    name: '真实姓名',
    email: '电子邮箱',
    phone: '手机号码',
    avatar: '头像URL',
    role: '用户角色',
    isVerified: '是否已实名认证',
    createdAt: '创建时间',
    updatedAt: '更新时间'
  },

  // 合同字段
  contract: {
    id: '合同ID',
    title: '合同标题',
    fileUrl: '合同文件URL',
    status: '合同状态',
    type: '合同类型',
    creatorId: '创建者ID',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    expiredAt: '过期时间',
    completedAt: '完成时间',
    parties: '合同参与方',
    signFields: '签署字段信息'
  },

  // 企业字段
  enterprise: {
    id: '企业ID',
    name: '企业名称',
    logo: '企业logo URL',
    businessLicense: '营业执照URL',
    legalRepresentative: '法定代表人',
    isVerified: '是否已认证',
    status: '企业状态',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    adminId: '管理员ID',
    members: '企业成员列表'
  },

  // 印章字段
  seal: {
    id: '印章ID',
    name: '印章名称',
    imageUrl: '印章图片URL',
    type: '印章类型',
    isDefault: '是否为默认印章',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    expiredAt: '过期时间'
  }
};

// 旧字段到标准字段的映射
const fieldMappings = {
  '_id': 'id',
  'createTime': 'createdAt',
  'updateTime': 'updatedAt',
  'expireTime': 'expiredAt',
  'completeTime': 'completedAt',
  
  // 用户字段
  'account': 'username',
  'realName': 'name',
  'mobile': 'phone',
  'verified': 'isVerified',
  'userType': 'role',
  
  // 合同字段
  'name': 'title', // 合同模块中name映射为title
  'filePath': 'fileUrl',
  'signType': 'type',
  'userId': 'creatorId',
  
  // 企业字段
  'legalPerson': 'legalRepresentative',
  'licenseUrl': 'businessLicense',
  'ownerId': 'adminId',
  
  // 印章字段
  'sealUrl': 'imageUrl',
  'url': 'imageUrl', // 印章模块的url映射为imageUrl
  'default': 'isDefault'
};

/**
 * 检查数据是否使用了标准字段
 * @param {Object} data 待检查的数据
 * @param {String} module 模块名称(user/contract/enterprise/seal)
 * @returns {Object} 检查结果
 */
function validateApiFields(data, module) {
  if (!data || typeof data !== 'object') {
    return { 
      valid: true, 
      nonStandardFields: [] 
    };
  }
  
  // 获取该模块的标准字段
  const standardFieldsForModule = standardFields[module] || {};
  const nonStandardFields = [];
  
  // 检查每个字段
  Object.keys(data).forEach(field => {
    // 检查是否为标准字段
    if (!standardFieldsForModule[field]) {
      // 检查是否有对应的标准字段
      let hasStandardMapping = false;
      for (const [oldField, standardField] of Object.entries(fieldMappings)) {
        if (field === oldField && standardFieldsForModule[standardField]) {
          nonStandardFields.push({
            field,
            recommendedField: standardField,
            description: standardFieldsForModule[standardField]
          });
          hasStandardMapping = true;
          break;
        }
      }
      
      // 如果没有找到对应的标准字段
      if (!hasStandardMapping && !standardFieldsForModule[field]) {
        nonStandardFields.push({
          field,
          recommendedField: null,
          description: '未知字段，未在标准字段列表中定义'
        });
      }
    }
    
    // 递归检查嵌套对象
    if (data[field] && typeof data[field] === 'object' && !Array.isArray(data[field])) {
      const nestedResult = validateApiFields(data[field], module);
      nestedResult.nonStandardFields.forEach(item => {
        nonStandardFields.push({
          field: `${field}.${item.field}`,
          recommendedField: item.recommendedField,
          description: item.description
        });
      });
    }
  });
  
  return {
    valid: nonStandardFields.length === 0,
    nonStandardFields
  };
}

/**
 * 检查API响应
 * @param {Object} response API响应数据
 * @param {String} module 模块名称
 * @returns {Object} 检查结果
 */
function validateApiResponse(response, module) {
  // 检查响应格式
  if (!response || typeof response !== 'object') {
    return {
      valid: false,
      message: '响应不是有效的对象',
      formatValid: false,
      fieldsValid: false,
      nonStandardFields: []
    };
  }
  
  // 检查是否符合标准响应格式
  const formatValid = 'success' in response;
  let fieldsValid = true;
  let nonStandardFields = [];
  
  // 检查数据字段
  if (response.data) {
    const result = validateApiFields(
      response.data, 
      module
    );
    fieldsValid = result.valid;
    nonStandardFields = result.nonStandardFields;
  }
  
  return {
    valid: formatValid && fieldsValid,
    formatValid,
    fieldsValid,
    nonStandardFields,
    message: formatValid 
      ? (fieldsValid ? '响应符合规范' : '响应包含非标准字段') 
      : '响应格式不符合标准'
  };
}

/**
 * 转换为标准字段
 * @param {Object} data 待转换的数据
 * @param {String} module 模块名称
 * @returns {Object} 转换后的数据
 */
function convertToStandardFields(data, module) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // 处理数组
  if (Array.isArray(data)) {
    return data.map(item => convertToStandardFields(item, module));
  }
  
  // 转换对象
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    let standardKey = key;
    
    // 特殊处理模块特定映射
    if (module === 'contract' && key === 'name') {
      standardKey = 'title';
    } else if (module === 'seal' && (key === 'sealUrl' || key === 'url')) {
      standardKey = 'imageUrl';
    } else if (fieldMappings[key]) {
      // 如果是印章模块的name字段，不要转换为title
      if (!(module === 'seal' && key === 'name')) {
        standardKey = fieldMappings[key];
      }
    }
    
    // 递归处理嵌套对象
    result[standardKey] = convertToStandardFields(value, module);
  }
  
  return result;
}

module.exports = {
  validateApiFields,
  validateApiResponse,
  convertToStandardFields,
  standardFields,
  fieldMappings
}; 