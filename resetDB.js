const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// MongoDB连接信息
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://contrct:990124lyx@82.156.176.105:27017/contrct?authSource=contrct';

// 用户模型
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  phone: String,
  email: String,
  role: { type: String, default: 'user' },
  avatar: String,
  isVerified: Boolean,
  account: String,
  idCard: String,
  enterprises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' }],
  currentEnterprise: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' }
}, { timestamps: true });

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

const User = mongoose.model('User', userSchema);

// 企业模型
const enterpriseSchema = new mongoose.Schema({
  name: String,
  creditCode: String,
  legalRepresentative: String,
  phone: String,
  address: String,
  logo: String,
  isVerified: Boolean,
  industry: String,
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    department: String,
    addedAt: Date
  }]
}, { timestamps: true });

const Enterprise = mongoose.model('Enterprise', enterpriseSchema);

// 模板参数
const parameterSchema = new mongoose.Schema({
  name: String,
  label: String,
  type: {
    type: String,
    enum: ['text', 'date', 'number', 'select'],
    default: 'text'
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [String], // 用于select类型
  defaultValue: String
});

// 模板签署角色
const templateRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['personal', 'enterprise'],
    required: true
  },
  signFields: [{
    page: Number,
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    signType: {
      type: String,
      enum: ['signature', 'seal'],
      default: 'signature'
    }
  }]
});

// 模板模型
const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  fileUrl: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enterprise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  category: String,
  parameters: [parameterSchema],
  usageCount: {
    type: Number,
    default: 0
  },
  roles: [templateRoleSchema]
}, { timestamps: true });

const Template = mongoose.model('Template', templateSchema);

// 合同模型
const contractSchema = new mongoose.Schema({
  title: String,
  description: String,
  fileUrl: String,
  status: String, // 草稿, 待签署, 进行中, 已完成, 已拒绝, 已过期
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enterprise: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' },
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  parties: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    status: String, // 待签署, 已签署, 已拒绝
    signatureType: String, // 手写, 印章
    signatureData: String,
    signedAt: Date
  }],
  parameters: [{
    key: String,
    value: String
  }],
  attachments: [{
    name: String,
    fileUrl: String,
    type: String,
    uploadedAt: Date
  }],
  expireAt: Date
}, { timestamps: true });

const Contract = mongoose.model('Contract', contractSchema);

// 印章模型
const sealSchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enterprise: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' },
  isPersonal: Boolean,
  createdAt: { type: Date, default: Date.now }
});

const Seal = mongoose.model('Seal', sealSchema);

