const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  account: {
    type: String,
    unique: true,
    sparse: true,
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
    enum: ['personal', 'enterprise'],
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
}, {
  timestamps: true
});

// 保存前加密密码
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// 比较密码
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 