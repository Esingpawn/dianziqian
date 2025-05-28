const mongoose = require('mongoose');

// 签署字段（签名位置）
const signFieldSchema = new mongoose.Schema({
  page: {
    type: Number,
    required: true
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  signerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['signature', 'seal'],
    default: 'signature'
  },
  sealId: mongoose.Schema.Types.ObjectId, // 如果是企业印章，关联印章ID
  isSigned: {
    type: Boolean,
    default: false
  },
  signedAt: Date,
  signatureImage: String // 签名图片路径
});

// 合同参与方
const contractPartySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['personal', 'enterprise'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise'
  },
  name: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  email: String,
  signFields: [signFieldSchema],
  status: {
    type: String,
    enum: ['pending', 'signed', 'rejected', 'expired'],
    default: 'pending'
  },
  signedAt: Date,
  rejectReason: String,
  sendNotification: {
    type: Boolean,
    default: true
  },
  notificationSentAt: Date
});

// 附件
const attachmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// 合同模型
const contractSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '请提供合同标题'],
    trim: true
  },
  contractNo: {
    type: String,
    required: [true, '请提供合同编号'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  initiator: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    enterpriseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enterprise'
    },
    isPersonal: {
      type: Boolean,
      required: true
    }
  },
  filePath: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    get: function() {
      return this.filePath;
    }
  },
  fileHash: String, // 文件哈希值，用于验证文件完整性
  pageCount: {
    type: Number,
    required: true
  },
  parties: [contractPartySchema],
  attachments: [attachmentSchema],
  status: {
    type: String,
    enum: ['draft', 'pending', 'signing', 'completed', 'rejected', 'canceled', 'expired'],
    default: 'draft'
  },
  signMethod: {
    type: String,
    enum: ['sequential', 'parallel'],
    default: 'parallel'
  },
  isFromTemplate: {
    type: Boolean,
    default: false
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template'
  },
  keywords: [String],
  expiryDate: Date,
  expireTime: {
    type: Date,
    get: function() {
      return this.expiryDate;
    }
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  createTime: {
    type: Date,
    get: function() {
      return this.createdAt;
    }
  },
  updatedAt: Date
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      if (ret._id && !ret.id) {
        ret.id = ret._id.toString();
      }
      if (ret.filePath) ret.fileUrl = ret.filePath;
      if (ret.expiryDate) ret.expireTime = ret.expiryDate;
      if (ret.createdAt) ret.createTime = ret.createdAt;
      // delete ret._id; // 保留 _id 以防万一其他地方直接使用
      delete ret.__v; // 通常不需要 __v 版本号
    }
  },
  toObject: {
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      if (ret._id && !ret.id) {
        ret.id = ret._id.toString();
      }
      if (ret.filePath) ret.fileUrl = ret.filePath;
      if (ret.expiryDate) ret.expireTime = ret.expiryDate;
      if (ret.createdAt) ret.createTime = ret.createdAt;
      // delete ret._id;
      delete ret.__v;
    }
  }
});

// 创建合同编号
contractSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    this.contractNo = `CT${year}${month}${day}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract; 