const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB连接信息
const MONGODB_URI = 'mongodb://contrct:990124lyx@82.156.176.105:27017/contrct?authSource=contrct';

// 简单用户创建
async function createUsers() {
  try {
    console.log('开始连接数据库...');
    await mongoose.connect(MONGODB_URI);
    console.log('数据库连接成功');
    
    // 简单用户模型
    const userSchema = new mongoose.Schema({
      username: String,
      password: String,
      name: String,
      role: String
    });
    
    const User = mongoose.model('User', userSchema);
    
    // 创建管理员用户
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin',
      password: adminPassword,
      name: '系统管理员',
      role: 'admin'
    });
    console.log(`管理员创建成功: ${admin._id}`);
    
    // 创建普通用户
    const userPassword = await bcrypt.hash('test123', 10);
    const user = await User.create({
      username: 'test',
      password: userPassword,
      name: '测试用户',
      role: 'user'
    });
    console.log(`普通用户创建成功: ${user._id}`);
    
    console.log('用户创建完成');
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('出错了:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

createUsers(); 