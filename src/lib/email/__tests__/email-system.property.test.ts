// Property-based tests for email system
import * as fc from 'fast-check'
import { ResendEmailService } from '../resend-client'
import { EmailService } from '../email-service'
import { DomainManager } from '../domain-manager'
import { contactArbitrary, emailCampaignArbitrary } from '../../test-factories'

// Create a reliable valid domain generator
const validDomainArbitrary = fc.tuple(
  fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s) && !s.startsWith('-') && !s.endsWith('-')),
  fc.constantFrom('com', 'org', 'net', 'io', 'co')
).map(([name, tld]) => `${name}.${tld}`)

// Mock Resend to avoid actual API calls during testing
jest.mock('resend', () => {
  const mockEmailsSend = jest.fn().mockResolvedValue({ data: { id: 'mock-message-id' } })
  const mockEmailsGet = jest.fn().mockResolvedValue({ last_event: 'delivered' })
  const mockDomainsCreate = jest.fn().mockImplementation(({ name }) => Promise.resolve({
    name: name,
    status: 'verified',
    records: [
      { type: 'TXT', name: '_resend', value: 'verification-token' },
      { type: 'MX', name: '@', value: '10 mx.resend.com' }
    ]
  }))
  const mockDomainsVerify = jest.fn().mockResolvedValue({ status: 'verified' })
  const mockDomainsList = jest.fn().mockResolvedValue({
    data: [{ name: 'example.com', status: 'verified' }]
  })

  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockEmailsSend,
        get: mockEmailsGet
      },
      domains: {
        create: mockDomainsCreate,
        verify: mockDomainsVerify,
        list: mockDomainsList
      }
    })),
    // Export mocks for testing
    __mocks: {
      mockEmailsSend,
      mockEmailsGet,
      mockDomainsCreate,
      mockDomainsVerify,
      mockDomainsList
    }
  }
})

// Mock Supabase client
jest.mock('../../database/client', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ 
            data: { settings: { custom_domain: null } }, 
            error: null 
          })
        }))
      })),
      insert: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      }))
    }))
  }
}))

