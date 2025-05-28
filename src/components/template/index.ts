// 导出所有模板相关组件和类型
export { default as UploadDocumentStep } from './UploadDocumentStep';
export { default as EditSignatureFieldsStep } from './EditSignatureFieldsStep';
export { default as SetSigningProcessStep } from './SetSigningProcessStepSimple';
export { default as ExportTemplateStep } from './ExportTemplateStep';

// 导出组件的Ref类型
export type { UploadDocumentStepRef } from './UploadDocumentStep';
export type { EditSignatureFieldsStepRef } from './EditSignatureFieldsStep';
export type { SetSigningProcessStepRef } from './SetSigningProcessStepSimple';
export type { ExportTemplateStepRef } from './ExportTemplateStep';

// 导出公共类型
export type { FieldComponent } from './EditSignatureFieldsStep';
export type { SignerRole } from './SetSigningProcessStepSimple';
export type { TemplateData } from './ExportTemplateStep'; 