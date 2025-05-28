import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag, Typography, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { getUsers, createUser, updateUser, deleteUser, User, UserParams } from '../../api/users';

const { Title } = Typography;
const { Option } = Select;

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // State for View Modal
  const [isViewModalVisible, setIsViewModalVisible] = useState<boolean>(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize]);

  const fetchUsers = async (keyword?: string) => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: keyword || searchKeyword
      };
      
      const response = await getUsers(params);
      console.log('获取用户列表响应:', response);
      
      // 处理不同格式的API响应
      let userItems = [];
      let totalItems = 0;
      
      if (response && response.data) {
        // The actual user list from the backend is in response.data.data.users
        // and total count is in response.data.total
        if (response.data.data && Array.isArray(response.data.data.users)) {
          userItems = response.data.data.users;
          totalItems = response.data.total || userItems.length;
        } else if (Array.isArray(response.data)) { // Fallback for direct array response (less likely for this endpoint now)
          userItems = response.data;
          totalItems = response.data.length;
        } else if (response.data.items && Array.isArray(response.data.items)) { // Fallback for other common structures
          userItems = response.data.items;
          totalItems = response.data.total || userItems.length;
        } else if (response.data.results && Array.isArray(response.data.results)) { // Fallback for other common structures
          userItems = response.data.results;
          totalItems = response.data.total || userItems.length;
        }
        
        console.log('Raw userItems from API structure:', userItems);
        
        // 确保每个用户对象都有id字段
        const processedUsers = userItems.map((user: any) => ({
          ...user,
          id: user.id || user._id // 兼容MongoDB的_id
        }));
        
        setUsers(processedUsers);
        setPagination({
          ...pagination,
          total: totalItems
        });
      } else {
        message.error('获取用户列表失败');
      }
    } catch (error) {
      console.error('加载用户列表时发生错误:', error);
      message.error('加载用户列表时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchUsers();
  };

  const handleReset = () => {
    setSearchKeyword('');
    setPagination({ ...pagination, current: 1 });
    fetchUsers('');
  };

  const handleTableChange = (newPagination: any) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    });
  };

  const showAddUserModal = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditUserModal = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    });
    setIsModalVisible(true);
  };

  const showViewUserModal = (user: User) => {
    setViewingUser(user);
    setIsViewModalVisible(true);
  };

  const handleViewModalCancel = () => {
    setIsViewModalVisible(false);
    setViewingUser(null); // Clear viewing user on modal close
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const userData: UserParams = {
        username: values.username,
        email: values.email,
        phone: values.phone,
        role: values.role,
        status: values.status
      };

      if (!editingUser) {
        // 添加用户时需要密码
        userData.password = values.password;
        await createUser(userData);
        message.success('用户创建成功');
      } else {
        // 更新用户
        if (values.password) {
          userData.password = values.password;
        }
        await updateUser(editingUser.id, userData);
        message.success('用户更新成功');
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      console.error('提交表单时发生错误:', error);
      message.error('操作失败，请检查数据是否正确');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success('用户删除成功');
      fetchUsers();
    } catch (error) {
      console.error('删除用户时发生错误:', error);
      message.error('删除用户失败');
    }
  };
  
  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '手机号', dataIndex: 'phone', key: 'phone', render: (phone?: string) => phone || '-' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role?: string) => {
        if (!role) return <Tag>未知角色</Tag>;
        return <Tag color={role === 'admin' ? 'gold' : 'blue'}>{role.toUpperCase()}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status?: string) => {
        if (!status) return <Tag>未知状态</Tag>;
        let color = 'default';
        if (status === 'active') color = 'success';
        else if (status === 'pending') color = 'warning';
        else if (status === 'inactive') color = 'error';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt', 
      render: (text: string) => new Date(text).toLocaleDateString() 
    },
    {
      title: '实名认证',
      dataIndex: 'isVerified',
      key: 'isVerified',
      render: (isVerified?: boolean) => (
        isVerified === undefined ? '-' : (isVerified ? <Tag color="green">已认证</Tag> : <Tag color="red">未认证</Tag>)
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button icon={<EyeOutlined />} onClick={() => showViewUserModal(record)}>查看</Button>
          <Button icon={<EditOutlined />} onClick={() => showEditUserModal(record)}>编辑</Button>
          <Popconfirm title="确定删除此用户吗?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ margin: '20px'}}>
      <Title level={2}>用户管理</Title>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索用户名或邮箱"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            style={{ width: 250 }}
            onPressEnter={handleSearch}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddUserModal}>
            添加用户
          </Button>
        </Space>
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          name="userForm"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的中国大陆手机号' }
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          {editingUser && (
            <Form.Item
              name="password"
              label="新密码 (可选)"
              rules={[
                { required: false, min: 6, message: '密码至少6位' }
              ]}
            >
              <Input.Password placeholder="留空则不修改密码" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
            initialValue="user"
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="user">普通用户</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
            initialValue="active"
          >
            <Select placeholder="请选择状态">
              <Option value="active">激活</Option>
              <Option value="pending">待审核</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* View User Modal */}
      {viewingUser && (
        <Modal
          title="查看用户详情"
          open={isViewModalVisible}
          onCancel={handleViewModalCancel}
          footer={[
            <Button key="close" onClick={handleViewModalCancel}>
              关闭
            </Button>,
          ]}
        >
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="ID">{viewingUser.id}</Descriptions.Item>
            <Descriptions.Item label="用户名">{viewingUser.username}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{viewingUser.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="手机号">{viewingUser.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="角色">
              <Tag color={viewingUser.role === 'admin' ? 'gold' : 'blue'}>
                {viewingUser.role ? viewingUser.role.toUpperCase() : '未知'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={
                viewingUser.status === 'active' ? 'success' :
                viewingUser.status === 'pending' ? 'warning' :
                viewingUser.status === 'inactive' ? 'error' : 'default'
              }>
                {viewingUser.status ? viewingUser.status.toUpperCase() : '未知'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(viewingUser.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="实名认证">
              {viewingUser.isVerified === undefined ? '-' : (viewingUser.isVerified ? <Tag color="green">已认证</Tag> : <Tag color="red">未认证</Tag>)}
            </Descriptions.Item>
          </Descriptions>
        </Modal>
      )}
    </div>
  );
};

export default UserManagementPage; 