const Contract = require('../../models/contract.model');
const Template = require('../../models/template.model');
const User = require('../../models/user.model');
const Enterprise = require('../../models/enterprise.model');
const { AppError, catchAsync } = require('../../utils/error.utils');
const { calculateFileHash, upload } = require('../../utils/upload.utils');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// 定义文件上传中间件
const uploadContractFile = upload.single('file');
const uploadAttachment = upload.array('attachment');

/**
 * 创建自定义合同
 */
const createCustomContract = catchAsync(async (req, res, next) => {
  console.log('[Server createContract] Received req.body:', req.body);
  console.log('[Server createContract] Received req.file:', req.file);
  console.log('[Server createContract] Received req.user:', req.user?._id);

  console.log('[Create Controller] Request received. Headers:', JSON.stringify(req.headers, null, 2));
  console.log('[Create Controller] req.file (from multer):', req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    filename: req.file.filename // multer diskStorage adds this
  } : 'req.file is undefined/null');
  console.log('[Create Controller] req.files (from multer):', req.files ? req.files.map(f => ({
    fieldname: f.fieldname,
    originalname: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
    path: f.path,
    filename: f.filename // multer diskStorage adds this
  })) : 'req.files is undefined/null or empty');
  console.log('[Create Controller] req.body (parsed by multer):', req.body);
  
  // 原有的日志，可以根据需要保留或注释
  console.log('收到的创建合同请求:',{
    body: req.body, // 这个 body 应该是 multer 解析后的文本字段
    fileInfo: req.file ? { // 这里应该能看到 multer 处理后的 req.file
      fieldname: req.file.fieldname, 
      originalname: req.file.originalname,
      size: req.file.size
    } : '无主合同文件',
    filesInfo: req.files ? req.files.map(f => ({ // 同理，这里是 req.files
      fieldname: f.fieldname,
      originalname: f.originalname,
      size: f.size
    })) : '无附件文件'
  });
  
  // 检查是否有上传的主合同文件
  if (!req.file) {
    console.error('合同创建失败: 未上传主合同文件');
    return next(new AppError('请上传合同文件', 400));
  }
  
  try {
    // 获取表单数据
    const { 
      title, 
      description, 
      expireTime,
      signMethod = 'parallel',
      signers: signersJson,
      fields: fieldsJson
    } = req.body;
    
    console.log('处理签署方信息:', { signersJson });
    
    // 解析签署方信息
    let signers = [];
    try {
      if (signersJson) {
        signers = JSON.parse(signersJson);
        console.log('解析后的签署方:', signers);
      }
    } catch (error) {
      console.error('签署方数据解析错误:', error);
      return next(new AppError('签署方数据格式错误', 400));
    }
    
    if (!signers || signers.length === 0) {
      return next(new AppError('请添加至少一个签署方', 400));
    }
    
    // 解析字段信息
    let fields = [];
    try {
      if (fieldsJson) {
        fields = JSON.parse(fieldsJson);
        console.log('解析后的字段:', fields);
      }
    } catch (error) {
      console.error('字段数据解析错误:', error);
      // 字段可以为空，不返回错误
    }
    
    // 合同文件信息 (来自 req.file)
    const contractMainFile = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size
    };
    
    // 计算文件哈希值
    let fileHash;
    try {
      fileHash = await calculateFileHash(req.file.path);
    } catch (error) {
      console.error('计算文件哈希错误:', error);
      fileHash = Date.now().toString(); // 使用时间戳作为备用
    }
    
    // 创建合同
    const contract = new Contract({
      title: title || req.file.originalname,
      description,
      fileHash,
      filePath: req.file.filename,
      originalFilename: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      pageCount: 1, // 临时硬编码，后续应从PDF解析或前端传递
      contractNo: `CN-${Date.now()}`, // 临时生成合同编号
      expireTime: expireTime ? new Date(expireTime) : undefined,
      signMethod,
      initiator: {
        userId: req.user._id,
        enterpriseId: req.user.currentEnterprise,
        isPersonal: !req.user.currentEnterprise // 根据是否有当前企业判断是否为个人发起
      },
      status: 'pending',
      createMode: 'custom',
      fields: fields
    });
    
    // 添加签署方
    contract.parties = signers.map(signer => ({
      userId: signer.userId, // 如果前端的signer对象没有userId，这里会是undefined
      name: signer.name,
      email: signer.email,
      phone: signer.phone,
      contact: signer.phone || signer.email, // 使用电话或邮箱作为联系方式
      type: signer.type || 'personal', // 假设默认为个人，除非前端提供
      role: signer.role, // 从前端的signer对象获取role
      enterpriseId: signer.enterpriseId, // 如果前端的signer对象没有enterpriseId，这里会是undefined
      signOrder: signer.signOrder || (contract.signMethod === 'sequential' ? (signers.indexOf(signer) + 1) : 1),
      status: 'pending'
    }));
    
    // 处理附件 (来自 req.files)
    if (req.files && req.files.length > 0) {
      contract.attachments = req.files.map(f => ({
        filename: f.filename,
        originalname: f.originalname,
        path: f.path,
        mimetype: f.mimetype,
        size: f.size
      }));
    }
    
    // 保存合同
    await contract.save();
    console.log('合同保存成功:', contract._id);
    
    res.status(201).json({
      success: true,
      message: '合同创建成功',
      data: {
        contractId: contract._id
      }
    });
  } catch (error) {
    console.error('创建合同过程中出错:', error);
    return next(new AppError(`创建合同失败: ${error.message}`, 500));
  }
});

