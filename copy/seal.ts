import request from '../utils/request';

// 印章类型
export type SealType = 'personal' | 'enterprise' | 'department';

// 印章信息接口
export interface SealInfo {
  id: string;
  name: string;
  type: SealType;
  imageUrl: string;
  creatorId: string;
  creatorName: string;
  createTime: string;
  expireTime?: string;
  status: 'active' | 'inactive';
  usageCount: number;
  department?: string; // 部门印章专用
  description?: string;
}

// 创建印章参数
export interface CreateSealParams {
  name: string;
  type: SealType;
  image: File;
  department?: string;
  description?: string;
  expireTime?: string;
}

/**
 * 获取印章列表
 * @param params 查询参数
 */
export const getSeals = (params?: {
  type?: SealType;
  keyword?: string;
  status?: 'active' | 'inactive';
  page?: number;
  pageSize?: number;
}) => {
  return request.get('/seals', { params });
};

/**
 * 获取印章详情
 * @param id 印章ID
 */
export const getSealById = (id: string) => {
  return request.get(`/seals/${id}`);
};

/**
 * 创建印章
 * @param data 印章数据
 */
export const createSeal = (data: FormData) => {
  return request.post('/seals', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 更新印章
 * @param id 印章ID
 * @param data 更新数据
 */
export const updateSeal = (id: string, data: Partial<Omit<CreateSealParams, 'image'> & { image?: File }>) => {
  // 如果有图片文件，使用FormData
  if (data.image) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'image') {
        formData.append('image', value as File);
      } else if (value !== undefined) {
        formData.append(key, value as string);
      }
    });
    
    return request.patch(`/seals/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
  
  // 没有图片文件，直接发送JSON
  const { image, ...restData } = data;
  return request.patch(`/seals/${id}`, restData);
};

/**
 * 更新印章状态
 * @param id 印章ID
 * @param status 状态
 */
export const updateSealStatus = (id: string, status: 'active' | 'inactive') => {
  return request.patch(`/seals/${id}/status`, { status });
};

/**
 * 删除印章
 * @param id 印章ID
 */
export const deleteSeal = (id: string) => {
  return request.delete(`/seals/${id}`);
};

/**
 * 获取印章使用记录
 * @param id 印章ID
 * @param params 查询参数
 */
export const getSealUsageHistory = (id: string, params?: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}) => {
  return request.get(`/seals/${id}/usage-history`, { params });
}; 