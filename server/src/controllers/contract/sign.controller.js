const Contract = require('../../models/contract.model');
const Enterprise = require('../../models/enterprise.model');
const { AppError, catchAsync } = require('../../utils/error.utils');
const { upload } = require('../../utils/upload.utils');
const path = require('path');
const fs = require('fs');

// 配置签名图片上传
const uploadSignature = upload.single('signature');

/**
 * 设置签名位置
 */
const setSignFields = catchAsync(async (req, res, next) => {
  const { contractId } = req.params;
  const { signFields } = req.body;
  
  // 查找合同
  const contract = await Contract.findById(contractId);
  
  if (!contract) {
    return next(new AppError('未找到该合同', 404));
  }
  
  // 验证是否是合同发起人
  if (contract.initiator.userId.toString() !== req.user._id.toString()) {
    return next(new AppError('只有合同发起人可以设置签名位置', 403));
  }
  
  // 验证合同状态
  if (contract.status !== 'draft' && contract.status !== 'pending') {
    return next(new AppError('只能为草稿或待签署的合同设置签名位置', 400));
  }
  
  // 解析签名位置数据
  let parsedSignFields = [];
  try {
    parsedSignFields = JSON.parse(signFields);
  } catch (error) {
    return next(new AppError('签名位置数据格式错误，请提供有效的JSON格式', 400));
  }
  
  // 更新参与方的签名位置
  let updated = false;
  
  for (const field of parsedSignFields) {
    // 查找对应的参与方
    const partyIndex = contract.parties.findIndex(
      party => party._id.toString() === field.partyId
    );
    
    if (partyIndex !== -1) {
      // 添加签名字段
      if (!contract.parties[partyIndex].signFields) {
        contract.parties[partyIndex].signFields = [];
      }
      
      contract.parties[partyIndex].signFields.push({
        page: field.page,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        signerId: field.signerId || contract.parties[partyIndex].userId,
        signType: field.signType || 'signature',
        sealId: field.sealId,
        isSigned: false
      });
      
      updated = true;
    }
  }
  
  if (!updated) {
    return next(new AppError('未找到有效的参与方', 400));
  }
  
  // 如果合同状态是草稿，更新为待签署
  if (contract.status === 'draft') {
    contract.status = 'pending';
  }
  
  await contract.save();
  
  res.status(200).json({
    success: true,
    message: '签名位置设置成功',
    data: {
      contract: {
        id: contract._id,
        title: contract.title,
        status: contract.status,
        templateId: contract.templateId,
        initiator: contract.initiator,
        parties: contract.parties,
        createdAt: contract.createdAt
      }
    }
  });
});

/**
 * 签署合同
 */
