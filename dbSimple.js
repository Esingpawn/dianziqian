const mongoose = require('mongoose');

// 连接字符串
const MONGODB_URI = 'mongodb://contrct:990124lyx@82.156.176.105:27017/contrct?authSource=contrct';

console.log('启动数据库连接测试...');
console.log(`连接URI: ${MONGODB_URI}`);

// 连接数据库
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('数据库连接成功!');
  
  // 获取所有集合
  const collections = await mongoose.connection.db.collections();
  console.log(`数据库共有 ${collections.length} 个集合:`);
  
  // 打印所有集合名称
  for (const collection of collections) {
    const count = await collection.countDocuments();
    console.log(`- ${collection.collectionName}: ${count} 条记录`);
  }
  
  console.log('测试完成，关闭连接');
  await mongoose.connection.close();
})
.catch(err => {
  console.error('数据库连接失败:', err.message);
}); 