/**
 * 创建模板合同
 */
const createTemplateContract = catchAsync(async (req, res, next) => {
  console.log('[Server createTemplateContract] Received req.body:', req.body);
  console.log('[Server createTemplateContract] Received req.user:', req.user?._id);

  const { 
    templateId: templateIdFromBody, // 从 req.body 获取，重命名以区分
    title, 
    description, 
    expiryDate, 
    signMethod,
    signers,
    paramValues
  } = req.body;
  
  // 验证模板ID格式 (应该在获取模板之前，并使用实际的 templateId)
  // if (!mongoose.Types.ObjectId.isValid(req.params.templateId) && !mongoose.Types.ObjectId.isValid(templateId)) {
  //   return next(new AppError('无效的模板ID格式', 400));
  // }
  
  // 优先使用URL路径参数中的模板ID，其次使用请求体中的模板ID
  const actualTemplateId = req.params.templateId || templateIdFromBody;

  // 对 actualTemplateId 进行校验
  if (!actualTemplateId || !mongoose.Types.ObjectId.isValid(actualTemplateId)) {
    return next(new AppError('无效的模板ID格式或模板ID未提供', 400));
  }
  
  // 获取模板
  console.log(`[CreateTemplateContract] Attempting to find template with ID: ${actualTemplateId}`);
  const template = await Template.findById(actualTemplateId);
  console.log('[CreateTemplateContract] Found template object:', JSON.stringify(template, null, 2));
  
  if (!template) {
    return next(new AppError('未找到模板', 404));
  }
  
  // 进一步检查 template.fileUrl 是否有效
  if (!template.fileUrl || typeof template.fileUrl !== 'string') {
    console.error(`[CreateTemplateContract] Template found, but fileUrl is invalid or missing. fileUrl: ${template.fileUrl}`);
    return next(new AppError('模板文件路径(fileUrl)无效或缺失', 500));
  }
  
  // 解析参与方数据 (现在从 signers 解析)
  let contractParties = [];
  try {
    if (signers) { // 检查 signers 是否存在
      contractParties = JSON.parse(signers); // 尝试解析 signers
    } else {
      // 如果 signers 未提供，也应该报错，因为参与方是必需的
      return next(new AppError('请至少添加一个合同参与方 (signers field missing or empty)', 400));
    }
  } catch (error) {
    return next(new AppError('参与方数据(signers)格式错误，请提供有效的JSON格式', 400));
  }
  
  // 验证参与方数据
  if (!Array.isArray(contractParties) || contractParties.length === 0) { // 确保是数组且不为空
    return next(new AppError('请至少添加一个合同参与方', 400));
  }
  
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
  
  // 解析参数值
  let templateParamValues = {};
  try {
    if (paramValues) {
      templateParamValues = JSON.parse(paramValues);
    }
  } catch (error) {
    return next(new AppError('参数值格式错误，请提供有效的JSON格式', 400));
  }
  
  // TODO: 根据模板和参数值生成合同文件
  // 这里应该调用PDF生成服务，填充模板参数并生成最终合同文件
  // 为简化处理，这里直接使用模板文件
  
  // 构建模板文件的正确文件系统路径
  // __dirname 一般是 server/src/controllers/contract
  
  // 假设 template.fileUrl (如 /uploads/templates/filename.pdf) 是相对于 server 目录的路径
  // server 目录的绝对路径
  const serverRoot = path.join(__dirname, '../../../'); 
  // template.fileUrl 通常是 /uploads/templates/filename.pdf, 去掉开头的 '/'
  const relativeTemplatePath = template.fileUrl.startsWith('/') ? template.fileUrl.substring(1) : template.fileUrl;
  // 最终模板文件的绝对路径，预期指向 server/uploads/templates/filename.pdf
  const templateFilePath = path.join(serverRoot, relativeTemplatePath);

  // --- BEGIN DEBUG LOGS ---
  console.log(`[CreateTemplateContract] Resolved serverRoot (new projectRoot): ${serverRoot}`);
  console.log(`[CreateTemplateContract] template.fileUrl: ${template.fileUrl}`);
  console.log(`[CreateTemplateContract] relativeTemplatePath: ${relativeTemplatePath}`);
  console.log(`[CreateTemplateContract] Attempting to access template at (templateFilePath): ${templateFilePath}`);
  if (fs.existsSync(templateFilePath)) {
    console.log(`[CreateTemplateContract] Source template file DOES exist at: ${templateFilePath}`);
  } else {
    console.error(`[CreateTemplateContract] Source template file DOES NOT exist at: ${templateFilePath}. Check path and file system.`);
    // return next(new AppError('模板源文件未找到，路径: ' + templateFilePath, 500)); // Optionally, stop here if file not found
  }
  // --- END DEBUG LOGS ---

  const contractFileName = `contract-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
  // 新合同存储在 server/uploads/contracts/ (相对于 server 目录)
  // 或者，如果也想存到项目根目录的 uploads/contracts:
  // const contractFileDestDir = path.join(projectRoot, 'uploads', 'contracts');
  // 为了与现有自定义合同逻辑可能保持一致（如果它们也存在 server/uploads），暂时保持原目标路径结构
  const contractFileDestDir = path.join(__dirname, '../../../uploads/contracts'); // 指向 server/uploads/contracts
  if (!fs.existsSync(contractFileDestDir)){
    fs.mkdirSync(contractFileDestDir, { recursive: true });
  }
  const contractFilePath = path.join(contractFileDestDir, contractFileName);
  
  // 复制模板文件作为合同文件(实际项目中应该动态生成)
  console.log(`[CreateTemplateContract] Copying template file from: ${templateFilePath} to: ${contractFilePath}`); 
  fs.copyFileSync(templateFilePath, contractFilePath);
  
  // 计算文件哈希值
  const fileHash = await calculateFileHash(contractFilePath);
  
  // 创建合同
  const contract = await Contract.create({
    title: title || template.name,
    description: description || template.description || '', // Default to empty string
    initiator: {
      userId: req.user._id,
      enterpriseId: req.user.currentEnterprise, // Use currentEnterprise from auth middleware
      isPersonal: !req.user.currentEnterprise // Based on currentEnterprise
    },
    filePath: `/uploads/contracts/${contractFileName}`,
    fileHash,
    pageCount: template.pageCount || 1, // Use template.pageCount or default to 1
    contractNo: `TCN-${Date.now()}`, // Generate a template contract number
    parties: contractParties.map(p => ({
      name: p.name,
      email: p.email,
      phone: p.phone,
      contact: p.contact || p.phone || p.email, // Ensure contact is set
      type: p.type || 'personal', // Default to personal if not provided
      role: p.role, 
      enterpriseId: p.enterpriseId,
      userId: p.userId, // This should be populated by the user/enterprise lookup logic above
      signOrder: p.signOrder || (signMethod === 'sequential' ? (contractParties.indexOf(p) + 1) : 1),
      status: 'pending'
      // Do NOT set p._id here, let Mongoose handle it for subdocuments unless it is a ref to an existing Party entity
    })),
    status: 'pending',
    signMethod: signMethod || template.signMethod || 'parallel', // Default signMethod
    isFromTemplate: true,
    templateId: template._id,
    expireTime: expiryDate ? new Date(expiryDate) : undefined, // Field name is expireTime in Contract model
    createMode: 'template' // Explicitly set createMode
  });
  
  // 处理附件上传
  if (req.files && req.files.length > 0) {
    const attachments = req.files.map(file => ({
      name: file.originalname,
      path: `/uploads/attachments/${file.filename}`,
      type: file.mimetype,
      size: file.size,
      uploadedBy: req.user._id,
      uploadedAt: Date.now()
    }));
    
    contract.attachments = attachments;
    await contract.save();
  }
  
  // 更新模板使用次数
  template.usageCount += 1;
  await template.save();
  
  res.status(201).json({
    status: 'success',
    data: {
      contract
    }
  });
});

module.exports = {
  uploadContractFile,
  uploadAttachment,
  createCustomContract,
  createTemplateContract,
}; 