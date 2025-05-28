import request from '../utils/request';

// 模板项接口
export interface TemplateItem {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  creatorId: string;
  creatorName: string;
  createTime: string;
  updateTime: string;
  usageCount: number;
  tags?: string[];
  isPublic: boolean;
}

// 模板详情接口
export interface TemplateDetail extends TemplateItem {
  fields: Array<{
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    defaultValue?: string;
    options?: string[]; // 用于select类型
    description?: string;
  }>;
}

// 创建模板参数
export interface CreateTemplateParams {
  name: string;
  category: string;
  content: string;
  description?: string;
  fields?: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
    required: boolean;
    placeholder?: string;
    options?: string[];
    defaultValue?: string;
  }>;
  file?: FormData;
}

/**
 * 获取模板列表
 * @param params 查询参数
 */
export const getTemplates = (params?: {
  keyword?: string;
  isPublic?: boolean;
  tags?: string[];
  page?: number;
  pageSize?: number;
}) => {
  return request.get('/templates', { params });
};

/**
 * 获取模板详情
 * @param id 模板ID
 */
export const getTemplateById = (id: string) => {
  return request.get(`/templates/${id}`);
};

/**
 * 创建模板
 * @param data 模板数据
 */
export const createTemplate = (data: FormData) => {
  return request.post('/templates', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 更新模板
 * @param id 模板ID
 * @param data 更新数据
 */
export const updateTemplate = (id: string, data: FormData) => {
  return request.put(`/templates/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 删除模板
 * @param id 模板ID
 */
export const deleteTemplate = (id: string) => {
  return request.delete(`/templates/${id}`);
};

/**
 * 从模板创建合同
 * @param id 模板ID
 * @param data 合同数据
 */
export const createContractFromTemplate = (id: string, data: FormData) => {
  return request.post(`/templates/${id}/contracts`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}; 