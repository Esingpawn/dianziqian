const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 创建用户模型
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  userType: {
    type: String,
    enum: ['personal', 'enterprise', 'admin'],
    default: 'personal'
  },
  verified: {
    type: Boolean,
    default: false
  },
  idCard: {
    type: String
  },
  faceVerified: {
    type: Boolean,
    default: false
  },
  enterprises: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise'
  }],
  currentEnterprise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://contrct:990124lyx@82.156.176.105:27017/contrct?authSource=contrct';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('已连接到MongoDB数据库');
  
  try {
    // 检查是否已存在管理员
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('管理员用户已存在');
      console.log('用户名: admin');
      console.log('请使用已有密码登录，或者重置密码');
    } else {
      // 创建超级管理员
      const hashedPassword = await bcrypt.hash('admin123456', 10);
      
      const adminUser = new User({
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        phone: '13800000000',
        email: 'admin@example.com',
        userType: 'admin',
        verified: true,
        faceVerified: true
      });
      
      await adminUser.save();
      
      console.log('超级管理员创建成功');
      console.log('用户名: admin');
      console.log('密码: admin123456');
      console.log('请登录后立即修改默认密码');
    }
  } catch (error) {
    console.error('创建管理员失败:', error);
  } finally {
    // 关闭数据库连接
    mongoose.connection.close();
  }
})
.catch(err => {
  console.error('数据库连接失败:', err);
  process.exit(1);
}); 