const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// MongoDB连接信息
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://contrct:990124lyx@82.156.176.105:27017/contrct?authSource=contrct';

// 连接数据库并初始化基本数据
async function initializeBasicData() {
  try {
    console.log('开始连接数据库...');
    console.log(`连接URI: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('数据库连接成功');
    
    // 定义用户模型
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

    // 定义企业模型
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

    // 创建或获取模型
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const Enterprise = mongoose.models.Enterprise || mongoose.model('Enterprise', enterpriseSchema);
    
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
    
    console.log('基础数据初始化完成');
    
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
    console.error(error.stack);
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// 执行初始化
initializeBasicData(); 