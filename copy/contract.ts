import request from '../utils/request';

// 合同状态类型
export type ContractStatus = 'draft' | 'pending' | 'signing' | 'completed' | 'rejected' | 'canceled' | 'expired';

// 合同列表项接口
export interface ContractListItem {
  id: string;
  title: string;
  status: ContractStatus;
  createTime: string;
  creatorId: string;
  creatorName: string;
  signerCount: number;
  signedCount: number;
  isCreator: boolean;
  needMySign: boolean;
  expireTime?: string;
  templateId?: string;
  templateName?: string;
}

// 合同详情接口
export interface ContractDetail {
  id: string;
  title: string;
  status: ContractStatus;
  createTime: string;
  expireTime?: string;
  creatorId: string;
  creatorName: string;
  fileUrl: string;
  description?: string;
  templateId?: string;
  templateName?: string;
  signers: Array<{
    id: string;
    name: string;
    role: string;
    status: 'pending' | 'signed' | 'rejected';
    signTime?: string;
    isCurrentUser: boolean;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    fileUrl: string;
    type: string;
    uploadTime: string;
  }>;
  logs: Array<{
    id: string;
    time: string;
    content: string;
    userId: string;
    userName: string;
  }>;
}

// 合同签署位置接口
export interface SignPosition {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signerId: string;
  signerName: string;
  type: 'signature' | 'seal';
  isSigned: boolean;
  signTime?: string;
}

// 合同创建参数
export interface CreateContractParams {
  title: string;
  file: File;
  description?: string;
  expireTime?: string;
  signers: Array<{
    name: string;
    email?: string;
    phone?: string;
    role: string;
  }>;
  attachments?: File[];
  templateId?: string;
}

/**
 * 获取合同列表
 * @param params 查询参数
 */
export const getContracts = (params?: {
  status?: ContractStatus | 'all';
  keyword?: string;
  startDate?: string;
  endDate?: string;
  createdByMe?: boolean;
  needMySign?: boolean;
  page?: number;
  pageSize?: number;
}) => {
  return request.get('/contracts', { params });
};

/**
 * 获取合同详情
 * @param id 合同ID
 * @param config 可选的 Axios 请求配置
 */
export const getContractById = (id: string, config?: any) => {
  return request.get(`/contracts/${id}`, config);
};

/**
 * 下载合同
 * @param id 合同ID
 */
export const downloadContract = (id: string) => {
  return request.get(`/contracts/${id}/download`, { responseType: 'blob' });
};

/**
 * 撤销合同
 * @param id 合同ID
 */
export const cancelContract = (id: string) => {
  return request.post(`/contracts/${id}/cancel`);
};

/**
 * 创建合同
 * @param data 合同数据
 */
export const createContract = (data: FormData) => {
  const mode = data.get('mode') as string;
  
  if (mode === 'template') {
    const templateId = data.get('templateId') as string;
    
    // 使用模板接口
    return request.post(`/contracts/template/${templateId}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } else {
    // 否则使用自定义合同接口
    return request.post('/contracts/custom', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

/**
 * 获取合同签署位置
 * @param id 合同ID
 */
export const getSignPositions = (id: string) => {
  return request.get(`/contracts/${id}/positions`);
};

/**
 * 设置签署位置
 * @param id 合同ID
 * @param positions 签署位置数据
 */
export const setSignPositions = (id: string, positions: Omit<SignPosition, 'id' | 'isSigned' | 'signTime'>[]) => {
  return request.post(`/contracts/${id}/positions`, { positions });
};

/**
 * 签署合同
 * @param id 合同ID
 * @param data 签署数据
 */
export const signContract = (id: string, data: { signatureId?: string; sealId?: string; positions: string[] }) => {
  return request.post(`/contracts/${id}/sign`, data);
};

/**
 * 拒绝签署
 * @param id 合同ID
 * @param reason 拒绝原因
 */
export const rejectContract = (id: string, reason: string) => {
  return request.post(`/contracts/${id}/reject`, { reason });
};

/**
 * 添加附件
 * @param id 合同ID
 * @param file 附件文件
 */
export const addAttachment = (id: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return request.post(`/contracts/${id}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 删除附件
 * @param contractId 合同ID
 * @param attachmentId 附件ID
 */
export const deleteAttachment = (contractId: string, attachmentId: string) => {
  return request.delete(`/contracts/${contractId}/attachments/${attachmentId}`);
};

/**
 * 创建从模板生成的合同
 * @param data 模板合同数据
 */
export const createFromTemplate = (templateId: string, data: FormData) => {
  return request.post(`/templates/${templateId}/contracts`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 批量创建合同
 * @param data 批量创建数据
 */
export const batchCreateContracts = (data: FormData) => {
  return request.post('/contracts/batch', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}; 