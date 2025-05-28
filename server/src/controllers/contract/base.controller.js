const Contract = require('../../models/contract.model');
const User = require('../../models/user.model');
const Enterprise = require('../../models/enterprise.model');
const { AppError, catchAsync } = require('../../utils/error.utils');
const { upload, calculateFileHash } = require('../../utils/upload.utils');
const path = require('path');
const fs = require('fs');

// 配置合同文件上传
const uploadContractFile = upload.single('file');

// 配置附件上传
const uploadAttachment = upload.array('attachments', 5); // 最多5个附件

/**
 * 获取合同列表
 */
const getContracts = catchAsync(async (req, res) => {
  // 分页
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // 查询条件
  const query = {};
  
  // 按状态过滤
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  // 按标题搜索
  if (req.query.search) {
    query.title = { $regex: req.query.search, $options: 'i' };
  }
  
  // 按我的不同角色过滤
  if (req.query.role === 'initiator') {
    // 我发起的
    query['initiator.userId'] = req.user._id;
  } else if (req.query.role === 'participant') {
    // 我参与的(待我处理和待他人处理)
    query['parties.userId'] = req.user._id;
    
    // 如果指定了处理状态
    if (req.query.pendingStatus === 'mine') {
      // 待我处理的
      query['parties'] = {
        $elemMatch: {
          userId: req.user._id,
          status: 'pending'
        }
      };
    } else if (req.query.pendingStatus === 'others') {
      // 待他人处理的
      query.$and = [
        { 'parties.userId': req.user._id },
        { status: 'pending' },
        { 'parties': { 
          $not: { 
            $elemMatch: { 
              userId: req.user._id, 
              status: 'pending' 
            } 
          } 
        }}
      ];
    }
  }
  
  // 如果用户是企业成员，也可以查看企业相关的合同
  if (req.user.enterpriseId && req.query.enterprise === 'true') {
    query.$or = [
      { 'initiator.userId': req.user._id },
      { 'parties.userId': req.user._id },
      { 'initiator.enterpriseId': req.user.enterpriseId }
    ];
  }
  
  // 获取合同和总数
  const contracts = await Contract.find(query)
    .populate({
      path: 'initiator.userId',
      select: 'name email phone'
    })
    .populate({
      path: 'parties.userId',
      select: 'name email phone'
    })
    .populate({
      path: 'initiator.enterpriseId',
      select: 'name'
    })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  const total = await Contract.countDocuments(query);
  
  res.status(200).json({
    success: true,
    total,
    data: {
      contracts: contracts.map(contract => ({
        id: contract._id,
        title: contract.title,
        status: contract.status,
        templateId: contract.templateId,
        initiator: contract.initiator,
        parties: contract.parties,
        createdAt: contract.createdAt
        // 可根据前端需要补充其它字段
      }))
    }
  });
});

/**
 * 获取合同详情
 */
const getContract = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const contract = await Contract.findById(id)
    .populate({
      path: 'initiator.userId',
      select: 'name email phone avatar'
    })
    .populate({
      path: 'parties.userId',
      select: 'name email phone avatar'
    })
    .populate({
      path: 'initiator.enterpriseId',
      select: 'name creditCode'
    })
    .populate({
      path: 'parties.enterpriseId',
      select: 'name creditCode'
    })
    .populate({
      path: 'templateId',
      select: 'name'
    });
  
  if (!contract) {
    return next(new AppError('未找到该合同', 404));
  }
  
  // 容错：防止initiator或templateId为undefined
  if (!contract.initiator || !contract.initiator.userId) {
    // 不要立即返回错误，尝试修复问题
    console.warn('合同发起人信息缺失，将使用占位数据');
    contract.initiator = contract.initiator || {};
    contract.initiator.userId = contract.initiator.userId || {
      _id: '000000000000000000000000',
      name: '未知用户'
    };
  }
  
  // 容错：处理templateId不存在的情况
  if (!contract.templateId) {
    console.warn(`合同(${id})模板信息缺失，将继续返回合同数据`);
    // 不返回错误，让前端能够正常显示合同详情
    // 为了前端兼容，添加一个空的模板对象
    contract.templateId = {
      _id: '000000000000000000000000',
      name: '未知模板'
    };
  }
  
  // 检查用户是否有权限查看该合同
  const isInitiator = contract.initiator.userId._id.toString() === req.user._id.toString();
  const isParticipant = contract.parties.some(party => 
    party.userId && party.userId._id.toString() === req.user._id.toString()
  );
  const isEnterpriseAdmin = req.user.role === 'enterprise_admin' && 
    req.user.enterpriseId && 
    contract.initiator.enterpriseId && 
    contract.initiator.enterpriseId._id.toString() === req.user.enterpriseId.toString();
  
  if (!isInitiator && !isParticipant && !isEnterpriseAdmin && req.user.role !== 'admin') {
    return next(new AppError('您没有权限查看此合同', 403));
  }
  
  res.status(200).json({
    success: true,
    data: {
      contract: {
        id: contract._id,
        title: contract.title,
        status: contract.status,
        templateId: contract.templateId,
        initiator: contract.initiator,
        parties: contract.parties,
        createdAt: contract.createdAt,
        fileUrl: contract.fileUrl || contract.filePath,
        // 可根据前端需要补充其它字段
        description: contract.description,
        expireTime: contract.expiryDate || contract.expireTime
      }
    }
  });
});

/**
 * 获取我的合同统计
 */
const getMyContractStats = catchAsync(async (req, res) => {
  // 我发起的合同数量
  const initiatedCount = await Contract.countDocuments({
    'initiator.userId': req.user._id
  });
  
  // 我参与的待处理合同数量
  const pendingCount = await Contract.countDocuments({
    'parties': {
      $elemMatch: {
        userId: req.user._id,
        status: 'pending'
      }
    }
  });
  
  // 已完成的合同数量
  const completedCount = await Contract.countDocuments({
    $or: [
      { 'initiator.userId': req.user._id },
      { 'parties.userId': req.user._id }
    ],
    status: 'completed'
  });
  
  // 被拒绝的合同数量
  const rejectedCount = await Contract.countDocuments({
    $or: [
      { 'initiator.userId': req.user._id },
      { 'parties.userId': req.user._id }
    ],
    status: 'rejected'
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      initiated: initiatedCount,
      pending: pendingCount,
      completed: completedCount,
      rejected: rejectedCount
    }
  });
});

module.exports = {
  getContracts,
  getContract,
  getMyContractStats,
  uploadContractFile,
  uploadAttachment
}; 