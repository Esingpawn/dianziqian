const mongoose = require('mongoose');

const sealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['personal', 'enterprise', 'department'],
    default: 'personal'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enterprise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise',
    required: function() {
      return this.type === 'enterprise';
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  expireTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  usageCount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true
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
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      if (ret._id && !ret.id) {
        ret.id = ret._id.toString();
      }
      if (ret.image) ret.imageUrl = ret.image;
      if (ret.createdAt) ret.createTime = ret.createdAt;
      delete ret.__v;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      if (ret._id && !ret.id) {
        ret.id = ret._id.toString();
      }
      if (ret.image) ret.imageUrl = ret.image;
      if (ret.createdAt) ret.createTime = ret.createdAt;
      delete ret.__v;
    }
  }
});

// 更新时间中间件
sealSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Seal = mongoose.model('Seal', sealSchema);

module.exports = Seal; 