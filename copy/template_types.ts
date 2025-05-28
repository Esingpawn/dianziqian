export type FieldType = 
  // 签署区域组件
  | 'signature-personal'          // 个人签名
  | 'signature-company-seal'      // 企业印章
  | 'signature-cross-page-seal'   // 骑缝章 (特殊)
  | 'signature-legal-rep'         // 法定代表人章
  | 'signature-approval'          // 签批
  | 'signature-opinion'           // 签署意见
  // 签署人信息组件 (这些通常是文本字段，但类型可以更具体以驱动属性和逻辑)
  | 'info-company-name'           // 企业全称
  | 'info-social-code'            // 统一社会信用代码
  | 'info-legal-name'             // 法人/经营者姓名
  | 'info-signer-name'            // 签署人姓名
  | 'info-signer-phone'           // 签署人手机号
  | 'info-signer-id-type'         // 签署人证件类型 (可能是选择器)
  | 'info-signer-id-number'       // 签署人证件号
  | 'info-legal-rep-name'         // 法定代表人姓名
  | 'info-id-card'                // 身份证号
  | 'info-phone'                 // 手机号
  | 'info-email'                 // 邮箱
  | 'info-address'                // 联系地址
  // 填写区组件
  | 'fill-text-single'            // 单行文本
  | 'fill-text-multi'             // 多行文本
  | 'fill-checkbox'               // 勾选框
  | 'fill-selector'               // 选择器 (通用，具体类型在options中定义)
  | 'fill-number'                 // 数字
  | 'fill-date'                   // 日期
  | 'fill-image'                  // 图片上传占位
  | 'fill-attachment'             // 附件上传占位
  | 'fill-education'              // 学历 (可能是选择器)
  | 'fill-gender'                 // 性别 (可能是选择器)
  | 'fill-address'                // 省市区 (可能是复杂组件)
  | 'fill-data-table'             // 数据表格 (特殊)
  // 水印组件
  | 'watermark'                   // 水印 (具体配置在options中)
  | string; // Fallback for any other custom types or future extensions

export interface FieldComponent {
  id: string;
  type: FieldType;
  pageNumber: number;
  rect: { // Position and dimensions in pixels relative to the original page size
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label?: string; // Optional label for the field itself
  assignee?: string; // ID or role of the person/entity assigned to this field
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  allowDecimal?: boolean;
  dateFormat?: string; // e.g., 'YYYY-MM-DD'
  defaultChecked?: boolean;
  optionsList?: Array<{ label: string; value: string | number }>;
  options?: Record<string, any>; // Generic options for other specific needs or future extensions

  // Properties for signature fields
  applyTo?: 'currentPage' | 'allPages'; // 'currentPage' is default
  opacity?: number; // 0.0 to 1.0, default 1.0
  showSigningDate?: boolean; // default true, dateFormat is already available

  // Properties for company seal fields
  sealType?: 'any' | 'company' | 'contract' | 'finance' | 'hr'; // 'any' is default
  adaptSealSize?: boolean; // default false

  tooltip?: string; // 字段填写提示，鼠标悬浮时显示
  validationRule?: 'email' | 'phone' | 'idcard' | string; // 校验规则（预设或自定义正则表达式）
  validationMessage?: string; // 自定义校验失败信息
}

export interface TemplateParty {
  id: string; // Unique ID for the party (e.g., 'party_uuid_1')
  name: string; // User-defined name (e.g., "甲方", "乙方", "法务部")
}

// If there's a main template interface, ensure it can hold TemplateParty[]
// For example:
// export interface TemplateConfiguration {
//   fieldComponents: FieldComponent[];
//   parties: TemplateParty[];
//   signingOrder?: 'sequential' | 'parallel';
//   orderedPartyIds?: string[];
//   // ... other template metadata
// } 