// 连接数据库并重置
async function resetAndInitialize() {
  try {
    console.log('开始连接数据库...');
    console.log(`连接URI: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('数据库连接成功');
    
    // 创建管理员用户
    console.log('创建管理员用户...');
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      name: '系统管理员',
      phone: '13800000000',
      email: 'admin@esign.com',
      role: 'admin',
      isVerified: true,
      account: 'admin'
    });
    console.log(`管理员创建成功: ${admin._id}`);
    
    // 创建测试用户
    console.log('创建测试用户...');
    const testUser = await User.create({
      username: 'test',
      password: 'test123',
      name: '测试用户',
      phone: '13900000001',
      email: 'test@esign.com',
      role: 'user',
      isVerified: true,
      account: 'test'
    });
    console.log(`测试用户创建成功: ${testUser._id}`);
    
    const companyUser = await User.create({
      username: 'company',
      password: 'company123',
      name: '企业用户',
      phone: '13900000002',
      email: 'company@esign.com',
      role: 'enterprise_admin',
      isVerified: true,
      account: 'company'
    });
    console.log(`企业用户创建成功: ${companyUser._id}`);
    
    // 创建测试企业
    console.log('创建测试企业...');
    const enterprise = await Enterprise.create({
      name: '示例科技有限公司',
      creditCode: '91110000123456789A',
      legalRepresentative: '测试企业',
      phone: '400-123-4567',
      address: '北京市海淀区中关村大街1号',
      industry: '信息技术',
      description: '这是一个用于测试的企业账户',
      owner: admin._id,
      isVerified: true,
      members: [
        {
          user: admin._id,
          role: 'owner',
          department: '管理层',
          addedAt: new Date()
        },
        {
          user: companyUser._id,
          role: 'admin',
          department: '管理层',
          addedAt: new Date()
        }
      ]
    });
    console.log(`测试企业创建成功: ${enterprise._id}`);
    
    // 更新用户企业信息
    await User.findByIdAndUpdate(admin._id, {
      currentEnterprise: enterprise._id,
      enterprises: [enterprise._id]
    });
    
    await User.findByIdAndUpdate(companyUser._id, {
      currentEnterprise: enterprise._id,
      enterprises: [enterprise._id]
    });
    
    // 创建示例模板
    console.log('创建示例模板...');
    const laborTemplate = await Template.create({
      name: '劳动合同模板',
      description: '标准劳动合同模板，适用于各类企业',
      fileUrl: '/uploads/templates/labor_contract_template.pdf',
      creator: admin._id,
      enterprise: enterprise._id,
      category: '合同',
      isPublic: true,
      parameters: [
        {
          name: '甲方名称',
          label: '公司名称',
          type: 'text',
          required: true
        },
        {
          name: '乙方姓名',
          label: '员工姓名',
          type: 'text',
          required: true
        },
        {
          name: '合同期限',
          label: '合同期限',
          type: 'select',
          options: ['1年', '2年', '3年', '5年', '无固定期限'],
          required: true
        }
      ],
      roles: [
        {
          name: '甲方（公司）',
          type: 'enterprise',
          signFields: [
            {
              page: 3,
              x: 100,
              y: 500,
              width: 150,
              height: 60,
              signType: 'seal'
            }
          ]
        },
        {
          name: '乙方（员工）',
          type: 'personal',
          signFields: [
            {
              page: 3,
              x: 400,
              y: 500,
              width: 150,
              height: 60,
              signType: 'signature'
            }
          ]
        }
      ],
      usageCount: 0
    });
    console.log(`劳动合同模板创建成功: ${laborTemplate._id}`);
    
    const ndaTemplate = await Template.create({
      name: '保密协议模板',
      description: '公司与员工/合作伙伴之间的保密协议',
      fileUrl: '/uploads/templates/nda_template.pdf',
      creator: admin._id,
      enterprise: enterprise._id,
      category: '协议',
      isPublic: true,
      parameters: [
        {
          name: '公司名称',
          label: '公司名称',
          type: 'text',
          required: true
        },
        {
          name: '签署方名称',
          label: '签署方名称',
          type: 'text',
          required: true
        },
        {
          name: '保密期限',
          label: '保密期限',
          type: 'select',
          options: ['1年', '2年', '3年', '5年', '永久'],
          required: true
        }
      ],
      roles: [
        {
          name: '公司',
          type: 'enterprise',
          signFields: [
            {
              page: 2,
              x: 100,
              y: 600,
              width: 150,
              height: 60,
              signType: 'seal'
            }
          ]
        },
        {
          name: '签署方',
          type: 'personal',
          signFields: [
            {
              page: 2,
              x: 400,
              y: 600,
              width: 150,
              height: 60,
              signType: 'signature'
            }
          ]
        }
      ],
      usageCount: 0
    });
    console.log(`保密协议模板创建成功: ${ndaTemplate._id}`);
    
    // 创建示例印章
    console.log('创建示例印章...');
    const companySeal = await Seal.create({
      name: '公司印章',
      imageUrl: '/uploads/seals/company_seal.png',
      creator: admin._id,
      enterprise: enterprise._id,
      isPersonal: false
    });
    console.log(`公司印章创建成功: ${companySeal._id}`);
    
    const personalSeal = await Seal.create({
      name: '个人印章',
      imageUrl: '/uploads/seals/personal_seal.png',
      creator: testUser._id,
      isPersonal: true
    });
    console.log(`个人印章创建成功: ${personalSeal._id}`);
    
    // 创建示例合同
    console.log('创建示例合同...');
    const contract = await Contract.create({
      title: '测试劳动合同',
      description: '这是一份测试用的劳动合同',
      fileUrl: '/uploads/contracts/test_labor_contract.pdf',
      status: '待签署',
      creator: admin._id,
      enterprise: enterprise._id,
      template: laborTemplate._id,
      parties: [
        {
          user: admin._id,
          role: '甲方',
          status: '已签署',
          signatureType: '印章',
          signatureData: '/uploads/signatures/admin_signature.png',
          signedAt: new Date()
        },
        {
          user: testUser._id,
          role: '乙方',
          status: '待签署'
        }
      ],
      parameters: [
        {
          key: 'company_name',
          value: '示例科技有限公司'
        },
        {
          key: 'employee_name',
          value: '测试用户'
        },
        {
          key: 'contract_period',
          value: '3年'
        }
      ],
      expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
    });
    console.log(`示例合同创建成功: ${contract._id}`);
    
    console.log('数据库初始化完成');
    
    // 获取最终的集合信息
    const finalCollections = await mongoose.connection.db.collections();
    console.log('\n数据库当前状态:');
    
    for (const collection of finalCollections) {
      const count = await collection.countDocuments();
      console.log(`- ${collection.collectionName}: ${count} 条记录`);
    }
    
    console.log('\n初始化完成，关闭连接');
    await mongoose.connection.close();
    
    process.exit(0);
  } catch (error) {
    console.error('初始化过程中出错:', error);
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// 执行初始化
resetAndInitialize(); 