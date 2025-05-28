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
    enum: ['personal', 'enterprise'],
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间中间件
sealSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Seal = mongoose.model('Seal', sealSchema);

module.exports = Seal; 