import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { message } from 'antd';
import { getCurrentUser, login, LoginParams, LoginResponseData, ApiUser } from '../api/auth';
import { AppApiResponse } from '../utils/request';
import { AxiosResponse } from 'axios';
import request from '../utils/request';

// 用户接口
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
  companyId?: string;
  companyRole?: string;
  currentEnterprise?: string;
  createdAt: string;
}

// 认证上下文接口
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (params: LoginParams) => Promise<boolean>;
  setUser: (user: User | null) => void;
  logout: () => void;
  refreshUserInfo: () => Promise<void>;
  setCurrentEnterprise: (enterpriseId: string) => Promise<boolean>;
}

// 创建上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 判断是否已认证
  const isAuthenticated = !!user;
  
  // 用户登录
  const handleLogin = async (params: LoginParams): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // login(params) from api/auth.ts returns Promise<AxiosResponse<AppApiResponse<LoginResponseData>>>
      const axiosResponse: AxiosResponse<AppApiResponse<LoginResponseData>> = await login(params); 
      console.log('Axios 登录响应:', axiosResponse);

      // Extract the AppApiResponse object from axiosResponse.data
      const appApiResponse: AppApiResponse<LoginResponseData> = axiosResponse.data; 
      console.log('App API 响应 (从拦截器提取后):', appApiResponse);
      
      // 检查整体 AppApiResponse 和其 success 状态
      if (!(appApiResponse && appApiResponse.success === true)) {
        const errorMsgToShow = appApiResponse?.message || '登录认证失败或响应无效';
        console.error('AuthContext: App API 响应无效或success不为true:', appApiResponse);
        message.error(errorMsgToShow);
        setError(errorMsgToShow);
        return false;
      }

      // 检查 appApiResponse.data (即 LoginResponseData) 是否存在且包含token和user
      const loginPayload: LoginResponseData | undefined = appApiResponse.data;

      if (!(loginPayload && typeof loginPayload.token === 'string' && loginPayload.user && typeof loginPayload.user === 'object')) {
        console.error('AuthContext: loginPayload (appApiResponse.data) 结构不正确或缺少token/user:', loginPayload);
        const errorMsg = '登录响应数据格式错误，缺少关键信息';
        message.error(errorMsg);
        setError(errorMsg);
        return false;
      }

      // 到这里，loginPayload.token 和 loginPayload.user 应该是存在的
      // loginPayload.user is still of type ApiUser (from api/auth.ts) or backend structure
      const backendUser = loginPayload.user as any; // Cast to any for mapping, or use ApiUser type
      
      // Map backendUser to frontend AuthContext User interface
      let enterpriseIdStringLogin: string | undefined = undefined;
      if (backendUser.currentEnterprise) {
        if (typeof backendUser.currentEnterprise === 'string') {
          enterpriseIdStringLogin = backendUser.currentEnterprise;
        } else if (typeof backendUser.currentEnterprise === 'object' && backendUser.currentEnterprise !== null) {
          if ('_id' in backendUser.currentEnterprise && backendUser.currentEnterprise._id) {
            enterpriseIdStringLogin = String(backendUser.currentEnterprise._id);
          } else if ('id' in backendUser.currentEnterprise && backendUser.currentEnterprise.id) {
            enterpriseIdStringLogin = String(backendUser.currentEnterprise.id);
          } else {
            console.warn('AuthContext (login): Could not extract a valid string ID from backendUser.currentEnterprise object', backendUser.currentEnterprise);
          }
        } else {
          // Handle cases where it might be a non-string, non-object type if necessary, or log a warning
          console.warn('AuthContext (login): backendUser.currentEnterprise is neither a string nor a valid object for ID extraction', backendUser.currentEnterprise);
        }
      }

      const mappedUser: User = {
        id: backendUser._id || backendUser.id, 
        name: backendUser.name || '未知用户',
        email: backendUser.email || 'N/A', 
        phone: backendUser.phone || 'N/A', 
        role: backendUser.userType || backendUser.role || 'personal', // Handle userType and role
        avatar: backendUser.avatar,
        isVerified: backendUser.verified === true || backendUser.isVerified === true, // Handle verified and isVerified
        companyId: enterpriseIdStringLogin || (backendUser.companyId || undefined), // Use extracted ID for companyId as well if available
        companyRole: backendUser.companyRole,
        currentEnterprise: enterpriseIdStringLogin,
        createdAt: backendUser.createdAt || new Date().toISOString(), 
      };
      
      Cookies.set('token', loginPayload.token, { expires: 7 });
      setUser(mappedUser);
      localStorage.setItem('user', JSON.stringify(mappedUser));
        
      console.log("认证成功，映射后的用户信息：", mappedUser);
        return true;

    } catch (err: any) {
      // This catch block handles errors from await login(params) itself (e.g., network error not caught by interceptor),
      // or any unexpected errors within the try block.
      console.error('登录流程中发生意外错误 (AuthContext):', err);
      // Extract message from AxiosError if possible, otherwise use a generic one
      const errMsg = err?.response?.data?.message || err?.message || '登录过程中发生未知错误';
      message.error(errMsg);
      setError(errMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // 退出登录
  const handleLogout = () => {
    Cookies.remove('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };
  
  // 刷新用户信息
  const refreshUserInfo = async () => {
    setIsLoading(true);
    setError(null); // 清除之前的错误状态
    try {
      const token = Cookies.get('token');
      if (!token) {
        // 尝试从localStorage恢复用户信息 (如果token不存在，通常意味着未登录或已登出)
        const savedUserJson = localStorage.getItem('user');
        if (savedUserJson) {
          try {
            const savedUser = JSON.parse(savedUserJson) as User;
            setUser(savedUser);
          } catch (e) {
            localStorage.removeItem('user'); // 解析失败则移除损坏的数据
          }
        }
        setIsLoading(false);
        return;
      }
      
      // 发送请求获取用户信息
      // getCurrentUser() from api/auth.ts returns Promise<AxiosResponse<AppApiResponse<{ user: ApiUser }>>>
      const axiosResponse: AxiosResponse<AppApiResponse<{ user: ApiUser }>> = await getCurrentUser();
      console.log('[AuthContext refreshUserInfo] Axios response:', axiosResponse);

      const appApiResponse = axiosResponse.data;
      console.log('[AuthContext refreshUserInfo] App API response:', appApiResponse);
      
      if (appApiResponse && appApiResponse.success && appApiResponse.data && appApiResponse.data.user) {
        const backendUser = appApiResponse.data.user as any; // Use 'as any' or define a more precise type from ApiUser
        
        // Map backendUser (ApiUser) to frontend AuthContext User interface
        let enterpriseIdStringRefresh: string | undefined = undefined;
        if (backendUser.currentEnterprise) {
          if (typeof backendUser.currentEnterprise === 'string') {
            enterpriseIdStringRefresh = backendUser.currentEnterprise;
          } else if (typeof backendUser.currentEnterprise === 'object' && backendUser.currentEnterprise !== null) {
            if ('_id' in backendUser.currentEnterprise && backendUser.currentEnterprise._id) {
              enterpriseIdStringRefresh = String(backendUser.currentEnterprise._id);
            } else if ('id' in backendUser.currentEnterprise && backendUser.currentEnterprise.id) {
              enterpriseIdStringRefresh = String(backendUser.currentEnterprise.id);
            } else {
              console.warn('AuthContext (refresh): Could not extract a valid string ID from backendUser.currentEnterprise object', backendUser.currentEnterprise);
            }
          } else {
             console.warn('AuthContext (refresh): backendUser.currentEnterprise is neither a string nor a valid object for ID extraction', backendUser.currentEnterprise);
          }
        }

        const mappedUser: User = {
          id: backendUser._id, // Assuming ApiUser guarantees _id is a string
          name: backendUser.name || '未知用户',
          email: backendUser.email || 'N/A', 
          phone: backendUser.phone || 'N/A', 
          role: backendUser.userType || backendUser.role || 'personal',
          avatar: backendUser.avatar,
          isVerified: backendUser.verified === true || backendUser.isVerified === true,
          companyId: enterpriseIdStringRefresh || (backendUser.companyId || undefined), // Use extracted ID for companyId as well
          companyRole: backendUser.companyRole,
          currentEnterprise: enterpriseIdStringRefresh,
          createdAt: backendUser.createdAt || new Date().toISOString(), 
        };

        setUser(mappedUser);
        localStorage.setItem('user', JSON.stringify(mappedUser));
      } else {
        // 如果API调用成功但返回的数据结构不符合预期，或 success 为 false
        const messageFromServer = appApiResponse?.message || '获取用户信息失败或数据无效';
        throw new Error(messageFromServer);
      }
    } catch (err: any) {
      // 此处捕获 await getCurrentUser() 可能抛出的网络错误等，或者上面 throw new Error
      const errorMsg = err?.response?.data?.message || err?.message || '刷新用户信息时发生未知错误';
      console.error('AuthContext refreshUserInfo 失败:', err);
      
      // 获取用户信息失败，尝试从localStorage加载，作为回退
      const savedUserJson = localStorage.getItem('user');
      if (savedUserJson) {
        try {
          const savedUser = JSON.parse(savedUserJson) as User;
          setUser(savedUser);
          // 即使从localStorage恢复，也应提示获取最新信息失败
          message.warning('无法获取最新用户信息，将使用本地缓存。');
        } catch (e) {
          // 如果localStorage也解析失败，则执行登出逻辑
          message.error(errorMsg); // 显示获取信息的主要错误
          Cookies.remove('token');
          localStorage.removeItem('user');
          setUser(null);
          setError(errorMsg);
      }
      } else {
        // 如果没有本地缓存，则彻底失败，执行登出
      message.error(errorMsg);
      Cookies.remove('token');
      localStorage.removeItem('user');
      setUser(null);
      setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // 初始化加载用户信息
  useEffect(() => {
    refreshUserInfo();
  }, []);
  
  // 设置当前选择的企业
  const setCurrentEnterprise = async (enterpriseId: string) => {
    try {
      setUser(prev => {
        if (!prev) return prev;
        
        // 存储当前企业ID到localStorage
        localStorage.setItem('currentEnterpriseId', enterpriseId);
        
        return {
          ...prev,
          currentEnterprise: enterpriseId
        };
      });
      
      // 可选：同步到后端
      await request.post('/auth/set-enterprise', { enterpriseId });
      return true;
    } catch (error) {
      console.error('设置当前企业失败:', error);
      return false;
    }
  };
  
  // 提供上下文值
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    error,
    login: handleLogin,
    setUser,
    logout: handleLogout,
    refreshUserInfo,
    setCurrentEnterprise,
  };
  
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// 自定义钩子，方便使用上下文
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
}; 