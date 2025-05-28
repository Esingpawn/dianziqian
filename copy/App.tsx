import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';

// 布局
import MainLayout from './layouts/MainLayout';

// 页面
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ContractList from './pages/contracts/ContractList';
import ContractDetail from './pages/contracts/ContractDetail';
import ContractSign from './pages/contracts/ContractSign';
import ContractCreate from './pages/contracts/ContractCreate';
import MemberList from './pages/company/MemberList';
import SealList from './pages/company/SealList';
import NotFound from './pages/NotFound';
import TemplateList from './pages/templates/TemplateList';
import TemplateDetail from './pages/templates/TemplateDetail';
import NewTemplateCreate from './pages/templates/NewTemplateCreate';
import TemplateEdit from './pages/templates/TemplateEdit';
import TemplateCopy from './pages/templates/TemplateCopy';
import Profile from './pages/profile/Profile';
import CompanyInfo from './pages/company/CompanyInfo';
import DepartmentManagement from './pages/company/DepartmentManagement';
import UserManagementPage from './pages/users/UserManagement';

// 路由守卫组件
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{element}</> : <Navigate to="/login" />;
};

// 公共路由守卫（已登录用户不能访问）
const PublicRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{element}</>;
};

function App() {
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <ConfigProvider locale={zhCN}>
        <BrowserRouter>
          <Routes>
            {/* 公共路由 */}
            <Route path="/login" element={<PublicRoute element={<Login />} />} />
            <Route path="/register" element={<PublicRoute element={<Register />} />} />
            
            {/* 受保护路由 */}
            <Route element={<ProtectedRoute element={<MainLayout />} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* 合同相关路由 */}
              <Route path="/contracts">
                <Route path="all" element={<ContractList type="all" />} />
                <Route path="pending" element={<ContractList type="pending" />} />
                <Route path="completed" element={<ContractList type="completed" />} />
                <Route path="create" element={<ContractCreate />} />
                <Route path=":id" element={<ContractDetail />} />
                <Route path=":id/sign" element={<ContractSign />} />
              </Route>
              
              {/* 模板相关路由 */}
              <Route path="/templates">
                <Route index element={<TemplateList />} />
                <Route path=":id" element={<TemplateDetail />} />
                <Route path="edit/:id" element={<TemplateEdit />} />
                <Route path="copy/:id" element={<TemplateCopy />} />
                <Route path="create" element={<NewTemplateCreate />} />
              </Route>
              
              {/* 企业相关路由 */}
              <Route path="/company">
                <Route path="info" element={<CompanyInfo />} />
                <Route path="members" element={<MemberList />} />
                <Route path="departments" element={<DepartmentManagement />} />
              </Route>
              
              {/* 印章相关路由 */}
              <Route path="/seals" element={<SealList />} />
              
              {/* 用户管理路由 - 新增 */}
              <Route path="/users" element={<UserManagementPage />} />
              
              {/* 个人中心 */}
              <Route path="/profile" element={<Profile />} />
            </Route>
            
            {/* 重定向根路径到仪表盘 */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            {/* 404页面 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
