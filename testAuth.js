const axios = require('axios');

async function testRegister() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      username: 'testuser',
      password: 'password123',
      name: '测试用户',
      phone: '13800000001',
      email: 'test@example.com'
    });
    
    console.log('注册成功:', response.data);
  } catch (error) {
    console.error('注册失败:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误详情:', error.response.data);
    }
  }
}

// 执行测试
testRegister(); 