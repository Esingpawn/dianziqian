import request from '../utils/request';

// 用户类型定义
export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  isVerified?: boolean;
}

// 创建/更新用户请求参数
export interface UserParams {
  username: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive' | 'pending';
}

/**
 * 获取用户列表
 * @param params 查询参数
 */
export const getUsers = (params?: {
  keyword?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) => {
  return request.get('/users', { params });
};

/**
 * 获取单个用户详情
 * @param id 用户ID
 */
export const getUserById = (id: string) => {
  return request.get(`/users/${id}`);
};

/**
 * 创建新用户
 * @param data 用户数据
 */
export const createUser = (data: UserParams) => {
  return request.post('/users', data);
};

/**
 * 更新用户信息
 * @param id 用户ID
 * @param data 更新数据
 */
export const updateUser = (id: string, data: UserParams) => {
  return request.patch(`/users/${id}`, data);
};

/**
 * 删除用户
 * @param id 用户ID
 */
export const deleteUser = (id: string) => {
  return request.delete(`/users/${id}`);
};

/**
 * 更改用户状态
 * @param id 用户ID
 * @param status 新状态
 */
export const changeUserStatus = (id: string, status: 'active' | 'inactive' | 'pending') => {
  return request.patch(`/users/${id}`, { status });
}; 