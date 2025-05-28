import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
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
  FieldTimeOutlined,
  MenuOutlined
} from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FieldComponent } from './EditSignatureFieldsStep';

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

// 可排序的表格行组件
const SortableTableRow = ({ id, children, ...props }: { id: string; children: React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
    ...props.style
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...props}
      {...attributes}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.key === 'sort') {
          // 这是排序图标所在的单元格
          return React.cloneElement(child, {
            children: (
              <MenuOutlined
                style={{ cursor: 'grab', color: '#999' }}
                {...listeners}
              />
            )
          });
        }
        return child;
      })}
    </tr>
  );
};

const SetSigningProcessStep = forwardRef<SetSigningProcessStepRef, SetSigningProcessStepProps>((props, ref) => {
  const { 
    fieldComponents, 
    signingProcess, 
    setSigningProcess, 
    onNext, 
    onPrev 
  } = props;
  
  // ... 保留其他状态代码 ...
  
  // 设置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = signingProcess.findIndex(role => role.id === active.id);
    const newIndex = signingProcess.findIndex(role => role.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      // 使用arrayMove重新排序数组
      const updatedRoles = arrayMove(signingProcess, oldIndex, newIndex).map(
        (role, index) => ({ ...role, order: index })
      );
      
      setSigningProcess(updatedRoles);
    }
  };
  
  // ... 保留其他方法 ...

  // 渲染签署流程表格
  const renderProcessTable = () => {
    const columns = [
      {
        title: '',
        key: 'sort',
        width: 50,
        render: () => <span />
      },
      {
        title: '顺序',
        dataIndex: 'order',
        key: 'order',
        width: 80,
        render: (_: any, record: SignerRole, index: number) => index + 1
      },
      // ... 保留其他列 ...
    ];
    
    // 添加其他列定义
    columns.push(
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
    );
    
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        disabled={processMode !== SigningProcessMode.Sequential}
      >
        <SortableContext
          items={signingProcess.map(role => role.id)}
          strategy={verticalListSortingStrategy}
        >
          <Table
            dataSource={signingProcess}
            columns={columns}
            rowKey="id"
            pagination={false}
            components={{
              body: {
                row: ({ children, ...props }: any) => {
                  // 确保有data-row-key属性，它是行的key
                  if (!props['data-row-key']) {
                    return <tr {...props}>{children}</tr>;
                  }
                  
                  return (
                    <SortableTableRow id={props['data-row-key']} {...props}>
                      {children}
                    </SortableTableRow>
                  );
                }
              }
            }}
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
        </SortableContext>
      </DndContext>
    );
  };

  // ... 保留其他渲染方法 ...
}); 