// Email service exports
export { ResendEmailService, resendEmailService } from './resend-client'
export { EmailService, emailService } from './email-service'
export { DomainManager, domainManager } from './domain-manager'
export type { 
  SendResult, 
  DeliveryStatus, 
  DomainSetupResult, 
  EmailTemplate
} from './resend-client'
export type {
  DomainConfig,
  DomainVerificationResult
} from './domain-manager'