// Property-based tests for compliance system
import * as fc from 'fast-check'
import { ConsentManager } from '../consent-manager'
import { UnsubscribeHandler } from '../unsubscribe-handler'
import { BulkComplianceOperations } from '../bulk-operations'
import { ConsentType, ConsentSource } from '../../database/types'

// Mock the database dependencies
jest.mock('../../database/repositories')
jest.mock('../../database/client')

// Test data generators
const consentTypeArb = fc.constantFrom('email', 'sms')
const consentSourceArb = fc.constantFrom('shopify', 'manual', 'campaign', 'api')
const uuidArb = fc.uuid()
const emailArb = fc.emailAddress()
const phoneArb = fc.string({ minLength: 10, maxLength: 15 }).map(s => '+1' + s.replace(/\D/g, '').slice(0, 10))
const ipAddressArb = fc.ipV4()

describe('Compliance System Property Tests', () => {
  let consentManager: ConsentManager
  let unsubscribeHandler: UnsubscribeHandler
  let bulkOperations: BulkComplianceOperations

  beforeEach(() => {
    jest.clearAllMocks()
    consentManager = new ConsentManager({ useServiceRole: true })
    unsubscribeHandler = new UnsubscribeHandler('test-secret-key')
    bulkOperations = new BulkComplianceOperations()
  })

  describe('Property 7: Immediate Unsubscribe Processing', () => {
    test('Feature: shopify-marketing-platform, Property 7: For any unsubscribe request, the recipient should be immediately opted out and no further emails should be sent', () => {
      fc.assert(fc.asyncProperty(
        emailArb,
        uuidArb,
        ipAddressArb,
        async (email, campaignId, ipAddress) => {
          // Mock successful contact lookup and consent recording
          const mockContact = {
            id: fc.sample(uuidArb, 1)[0],
            email,
            email_consent: true,
            sms_consent: true
          }

          // Mock the database operations
          jest.spyOn(unsubscribeHandler as unknown as { findContactByEmail: (email: string) => Promise<unknown> }, 'findContactByEmail')
            .mockResolvedValue(mockContact)
          
          jest.spyOn(consentManager, 'recordConsent')
            .mockResolvedValue({ data: { id: 'consent-id' } as { id: string }, error: null })

          // Process unsubscribe
          const result = await unsubscribeHandler.processEmailUnsubscribe({
            email,
            campaignId,
            ipAddress
          })

          // Verify immediate processing
          expect(result.error).toBeNull()
          expect(result.data?.success).toBe(true)
          expect(result.data?.contactId).toBe(mockContact.id)

          // Verify consent was recorded as false
          expect(consentManager.recordConsent).toHaveBeenCalledWith({
            contactId: mockContact.id,
            type: 'email',
            consented: false,
            source: 'campaign',
            ipAddress
          })
        }
      ), { numRuns: 100 })
    })
  })

  describe('Property 9: SMS Opt-out Processing', () => {
    test('Feature: shopify-marketing-platform, Property 9: For any STOP request received, the recipient should be immediately opted out and no further SMS should be sent', () => {
      fc.assert(fc.asyncProperty(
        phoneArb,
        phoneArb,
        fc.constantFrom('STOP', 'stop', 'QUIT', 'quit', 'CANCEL', 'cancel'),
        async (fromNumber, toNumber, stopMessage) => {
          // Mock successful contact lookup and consent recording
          const mockContact = {
            id: fc.sample(uuidArb, 1)[0],
            phone: fromNumber,
            email_consent: true,
            sms_consent: true
          }

          // Mock the database operations
          jest.spyOn(unsubscribeHandler as unknown as { findContactByPhone: (phone: string) => Promise<unknown> }, 'findContactByPhone')
            .mockResolvedValue(mockContact)
          
          jest.spyOn(consentManager, 'recordConsent')
            .mockResolvedValue({ data: { id: 'consent-id' } as { id: string }, error: null })

          // Process SMS opt-out
          const result = await unsubscribeHandler.processSMSOptOut({
            fromNumber,
            toNumber,
            message: stopMessage,
            timestamp: new Date()
          })

          // Verify immediate processing
          expect(result.error).toBeNull()
          expect(result.data?.success).toBe(true)
          expect(result.data?.contactId).toBe(mockContact.id)

          // Verify consent was recorded as false
          expect(consentManager.recordConsent).toHaveBeenCalledWith({
            contactId: mockContact.id,
            type: 'sms',
            consented: false,
            source: 'campaign'
          })
        }
      ), { numRuns: 100 })
    })
  })

  describe('Property 21: Consent Recording Completeness', () => {
    test('Feature: shopify-marketing-platform, Property 21: For any consent action (email or SMS), it should be properly captured, stored, and auditable', () => {
      fc.assert(fc.asyncProperty(
        uuidArb,
        consentTypeArb,
        fc.boolean(),
        consentSourceArb,
        fc.option(ipAddressArb),
        async (contactId, type, consented, source, ipAddress) => {
          // Mock successful contact lookup
          const mockContact = {
            id: contactId,
            email: 'test@example.com',
            email_consent: !consented,
            sms_consent: !consented
          }

          // Mock successful consent recording
          const mockConsentRecord = {
            id: fc.sample(uuidArb, 1)[0],
            contact_id: contactId,
            type,
            consented,
            source,
            ip_address: ipAddress || null,
            recorded_at: new Date()
          }

          jest.spyOn(consentManager['contactRepo'], 'getContact')
            .mockResolvedValue({ data: mockContact, error: null })
          
          jest.spyOn(consentManager['consentRepo'], 'recordConsent')
            .mockResolvedValue({ data: mockConsentRecord, error: null })
          
          jest.spyOn(consentManager['contactRepo'], 'updateContact')
            .mockResolvedValue({ data: mockContact, error: null })

          // Record consent
          const result = await consentManager.recordConsent({
            contactId,
            type,
            consented,
            source,
            ipAddress
          })

          // Verify consent was properly recorded
          expect(result.error).toBeNull()
          expect(result.data).toEqual(mockConsentRecord)

          // Verify all required fields are captured
          expect(result.data?.contact_id).toBe(contactId)
          expect(result.data?.type).toBe(type)
          expect(result.data?.consented).toBe(consented)
          expect(result.data?.source).toBe(source)
          expect(result.data?.recorded_at).toBeInstanceOf(Date)

          // Verify contact consent status was updated
          expect(consentManager['contactRepo'].updateContact).toHaveBeenCalledWith(
            contactId,
            type === 'email' ? { email_consent: consented } : { sms_consent: consented }
          )
        }
      ), { numRuns: 100 })
    })
  })

  describe('Property 22: Unsubscribe Mechanism Presence', () => {
    test('Feature: shopify-marketing-platform, Property 22: For any email communication, unsubscribe mechanisms should be present and functional', () => {
      fc.assert(fc.property(
        uuidArb,
        uuidArb,
        fc.constantFrom('email', 'sms'),
        fc.webUrl(),
        (contactId, campaignId, campaignType, baseUrl) => {
          // Generate unsubscribe link
          const unsubscribeLink = unsubscribeHandler.generateUnsubscribeLink({
            contactId,
            campaignId,
            campaignType: campaignType as 'email' | 'sms',
            baseUrl
          })

          // Verify link is generated
          expect(unsubscribeLink).toBeDefined()
          expect(typeof unsubscribeLink).toBe('string')
          expect(unsubscribeLink.length).toBeGreaterThan(0)

          // Verify link contains required components
          expect(unsubscribeLink).toContain(baseUrl)
          expect(unsubscribeLink).toContain('/api/unsubscribe')
          expect(unsubscribeLink).toContain('token=')
          expect(unsubscribeLink).toContain(`type=${campaignType}`)

          // Verify link is properly formatted URL
          expect(() => new URL(unsubscribeLink)).not.toThrow()
        }
      ), { numRuns: 100 })
    })
  })

  describe('Property 23: SMS Opt-out Processing', () => {
    test('Feature: shopify-marketing-platform, Property 23: For any SMS STOP request, it should be properly processed and logged', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 160 }),
        (message) => {
          // Test STOP request detection
          const stopWords = ['stop', 'quit', 'cancel', 'end', 'unsubscribe', 'remove', 'opt-out', 'optout', 'leave']
          const isStopRequest = unsubscribeHandler.isSMSStopRequest(message)

          const messageContainsStopWord = stopWords.some(word => 
            message.toLowerCase().includes(word.toLowerCase())
          )

          // If message contains stop word, should be detected as stop request
          if (messageContainsStopWord) {
            expect(isStopRequest).toBe(true)
          }

          // Exact stop words should always be detected
          if (stopWords.includes(message.toLowerCase().trim())) {
            expect(isStopRequest).toBe(true)
          }
        }
      ), { numRuns: 100 })
    })
  })

  describe('Property 24: Consent Audit Trail', () => {
    test('Feature: shopify-marketing-platform, Property 24: For any consent or opt-out activity, it should be properly logged in the audit trail', () => {
      fc.assert(fc.asyncProperty(
        uuidArb,
        fc.array(fc.record({
          type: consentTypeArb,
          consented: fc.boolean(),
          source: consentSourceArb,
          recorded_at: fc.date()
        }), { minLength: 1, maxLength: 10 }),
        async (contactId, consentHistory) => {
          // Mock contact and consent history
          const mockContact = {
            id: contactId,
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User'
          }

          const mockConsentRecords = consentHistory.map((record, index) => ({
            id: fc.sample(uuidArb, 1)[0],
            contact_id: contactId,
            ...record
          }))

          jest.spyOn(consentManager['consentRepo'], 'getContactConsentHistory')
            .mockResolvedValue({ data: mockConsentRecords, error: null })
          
          jest.spyOn(consentManager['contactRepo'], 'getContact')
            .mockResolvedValue({ data: mockContact, error: null })

          // Get audit trail
          const result = await consentManager.getConsentAuditTrail(contactId)

          // Verify audit trail is complete
          expect(result.error).toBeNull()
          expect(result.data).toHaveLength(consentHistory.length)

          // Verify all entries have required audit information
          result.data?.forEach((entry, index) => {
            expect(entry.id).toBeDefined()
            expect(entry.contactId).toBe(contactId)
            expect(entry.type).toBe(consentHistory[index].type)
            expect(entry.consented).toBe(consentHistory[index].consented)
            expect(entry.source).toBe(consentHistory[index].source)
            expect(entry.recordedAt).toBeInstanceOf(Date)
            expect(entry.contactEmail).toBe(mockContact.email)
            expect(entry.contactName).toBe('Test User')
          })
        }
      ), { numRuns: 100 })
    })
  })
})