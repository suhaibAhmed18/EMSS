// Main compliance module - exports all compliance functionality
export { ConsentManager, consentManager } from './consent-manager'
export { UnsubscribeHandler, unsubscribeHandler } from './unsubscribe-handler'
export { BulkComplianceOperations, bulkComplianceOperations } from './bulk-operations'

export type {
  ConsentManagerConfig,
  RecordConsentRequest,
  ConsentStatus,
  GDPRDataRequest,
  ConsentAuditEntry
} from './consent-manager'

export type {
  UnsubscribeRequest,
  UnsubscribeResult,
  UnsubscribeLinkConfig,
  SMSOptOutRequest
} from './unsubscribe-handler'

export type {
  BulkConsentRequest,
  BulkConsentResult,
  BulkUnsubscribeRequest
} from './bulk-operations'

// Re-export database types for convenience
export type {
  ConsentRecord,
  CreateConsentRecord,
  ConsentType,
  ConsentSource
} from '../database/types'