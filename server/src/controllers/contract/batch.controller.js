const Contract = require('../../models/contract.model');
const { AppError, catchAsync } = require('../../utils/error.utils');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

/**
 * 下载合同文件
 */
const downloadContract = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const contract = await Contract.findById(id);
  
  if (!contract) {
    return next(new AppError('未找到该合同', 404));
  }
  
  // 检查用户是否有权限下载该合同
  const isInitiator = contract.initiator.userId.toString() === req.user._id.toString();
  const isParticipant = contract.parties.some(party => 
    party.userId && party.userId.toString() === req.user._id.toString()
  );
  const isEnterpriseAdmin = req.user.role === 'enterprise_admin' && 
    req.user.enterpriseId && 
    contract.initiator.enterpriseId && 
    contract.initiator.enterpriseId.toString() === req.user.enterpriseId.toString();
  
  if (!isInitiator && !isParticipant && !isEnterpriseAdmin && req.user.role !== 'admin') {
    return next(new AppError('您没有权限下载此合同', 403));
  }
  
  // 检查合同是否已完成
  if (contract.status !== 'completed' && !isInitiator && req.user.role !== 'admin') {
    return next(new AppError('只有已完成的合同可以下载', 400));
  }
  
  // 获取文件路径
  const filePath = path.join(__dirname, `../../../${contract.filePath}`);
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return next(new AppError('合同文件不存在', 404));
  }
  
  // 设置文件名
  const fileName = `${contract.title}_${contract.contractNo}.pdf`;
  
  // 发送文件
  res.download(filePath, fileName);
});

/**
 * 下载合同附件
 */
const downloadAttachment = catchAsync(async (req, res, next) => {
  const { id, attachmentId } = req.params;
  
  const contract = await Contract.findById(id);
  
  if (!contract) {
    return next(new AppError('未找到该合同', 404));
  }
  
  // 检查用户是否有权限下载该合同附件
  const isInitiator = contract.initiator.userId.toString() === req.user._id.toString();
  const isParticipant = contract.parties.some(party => 
    party.userId && party.userId.toString() === req.user._id.toString()
  );
  const isEnterpriseAdmin = req.user.role === 'enterprise_admin' && 
    req.user.enterpriseId && 
    contract.initiator.enterpriseId && 
    contract.initiator.enterpriseId.toString() === req.user.enterpriseId.toString();
  
  if (!isInitiator && !isParticipant && !isEnterpriseAdmin && req.user.role !== 'admin') {
    return next(new AppError('您没有权限下载此合同附件', 403));
  }
  
  // 查找附件
  const attachment = contract.attachments.find(
    att => att._id.toString() === attachmentId
  );
  
  if (!attachment) {
    return next(new AppError('未找到该附件', 404));
  }
  
  // 获取文件路径
  const filePath = path.join(__dirname, `../../../${attachment.path}`);
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return next(new AppError('附件文件不存在', 404));
  }
  
  // 发送文件
  res.download(filePath, attachment.name);
});

/**
 * 下载合同及所有附件（打包下载）
 */
