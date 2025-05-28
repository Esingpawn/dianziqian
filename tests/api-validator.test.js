/**
 * API字段验证工具单元测试
 */

const apiValidator = require('../utils/api-validator');

describe('API响应格式和字段命名测试', () => {
  // 测试标准响应格式
  describe('响应格式测试', () => {
    test('标准成功响应格式应通过验证', () => {
      const response = {
        success: true,
        message: '操作成功',
        data: { id: '1', username: 'test' }
      };
      
      const result = apiValidator.validateApiResponse(response, 'user');
      expect(result.formatValid).toBe(true);
    });
    
    test('非标准响应格式应标记为不通过', () => {
      const response = {
        code: 200,
        msg: '操作成功',
        data: { id: '1' }
      };
      
      const result = apiValidator.validateApiResponse(response, 'user');
      expect(result.formatValid).toBe(false);
    });
    
    test('列表数据响应格式应通过验证', () => {
      const response = {
        success: true,
        message: '获取列表成功',
        data: {
          list: [{ id: '1', username: 'test' }],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 100,
            totalPages: 10
          }
        }
      };
      
      const result = apiValidator.validateApiResponse(response, 'user');
      expect(result.formatValid).toBe(true);
    });
  });
  
  // 测试用户模块字段
  describe('用户模块字段测试', () => {
    test('标准用户字段应通过验证', () => {
      const data = {
        id: '1',
        username: 'test',
        name: '测试用户',
        email: 'test@example.com',
        phone: '13800138000',
        role: 'user',
        isVerified: true,
        createdAt: '2023-01-01T00:00:00Z'
      };
      
      const result = apiValidator.validateApiFields(data, 'user');
      expect(result.valid).toBe(true);
      expect(result.nonStandardFields.length).toBe(0);
    });
    
    test('非标准用户字段应被检测出来', () => {
      const data = {
        _id: '1',             // 应该是id
        account: 'test',      // 应该是username
        realName: '测试用户',  // 应该是name
        mobile: '13800138000', // 应该是phone
        verified: true,       // 应该是isVerified
        createTime: '2023-01-01T00:00:00Z' // 应该是createdAt
      };
      
      const result = apiValidator.validateApiFields(data, 'user');
      expect(result.valid).toBe(false);
      expect(result.nonStandardFields.length).toBe(6);
    });
  });
  
  // 测试合同模块字段
  describe('合同模块字段测试', () => {
    test('标准合同字段应通过验证', () => {
      const data = {
        id: '1',
        title: '测试合同',
        fileUrl: 'https://example.com/contract.pdf',
        status: 'pending',
        type: 'personal',
        creatorId: 'user1',
        createdAt: '2023-01-01T00:00:00Z'
      };
      
      const result = apiValidator.validateApiFields(data, 'contract');
      expect(result.valid).toBe(true);
    });
    
    test('非标准合同字段应被检测出来', () => {
      const data = {
        _id: '1',            // 应该是id
        name: '测试合同',     // 应该是title
        filePath: 'https://example.com/contract.pdf', // 应该是fileUrl
        signType: 'personal', // 应该是type
        userId: 'user1',      // 应该是creatorId
        createTime: '2023-01-01T00:00:00Z' // 应该是createdAt
      };
      
      const result = apiValidator.validateApiFields(data, 'contract');
      expect(result.valid).toBe(false);
      expect(result.nonStandardFields.length).toBe(6);
    });
  });
  
  // 测试印章模块字段
  describe('印章模块字段测试', () => {
    test('标准印章字段应通过验证', () => {
      const data = {
        id: '1',
        name: '个人签名',
        imageUrl: 'https://example.com/seal.png',
        type: 'personal',
        isDefault: true,
        createdAt: '2023-01-01T00:00:00Z'
      };
      
      const result = apiValidator.validateApiFields(data, 'seal');
      expect(result.valid).toBe(true);
    });
    
    test('非标准印章字段应被检测出来', () => {
      const data = {
        _id: '1',           // 应该是id
        sealUrl: 'https://example.com/seal.png', // 应该是imageUrl
        default: true,      // 应该是isDefault
        createTime: '2023-01-01T00:00:00Z' // 应该是createdAt
      };
      
      const result = apiValidator.validateApiFields(data, 'seal');
      expect(result.valid).toBe(false);
      expect(result.nonStandardFields.length).toBe(4);
    });
  });
  
  // 测试企业模块字段
  describe('企业模块字段测试', () => {
    test('标准企业字段应通过验证', () => {
      const data = {
        id: '1',
        name: '测试企业',
        logo: 'https://example.com/logo.png',
        businessLicense: 'https://example.com/license.png',
        legalRepresentative: '法人代表',
        isVerified: true,
        createdAt: '2023-01-01T00:00:00Z'
      };
      
      const result = apiValidator.validateApiFields(data, 'enterprise');
      expect(result.valid).toBe(true);
    });
    
    test('非标准企业字段应被检测出来', () => {
      const data = {
        _id: '1',            // 应该是id
        licenseUrl: 'https://example.com/license.png', // 应该是businessLicense
        legalPerson: '法人代表', // 应该是legalRepresentative
        verified: true,      // 应该是isVerified
        ownerId: 'user1',    // 应该是adminId
        createTime: '2023-01-01T00:00:00Z' // 应该是createdAt
      };
      
      const result = apiValidator.validateApiFields(data, 'enterprise');
      expect(result.valid).toBe(false);
      expect(result.nonStandardFields.length).toBe(6);
    });
  });
  
  // 测试字段转换功能
  describe('字段转换测试', () => {
    test('应正确转换用户字段', () => {
      const oldData = {
        _id: '1',
        account: 'test',
        realName: '测试用户',
        mobile: '13800138000',
        verified: true,
        createTime: '2023-01-01T00:00:00Z'
      };
      
      const newData = apiValidator.convertToStandardFields(oldData, 'user');
      
      expect(newData).toEqual({
        id: '1',
        username: 'test',
        name: '测试用户',
        phone: '13800138000',
        isVerified: true,
        createdAt: '2023-01-01T00:00:00Z'
      });
    });
    
    test('应正确转换合同字段', () => {
      const oldData = {
        _id: '1',
        name: '测试合同',
        filePath: 'https://example.com/contract.pdf',
        signType: 'personal',
        userId: 'user1',
        createTime: '2023-01-01T00:00:00Z'
      };
      
      const newData = apiValidator.convertToStandardFields(oldData, 'contract');
      
      expect(newData).toEqual({
        id: '1',
        title: '测试合同',
        fileUrl: 'https://example.com/contract.pdf',
        type: 'personal',
        creatorId: 'user1',
        createdAt: '2023-01-01T00:00:00Z'
      });
    });
  });
}); 