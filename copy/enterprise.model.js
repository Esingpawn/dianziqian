const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false
  },
  role: {
    type: String,
    enum: ['admin', 'member', 'manager'],
    default: 'member'
  },
  permissions: {
    canSign: {
      type: Boolean,
      default: false
    },
    canCreate: {
      type: Boolean,
      default: false
    },
    canManageMembers: {
      type: Boolean,
      default: false
    }
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const enterpriseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请提供企业名称'],
    trim: true,
    unique: true
  },
  creditCode: {
    type: String,
    required: [true, '请提供统一社会信用代码'],
    trim: true,
    unique: true
  },
  legalPerson: {
    type: String,
    required: [true, '请提供法定代表人姓名'],
    trim: true
  },
  address: {
    type: String,
    required: [true, '请提供企业地址'],
    trim: true
  },
  contactPhone: {
    type: String,
    required: [true, '请提供联系电话'],
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  logoUrl: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  businessLicense: {
    type: String, // 存储营业执照图片路径
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date,
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  members: [memberSchema],
  seals: [{
    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, { timestamps: true });

const Enterprise = mongoose.model('Enterprise', enterpriseSchema);

module.exports = Enterprise; 