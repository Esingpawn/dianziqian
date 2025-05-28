require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoose: {
    url: process.env.MONGODB_URL || 'mongodb://contrct:990124lyx@82.156.176.105:27017/contrct?authSource=contrct',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'esign-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID || 'wxf863f02ee20a004e',
    appSecret: process.env.WECHAT_APP_SECRET || '49d25ab490c0f9a57920a1d6af0b1a5a',
  },
  upload: {
    maxSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
    destination: process.env.UPLOAD_DESTINATION || 'uploads/',
  },
}; 