const express = require('express');
const app = express();

// 模拟当前加载的路由
function printRoutes() {
  console.log('检查服务器路由配置:');
  
  // 加载实际的路由模块
  try {
    // const authRoutes = require('./src/routes/simple/auth.routes');
    // const userRoutes = require('./src/routes/simple/user.routes');
    // const contractRoutes = require('./src/routes/simple/contract.routes');
    // const templateRoutes = require('./src/routes/simple/template.routes');
    
    // 应用路由
    // app.use('/api/auth', authRoutes);
    // app.use('/api/users', userRoutes);
    // app.use('/api/contracts', contractRoutes);
    // app.use('/api/templates', templateRoutes);
    
    // 打印所有路由
    console.log('\n已加载的路由列表:');
    app._router.stack.forEach(function(r) {
      if (r.route && r.route.path) {
        console.log(`${r.route.stack[0].method.toUpperCase()}\t${r.route.path}`);
      } else if (r.name === 'router') {
        r.handle.stack.forEach(function(layer) {
          if (layer.route) {
            const method = layer.route.stack[0].method.toUpperCase();
            console.log(`${method}\t${r.regexp} + ${layer.route.path}`);
          }
        });
      }
    });
  } catch (error) {
    console.error('加载路由失败:', error);
  }
  
  // 检查用户模块
  try {
    // const User = require('./src/models/simple/user.model');
    console.log('\n用户模型字段:');
    // const userFields = Object.keys(User.schema.paths);
    // userFields.forEach(field => {
    //   const isRequired = User.schema.paths[field].isRequired || false;
    //   console.log(`- ${field}${isRequired ? ' (必填)' : ''}`);
    // });
  } catch (error) {
    console.error('加载用户模型失败:', error);
  }
}

printRoutes(); 