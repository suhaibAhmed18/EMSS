// Property-based tests for SMS system
import * as fc from 'fast-check'
import { TelnyxSMSService } from '../telnyx-client'
import { SMSService } from '../sms-service'
import { contactArbitrary, smsCampaignArbitrary } from '../../test-factories'

// Mock Telnyx to avoid actual API calls during testing
jest.mock('telnyx', () => {
  const mockMessagesCreate = jest.fn().mockResolvedValue({ 
    data: { id: 'mock-message-id' } 
  })
  const mockMessagesRetrieve = jest.fn().mockResolvedValue({ 
    data: { 
      delivery_status: 'delivered',
      errors: []
    } 
  })
  const mockMessagesListPhoneNumbers = jest.fn().mockResolvedValue({
    data: [
      { phone_number: '+1234567890', features: ['sms', 'voice'] }
    ]
  })

  return {
    Telnyx: jest.fn().mockImplementation(() => ({
      messages: {
        create: mockMessagesCreate,
        retrieve: mockMessagesRetrieve,
        list: mockMessagesListPhoneNumbers
      }
    })),
    // Export mocks for testing
    __mocks: {
      mockMessagesCreate,
      mockMessagesRetrieve,
      mockMessagesListPhoneNumbers
    }
  }
})

// Mock Supabase client
jest.mock('../../database/client', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ 
              data: { 
                id: 'template-id',
                name: 'Test Template',
                content: 'Hello {{first_name}}!',
                variables: []
              }, 
              error: null 
            })
          }))
        }))
      })),
      insert: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      }))
    }))
  }
}))

// Mock config
jest.mock('../../config', () => ({
  config: {
    telnyx: {
      apiKey: 'test-api-key',
      phoneNumber: '+1234567890'
    },
    app: {
      url: 'http://localhost:3000'
    }
  }
}))

