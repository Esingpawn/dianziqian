const mongoose = require('mongoose');

// 模板参数
const parameterSchema = new mongoose.Schema({
  name: String,
  label: String,
  type: {
    type: String,
    enum: ['text', 'date', 'number', 'select'],
    default: 'text'
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [String], // 用于select类型
  defaultValue: String
});

// 模板签署角色
const templateRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['personal', 'enterprise'],
    required: true
  },
  signFields: [{
    page: Number,
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    signType: {
      type: String,
      enum: ['signature', 'seal'],
      default: 'signature'
    }
  }],
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for id on templateRoleSchema
templateRoleSchema.virtual('id').get(function() {
  if (this._id) return this._id.toHexString();
});

// 合同模板模型
const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  fileUrl: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enterprise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: String,
  parameters: [parameterSchema],
  usageCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  roles: [templateRoleSchema],
  tags: [String]
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // 创建一个新对象，避免修改原始对象导致循环引用
      const result = { ...ret };
      
      // 添加id字段（如果没有）
      if (result._id && !result.id) {
        result.id = result._id.toString();
      }
      
      // 添加标准化字段，用于API规范统一
      if (result.name) result.title = result.name;
      if (result.parameters) result.fields = result.parameters;
      if (result.createdAt) result.createTime = result.createdAt;
      if (result.updatedAt) result.updateTime = result.updatedAt;
      
      // 删除不需要的字段
      delete result.__v;
      
      return result;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      // 创建一个新对象，避免修改原始对象导致循环引用
      const result = { ...ret };
      
      // 添加id字段（如果没有）
      if (result._id && !result.id) {
        result.id = result._id.toString();
      }
      
      // 添加标准化字段，用于API规范统一
      if (result.name) result.title = result.name;
      if (result.parameters) result.fields = result.parameters;
      if (result.createdAt) result.createTime = result.createdAt;
      if (result.updatedAt) result.updateTime = result.updatedAt;
      
      // 删除不需要的字段
      delete result.__v;
      
      return result;
    }
  }
});

// Virtual for id
templateSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Template = mongoose.model('Template', templateSchema);

module.exports = Template; 