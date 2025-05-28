const Enterprise = require('../models/enterprise.model');
const User = require('../models/user.model');
const Department = require('../models/department.model');
const mongoose = require('mongoose');
const { ApiError } = require('../utils/ApiError');

/**
 * 获取公司成员列表
 */
exports.getMembers = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const enterpriseId = req.user.currentEnterprise;
    
    // 查询属于该企业的用户
    const users = await User.find({ 
      enterprises: enterpriseId 
    })
    .skip((page - 1) * pageSize)
    .limit(Number(pageSize))
    .select('-password');
    
    const total = await User.countDocuments({ enterprises: enterpriseId });
    
    return res.json({
      success: true,
      data: users,
      pagination: {
        total,
        current: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    console.error("获取公司成员失败:", error);
    return res.status(500).json({ success: false, message: "获取公司成员失败" });
  }
};

/**
 * 添加公司成员
 */
exports.addMember = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    const enterpriseId = req.user.currentEnterprise;
    
    if (!email) {
      return res.status(400).json({ success: false, message: "邮箱是必填项" });
    }
    
    if (!name) {
      return res.status(400).json({ success: false, message: "姓名是必填项" });
    }
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      // 如果用户存在，将企业添加到用户的企业列表中
      if (!existingUser.enterprises.includes(enterpriseId)) {
        existingUser.enterprises.push(enterpriseId);
        await existingUser.save();
      }
      return res.json({
        success: true,
        message: "用户已添加到企业",
        data: existingUser
      });
    }
    
    // 创建新用户并关联到企业
    const newUser = new User({
      username: email, // 使用邮箱作为用户名
      account: email,  // 设置account字段避免null值
      name,
      email,
      phone: phone || '',
      role: role || 'user',
      enterprises: [enterpriseId],
      // 创建临时密码
      password: Math.random().toString(36).slice(-8)
    });
    
    await newUser.save();
    
    return res.status(201).json({
      success: true,
      message: "成功创建并添加成员",
      data: newUser
    });
  } catch (error) {
    console.error("添加公司成员失败:", error);
    return res.status(500).json({ success: false, message: "添加公司成员失败" });
  }
};

/**
 * 移除公司成员
 */
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const enterpriseId = req.user.currentEnterprise;
    
    // 检查用户是否存在
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }
    
    // 从用户的企业列表中移除当前企业
    user.enterprises = user.enterprises.filter(
      id => id.toString() !== enterpriseId.toString()
    );
    
    await user.save();
    
    return res.json({
      success: true,
      message: "成员已从企业移除"
    });
  } catch (error) {
    console.error("移除公司成员失败:", error);
    return res.status(500).json({ success: false, message: "移除公司成员失败" });
  }
}; 