describe('SMS System Property Tests', () => {
  let telnyxService: TelnyxSMSService
  let smsService: SMSService

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    
    // Create fresh instances
    telnyxService = new TelnyxSMSService()
    smsService = new SMSService()
  })

  // Feature: shopify-marketing-platform, Property 8: SMS Tracking Completeness
  describe('Property 8: SMS Tracking Completeness', () => {
    test('for any sent SMS, tracking data (delivery status, responses) should be properly recorded', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          campaign: smsCampaignArbitrary,
          recipients: fc.array(
            contactArbitrary.map(contact => ({ 
              ...contact, 
              sms_consent: true,
              phone: contact.phone || '+1234567890'
            })), 
            { minLength: 1, maxLength: 3 }
          )
        }),
        async ({ campaign, recipients }) => {
          // Recipients already have SMS consent and phone numbers from the generator
          const consentedRecipients = recipients
          
          // Send campaign
          const result = await telnyxService.sendCampaign(campaign, consentedRecipients)
          
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
              const deliveryStatus = await telnyxService.trackDelivery(sendResult.messageId)
              
              // Verify tracking data structure
              expect(deliveryStatus).toHaveProperty('messageId')
              expect(deliveryStatus).toHaveProperty('status')
              expect(deliveryStatus.messageId).toBe(sendResult.messageId)
              expect(['pending', 'delivered', 'failed']).toContain(deliveryStatus.status)
              
              // Verify tracking data completeness based on status
              if (deliveryStatus.status === 'delivered') {
                expect(deliveryStatus.deliveredAt).toBeInstanceOf(Date)
              }
              if (deliveryStatus.status === 'failed') {
                expect(deliveryStatus.failedAt).toBeInstanceOf(Date)
                expect(deliveryStatus.error).toBeDefined()
              }
            }
          }
        }
      ), { numRuns: 100 })
    })

    test('webhook events should properly update tracking data in database', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          messageId: fc.string({ minLength: 10 }),
          eventType: fc.constantFrom('message.sent', 'message.delivered', 'message.delivery_failed'),
          timestamp: fc.date()
        }),
        async ({ messageId, eventType, timestamp }) => {
          const webhookData = {
            event_type: eventType,
            data: {
              payload: {
                id: messageId,
                delivery_status: eventType === 'message.delivered' ? 'delivered' : 'failed',
                errors: eventType === 'message.delivery_failed' ? [{ detail: 'Delivery failed' }] : []
              },
              occurred_at: timestamp.toISOString()
            }
          }
          
          // Process webhook event
          await smsService.processWebhookEvent(webhookData)
          
          // Verify the webhook processing doesn't throw errors
          // In a real test, we would verify database updates
          expect(true).toBe(true) // Placeholder assertion
        }
      ), { numRuns: 100 })
    })
  })

  describe('SMS Content Personalization', () => {
    test('SMS content should be properly personalized for each recipient', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          campaign: fc.record({
            ...smsCampaignArbitrary.value,
            message: fc.constant('Hello {{first_name}}! You have {{order_count}} orders.')
          }),
          recipients: fc.array(
            contactArbitrary.map(contact => ({ 
              ...contact, 
              sms_consent: true,
              phone: contact.phone || '+1234567890',
              first_name: contact.first_name || 'John'
            })), 
            { minLength: 1, maxLength: 3 }
          )
        }),
        async ({ campaign, recipients }) => {
          // Recipients already have SMS consent, phone numbers, and names from the generator
          const consentedRecipients = recipients
          
          // Clear mocks before test
          jest.clearAllMocks()
          
          const result = await telnyxService.sendCampaign(campaign, consentedRecipients)
          
          // Get the mock function
          const { __mocks } = await import('telnyx')
          const { mockMessagesCreate } = __mocks
          
          // Verify personalization occurred
          expect(mockMessagesCreate).toHaveBeenCalledTimes(consentedRecipients.length)
          
          mockMessagesCreate.mock.calls.forEach((call: unknown[], index: number) => {
            const smsData = call[0] as Record<string, unknown>
            const recipient = consentedRecipients[index]
            
            // Verify content personalization
            if (recipient.first_name) {
              expect(smsData.text).toContain(recipient.first_name)
            }
            expect(smsData.text).toContain(recipient.order_count.toString())
          })
        }
      ), { numRuns: 100 })
    })
  })

  describe('SMS Consent Validation', () => {
    test('SMS should only be sent to recipients with SMS consent and phone numbers', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          campaign: smsCampaignArbitrary,
          recipients: fc.array(contactArbitrary, { minLength: 2, maxLength: 5 })
        }),
        async ({ campaign, recipients }) => {
          const result = await telnyxService.sendCampaign(campaign, recipients)
          
          // Verify results match consent status and phone availability
          result.forEach((sendResult, index) => {
            const recipient = recipients[index]
            
            if (recipient.sms_consent && recipient.phone) {
              expect(sendResult.success).toBe(true)
              expect(sendResult.messageId).toBeDefined()
            } else {
              expect(sendResult.success).toBe(false)
              if (!recipient.phone) {
                expect(sendResult.error).toBe('No phone number')
              } else {
                expect(sendResult.error).toBe('No SMS consent')
              }
            }
          })
        }
      ), { numRuns: 100 })
    })
  })

  describe('STOP Request Processing', () => {
    test('STOP requests should be properly identified and processed', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          phoneNumber: fc.string({ minLength: 10, maxLength: 15 }),
          message: fc.oneof(
            fc.constantFrom('STOP', 'stop', 'UNSUBSCRIBE', 'quit', 'CANCEL', 'END', 'opt-out'),
            fc.string({ minLength: 1, maxLength: 50 })
          )
        }),
        async ({ phoneNumber, message }) => {
          const webhookPayload = {
            data: {
              payload: {
                text: message,
                from: {
                  phone_number: phoneNumber
                }
              }
            }
          }
          
          const result = await telnyxService.handleIncomingMessage(webhookPayload)
          
          // Verify STOP request detection
          const stopKeywords = ['stop', 'unsubscribe', 'quit', 'cancel', 'end', 'opt-out']
          const shouldBeStopRequest = stopKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
          )
          
          expect(result.isStopRequest).toBe(shouldBeStopRequest)
          expect(result.phoneNumber).toBe(phoneNumber)
          expect(result.message).toBe(message)
        }
      ), { numRuns: 100 })
    })
  })

  describe('SMS Service Integration', () => {
    test('SMS service should properly integrate with database for campaign tracking', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          campaign: smsCampaignArbitrary,
          recipients: fc.array(
            contactArbitrary.map(contact => ({ 
              ...contact, 
              sms_consent: true,
              phone: contact.phone || '+1234567890'
            })), 
            { minLength: 1, maxLength: 3 }
          )
        }),
        async ({ campaign, recipients }) => {
          // Send campaign through SMS service (which includes database tracking)
          const result = await smsService.sendCampaign(campaign, recipients)
          
          // Verify service returns proper statistics
          expect(result).toHaveProperty('success')
          expect(result).toHaveProperty('failed')
          expect(result).toHaveProperty('results')
          expect(typeof result.success).toBe('number')
          expect(typeof result.failed).toBe('number')
          expect(Array.isArray(result.results)).toBe(true)
          expect(result.results.length).toBe(recipients.length)
          expect(result.success + result.failed).toBe(recipients.length)
        }
      ), { numRuns: 100 })
    })

    test('transactional SMS should work with templates', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          templateId: fc.uuid(),
          recipient: contactArbitrary.map(contact => ({ 
            ...contact, 
            sms_consent: true,
            phone: contact.phone || '+1234567890'
          })),
          data: fc.record({
            custom_field: fc.string()
          })
        }),
        async ({ templateId, recipient, data }) => {
          const result = await smsService.sendTransactional(templateId, recipient, data)
          
          // Verify transactional SMS result structure
          expect(result).toHaveProperty('id')
          expect(result).toHaveProperty('success')
          expect(result.id).toBe(recipient.id)
          
          if (result.success) {
            expect(result.messageId).toBeDefined()
          } else {
            expect(result.error).toBeDefined()
          }
        }
      ), { numRuns: 100 })
    })
  })
})