const downloadContractWithAttachments = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const contract = await Contract.findById(id);
  
  if (!contract) {
    return next(new AppError('未找到该合同', 404));
  }
  
  // 检查用户是否有权限下载该合同
  const isInitiator = contract.initiator.userId.toString() === req.user._id.toString();
  const isParticipant = contract.parties.some(party => 
    party.userId && party.userId.toString() === req.user._id.toString()
  );
  const isEnterpriseAdmin = req.user.role === 'enterprise_admin' && 
    req.user.enterpriseId && 
    contract.initiator.enterpriseId && 
    contract.initiator.enterpriseId.toString() === req.user.enterpriseId.toString();
  
  if (!isInitiator && !isParticipant && !isEnterpriseAdmin && req.user.role !== 'admin') {
    return next(new AppError('您没有权限下载此合同', 403));
  }
  
  // 检查合同是否已完成
  if (contract.status !== 'completed' && !isInitiator && req.user.role !== 'admin') {
    return next(new AppError('只有已完成的合同可以下载', 400));
  }
  
  // 设置响应头
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename=${contract.title}_${contract.contractNo}.zip`);
  
  // 创建zip归档
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  // 将归档传输到响应
  archive.pipe(res);
  
  // 获取合同文件路径
  const contractFilePath = path.join(__dirname, `../../../${contract.filePath}`);
  
  // 检查合同文件是否存在
  if (fs.existsSync(contractFilePath)) {
    // 添加合同文件到归档
    archive.file(contractFilePath, { name: `${contract.title}_${contract.contractNo}.pdf` });
  }
  
  // 添加附件到归档
  if (contract.attachments && contract.attachments.length > 0) {
    // 创建附件目录
    archive.append(null, { name: 'attachments/' });
    
    for (const attachment of contract.attachments) {
      const attachmentPath = path.join(__dirname, `../../../${attachment.path}`);
      
      if (fs.existsSync(attachmentPath)) {
        archive.file(attachmentPath, { name: `attachments/${attachment.name}` });
      }
    }
  }
  
  // 完成归档
  await archive.finalize();
});

/**
 * 批量发起合同
 */
const batchCreateContracts = catchAsync(async (req, res, next) => {
  const { 
    templateId, 
    baseTitle, 
    description, 
    expiryDate, 
    signMethod,
    parties
  } = req.body;
  
  // 获取模板
  const template = await Template.findById(templateId);
  
  if (!template) {
    return next(new AppError('未找到模板', 404));
  }
  
  // 解析参与方数据
  let contractPartiesList = [];
  try {
    if (parties) {
      contractPartiesList = JSON.parse(parties);
    }
  } catch (error) {
    return next(new AppError('参与方数据格式错误，请提供有效的JSON格式', 400));
  }
  
  // 验证参与方数据
  if (contractPartiesList.length === 0) {
    return next(new AppError('请至少添加一组合同参与方', 400));
  }
  
  // 批量创建合同
  const createdContracts = [];
  
  for (let i = 0; i < contractPartiesList.length; i++) {
    const contractParties = contractPartiesList[i];
    
    // 处理用户关联
    for (const party of contractParties) {
      if (party.type === 'personal') {
        // 查找个人用户
        const user = await User.findOne({ phone: party.contact });
        if (user) {
          party.userId = user._id;
        }
      } else if (party.type === 'enterprise') {
        // 查找企业
        const enterprise = await Enterprise.findOne({ name: party.name });
        if (enterprise) {
          party.enterpriseId = enterprise._id;
          
          // 如果有企业联系人信息，查找用户
          if (party.contact) {
            const user = await User.findOne({ 
              phone: party.contact, 
              enterpriseId: enterprise._id 
            });
            if (user) {
              party.userId = user._id;
            }
          }
        }
      }
    }
    
    // 设置合同标题
    const title = `${baseTitle || template.name} (${i + 1})`;
    
    // 复制模板文件作为合同文件
    const templateFilePath = path.join(__dirname, `../../../${template.filePath}`);
    const contractFileName = `contract-${Date.now()}-${i}-${Math.round(Math.random() * 1E9)}.pdf`;
    const contractFilePath = path.join(__dirname, `../../../uploads/contracts/${contractFileName}`);
    
    fs.copyFileSync(templateFilePath, contractFilePath);
    
    // 计算文件哈希值
    const fileHash = await calculateFileHash(contractFilePath);
    
    // 创建合同
    const contract = await Contract.create({
      title,
      description: description || template.description,
      initiator: {
        userId: req.user._id,
        enterpriseId: req.user.enterpriseId || undefined,
        isPersonal: !req.user.enterpriseId
      },
      filePath: `/uploads/contracts/${contractFileName}`,
      fileHash,
      pageCount: template.pageCount,
      parties: contractParties,
      status: 'pending',
      signMethod: signMethod || 'parallel',
      isFromTemplate: true,
      templateId: template._id,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined
    });
    
    createdContracts.push(contract);
  }
  
  // 更新模板使用次数
  template.usageCount += contractPartiesList.length;
  await template.save();
  
  res.status(201).json({
    status: 'success',
    results: createdContracts.length,
    message: `成功批量创建了 ${createdContracts.length} 份合同`,
    data: {
      contracts: createdContracts
    }
  });
});

module.exports = {
  downloadContract,
  downloadAttachment,
  downloadContractWithAttachments,
  batchCreateContracts
}; 