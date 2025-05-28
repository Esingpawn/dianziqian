const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. 连接字符串（可根据实际情况切换账号）
const MONGO_URI = 'mongodb://contrct:990124lyx@82.156.176.105:27017/contrct?authSource=contrct';

// 2. 定义所有集合的Schema（仅用于插入，不会污染主项目模型）
const userSchema = new mongoose.Schema({}, { strict: false });
const enterpriseSchema = new mongoose.Schema({}, { strict: false });
const sealSchema = new mongoose.Schema({}, { strict: false });
const templateSchema = new mongoose.Schema({}, { strict: false });
const contractSchema = new mongoose.Schema({}, { strict: false });
const approvalSchema = new mongoose.Schema({}, { strict: false });
const departmentSchema = new mongoose.Schema({}, { strict: false });
const notificationSchema = new mongoose.Schema({}, { strict: false });
const settingSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema, 'users');
const Enterprise = mongoose.model('Enterprise', enterpriseSchema, 'enterprises');
const Seal = mongoose.model('Seal', sealSchema, 'seals');
const Template = mongoose.model('Template', templateSchema, 'templates');
const Contract = mongoose.model('Contract', contractSchema, 'contracts');
const Approval = mongoose.model('Approval', approvalSchema, 'approvals');
const Department = mongoose.model('Department', departmentSchema, 'departments');
const Notification = mongoose.model('Notification', notificationSchema, 'notifications');
const Setting = mongoose.model('Setting', settingSchema, 'settings');

async function main() {
  await mongoose.connect(MONGO_URI);

  // 3. 清空所有集合
  await Promise.all([
    User.deleteMany({}),
    Enterprise.deleteMany({}),
    Seal.deleteMany({}),
    Template.deleteMany({}),
    Contract.deleteMany({}),
    Approval.deleteMany({}),
    Department.deleteMany({}),
    Notification.deleteMany({}),
    Setting.deleteMany({})
  ]);

  // 4. 插入测试数据（密码加密）
  const adminPwd = await bcrypt.hash("admin123", 10);
  const testPwd = await bcrypt.hash("test123", 10);

  await User.insertMany([
    {
      username: "admin",
      password: adminPwd,
      role: "admin",
      status: "active",
      realName: "超级管理员",
      email: "admin@esign.com",
      phone: "13800000000",
      avatar: "/uploads/avatars/admin.png",
      openid: "",
      unionid: "",
      createdAt: "2024-05-26T12:00:00Z"
    },
    {
      username: "testuser",
      password: testPwd,
      role: "user",
      status: "active",
      realName: "测试用户",
      email: "testuser@esign.com",
      phone: "13900000000",
      avatar: "/uploads/avatars/testuser.png",
      openid: "",
      unionid: "",
      createdAt: "2024-05-26T12:00:00Z"
    }
  ]);

  await Enterprise.insertMany([
    {
      name: "测试企业",
      industry: "IT",
      scale: "100-500",
      verifyStatus: "approved",
      verifyRemark: "",
      createdAt: "2024-05-26T12:00:00Z"
    }
  ]);

  await Seal.insertMany([
    {
      name: "测试印章",
      type: "official",
      ownerType: "enterprise",
      ownerId: "测试企业",
      imageUrl: "/uploads/seals/testseal.png",
      status: "active",
      createdAt: "2024-05-26T12:00:00Z"
    }
  ]);

  // 插入模板，获取_id
  const [template] = await Template.insertMany([
    {
      name: "标准合同模板",
      description: "标准测试模板",
      parameters: [
        {
          name: "甲方名称",
          key: "company_name",
          type: "text",
          isRequired: true,
          required: true
        },
        {
          name: "乙方姓名",
          key: "employee_name",
          type: "text",
          isRequired: true,
          required: true
        },
        {
          name: "合同期限",
          key: "contract_period",
          type: "select",
          options: ["1年", "2年", "3年", "5年", "无固定期限"],
          isRequired: true,
          required: true
        }
      ],
      createdAt: "2024-05-26T12:00:00Z"
    }
  ]);

  await Contract.insertMany([
    {
      title: "测试合同",
      templateId: template._id,
      status: "draft",
      parties: [
        { name: "甲方", role: "company" },
        { name: "乙方", role: "user" }
      ],
      fields: {
        company_name: "测试企业",
        employee_name: "测试用户",
        contract_period: "1年"
      },
      createdAt: "2024-05-26T12:00:00Z"
    }
  ]);

  await Approval.insertMany([
    {
      type: "user",
      targetId: "testuser",
      status: "pending",
      remark: "待审批",
      createdAt: "2024-05-26T12:00:00Z"
    },
    {
      type: "enterprise",
      targetId: "测试企业",
      status: "approved",
      remark: "企业认证通过",
      createdAt: "2024-05-26T12:00:00Z"
    }
  ]);

  await Department.insertMany([
    {
      name: "技术部",
      enterpriseId: "测试企业",
      members: ["testuser"],
      createdAt: "2024-05-26T12:00:00Z"
    }
  ]);

  await Notification.insertMany([
    {
      title: "系统通知",
      content: "欢迎使用电子合同签署系统！",
      userId: "testuser",
      read: false,
      createdAt: "2024-05-26T12:00:00Z"
    }
  ]);

  await Setting.insertMany([
    {
      key: "systemName",
      value: "电子合同签署系统"
    }
  ]);

  console.log("数据库初始化完成！");
  await mongoose.disconnect();
}

main().catch(err => {
  console.error("初始化失败：", err);
  process.exit(1);
});