const signContract = catchAsync(async (req, res, next) => {
  const { contractId, signFieldId } = req.params;
  const { signType } = req.body;
  
  // 查找合同
  const contract = await Contract.findById(contractId);
  
  if (!contract) {
    return next(new AppError('未找到该合同', 404));
  }
  
  // 验证合同状态
  if (contract.status !== 'pending') {
    return next(new AppError('只能签署待处理的合同', 400));
  }
  
  // 查找当前用户对应的参与方
  const partyIndex = contract.parties.findIndex(
    party => party.userId && party.userId.toString() === req.user._id.toString()
  );
  
  if (partyIndex === -1) {
    return next(new AppError('您不是该合同的参与方', 403));
  }
  
  // 检查参与方状态
  if (contract.parties[partyIndex].status !== 'pending') {
    return next(new AppError('您已处理过该合同', 400));
  }
  
  // 查找签名字段
  let signFieldFound = false;
  
  // 遍历所有签名字段
  for (const party of contract.parties) {
    if (!party.signFields) continue;
    
    const fieldIndex = party.signFields.findIndex(
      field => field._id.toString() === signFieldId
    );
    
    if (fieldIndex !== -1) {
      const field = party.signFields[fieldIndex];
      
      // 检查签名者是否匹配
      if (field.signerId.toString() !== req.user._id.toString()) {
        return next(new AppError('您不是该签名位置的指定签署人', 403));
      }
      
      // 检查签名类型
      if (signType && field.signType !== signType) {
        return next(new AppError('签名类型不匹配', 400));
      }
      
      // 处理签名
      if (field.signType === 'signature') {
        // 手写签名需要上传签名图片
        if (!req.file) {
          return next(new AppError('请上传签名图片', 400));
        }
        
        field.signatureImage = `/uploads/signatures/${req.file.filename}`;
      } else if (field.signType === 'seal') {
        // 企业印章需要指定印章ID
        const { sealId } = req.body;
        
        if (!sealId) {
          return next(new AppError('请指定印章', 400));
        }
        
        // 检查用户是否有权限使用该印章
        if (!req.user.enterpriseId) {
          return next(new AppError('您不是企业用户，无法使用印章', 403));
        }
        
        // 查找企业
        const enterprise = await Enterprise.findById(req.user.enterpriseId);
        
        if (!enterprise) {
          return next(new AppError('未找到您的企业', 404));
        }
        
        // 检查印章是否存在
        const sealExists = enterprise.seals.some(seal => 
          seal._id.toString() === sealId
        );
        
        if (!sealExists) {
          return next(new AppError('未找到该印章或您无权使用', 403));
        }
        
        field.sealId = sealId;
      }
      
      // 标记为已签署
      field.isSigned = true;
      field.signedAt = Date.now();
      signFieldFound = true;
      break;
    }
  }
  
  if (!signFieldFound) {
    return next(new AppError('未找到指定的签名位置', 404));
  }
  
  // 检查当前参与方是否已签署完所有位置
  const party = contract.parties[partyIndex];
  const allFieldsSigned = party.signFields.every(field => 
    field.isSigned || field.signerId.toString() !== req.user._id.toString()
  );
  
  // 如果所有位置都已签署，更新参与方状态
  if (allFieldsSigned) {
    party.status = 'signed';
    party.signedAt = Date.now();
  }
  
  // 检查所有参与方是否都已签署
  const allPartiesSigned = contract.parties.every(
    p => p.status === 'signed' || p.status === 'rejected'
  );
  
  // 如果所有参与方都已签署，更新合同状态
  if (allPartiesSigned && !contract.parties.some(p => p.status === 'rejected')) {
    contract.status = 'completed';
    contract.completedAt = Date.now();
  }
  
  await contract.save();
  
  res.status(200).json({
    success: true,
    message: '合同签署成功',
    data: {
      contract: {
        id: contract._id,
        title: contract.title,
        status: contract.status,
        templateId: contract.templateId,
        initiator: contract.initiator,
        parties: contract.parties,
        createdAt: contract.createdAt
      }
    }
  });
});

/**
 * 拒签合同
 */
const rejectContract = catchAsync(async (req, res, next) => {
  const { contractId } = req.params;
  const { reason } = req.body;
  
  // 查找合同
  const contract = await Contract.findById(contractId);
  
  if (!contract) {
    return next(new AppError('未找到该合同', 404));
  }
  
  // 验证合同状态
  if (contract.status !== 'pending') {
    return next(new AppError('只能拒签待处理的合同', 400));
  }
  
  // 查找当前用户对应的参与方
  const partyIndex = contract.parties.findIndex(
    party => party.userId && party.userId.toString() === req.user._id.toString()
  );
  
  if (partyIndex === -1) {
    return next(new AppError('您不是该合同的参与方', 403));
  }
  
  // 检查参与方状态
  if (contract.parties[partyIndex].status !== 'pending') {
    return next(new AppError('您已处理过该合同', 400));
  }
  
  // 更新参与方状态
  contract.parties[partyIndex].status = 'rejected';
  contract.parties[partyIndex].rejectReason = reason;
  
  // 更新合同状态
  contract.status = 'rejected';
  
  await contract.save();
  
  res.status(200).json({
    success: true,
    message: '拒签成功',
    data: {
      contract: {
        id: contract._id,
        title: contract.title,
        status: contract.status,
        templateId: contract.templateId,
        initiator: contract.initiator,
        parties: contract.parties,
        createdAt: contract.createdAt
      }
    }
  });
});

/**
 * 撤销合同
 */
const cancelContract = catchAsync(async (req, res, next) => {
  const { contractId } = req.params;
  
  // 查找合同
  const contract = await Contract.findById(contractId);
  
  if (!contract) {
    return next(new AppError('未找到该合同', 404));
  }
  
  // 验证是否是合同发起人
  if (contract.initiator.userId.toString() !== req.user._id.toString()) {
    return next(new AppError('只有合同发起人可以撤销合同', 403));
  }
  
  // 验证合同状态
  if (contract.status !== 'pending' && contract.status !== 'draft') {
    return next(new AppError('只能撤销待处理或草稿的合同', 400));
  }
  
  // 更新合同状态
  contract.status = 'cancelled';
  
  await contract.save();
  
  res.status(200).json({
    success: true,
    message: '合同撤销成功',
    data: {
      contract: {
        id: contract._id,
        title: contract.title,
        status: contract.status,
        templateId: contract.templateId,
        initiator: contract.initiator,
        parties: contract.parties,
        createdAt: contract.createdAt
      }
    }
  });
});

module.exports = {
  setSignFields,
  signContract,
  rejectContract,
  cancelContract,
  uploadSignature
}; 