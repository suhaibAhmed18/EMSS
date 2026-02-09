// Main database module exports
export * from './types'
export * from './client'
export * from './repositories'

// Re-export commonly used types and functions
export type {
  Store,
  Contact,
  EmailCampaign,
  SMSCampaign,
  CampaignTemplate,
  AutomationWorkflow,
  ConsentRecord,
  CampaignSend,
  CreateStore,
  CreateContact,
  CreateEmailCampaign,
  CreateSMSCampaign,
  CreateCampaignTemplate,
  CreateAutomationWorkflow,
  CreateConsentRecord,
  CreateCampaignSend,
  UpdateStore,
  UpdateContact,
  UpdateEmailCampaign,
  UpdateSMSCampaign,
  UpdateCampaignTemplate,
  UpdateAutomationWorkflow,
  UpdateCampaignSend,
  CampaignStatus,
  ConsentType,
  ConsentSource,
  CampaignSendStatus,
  UserRole,
} from './types'

export {
  createTypedSupabaseClient,
  createServiceSupabaseClient,
  TypedDatabaseClient,
  ContactManager,
  DataEncryption,
  ValidationError,
  validateAndTransform,
} from './client'

export {
  StoreRepository,
  ContactRepository,
  EmailCampaignRepository,
  SMSCampaignRepository,
  CampaignTemplateRepository,
  AutomationWorkflowRepository,
  ConsentRepository,
  CampaignSendRepository,
} from './repositories'