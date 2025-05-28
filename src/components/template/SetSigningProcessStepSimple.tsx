import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Table, 
  Form, 
  Input, 
  Select,
  Switch,
  Tag,
  Tooltip,
  Modal,
  Row,
  Col,
  message,
  DatePicker,
  Divider,
  List
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  EditOutlined, 
  QuestionCircleOutlined, 
  UserOutlined,
  TeamOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import { FieldComponent } from './EditSignatureFieldsStep';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 签署角色类型
export enum SignerRoleType {
  Sender = 'sender',
  Signer = 'signer',
  CC = 'cc',
  Reviewer = 'reviewer',
  Approver = 'approver'
}

// 签署流程方式
export enum SigningProcessMode {
  Sequential = 'sequential', // 顺序签署
  Parallel = 'parallel',     // 并行签署
  Free = 'free'              // 自由签署
}

// 签署角色
export interface SignerRole {
  id: string;
  name: string;
  type: SignerRoleType;
  order: number;
  required: boolean;
  orgType?: 'personal' | 'company';
  description?: string;
  fieldComponents: string[]; // 组件ID数组
}

// 组件属性
interface SetSigningProcessStepProps {
  fieldComponents: FieldComponent[];
  signingProcess: SignerRole[];
  setSigningProcess: (process: SignerRole[]) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

// 组件引用
export interface SetSigningProcessStepRef {
  validate: () => Promise<void>;
}

const SetSigningProcessStep = forwardRef<SetSigningProcessStepRef, SetSigningProcessStepProps>((props, ref) => {
  const { 
    fieldComponents, 
    signingProcess, 
    setSigningProcess, 
    onNext, 
    onPrev 
  } = props;
  
  // 表单实例
  const [form] = Form.useForm();
  
  // 签署流程方式
  const [processMode, setProcessMode] = useState<SigningProcessMode>(SigningProcessMode.Sequential);
  
  // 是否显示添加/编辑角色弹窗
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  
  // 当前编辑的角色
  const [currentRole, setCurrentRole] = useState<SignerRole | null>(null);
  
  // 有效期设置
  const [validityPeriod, setValidityPeriod] = useState<number>(30); // 默认30天
  
  // 是否启用签署提醒
  const [enableReminder, setEnableReminder] = useState<boolean>(true);
  
  // 提醒频率
  const [reminderFrequency, setReminderFrequency] = useState<number>(3); // 默认3天
  
  // 未分配的组件
  const [unassignedComponents, setUnassignedComponents] = useState<FieldComponent[]>([]);
  
  // 初始化时计算未分配组件
  React.useEffect(() => {
    updateUnassignedComponents();
  }, [fieldComponents, signingProcess]);
  
  // 更新未分配组件列表
  const updateUnassignedComponents = () => {
    // 获取所有已分配的组件ID
    const assignedComponentIds = signingProcess.flatMap(role => role.fieldComponents);
    
    // 过滤出未分配的组件
    const unassignedComps = fieldComponents.filter(
      component => !assignedComponentIds.includes(component.id)
    );
    
    setUnassignedComponents(unassignedComps);
  };
  
  // 暴露验证方法给父组件
  useImperativeHandle(ref, () => ({
    validate: async () => {
      return new Promise<void>((resolve, reject) => {
        // 检查是否至少有一个签署角色
        if (signingProcess.length === 0) {
          reject(new Error('请至少添加一个签署角色'));
          return;
        }
        
        // 检查所有必要字段是否已分配
        const requiredComponentIds = fieldComponents
          .filter(c => c.required)
          .map(c => c.id);
          
        const assignedComponentIds = signingProcess.flatMap(role => role.fieldComponents);
        
        const unassignedRequiredIds = requiredComponentIds.filter(
          id => !assignedComponentIds.includes(id)
        );
        
        if (unassignedRequiredIds.length > 0) {
          const unassignedNames = unassignedRequiredIds
            .map(id => fieldComponents.find(c => c.id === id)?.label || '未知组件')
            .join(', ');
            
          reject(new Error(`以下必填组件未分配给任何签署角色: ${unassignedNames}`));
          return;
        }
        
        resolve();
      });
    }
  }));

  // 处理添加角色
  const handleAddRole = () => {
    setCurrentRole(null);
    form.resetFields();
    setIsModalVisible(true);
  };
  
  // 处理编辑角色
  const handleEditRole = (roleId: string) => {
    const role = signingProcess.find(r => r.id === roleId);
    if (role) {
      setCurrentRole(role);
      form.setFieldsValue({
        name: role.name,
        type: role.type,
        orgType: role.orgType || 'personal',
        required: role.required,
        description: role.description
      });
      setIsModalVisible(true);
    }
  };
  
  // 处理删除角色
  const handleDeleteRole = (roleId: string) => {
    // 删除角色前，将该角色的组件移回未分配列表
    const roleToDelete = signingProcess.find(r => r.id === roleId);
    if (!roleToDelete) return;
    
    setSigningProcess(signingProcess.filter(r => r.id !== roleId));
    message.success('角色已删除');
  };
  
  // 保存角色
  const handleSaveRole = async () => {
    try {
      const values = await form.validateFields();
      
      if (currentRole) {
        // 更新现有角色
        const updatedProcess = signingProcess.map(r => 
          r.id === currentRole.id 
            ? { ...r, ...values } 
            : r
        );
        setSigningProcess(updatedProcess);
        message.success('角色已更新');
      } else {
        // 添加新角色
        const newRole: SignerRole = {
          id: `role-${Date.now()}`,
          name: values.name,
          type: values.type,
          order: signingProcess.length,
          required: values.required,
          orgType: values.orgType,
          description: values.description,
          fieldComponents: []
        };
        
        setSigningProcess([...signingProcess, newRole]);
        message.success('角色已添加');
      }
      
      setIsModalVisible(false);
    } catch (error) {
      // 表单验证失败
    }
  };
  
  // 处理移动角色顺序
  const handleMoveRole = (roleId: string, direction: 'up' | 'down') => {
    const index = signingProcess.findIndex(r => r.id === roleId);
    if (index === -1) return;
    
    const newProcess = [...signingProcess];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newProcess.length) return;
    
    // 交换位置
    [newProcess[index], newProcess[targetIndex]] = [newProcess[targetIndex], newProcess[index]];
    
    // 更新顺序
    const updatedProcess = newProcess.map((role, i) => ({
      ...role,
      order: i
    }));
    
    setSigningProcess(updatedProcess);
  };
  
  // 分配组件给角色
  const handleAssignComponents = (roleId: string, componentIds: string[]) => {
    const updatedProcess = signingProcess.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          fieldComponents: [...role.fieldComponents, ...componentIds]
        };
      }
      return role;
    });
    
    setSigningProcess(updatedProcess);
    updateUnassignedComponents();
  };
  
  // 从角色中移除组件
  const handleRemoveComponent = (roleId: string, componentId: string) => {
    const updatedProcess = signingProcess.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          fieldComponents: role.fieldComponents.filter(id => id !== componentId)
        };
      }
      return role;
    });
    
    setSigningProcess(updatedProcess);
    updateUnassignedComponents();
  };

  // 获取角色类型标签
  const getRoleTypeTag = (type: SignerRoleType) => {
    const typeConfig: Record<SignerRoleType, { color: string; text: string }> = {
      [SignerRoleType.Sender]: { color: 'blue', text: '发起方' },
      [SignerRoleType.Signer]: { color: 'green', text: '签署方' },
      [SignerRoleType.CC]: { color: 'purple', text: '抄送方' },
      [SignerRoleType.Reviewer]: { color: 'orange', text: '审阅方' },
      [SignerRoleType.Approver]: { color: 'red', text: '审批方' }
    };
    
    const config = typeConfig[type] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };
  
  // 渲染签署流程表格
  const renderProcessTable = () => {
    const columns = [
      {
        title: '顺序',
        dataIndex: 'order',
        key: 'order',
        width: 80,
        render: (_: any, record: SignerRole, index: number) => index + 1
      },
      {
        title: '角色名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '角色类型',
        dataIndex: 'type',
        key: 'type',
        render: (type: SignerRoleType) => getRoleTypeTag(type)
      },
      {
        title: '组织类型',
        dataIndex: 'orgType',
        key: 'orgType',
        render: (orgType: string) => 
          orgType === 'company' ? '企业' : '个人'
      },
      {
        title: '必填',
        dataIndex: 'required',
        key: 'required',
        render: (required: boolean) => required ? '是' : '否'
      },
      {
        title: '已分配组件',
        key: 'components',
        render: (text: string, record: SignerRole) => (
          <span>
            {record.fieldComponents.length} 个组件
            <Tooltip title="查看组件详情">
              <Button
                type="link"
                size="small"
                onClick={() => {
                  Modal.info({
                    title: `${record.name} 的组件`,
                    content: (
                      <List
                        size="small"
                        dataSource={record.fieldComponents}
                        renderItem={id => {
                          const component = fieldComponents.find(c => c.id === id);
                          return (
                            <List.Item 
                              actions={[
                                <Button 
                                  type="link" 
                                  danger
                                  size="small"
                                  onClick={() => handleRemoveComponent(record.id, id)}
                                >
                                  移除
                                </Button>
                              ]}
                            >
                              {component?.label || id}
                            </List.Item>
                          );
                        }}
                      />
                    ),
                    width: 600
                  });
                }}
              >
                查看
              </Button>
            </Tooltip>
          </span>
        )
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
      },
      {
        title: '操作',
        key: 'action',
        render: (text: string, record: SignerRole, index: number) => (
          <Space>
            <Tooltip title="上移">
              <Button
                type="text"
                icon={<ArrowUpOutlined />}
                disabled={index === 0 || processMode !== SigningProcessMode.Sequential}
                onClick={() => handleMoveRole(record.id, 'up')}
              />
            </Tooltip>
            <Tooltip title="下移">
              <Button
                type="text"
                icon={<ArrowDownOutlined />}
                disabled={index === signingProcess.length - 1 || processMode !== SigningProcessMode.Sequential}
                onClick={() => handleMoveRole(record.id, 'down')}
              />
            </Tooltip>
            <Tooltip title="编辑">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditRole(record.id)}
              />
            </Tooltip>
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteRole(record.id)}
              />
            </Tooltip>
          </Space>
        )
      }
    ];
    
    return (
      <Table
        dataSource={signingProcess}
        columns={columns}
        rowKey="id"
        pagination={false}
        footer={() => (
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddRole}
            block
          >
            添加签署角色
          </Button>
        )}
      />
    );
  };

  // 渲染未分配组件列表
  const renderUnassignedComponents = () => {
    return (
      <Card title="未分配组件">
        <List
          dataSource={unassignedComponents}
          renderItem={component => (
            <List.Item
              actions={signingProcess.length > 0 ? [
                <Select
                  placeholder="分配给角色"
                  style={{ width: 150 }}
                  onChange={(roleId) => handleAssignComponents(roleId, [component.id])}
                >
                  {signingProcess.map(role => (
                    <Option key={role.id} value={role.id}>{role.name}</Option>
                  ))}
                </Select>
              ] : [
                <Text type="secondary">请先添加角色</Text>
              ]}
            >
              <List.Item.Meta
                title={component.label}
                description={`类型: ${component.type} | 必填: ${component.required ? '是' : '否'}`}
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };
  
  // 渲染签署流程设置
  const renderProcessSettings = () => {
    return (
      <div style={{ marginBottom: 24 }}>
        <Card title="签署流程设置">
          <Row gutter={24}>
            <Col span={8}>
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>签署流程方式</Title>
                <Select
                  value={processMode}
                  onChange={setProcessMode}
                  style={{ width: '100%' }}
                >
                  <Option value={SigningProcessMode.Sequential}>
                    顺序签署（按顺序依次签署）
                  </Option>
                  <Option value={SigningProcessMode.Parallel}>
                    并行签署（同时发送给所有签署方）
                  </Option>
                  <Option value={SigningProcessMode.Free}>
                    自由签署（签署方可自由设置顺序）
                  </Option>
                </Select>
              </div>
            </Col>
            
            <Col span={8}>
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>
                  合同有效期
                  <Tooltip title="合同创建后多久内必须完成签署">
                    <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                  </Tooltip>
                </Title>
                <Select
                  value={validityPeriod}
                  onChange={setValidityPeriod}
                  style={{ width: '100%' }}
                >
                  <Option value={7}>7天</Option>
                  <Option value={15}>15天</Option>
                  <Option value={30}>30天</Option>
                  <Option value={60}>60天</Option>
                  <Option value={90}>90天</Option>
                </Select>
              </div>
            </Col>
            
            <Col span={8}>
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>签署提醒</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Switch
                    checked={enableReminder}
                    onChange={setEnableReminder}
                    checkedChildren="启用提醒"
                    unCheckedChildren="禁用提醒"
                  />
                  
                  {enableReminder && (
                    <Select
                      value={reminderFrequency}
                      onChange={setReminderFrequency}
                      style={{ width: '100%' }}
                      placeholder="提醒频率"
                    >
                      <Option value={1}>每天提醒</Option>
                      <Option value={3}>每3天提醒</Option>
                      <Option value={7}>每周提醒</Option>
                    </Select>
                  )}
                </Space>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };
  
  // 角色表单模态框
  const renderRoleModal = () => {
    return (
      <Modal
        title={currentRole ? '编辑角色' : '添加角色'}
        open={isModalVisible}
        onOk={handleSaveRole}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: '',
            type: SignerRoleType.Signer,
            orgType: 'personal',
            required: true,
            description: ''
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="角色名称"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="如: 甲方、销售方、承租方等" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="type"
                label="角色类型"
                rules={[{ required: true, message: '请选择角色类型' }]}
              >
                <Select>
                  <Option value={SignerRoleType.Sender}>发起方（创建合同）</Option>
                  <Option value={SignerRoleType.Signer}>签署方（签署合同）</Option>
                  <Option value={SignerRoleType.Reviewer}>审阅方（审阅内容）</Option>
                  <Option value={SignerRoleType.Approver}>审批方（审批合同）</Option>
                  <Option value={SignerRoleType.CC}>抄送方（仅接收通知）</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orgType"
                label="组织类型"
                rules={[{ required: true, message: '请选择组织类型' }]}
              >
                <Select>
                  <Option value="personal">个人</Option>
                  <Option value="company">企业</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="required"
                label="是否必填"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="必填"
                  unCheckedChildren="选填"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea 
              placeholder="角色说明，如：负责审批合同的法务" 
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <Title level={4}>设置签署流程</Title>
      <Paragraph type="secondary">
        设置签署角色和流程，并为每个角色分配相应的签署区域。
      </Paragraph>
      
      {/* 流程设置 */}
      {renderProcessSettings()}
      
      {/* 角色设置表格 */}
      <Card 
        title={
          <Space>
            <span>签署角色</span>
            <Tag color={processMode === SigningProcessMode.Sequential ? 'blue' : processMode === SigningProcessMode.Parallel ? 'green' : 'orange'}>
              {processMode === SigningProcessMode.Sequential ? '顺序签署' : 
                processMode === SigningProcessMode.Parallel ? '并行签署' : '自由签署'}
            </Tag>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {renderProcessTable()}
      </Card>
      
      {/* 未分配组件 */}
      {unassignedComponents.length > 0 && renderUnassignedComponents()}
      
      {/* 角色编辑模态框 */}
      {renderRoleModal()}
      
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onPrev}>上一步</Button>
        <Button type="primary" onClick={onNext}>下一步</Button>
      </div>
    </div>
  );
});

export default SetSigningProcessStep; 