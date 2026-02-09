// Campaign management exports
export { EmailCampaignManager, emailCampaignManager } from './email-campaign-manager'
export { SMSCampaignManager, smsCampaignManager } from './sms-campaign-manager'
export { CampaignExecutionEngine, campaignExecutionEngine } from './campaign-execution-engine'

export type {
  CampaignPreview,
  CampaignValidationResult,
  TemplateVariable
} from './email-campaign-manager'

export type {
  SMSCampaignPreview,
  SMSCampaignValidationResult,
  SMSTemplateVariable
} from './sms-campaign-manager'

export type {
  CampaignExecutionResult,
  RecipientListOptions,
  CampaignAnalytics
} from './campaign-execution-engine'