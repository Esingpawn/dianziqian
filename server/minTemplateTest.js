const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: String,
  description: String,
  parameters: [
    {
      name: String,
      key: String,
      type: String,
      isRequired: Boolean,
      required: Boolean,
      options: [String],
    }
  ]
});

const Template = mongoose.model('TemplateTest2', templateSchema, 'template_test2');

async function run() {
  await mongoose.connect('mongodb://contrct:990124lyx@82.156.176.105:27017/contrct?authSource=contrct');
  await Template.deleteMany({});
  try {
    const doc = await Template.create({
      name: '测试模板',
      description: '最小化测试',
      parameters: [
        {
          name: '甲方',
          key: 'partyA',
          type: 'text',
          isRequired: true,
          required: true,
          options: ['选项1', '选项2']
        }
      ]
    });
    console.log('插入成功:', doc);
  } catch (e) {
    console.error('插入失败:', e);
  } finally {
    await mongoose.disconnect();
  }
}

run(); 