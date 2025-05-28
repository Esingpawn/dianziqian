#!/usr/bin/env node

/**
 * API字段验证命令行工具
 * 用于检查API响应是否符合规范
 * 
 * 使用方法：
 * node scripts/api-validator-cli.js <文件路径> <模块名称>
 * 
 * 示例：
 * node scripts/api-validator-cli.js ./tests/responses/user-response.json user
 */

const fs = require('fs');
const path = require('path');
const apiValidator = require('../utils/api-validator');

// 获取命令行参数
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('使用方法: node scripts/api-validator-cli.js <文件路径> <模块名称>');
  console.error('支持的模块名称: user, contract, enterprise, seal');
  process.exit(1);
}

const filePath = args[0];
const moduleName = args[1];

// 验证模块名称是否有效
const validModules = ['user', 'contract', 'enterprise', 'seal', 'template'];
if (!validModules.includes(moduleName)) {
  console.error(`错误: 无效的模块名称 "${moduleName}"`);
  console.error(`支持的模块名称: ${validModules.join(', ')}`);
  process.exit(1);
}

// 读取并解析JSON文件
try {
  const fileContent = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
  let responseData;
  
  try {
    responseData = JSON.parse(fileContent);
  } catch (error) {
    console.error('错误: 无法解析JSON文件');
    console.error(error.message);
    process.exit(1);
  }
  
  // 验证API响应
  const result = apiValidator.validateApiResponse(responseData, moduleName);
  
  // 输出验证结果
  console.log('==================================');
  console.log(`API响应验证结果 (${path.basename(filePath)})`);
  console.log('==================================');
  console.log(`模块: ${moduleName}`);
  console.log(`验证通过: ${result.valid ? '✅ 是' : '❌ 否'}`);
  console.log(`响应格式正确: ${result.formatValid ? '✅ 是' : '❌ 否'}`);
  console.log(`字段命名规范: ${result.fieldsValid ? '✅ 是' : '❌ 否'}`);
  console.log('----------------------------------');
  
  // 如果有非标准字段，输出详细信息
  if (result.nonStandardFields && result.nonStandardFields.length > 0) {
    console.log('检测到非标准字段:');
    console.log('----------------------------------');
    result.nonStandardFields.forEach(field => {
      console.log(`字段: ${field.field}`);
      if (field.recommendedField) {
        console.log(`建议使用: ${field.recommendedField}`);
      }
      console.log(`描述: ${field.description}`);
      console.log('----------------------------------');
    });
    
    // 输出转换后的标准字段
    console.log('转换后的标准字段:');
    const standardData = apiValidator.convertToStandardFields(
      responseData.data,
      moduleName
    );
    console.log(JSON.stringify(standardData, null, 2));
    
    // 输出完整的标准响应
    console.log('----------------------------------');
    console.log('建议的标准响应格式:');
    const standardResponse = {
      success: true,
      message: responseData.message || '操作成功',
      data: standardData
    };
    console.log(JSON.stringify(standardResponse, null, 2));
  }
  
  // 设置退出状态码
  process.exit(result.valid ? 0 : 1);
  
} catch (error) {
  console.error(`错误: 无法读取文件 "${filePath}"`);
  console.error(error.message);
  process.exit(1);
} 