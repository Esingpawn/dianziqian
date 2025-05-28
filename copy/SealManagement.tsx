import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Typography, message, Modal,
  Form, Input, Upload, Select, Image, Tag, Tooltip, Popconfirm
} from 'antd';
import {
  PlusOutlined, UploadOutlined, EditOutlined,
  DeleteOutlined, EyeOutlined, CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';

// 导入API函数及类型
import { 
  createSeal, 
  getSeals as apiGetSeals, 
  updateSeal as apiUpdateSeal, 
  deleteSeal as apiDeleteSeal, 
  updateSealStatus as apiUpdateSealStatus 
} from '../../api/seal';
import type { SealInfo, SealType as ApiSealType } from '../../api/seal'; // Renamed CreateSealParams to avoid conflict if defined locally

const { Title } = Typography; // Removed Text as it's not used
const { Option } = Select;
const { TextArea } = Input;

// 使用从 API 导入的 SealType
// SealStatus enum can remain local if it's only for UI display and maps to API's status strings
enum SealStatus {
  Active = 'active',
  Inactive = 'inactive'
}

const SealManagement: React.FC = () => {
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [seals, setSeals] = useState<SealInfo[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('添加印章');
  const [currentSeal, setCurrentSeal] = useState<SealInfo | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchSeals();
  }, []);

  const fetchSeals = async () => {
    setLoading(true);
    try {
      const response = await apiGetSeals();
      if (response.data?.success) {
        setSeals(response.data.data || []);
      } else {
        message.error(response.data?.message || '获取印章列表失败');
        setSeals([]);
      }
    } catch (error: any) {
      message.error(error?.message || '获取印章列表出错');
      setSeals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSeal = () => {
    setModalTitle('添加印章');
    setCurrentSeal(null);
    form.resetFields();
    setFileList([]);
    setModalVisible(true);
  };

  const handleEditSeal = (seal: SealInfo) => { // Changed parameter type to SealInfo
    setModalTitle('编辑印章');
    setCurrentSeal(seal);
    form.setFieldsValue({
      name: seal.name,
      type: seal.type, // This type should align with ApiSealType values
      status: seal.status,
      description: seal.description,
      department: seal.department, // For department seals
    });
    if (seal.imageUrl) {
    setFileList([
      {
        uid: '-1',
          name: 'seal-image.png', // Or derive from URL
        status: 'done',
        url: seal.imageUrl,
      },
    ]);
    } else {
      setFileList([]);
    }
    setModalVisible(true);
  };

  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

  const handleDeleteSeal = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiDeleteSeal(id);
      if (response.data?.success) {
      message.success('删除印章成功');
        fetchSeals();
      } else {
        message.error(response.data?.message || '删除印章失败');
      }
    } catch (error: any) {
      message.error(error?.message || '删除印章操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (seal: SealInfo) => { // Changed parameter type to SealInfo
    try {
      setLoading(true);
      const newStatus = seal.status === 'active' ? 'inactive' : 'active';
      const response = await apiUpdateSealStatus(seal.id, newStatus);
      if (response.data?.success) {
        message.success(`印章已${newStatus === 'active' ? '启用' : '停用'}`);
        fetchSeals();
      } else {
        message.error(response.data?.message || '更改印章状态失败');
      }
    } catch (error: any) {
      message.error(error?.message || '更改印章状态操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (fileList.length === 0 && !currentSeal) {
        message.error('请上传印章图片');
        return;
      }
      
      setSubmitLoading(true);
      const formData = new FormData();
      formData.append('name', values.name);

      // Adjust type for backend: 'department' type in UI maps to 'enterprise' type for API
      const apiType = values.type === 'department' ? 'enterprise' : values.type;
      formData.append('type', apiType as ApiSealType);
      
      if (values.description) {
        formData.append('description', values.description);
      }
      // If UI type is 'department', backend expects 'department' field with actual department name
      if (values.type === 'department' && values.department) {
          formData.append('department', values.department);
      }
      // Backend expects 'isDefault' (boolean converted to string) - not in current form
      // formData.append('isDefault', 'false'); // Example: add if needed if it's a required field by backend

      let imageFile: RcFile | File | undefined;
      if (fileList.length > 0 && fileList[0].originFileObj) {
        imageFile = fileList[0].originFileObj as RcFile;
      }
      
      if (currentSeal) {
        // Update logic
        const updatePayload: any = { // Using 'any' for simplicity, refine with specific update type from api/seal.ts
          name: values.name,
            type: apiType, // Use adjusted apiType
          description: values.description,
            status: values.status, // Ensure form has status field for edit
        };
        if (values.type === 'department' && values.department) {
            updatePayload.department = values.department;
        } else if (apiType === 'enterprise' && !values.department) {
             // If it was a department seal and now it's just enterprise, or to clear department
            updatePayload.department = ''; // Or handle as per backend logic for clearing
        }
        if (imageFile) {
            updatePayload.image = imageFile;
          }

        const response = await apiUpdateSeal(currentSeal.id, updatePayload);
        if (response.data?.success) {
          message.success('印章更新成功');
          fetchSeals();
        } else {
          message.error(response.data?.message || '更新印章失败');
        }
      } else {
        // Create new seal
        if (!imageFile) {
          message.error('新印章必须上传图片');
          setSubmitLoading(false);
          return;
        }
        formData.append('image', imageFile); // 修改字段名为'image'，与API接口匹配
        const response = await createSeal(formData);
        if (response.data?.success) { 
          message.success(response.data.message || '印章添加成功');
          fetchSeals();
        } else {
          message.error(response.data?.message || '添加印章失败');
        }
      }
      
      setModalVisible(false);
    } catch (error: any) {
      console.error("Seal form submission failed:", error);
      // Try to get message from error.response.data if it's an Axios error processed by interceptor
      const errorMessage = error?.response?.data?.message || error?.message || '操作失败，请重试';
      message.error(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: '印章图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (url: string) => (
        url ? <Image
          src={url}
          alt="印章图片"
          width={60}
          height={60}
          style={{ objectFit: 'contain' }}
          preview={false} // Keep simple, preview modal is separate
          onClick={() => url && handlePreview(url)}
        /> : <Typography.Text type="secondary">无图</Typography.Text>
      ),
    },
    {
      title: '印章名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: ApiSealType, record: SealInfo) => { // Use ApiSealType
        let text = '';
        let color = '';
        
        // If it's an enterprise type and has a department, show as '部门（xxx）'
        if (type === 'enterprise' && record.department) {
            text = `部门 (${record.department})`;
            color = 'purple';
        } else {
        switch (type) {
            case 'personal':
            text = '个人印章';
            color = 'green';
            break;
            case 'enterprise':
            text = '公司印章';
            color = 'blue';
            break;
            // 'department' type for display is now handled by the condition above
            default:
                text = type; // Fallback
                color = 'grey';
            break;
            }
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: 'active' | 'inactive') => { // Explicit status values
        return status === 'active' 
          ? <Tag color="success">已启用</Tag> 
          : <Tag color="error">已停用</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
       render: (text: string) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: '创建人',
      dataIndex: 'creatorName', // Changed from 'creator' to 'creatorName'
      key: 'creatorName',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SealInfo) => ( // Changed record type to SealInfo
        <Space size="small">
          <Tooltip title="查看">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              onClick={() => record.imageUrl && handlePreview(record.imageUrl)}
              disabled={!record.imageUrl}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => handleEditSeal(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? '停用' : '启用'}>
            <Button 
              type="link" 
              icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />} 
              onClick={() => handleChangeStatus(record)}
            />
          </Tooltip>
            <Popconfirm
              title="确定要删除此印章吗？"
              onConfirm={() => handleDeleteSeal(record.id)}
              okText="确定"
              cancelText="取消"
            >
            <Tooltip title="删除">
              <Button 
                type="link" 
                danger 
                icon={<DeleteOutlined />} 
              />
            </Tooltip>
            </Popconfirm>
        </Space>
      ),
    },
  ];

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
      return Upload.LIST_IGNORE; // Use Upload.LIST_IGNORE for antd v4+
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过2MB!');
      return Upload.LIST_IGNORE;
    }
    
    // Do not auto-upload, just add to fileList
    setFileList([file as any]); // We need to cast to any or provide a full UploadFile object
    return false; 
  };

  const handleUploadChange: UploadProps['onChange'] = (info) => {
     // Keep only the latest file in the list for simplicity with maxCount={1}
    let newFileList = [...info.fileList];
    newFileList = newFileList.slice(-1);

    // You can also update the file status here if needed, e.g., to 'done' after manual processing
    // newFileList = newFileList.map(file => {
    //   if (file.response) {
    //     // Component will show file.url as link
    //     file.url = file.response.url;
    //   }
    //   return file;
    // });
    setFileList(newFileList);
  };

  const [formType, setFormType] = useState<ApiSealType>('personal');


  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>印章管理</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddSeal}
          >
            添加印章
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={seals} // seals is now SealInfo[]
        columns={columns} // columns now expect SealInfo
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={700}
        destroyOnClose // Good practice to reset form state when modal closes
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ type: 'personal', status: 'active' }} // Default values for new seal
          onValuesChange={(changedValues) => {
            if (changedValues.type) {
              setFormType(changedValues.type);
            }
          }}
        >
          <Form.Item
            name="name"
            label="印章名称"
            rules={[{ required: true, message: '请输入印章名称' }]}
          >
            <Input placeholder="请输入印章名称" maxLength={50} />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="印章类型"
            rules={[{ required: true, message: '请选择印章类型' }]}
          >
            <Select placeholder="请选择印章类型">
              <Option value="personal">个人印章</Option>
              <Option value="enterprise">公司印章</Option>
              <Option value="department">部门印章</Option> 
            </Select>
          </Form.Item>
          
          {/* Conditional department field */}
          {(form.getFieldValue('type') === 'department' || (currentSeal && currentSeal.type === 'enterprise' && currentSeal.department)) && (
            <Form.Item
              name="department"
              label="部门名称"
              rules={[{ required: form.getFieldValue('type') === 'department', message: '请输入部门名称' }]}
            >
              <Input placeholder="请输入部门名称" maxLength={50} />
            </Form.Item>
          )}
          
          {/* Status field only for editing existing seal */}
          {currentSeal && (
            <Form.Item
              name="status"
              label="印章状态"
              rules={[{ required: true, message: '请选择印章状态' }]}
            >
              <Select>
                <Option value="active">启用</Option>
                <Option value="inactive">停用</Option>
              </Select>
            </Form.Item>
          )}
          
          <Form.Item
            name="image" // This name is for the form item, not directly for FormData key
            label="印章图片"
            // Required only if creating new seal (currentSeal is null)
            rules={[{ required: !currentSeal, message: '请上传印章图片' }]}
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={beforeUpload} // Handles adding file to fileList
              onRemove={() => setFileList([])} // Clear fileList on remove
              onChange={handleUploadChange} // Manage fileList state
              maxCount={1}
            >
              {fileList.length >= 1 ? null : <div><PlusOutlined /><div style={{ marginTop: 8 }}>上传</div></div>}
            </Upload>
            <Typography.Text type="secondary">
              支持JPG、PNG格式，文件大小不超过2MB
            </Typography.Text>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea 
              rows={4} 
              placeholder="请输入印章描述(选填)" 
              maxLength={200} 
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={previewVisible}
        title="印章预览" // Added title for clarity
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="印章预览" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </Card>
  );
};

export default SealManagement; 