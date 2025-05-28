import request from '../utils/request';

// 企业信息接口
export interface CompanyInfo {
  id: string;
  name: string;
  creditCode: string; // 统一社会信用代码
  legalRepresentative: string; // 法定代表人
  address: string;
  contactPhone: string;
  email: string;
  industry: string;
  scale: string; // 企业规模
  verifyStatus: 'pending' | 'verified' | 'rejected'; // 认证状态
  logo?: string;
  createTime: string;
}

// 成员信息接口
export interface MemberInfo {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'member';
  department?: string;
  position?: string;
  joinTime: string;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
}

// 添加成员参数
export interface AddMemberParams {
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'manager' | 'member';
  departmentId?: string;
  position?: string;
}

// 企业认证参数
export interface VerifyCompanyParams {
  name: string;
  creditCode: string;
  legalRepresentative: string;
  address: string;
  contactPhone: string;
  email: string;
  industry: string;
  scale: string;
  businessLicense: File;
}

/**
 * 获取企业信息
 */
export const getCompanyInfo = () => {
  return request.get('/enterprise');
};

/**
 * 更新企业信息
 * @param enterpriseId 企业ID
 * @param data 企业信息
 */
export const updateCompanyInfo = (enterpriseId: string, data: Partial<CompanyInfo> | FormData) => {
  if (!enterpriseId) {
    console.error('更新企业信息失败：缺少企业ID');
    return Promise.reject(new Error('缺少企业ID'));
  }
  const isFormData = data instanceof FormData;
  
  return request.patch(`/enterprise/${enterpriseId}`, data, isFormData ? {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  } : undefined);
};

/**
 * 企业认证
 * @param data 认证信息
 */
export const verifyCompany = (data: FormData) => {
  return request.post('/enterprise/verify', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 获取企业成员列表
 * @param params 查询参数
 */
export const getCompanyMembers = (params?: {
  role?: string;
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}) => {
  return request.get('/enterprise/members', { params });
};

/**
 * 添加企业成员
 * @param data 成员信息
 */
export const addCompanyMember = (data: AddMemberParams) => {
  return request.post('/enterprise/members', data);
};

/**
 * 更新企业成员信息
 * @param id 成员ID
 * @param data 更新数据
 */
export const updateCompanyMember = (id: string, data: Partial<Omit<AddMemberParams, 'email'>>) => {
  return request.put(`/enterprise/members/${id}`, data);
};

/**
 * 移除企业成员
 * @param id 成员ID
 */
export const removeCompanyMember = (id: string) => {
  return request.delete(`/enterprise/members/${id}`);
};

/**
 * 获取企业部门列表
 */
export const getCompanyDepartments = (enterpriseId: string) => {
  if (!enterpriseId) {
    console.error('获取部门列表失败：缺少企业ID');
    return Promise.reject(new Error('缺少企业ID'));
  }
  return request.get(`/enterprise/${enterpriseId}/departments`);
};

/**
 * 添加企业部门
 * @param data 包含 enterpriseId, name, 和可选的 parentId
 */
export const addCompanyDepartment = (data: { enterpriseId: string, name: string, parentId?: string }) => {
  return request.post(`/enterprise/${data.enterpriseId}/departments`, { name: data.name, parentId: data.parentId });
};

/**
 * 更新企业部门
 * @param enterpriseId 企业ID
 * @param departmentId 部门ID
 * @param data 包含 name 和可选的 parentId
 */
export const updateCompanyDepartment = (enterpriseId: string, departmentId: string, data: { name: string, parentId?: string }) => {
  return request.put(`/enterprise/${enterpriseId}/departments/${departmentId}`, { name: data.name, parentId: data.parentId });
};

/**
 * 删除企业部门
 * @param enterpriseId 企业ID
 * @param departmentId 部门ID
 */
export const deleteCompanyDepartment = (enterpriseId: string, departmentId: string) => {
  return request.delete(`/enterprise/${enterpriseId}/departments/${departmentId}`);
}; 