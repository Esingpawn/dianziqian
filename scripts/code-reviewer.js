#!/usr/bin/env node

/**
 * 代码审查工具
 * 扫描项目中的代码，找出不符合API规范的地方
 * 
 * 使用方法：
 * node scripts/code-reviewer.js <目录路径>
 * 
 * 示例：
 * node scripts/code-reviewer.js ./server/src
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 定义关键字映射，用于识别可能不符合规范的字段
const fieldMappings = {
  // 通用字段
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
  'filePath': 'fileUrl',
  'signType': 'type',
  'userId': 'creatorId',
  
  // 企业字段
  'legalPerson': 'legalRepresentative',
  'licenseUrl': 'businessLicense',
  'ownerId': 'adminId',
  
  // 印章字段
  'sealUrl': 'imageUrl',
  'default': 'isDefault',
};

// 特殊模块字段映射
const specialMappings = {
  'contract': {
    'name': 'title'
  },
  'seal': {
    'url': 'imageUrl'
  }
};

// 获取命令行参数
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('使用方法: node scripts/code-reviewer.js <目录路径>');
  process.exit(1);
}

const targetDir = args[0];

// 确保目录存在
if (!fs.existsSync(targetDir)) {
  console.error(`错误: 目录 "${targetDir}" 不存在`);
  process.exit(1);
}

// 查找所有JavaScript和TypeScript文件
const files = glob.sync(`${targetDir}/**/*.{js,ts,jsx,tsx}`, {
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.min.js']
});

console.log(`找到 ${files.length} 个文件待审查...`);

// 统计数据
const stats = {
  filesWithIssues: 0,
  totalIssues: 0,
  issuesByType: {},
  issuesByFile: {}
};

// 存储问题详情
const issues = [];

// 检查正则表达式
const createRegexPatterns = () => {
  const patterns = {};
  
  // 创建对应字段的正则表达式
  for (const [oldField, newField] of Object.entries(fieldMappings)) {
    patterns[oldField] = new RegExp(`['"]${oldField}['"]|\\b${oldField}\\b(?!:)`, 'g');
  }
  
  // 处理特殊模块字段
  for (const [module, mappings] of Object.entries(specialMappings)) {
    for (const [oldField, newField] of Object.entries(mappings)) {
      if (!patterns[`${module}.${oldField}`]) {
        patterns[`${module}.${oldField}`] = new RegExp(`['"]${oldField}['"]|\\b${oldField}\\b(?!:)`, 'g');
      }
    }
  }
  
  return patterns;
};

const patterns = createRegexPatterns();

// 扫描文件
files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let fileHasIssues = false;
    const fileIssues = [];
    
    // 检查每一行代码
    lines.forEach((line, index) => {
      // 跳过注释行
      if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
        return;
      }
      
      // 检查旧字段名
      for (const [oldField, newField] of Object.entries(fieldMappings)) {
        const pattern = patterns[oldField];
        if (pattern.test(line)) {
          // 重置正则表达式
          pattern.lastIndex = 0;
          
          // 确认是字段引用，而不是其他代码
          if (isLikelyFieldReference(line, oldField)) {
            fileHasIssues = true;
            
            const issue = {
              file: path.relative(process.cwd(), file),
              line: index + 1,
              lineContent: line.trim(),
              oldField,
              recommendedField: newField,
              type: 'field_naming'
            };
            
            fileIssues.push(issue);
            issues.push(issue);
            
            // 更新统计数据
            stats.totalIssues++;
            stats.issuesByType[issue.type] = (stats.issuesByType[issue.type] || 0) + 1;
          }
        }
      }
      
      // 检查API端点格式是否一致
      checkApiEndpoints(line, index, file, fileIssues);
    });
    
    if (fileHasIssues) {
      stats.filesWithIssues++;
      stats.issuesByFile[path.relative(process.cwd(), file)] = fileIssues.length;
    }
  } catch (error) {
    console.error(`错误: 无法读取文件 "${file}"`);
    console.error(error.message);
  }
});