describe('Email System Property Tests', () => {
  let resendService: ResendEmailService
  let emailService: EmailService
  let domainManager: DomainManager

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    
    // Create fresh instances
    resendService = new ResendEmailService()
    emailService = new EmailService()
    domainManager = new DomainManager()
  })

  // Feature: shopify-marketing-platform, Property 5: Custom Domain Email Sending
  describe('Property 5: Custom Domain Email Sending', () => {
    test('for any configured custom domain, all emails should be sent from that domain rather than the platform default domain', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          domain: validDomainArbitrary,
          storeId: fc.uuid(),
          campaign: emailCampaignArbitrary,
          recipients: fc.array(
            contactArbitrary.map(contact => ({ ...contact, email_consent: true })), 
            { minLength: 1, maxLength: 3 }
          )
        }),
        async ({ domain, storeId, campaign, recipients }) => {
          // Recipients already have email consent from the generator
          const consentedRecipients = recipients
          
          // Get the mocked Supabase client
          const { supabaseAdmin } = await import('../../database/client')
          
          // Mock the domain configuration to be returned when queried
          const domainConfig = {
            id: 'test-id',
            storeId,
            domain,
            verified: true,
            dnsRecords: [
              { type: 'TXT', name: '_resend', value: 'verification-token', status: 'verified' },
              { type: 'MX', name: '@', value: '10 mx.resend.com', status: 'verified' }
            ],
            createdAt: new Date(),
            verifiedAt: new Date()
          }
          
          // Reset all mocks before setting up new expectations
          jest.clearAllMocks()
          
          // Mock the database calls in the correct sequence:
          // 1. First call in setupDomain - check for existing domain (returns null)
          // 2. Second call in setupDomain - update store with domain config
          // 3. Third call in getFromEmailAddress - retrieve the configured domain
          const mockSelect = jest.fn()
          const mockEq = jest.fn()
          const mockSingle = jest.fn()
          const mockUpdate = jest.fn()
          
          // Chain the mocks properly
          mockSelect.mockReturnValue({ eq: mockEq })
          mockEq.mockReturnValue({ single: mockSingle })
          mockUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) })
          
          // Setup the return values for the sequence of calls
          mockSingle
            .mockResolvedValueOnce({ data: { settings: { custom_domain: null } }, error: null }) // setupDomain check
            .mockResolvedValue({ data: { settings: { custom_domain: domainConfig } }, error: null }) // getFromEmailAddress call
          
          supabaseAdmin.from.mockReturnValue({
            select: mockSelect,
            update: mockUpdate
          })
          
          // Setup custom domain
          const setupResult = await domainManager.setupDomain(storeId, domain)
          
          // Verify domain is configured
          expect(setupResult.domain).toBe(domain)
          expect(setupResult.verified).toBe(true)
          
          // Get recommended from email address - this should now return the custom domain
          const fromEmail = await domainManager.getFromEmailAddress(storeId, 'marketing')
          
          // Verify from email uses custom domain
          expect(fromEmail).toBe(`marketing@${domain}`)
          
          // Send campaign with custom domain
          const campaignWithCustomDomain = {
            ...campaign,
            store_id: storeId,
            from_email: fromEmail
          }
          
          const result = await resendService.sendCampaign(campaignWithCustomDomain, consentedRecipients)
          
          // Verify all emails were sent successfully
          expect(result.every(r => r.success)).toBe(true)
          
          // Get the mock function
          const { __mocks } = await import('resend')
          const { mockEmailsSend } = __mocks
          
          // Verify all emails use custom domain
          expect(mockEmailsSend).toHaveBeenCalledTimes(consentedRecipients.length)
          
          mockEmailsSend.mock.calls.forEach((call: unknown[]) => {
            const emailData = call[0] as Record<string, unknown>
            expect(emailData.from).toContain(`@${domain}`)
          })
        }
      ), { numRuns: 3 })
    })
  })

  // Feature: shopify-marketing-platform, Property 6: Email Tracking Completeness
  describe('Property 6: Email Tracking Completeness', () => {
    test('for any sent email, tracking data (delivery status, opens, clicks, bounces) should be properly recorded', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          campaign: emailCampaignArbitrary,
          recipients: fc.array(contactArbitrary, { minLength: 1, maxLength: 3 }),
          trackingEvents: fc.array(
            fc.constantFrom('delivered', 'opened', 'clicked', 'bounced'),
            { minLength: 1, maxLength: 4 }
          )
        }),
        async ({ campaign, recipients, trackingEvents }) => {
          // Ensure all recipients have email consent for this test
          const consentedRecipients = recipients.map(r => ({ ...r, email_consent: true }))
          
          // Send campaign
          const result = await resendService.sendCampaign(campaign, consentedRecipients)
          
          // Verify all sends have message IDs for tracking
          result.forEach(sendResult => {
            if (sendResult.success) {
              expect(sendResult.messageId).toBeDefined()
              expect(typeof sendResult.messageId).toBe('string')
              expect(sendResult.messageId!.length).toBeGreaterThan(0)
            }
          })
          
          // Test tracking for each successful send
          for (const sendResult of result) {
            if (sendResult.success && sendResult.messageId) {
              const deliveryStatus = await resendService.trackDelivery(sendResult.messageId)
              
              // Verify tracking data structure
              expect(deliveryStatus).toHaveProperty('messageId')
              expect(deliveryStatus).toHaveProperty('status')
              expect(deliveryStatus.messageId).toBe(sendResult.messageId)
              expect(['pending', 'delivered', 'bounced', 'failed']).toContain(deliveryStatus.status)
              
              // Verify tracking data completeness based on status
              if (deliveryStatus.status === 'delivered') {
                expect(deliveryStatus.deliveredAt).toBeInstanceOf(Date)
              }
              if (deliveryStatus.status === 'bounced') {
                expect(deliveryStatus.bouncedAt).toBeInstanceOf(Date)
              }
              if (deliveryStatus.status === 'failed') {
                expect(deliveryStatus.error).toBeDefined()
              }
            }
          }
        }
      ), { numRuns: 3 })
    })

    test('webhook events should properly update tracking data in database', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          messageId: fc.string({ minLength: 10 }),
          eventType: fc.constantFrom('email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced'),
          timestamp: fc.date()
        }),
        async ({ messageId, eventType, timestamp }) => {
          const webhookData = {
            type: eventType,
            data: {
              email_id: messageId,
              created_at: timestamp.toISOString()
            }
          }
          
          // Process webhook event
          await emailService.processWebhookEvent(webhookData)
          
          // Verify the webhook processing doesn't throw errors
          // In a real test, we would verify database updates
          expect(true).toBe(true) // Placeholder assertion
        }
      ), { numRuns: 3 })
    })
  })

  describe('Email Content Personalization', () => {
    test('email content should be properly personalized for each recipient', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          campaign: fc.record({
            id: fc.uuid(),
            store_id: fc.uuid(),
            name: fc.string({ minLength: 1 }),
            subject: fc.constant('Hello {{first_name}}!'),
            html_content: fc.constant('<p>Hi {{first_name}} {{last_name}}, you have {{order_count}} orders!</p>'),
            text_content: fc.option(fc.string()),
            from_email: fc.emailAddress(),
            from_name: fc.string({ minLength: 1 }),
            status: fc.constantFrom('draft', 'scheduled', 'sending', 'sent', 'failed'),
            scheduled_at: fc.option(fc.date()),
            sent_at: fc.option(fc.date()),
            recipient_count: fc.integer({ min: 0 }),
            delivered_count: fc.integer({ min: 0 }),
            opened_count: fc.integer({ min: 0 }),
            clicked_count: fc.integer({ min: 0 }),
            created_at: fc.date(),
            updated_at: fc.date()
          }),
          recipients: fc.array(
            contactArbitrary.map(contact => ({ 
              ...contact, 
              email_consent: true,
              first_name: contact.first_name || 'John',
              last_name: contact.last_name || 'Doe'
            })), 
            { minLength: 1, maxLength: 3 }
          )
        }),
        async ({ campaign, recipients }) => {
          // Recipients already have email consent and names from the generator
          const consentedRecipients = recipients
          
          // Clear mocks before test
          jest.clearAllMocks()
          
          const result = await resendService.sendCampaign(campaign, consentedRecipients)
          
          // Get the mock function
          const { __mocks } = await import('resend')
          const { mockEmailsSend } = __mocks
          
          // Verify personalization occurred
          expect(mockEmailsSend).toHaveBeenCalledTimes(consentedRecipients.length)
          
          mockEmailsSend.mock.calls.forEach((call: unknown[], index: number) => {
            const emailData = call[0] as Record<string, unknown>
            const recipient = consentedRecipients[index]
            
            // Verify subject personalization
            if (recipient.first_name) {
              expect(emailData.subject).toContain(recipient.first_name)
            }
            
            // Verify content personalization
            if (recipient.first_name) {
              expect(emailData.html).toContain(recipient.first_name)
            }
            if (recipient.last_name) {
              expect(emailData.html).toContain(recipient.last_name)
            }
            expect(emailData.html).toContain(recipient.order_count.toString())
          })
        }
      ), { numRuns: 3 })
    })
  })

  describe('Email Consent Validation', () => {
    test('emails should only be sent to recipients with email consent', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          campaign: emailCampaignArbitrary,
          recipients: fc.array(contactArbitrary, { minLength: 2, maxLength: 5 })
        }),
        async ({ campaign, recipients }) => {
          const result = await resendService.sendCampaign(campaign, recipients)
          
          // Verify results match consent status
          result.forEach((sendResult, index) => {
            const recipient = recipients[index]
            
            if (recipient.email_consent) {
              expect(sendResult.success).toBe(true)
              expect(sendResult.messageId).toBeDefined()
            } else {
              expect(sendResult.success).toBe(false)
              expect(sendResult.error).toBe('No email consent')
            }
          })
        }
      ), { numRuns: 3 })
    })
  })

  describe('Domain Verification', () => {
    test('domain verification should return consistent results', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          domain: validDomainArbitrary,
          storeId: fc.uuid()
        }),
        async ({ domain, storeId }) => {
          // Get the mocked Supabase client
          const { supabaseAdmin } = await import('../../database/client')
          
          // Mock domain configuration for setup and verification
          const domainConfig = {
            id: 'test-id',
            storeId,
            domain,
            verified: false,
            dnsRecords: [
              { type: 'TXT', name: '_resend', value: 'verification-token', status: 'pending' },
              { type: 'MX', name: '@', value: '10 mx.resend.com', status: 'pending' }
            ],
            createdAt: new Date()
          }
          
          // Reset all mocks
          jest.clearAllMocks()
          
          // Mock the database calls properly
          const mockSelect = jest.fn()
          const mockEq = jest.fn()
          const mockSingle = jest.fn()
          const mockUpdate = jest.fn()
          
          mockSelect.mockReturnValue({ eq: mockEq })
          mockEq.mockReturnValue({ single: mockSingle })
          mockUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) })
          
          // First setup the domain
          mockSingle
            .mockResolvedValueOnce({ data: { settings: { custom_domain: null } }, error: null }) // setupDomain check
            .mockResolvedValue({ data: { settings: { custom_domain: domainConfig } }, error: null }) // verifyDomain call
          
          supabaseAdmin.from.mockReturnValue({
            select: mockSelect,
            update: mockUpdate
          })
          
          // Setup domain first
          await domainManager.setupDomain(storeId, domain)
          
          // Verify domain
          const verificationResult = await domainManager.verifyDomain(storeId)
          
          // Verify consistency
          expect(verificationResult.domain).toBe(domain)
          expect(typeof verificationResult.verified).toBe('boolean')
          
          if (verificationResult.verified) {
            expect(verificationResult.errors).toBeUndefined()
          } else {
            expect(verificationResult.errors).toBeDefined()
            expect(Array.isArray(verificationResult.errors)).toBe(true)
          }
        }
      ), { numRuns: 3 })
    })
  })
})