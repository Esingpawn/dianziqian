const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '部门名称为必填项'],
      trim: true
    },
    enterprise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enterprise',
      required: [true, '部门必须属于一个企业']
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '必须指定创建人']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 虚拟字段：子部门
departmentSchema.virtual('children', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'parent'
});

// 索引
departmentSchema.index({ enterprise: 1, name: 1 }, { unique: true });
departmentSchema.index({ parent: 1 });

// 更新时间中间件
departmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department; 