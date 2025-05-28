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
    // 重置管理员密码
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await User.updateOne(
      { username: 'admin' },
      { 
        $set: { 
          password: hashedPassword,
          verified: true,
          faceVerified: true
        }
      },
      { upsert: true } // 如果不存在则创建
    );
    
    if (result.matchedCount > 0) {
      console.log('管理员密码重置成功');
      console.log('用户名: admin');
      console.log(`新密码: ${newPassword}`);
    } else if (result.upsertedCount > 0) {
      console.log('管理员账号创建成功');
      console.log('用户名: admin');
      console.log(`密码: ${newPassword}`);
    } else {
      console.log('操作失败，未匹配到用户');
    }
  } catch (error) {
    console.error('重置管理员密码失败:', error);
  } finally {
    // 关闭数据库连接
    mongoose.connection.close();
  }
})
.catch(err => {
  console.error('数据库连接失败:', err);
  process.exit(1);
}); 