// 输出审查结果
console.log('\n==================================');
console.log('代码审查结果');
console.log('==================================');
console.log(`检查的文件数: ${files.length}`);
console.log(`有问题的文件数: ${stats.filesWithIssues}`);
console.log(`总问题数: ${stats.totalIssues}`);
console.log('----------------------------------');

// 按文件输出问题
const filesSorted = Object.keys(stats.issuesByFile).sort((a, b) => 
  stats.issuesByFile[b] - stats.issuesByFile[a]
);

if (filesSorted.length > 0) {
  console.log('问题最多的文件:');
  filesSorted.slice(0, 10).forEach(file => {
    console.log(`${file}: ${stats.issuesByFile[file]}个问题`);
  });
  console.log('----------------------------------');
  
  // 输出详细问题
  console.log('问题详情:');
  const issuesByFile = {};
  
  issues.forEach(issue => {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  });
  
  Object.keys(issuesByFile).forEach(file => {
    console.log(`\n文件: ${file}`);
    console.log('----------------------------------');
    
    issuesByFile[file].forEach(issue => {
      console.log(`行号: ${issue.line}`);
      console.log(`代码: ${issue.lineContent}`);
      console.log(`问题: 使用了非标准字段名 "${issue.oldField}"`);
      console.log(`建议: 使用标准字段名 "${issue.recommendedField}"`);
      console.log('----------------------------------');
    });
  });
  
  // 输出修复建议
  console.log('\n修复建议:');
  console.log('1. 使用 response.middleware.js 中间件自动转换字段名');
  console.log('2. 在返回API响应前使用 convertToStandardFields 函数');
  console.log('3. 更新代码中的字段引用，使用标准字段名');
}

// 判断是否可能是字段引用，而不是其他代码
function isLikelyFieldReference(line, field) {
  // 排除一些明显不是字段引用的情况
  if (line.includes(`function ${field}`) || line.includes(`const ${field} =`) || 
      line.includes(`let ${field} =`) || line.includes(`var ${field} =`) ||
      line.includes(`class ${field}`)) {
    return false;
  }
  
  // 检查是否像是字段引用
  return line.includes(`"${field}"`) || line.includes(`'${field}'`) || 
         line.includes(`.${field}`) || line.includes(`?.${field}`) ||
         line.includes(`[${field}]`) || line.includes(`[${field}]`) ||
         line.includes(`${field}:`) || line.includes(`${field},`);
}

// 检查API端点格式是否一致
function checkApiEndpoints(line, index, file, fileIssues) {
  // 检查非标准API端点格式
  const oldEndpointPatterns = [
    /\/api\/contract\/\w+/g,
    /\/api\/user\/\w+/g,
    /\/api\/enterprise\/\w+/g,
    /\/api\/seal\/\w+/g,
    /\/api\/template\/\w+/g
  ];
  
  oldEndpointPatterns.forEach(pattern => {
    if (pattern.test(line)) {
      // 获取匹配的端点
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // 转换为标准格式
          const parts = match.split('/');
          const resource = parts[2];
          const action = parts.slice(3).join('/');
          
          // 构建推荐的标准端点
          let recommendedEndpoint;
          if (action && action !== 'list' && action !== 'detail') {
            // 对于特殊动作，使用复数资源名+动作
            recommendedEndpoint = `/api/${resource}s/${action}`;
          } else if (action === 'list') {
            // 列表应该直接使用复数资源名
            recommendedEndpoint = `/api/${resource}s`;
          } else if (action === 'detail') {
            // 详情应该使用复数资源名+ID参数
            recommendedEndpoint = `/api/${resource}s/:id`;
          } else {
            // 其他情况使用复数资源名
            recommendedEndpoint = `/api/${resource}s`;
          }
          
          fileIssues.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            lineContent: line.trim(),
            oldField: match,
            recommendedField: recommendedEndpoint,
            type: 'api_endpoint'
          });
          
          // 更新统计数据
          stats.totalIssues++;
          stats.issuesByType['api_endpoint'] = (stats.issuesByType['api_endpoint'] || 0) + 1;
        });
      }
    }
  });
} 