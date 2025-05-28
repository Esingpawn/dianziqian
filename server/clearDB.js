const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// MongoDB连接信息
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://contrct:990124lyx@82.156.176.105:27017/contrct?authSource=contrct';

// 连接数据库并清空
async function clearDatabase() {
  try {
    console.log('开始连接数据库...');
    console.log(`连接URI: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('数据库连接成功');
    
    // 清空所有集合
    console.log('开始清空数据库...');
    const collections = await mongoose.connection.db.collections();
    let clearedCollections = 0;
    
    for (const collection of collections) {
      const name = collection.collectionName;
      await collection.deleteMany({});
      console.log(`已清空集合: ${name}`);
      clearedCollections++;
    }
    
    console.log(`已清空 ${clearedCollections} 个集合`);
    console.log('数据库重置完成，关闭连接');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('重置过程中出错:', error);
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// 执行清空操作
clearDatabase(); 