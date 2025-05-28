const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// 加载环境变量
dotenv.config();

// 覆盖MongoDB连接字符串为生产环境
process.env.MONGODB_URI = 'mongodb://contrct:990124lyx@82.156.176.105:27017/contrct?authSource=contrct';

// 连接数据库
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    console.log('正在连接到数据库...');
    console.log(`连接URI: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('数据库连接成功');
    return true;
  } catch (err) {
    console.error('数据库连接失败:', err.message);
    return false;
  }
};

// 获取所有集合并重置
const resetDatabase = async () => {
  try {
    console.log('开始重置数据库...');
    
    // 获取所有集合
    const collections = await mongoose.connection.db.collections();
    
    // 遍历并清空每个集合
    for (const collection of collections) {
      await collection.deleteMany({});
      console.log(`已清空集合: ${collection.collectionName}`);
    }
    
    console.log('数据库重置完成');
    return true;
  } catch (err) {
    console.error('数据库重置失败:', err.message);
    return false;
  }
};

// 定义用户模型 - 适应生产环境
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  role: { type: String, default: 'user' },
  avatar: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  account: { type: String, unique: true }, // 生产环境特有字段
  idCard: { type: String, default: null },
  enterprises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' }],
  currentEnterprise: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', default: null }
}, { timestamps: true });

// 保存前加密密码
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 验证密码方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// 定义企业模型
const enterpriseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  creditCode: { type: String, required: true, unique: true },
  legalRepresentative: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  logo: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  industry: { type: String, default: '其他' },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    department: { type: String, default: '默认部门' },
    addedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Enterprise = mongoose.model('Enterprise', enterpriseSchema);

// 定义模板模型
const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  fileUrl: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enterprise: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', default: null },
  isPrivate: { type: Boolean, default: false },
  category: { type: String, enum: ['合同', '协议', '授权书', '声明', '其他'], default: '其他' },
  tags: [String],
  parameters: [{
    name: { type: String, required: true },
    key: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'date', 'select', 'checkbox'], default: 'text' },
    options: [String],
    defaultValue: { type: String, default: '' },
    isRequired: { type: Boolean, default: false },
    position: { type: Object, default: null }
  }],
  signaturePositions: [{
    role: { type: String, required: true },
    page: { type: Number, required: true },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    }
  }],
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

const Template = mongoose.model('Template', templateSchema);

// 创建管理员账户
const createAdminUser = async () => {
  try {
    // 创建管理员账户
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      name: '系统管理员',
      phone: '13800000000',
      email: 'admin@esign.com',
      role: 'admin',
      isVerified: true,
      account: 'admin'
    });
    
    console.log('管理员账户创建成功');
    return adminUser;
  } catch (err) {
    console.error('创建管理员账户失败:', err.message);
    return null;
  }
};

// 创建测试用户
const createTestUsers = async () => {
  try {
    // 创建测试用户
    const testUsers = [];
    
    try {
      const testUser1 = await User.create({
        username: 'test',
        password: 'test123',
        name: '测试用户',
        phone: '13900000001',
        email: 'test@esign.com',
        role: 'user',
        isVerified: true,
        account: 'test'
      });
      testUsers.push(testUser1);
      console.log('测试用户1创建成功');
    } catch (err) {
      console.error('创建测试用户1失败:', err.message);
    }
    
    try {
      const testUser2 = await User.create({
        username: 'company',
        password: 'company123',
        name: '企业用户',
        phone: '13900000002',
        email: 'company@esign.com',
        role: 'enterprise_admin',
        isVerified: true,
        account: 'company'
      });
      testUsers.push(testUser2);
      console.log('测试用户2创建成功');
    } catch (err) {
      console.error('创建测试用户2失败:', err.message);
    }
    
    return testUsers;
  } catch (err) {
    console.error('创建测试用户过程中出错:', err.message);
    return [];
  }
};

// 创建测试企业
const createTestEnterprise = async (adminUserId) => {
  try {
    // 创建测试企业
    const enterprise = await Enterprise.create({
      name: '示例科技有限公司',
      creditCode: '91110000123456789A',
      legalRepresentative: '测试企业',
      phone: '400-123-4567',
      address: '北京市海淀区中关村大街1号',
      industry: '信息技术',
      description: '这是一个用于测试的企业账户',
      owner: adminUserId,
      isVerified: true,
      members: [
        {
          user: adminUserId,
          role: 'owner',
          department: '管理层'
        }
      ]
    });
    
    console.log('测试企业创建成功');
    
    // 更新用户企业信息
    await User.findByIdAndUpdate(adminUserId, {
      currentEnterprise: enterprise._id,
      $push: { enterprises: enterprise._id }
    });
    
    return enterprise;
  } catch (err) {
    console.error('创建测试企业失败:', err.message);
    return null;
  }
};

// 创建示例模板
const createSampleTemplates = async (userId, enterpriseId) => {
  try {
    // 创建示例模板
    const templates = await Template.create([
      {
        name: '劳动合同模板',
        description: '标准劳动合同模板，适用于各类企业',
        fileUrl: '/uploads/templates/labor_contract_template.pdf',
        creator: userId,
        enterprise: enterpriseId,
        category: '合同',
        isPrivate: false,
        tags: ['劳动', '雇佣', '标准'],
        parameters: [
          {
            name: '甲方名称',
            key: 'company_name',
            type: 'text',
            isRequired: true
          },
          {
            name: '乙方姓名',
            key: 'employee_name',
            type: 'text',
            isRequired: true
          },
          {
            name: '合同期限',
            key: 'contract_period',
            type: 'select',
            options: ['1年', '2年', '3年', '5年', '无固定期限'],
            isRequired: true
          }
        ],
        signaturePositions: [
          {
            role: '甲方',
            page: 3,
            position: { x: 100, y: 500 }
          },
          {
            role: '乙方',
            page: 3,
            position: { x: 400, y: 500 }
          }
        ]
      },
      {
        name: '保密协议模板',
        description: '公司与员工/合作伙伴之间的保密协议',
        fileUrl: '/uploads/templates/nda_template.pdf',
        creator: userId,
        enterprise: enterpriseId,
        category: '协议',
        isPrivate: false,
        tags: ['保密', 'NDA', '商业机密'],
        parameters: [
          {
            name: '公司名称',
            key: 'company_name',
            type: 'text',
            isRequired: true
          },
          {
            name: '签署方名称',
            key: 'party_name',
            type: 'text',
            isRequired: true
          },
          {
            name: '保密期限',
            key: 'confidentiality_period',
            type: 'select',
            options: ['1年', '2年', '3年', '5年', '永久'],
            isRequired: true
          }
        ],
        signaturePositions: [
          {
            role: '公司',
            page: 2,
            position: { x: 100, y: 600 }
          },
          {
            role: '签署方',
            page: 2,
            position: { x: 400, y: 600 }
          }
        ]
      }
    ]);
    
    console.log(`已创建 ${templates.length} 个示例模板`);
  } catch (err) {
    console.error('创建示例模板失败:', err.message);
  }
};

// 主函数
const initializeDatabase = async () => {
  try {
    console.log('======= 开始数据库重置和初始化 =======');
    
    // 连接数据库
    const connected = await connectDB();
    if (!connected) {
      process.exit(1);
    }
    
    // 重置数据库
    const reset = await resetDatabase();
    if (!reset) {
      process.exit(1);
    }
    
    // 创建管理员
    const admin = await createAdminUser();
    if (!admin) {
      throw new Error('无法创建管理员用户');
    }
    
    // 创建测试用户
    await createTestUsers();
    
    // 创建测试企业
    const enterprise = await createTestEnterprise(admin._id);
    
    // 创建示例模板
    if (enterprise) {
      await createSampleTemplates(admin._id, enterprise._id);
    }
    
    console.log('======= 数据库重置和初始化完成 =======');
    
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
    
    process.exit(0);
  } catch (err) {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  }
};

// 执行初始化
initializeDatabase(); 