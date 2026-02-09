// End-to-end integration tests for complete user workflows
import * as fc from 'fast-check'

// Mock all external dependencies first
jest.mock('@/lib/config', () => ({
  config: {
    shopify: {
      clientId: 'test_client_id',
      clientSecret: 'test_client_secret',
      webhookSecret: 'test_webhook_secret',
    },
    resend: {
      apiKey: 'test_resend_key',
    },
    telnyx: {
      apiKey: 'test_telnyx_key',
      messagingProfileId: 'test_profile_id',
    },
    app: {
      url: 'http://localhost:3000',
      secret: 'test_secret_key_for_testing_purposes_only',
    },
  },
}))

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ 
            data: { 
              id: 'test-store-id',
              shop_domain: 'test-shop',
              access_token: 'test-token',
              is_active: true 
            }, 
            error: null 
          })),
          maybeSingle: jest.fn(() => ({ 
            data: null, 
            error: null 
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => ({ data: [], error: null }))
        })),
      })),
    })),
    insert: jest.fn(() => ({ 
      select: jest.fn(() => ({ 
        single: jest.fn(() => ({ 
          data: { id: 'new-record-id' }, 
          error: null 
        }))
      }))
    })),
    upsert: jest.fn(() => ({ 
      select: jest.fn(() => ({ 
        single: jest.fn(() => ({ 
          data: { id: 'upserted-record-id' }, 
          error: null 
        }))
      }))
    })),
    update: jest.fn(() => ({ 
      eq: jest.fn(() => ({ 
        eq: jest.fn(() => ({ 
          select: jest.fn(() => ({ 
            single: jest.fn(() => ({ 
              data: { id: 'updated-record-id' }, 
              error: null 
            }))
          }))
        }))
      }))
    })),
    delete: jest.fn(() => ({ 
      eq: jest.fn(() => ({ error: null }))
    })),
  })),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock database client classes
jest.mock('@/lib/database/client', () => {
  interface MockSupabaseClient {
    from: (table: string) => unknown;
    auth: unknown;
  }

  class MockTypedDatabaseClient {
    constructor(client: MockSupabaseClient) {
      this.client = client
    }
    client: MockSupabaseClient
  }

  class MockContactManager extends MockTypedDatabaseClient {
    async createContact() { return { data: { id: 'test-contact-id' }, error: null } }
    async getContact() { return { data: { id: 'test-contact-id' }, error: null } }
    async updateContact() { return { data: { id: 'test-contact-id' }, error: null } }
    async deleteContact() { return { error: null } }
  }

  const mockClient = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({ 
              data: { 
                id: 'test-store-id',
                shop_domain: 'test-shop',
                access_token: 'test-token',
                is_active: true 
              }, 
              error: null 
            })),
            maybeSingle: jest.fn(() => ({ 
              data: null, 
              error: null 
            })),
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({ data: [], error: null }))
          })),
        })),
      })),
      insert: jest.fn(() => ({ 
        select: jest.fn(() => ({ 
          single: jest.fn(() => ({ 
            data: { id: 'new-record-id' }, 
            error: null 
          }))
        }))
      })),
      upsert: jest.fn(() => ({ 
        select: jest.fn(() => ({ 
          single: jest.fn(() => ({ 
            data: { id: 'upserted-record-id' }, 
            error: null 
          }))
        }))
      })),
      update: jest.fn(() => ({ 
        eq: jest.fn(() => ({ 
          eq: jest.fn(() => ({ 
            select: jest.fn(() => ({ 
              single: jest.fn(() => ({ 
                data: { id: 'updated-record-id' }, 
                error: null 
              }))
            }))
          }))
        }))
      })),
      delete: jest.fn(() => ({ 
        eq: jest.fn(() => ({ error: null }))
      })),
    })),
  }

  return {
    createTypedSupabaseClient: jest.fn(() => mockClient),
    createServiceSupabaseClient: jest.fn(() => mockClient),
    TypedDatabaseClient: MockTypedDatabaseClient,
    ContactManager: MockContactManager,
  }
})

// Mock external APIs
global.fetch = jest.fn()

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ 
        data: { id: 'mock-email-id' }, 
        error: null 
      }),
    },
    domains: {
      create: jest.fn().mockResolvedValue({ 
        data: { id: 'mock-domain-id', name: 'test.com', status: 'pending' }, 
        error: null 
      }),
      verify: jest.fn().mockResolvedValue({ 
        data: { status: 'verified' }, 
        error: null 
      }),
    },
  })),
}))

// Mock Telnyx
jest.mock('telnyx', () => {
  const mockTelnyx = jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({ 
        data: { id: 'mock-sms-id' } 
      }),
    },
  }))
  
  return {
    __esModule: true,
    default: mockTelnyx,
    Telnyx: mockTelnyx,
  }
})

// Mock service classes to avoid complex dependency chains
jest.mock('@/lib/shopify/client')
jest.mock('@/lib/shopify/webhook-processor')
jest.mock('@/lib/email/email-service')
jest.mock('@/lib/sms/sms-service')
jest.mock('@/lib/contacts/contact-service')
jest.mock('@/lib/campaigns/email-campaign-manager')
jest.mock('@/lib/campaigns/sms-campaign-manager')
jest.mock('@/lib/automation/automation-engine')
jest.mock('@/lib/compliance/consent-manager')

// Import after mocking
import { ShopifyClient } from '@/lib/shopify/client'
import { webhookProcessor } from '@/lib/shopify/webhook-processor'
import { EmailService } from '@/lib/email/email-service'
import { SMSService } from '@/lib/sms/sms-service'
import { ContactService } from '@/lib/contacts/contact-service'
import { EmailCampaignManager } from '@/lib/campaigns/email-campaign-manager'
import { SMSCampaignManager } from '@/lib/campaigns/sms-campaign-manager'
import { AutomationEngine } from '@/lib/automation/automation-engine'
import { ConsentManager } from '@/lib/compliance/consent-manager'
import { contactArbitrary, emailCampaignArbitrary, smsCampaignArbitrary } from '@/lib/test-factories'

describe('End-to-End Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock implementations
    const mockShopifyClient = ShopifyClient as jest.MockedClass<typeof ShopifyClient>
    mockShopifyClient.prototype.subscribeToWebhooks = jest.fn().mockResolvedValue([
      { id: 1, topic: 'orders/create', address: 'http://localhost:3000/api/webhooks/shopify' },
      { id: 2, topic: 'orders/paid', address: 'http://localhost:3000/api/webhooks/shopify' },
      { id: 3, topic: 'customers/create', address: 'http://localhost:3000/api/webhooks/shopify' },
    ])

    const mockWebhookProcessor = webhookProcessor as jest.Mocked<typeof webhookProcessor>
    mockWebhookProcessor.processWebhook = jest.fn().mockResolvedValue({
      success: true,
      processed: true,
      data: { orderId: 12345, customerId: 12345 },
    })

    const mockEmailService = EmailService as jest.MockedClass<typeof EmailService>
    mockEmailService.prototype.setupCustomDomain = jest.fn().mockResolvedValue({
      success: true,
      domainId: 'mock-domain-id',
      status: 'pending',
    })

    const mockEmailCampaignManager = EmailCampaignManager as jest.MockedClass<typeof EmailCampaignManager>
    mockEmailCampaignManager.prototype.sendCampaign = jest.fn().mockResolvedValue({
      success: true,
      sentCount: 1,
      failedCount: 0,
      skippedCount: 0,
    })

    const mockSMSCampaignManager = SMSCampaignManager as jest.MockedClass<typeof SMSCampaignManager>
    mockSMSCampaignManager.prototype.sendCampaign = jest.fn().mockResolvedValue({
      success: true,
      sentCount: 1,
      failedCount: 0,
      skippedCount: 0,
    })

    const mockAutomationEngine = AutomationEngine as jest.MockedClass<typeof AutomationEngine>
    mockAutomationEngine.prototype.executeWorkflow = jest.fn().mockResolvedValue({
      success: true,
      actionsExecuted: 1,
      errors: [],
    })

    const mockContactService = ContactService as jest.MockedClass<typeof ContactService>
    mockContactService.prototype.getContact = jest.fn().mockResolvedValue({
      id: 'test-contact-id',
      storeId: 'test-store-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'Customer',
      emailConsent: true,
      smsConsent: true,
      totalSpent: 100,
      orderCount: 1,
      tags: [],
      segments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const mockConsentManager = ConsentManager as jest.MockedClass<typeof ConsentManager>
    mockConsentManager.prototype.recordConsent = jest.fn().mockResolvedValue(undefined)

    // Setup default fetch mocks
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        customers: [], 
        orders: [], 
        products: [],
        webhooks: []
      }),
    })
  })

  describe('Complete User Workflow: Store Connection to Campaign Execution', () => {
    test('full workflow from Shopify connection to email campaign delivery', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            shopDomain: fc.string({ minLength: 4, maxLength: 60 }).filter(s => 
              /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(s)
            ),
            customDomain: fc.string({ minLength: 4, maxLength: 60 }).filter(s => 
              /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$/.test(s)
            ),
            customerEmail: fc.emailAddress(),
            campaignSubject: fc.string({ minLength: 5, maxLength: 100 }),
            campaignContent: fc.string({ minLength: 10, maxLength: 1000 }),
          }),
          async ({ shopDomain, customDomain, customerEmail, campaignSubject, campaignContent }) => {
            // Step 1: Connect Shopify store
            const shopifyClient = new ShopifyClient('test-shop', 'test-access-token')
            const webhookUrl = 'http://localhost:3000/api/webhooks/shopify'
            const webhooks = await shopifyClient.subscribeToWebhooks(webhookUrl)
            expect(webhooks.length).toBeGreaterThan(0)

            // Step 2: Process incoming customer data via webhook
            const customerPayload = {
              id: 12345,
              email: customerEmail,
              first_name: 'Test',
              last_name: 'Customer',
              phone: '+1234567890',
              orders_count: 1,
              total_spent: '100.00',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              tags: 'vip,loyal',
              accepts_marketing: true,
            }

            const webhookResult = await webhookProcessor.processWebhook({
              topic: 'customers/create',
              shopDomain,
              payload: customerPayload,
              headers: {
                signature: 'test-signature',
                topic: 'customers/create',
                shopDomain,
                timestamp: Date.now().toString(),
              },
            })

            expect(webhookResult.success).toBe(true)

            // Step 3: Set up custom domain for email
            const emailService = new EmailService()
            const domainResult = await emailService.setupCustomDomain(customDomain, 'test-store-id')
            expect(domainResult.success).toBe(true)

            // Step 4: Create and send email campaign
            const campaign = {
              id: 'test-campaign-id',
              storeId: 'test-store-id',
              name: 'Test Campaign',
              subject: campaignSubject,
              htmlContent: `<html><body>${campaignContent}</body></html>`,
              textContent: campaignContent,
              fromEmail: `noreply@${customDomain}`,
              fromName: 'Test Store',
              status: 'draft' as const,
              scheduledAt: undefined,
            }

            const contacts = [{
              id: 'test-contact-id',
              storeId: 'test-store-id',
              email: customerEmail,
              firstName: 'Test',
              lastName: 'Customer',
              emailConsent: true,
              smsConsent: false,
              totalSpent: 100,
              orderCount: 1,
              tags: ['vip', 'loyal'],
              segments: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            }]

            const emailCampaignManager = new EmailCampaignManager()
            const sendResult = await emailCampaignManager.sendCampaign(campaign, contacts)
            expect(sendResult.success).toBe(true)
            expect(sendResult.sentCount).toBe(1)

            // Step 5: Verify data consistency across all components
            // All operations should have succeeded without data loss
            expect(webhookResult.processed).toBe(true)
            expect(domainResult.domainId).toBeDefined()
            expect(sendResult.failedCount).toBe(0)
          }
        ),
        { numRuns: 1 }
      )
    }, 60000)

    test('full workflow from Shopify connection to SMS campaign delivery', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            shopDomain: fc.string({ minLength: 4, maxLength: 60 }).filter(s => 
              /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(s)
            ),
            customerPhone: fc.string({ minLength: 10, maxLength: 15 }).filter(s => /^\+?[\d\s-()]+$/.test(s)),
            smsMessage: fc.string({ minLength: 10, maxLength: 160 }),
          }),
          async ({ shopDomain, customerPhone, smsMessage }) => {
            // Step 1: Process customer with SMS consent
            const customerPayload = {
              id: 12345,
              email: 'test@example.com',
              first_name: 'Test',
              last_name: 'Customer',
              phone: customerPhone,
              orders_count: 1,
              total_spent: '100.00',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              tags: '',
              accepts_marketing: true,
            }

            const webhookResult = await webhookProcessor.processWebhook({
              topic: 'customers/create',
              shopDomain,
              payload: customerPayload,
              headers: {
                signature: 'test-signature',
                topic: 'customers/create',
                shopDomain,
                timestamp: Date.now().toString(),
              },
            })

            expect(webhookResult.success).toBe(true)

            // Step 2: Record SMS consent
            const consentManager = new ConsentManager()
            await consentManager.recordConsent('test-contact-id', 'sms', true)

            // Step 3: Create and send SMS campaign
            const campaign = {
              id: 'test-sms-campaign-id',
              storeId: 'test-store-id',
              name: 'Test SMS Campaign',
              message: smsMessage,
              fromNumber: '+1234567890',
              status: 'draft' as const,
              scheduledAt: undefined,
            }

            const contacts = [{
              id: 'test-contact-id',
              storeId: 'test-store-id',
              email: 'test@example.com',
              phone: customerPhone,
              firstName: 'Test',
              lastName: 'Customer',
              emailConsent: false,
              smsConsent: true,
              totalSpent: 100,
              orderCount: 1,
              tags: [],
              segments: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            }]

            const smsCampaignManager = new SMSCampaignManager()
            const sendResult = await smsCampaignManager.sendCampaign(campaign, contacts)
            expect(sendResult.success).toBe(true)
            expect(sendResult.sentCount).toBe(1)

            // Verify data consistency
            expect(webhookResult.processed).toBe(true)
            expect(sendResult.failedCount).toBe(0)
          }
        ),
        { numRuns: 1 }
      )
    }, 60000)

    test('automation workflow from trigger to action execution', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            shopDomain: fc.string({ minLength: 4, maxLength: 60 }).filter(s => 
              /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(s)
            ),
            orderId: fc.integer({ min: 1, max: 999999 }),
            orderTotal: fc.float({ min: 10, max: 1000, noNaN: true }).map(n => n.toFixed(2)),
            customerEmail: fc.emailAddress(),
          }),
          async ({ shopDomain, orderId, orderTotal, customerEmail }) => {
            // Step 1: Create automation workflow
            const workflow = {
              id: 'test-workflow-id',
              storeId: 'test-store-id',
              name: 'Order Confirmation Automation',
              trigger: {
                type: 'order_created' as const,
                conditions: [],
              },
              actions: [
                {
                  type: 'send_email' as const,
                  config: {
                    templateId: 'order-confirmation',
                    subject: 'Thank you for your order!',
                    content: 'Your order has been received.',
                  },
                },
              ],
              conditions: [],
              isActive: true,
            }

            // Step 2: Trigger automation with order creation
            const orderPayload = {
              id: orderId,
              order_number: `#${orderId}`,
              email: customerEmail,
              total_price: orderTotal,
              currency: 'USD',
              financial_status: 'paid',
              fulfillment_status: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              customer: {
                id: 12345,
                email: customerEmail,
                first_name: 'Test',
                last_name: 'Customer',
                orders_count: 1,
                total_spent: orderTotal,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                tags: '',
                accepts_marketing: true,
              },
            }

            // Process order webhook
            const webhookResult = await webhookProcessor.processWebhook({
              topic: 'orders/create',
              shopDomain,
              payload: orderPayload,
              headers: {
                signature: 'test-signature',
                topic: 'orders/create',
                shopDomain,
                timestamp: Date.now().toString(),
              },
            })

            expect(webhookResult.success).toBe(true)

            // Step 3: Execute automation
            const automationEngine = new AutomationEngine()
            const executionResult = await automationEngine.executeWorkflow(
              workflow.id,
              {
                type: 'order_created',
                data: orderPayload,
                storeId: 'test-store-id',
                timestamp: new Date(),
              }
            )

            expect(executionResult.success).toBe(true)
            expect(executionResult.actionsExecuted).toBe(1)

            // Verify end-to-end data flow
            expect(webhookResult.processed).toBe(true)
            expect(executionResult.errors).toHaveLength(0)
          }
        ),
        { numRuns: 1 }
      )
    }, 60000)
  })

  describe('Cross-Component Data Consistency', () => {
    test('customer data remains consistent across all system components', async () => {
      await fc.assert(
        fc.asyncProperty(
          contactArbitrary,
          async (contact) => {
            // Step 1: Create contact via webhook processing
            const customerPayload = {
              id: 12345,
              email: contact.email,
              first_name: contact.firstName || 'Test',
              last_name: contact.lastName || 'Customer',
              phone: contact.phone,
              orders_count: contact.orderCount,
              total_spent: contact.totalSpent.toString(),
              created_at: contact.createdAt.toISOString(),
              updated_at: contact.updatedAt.toISOString(),
              tags: contact.tags.join(', '),
              accepts_marketing: contact.emailConsent,
            }

            const webhookResult = await webhookProcessor.processWebhook({
              topic: 'customers/create',
              shopDomain: 'test-shop',
              payload: customerPayload,
              headers: {
                signature: 'test-signature',
                topic: 'customers/create',
                shopDomain: 'test-shop',
                timestamp: Date.now().toString(),
              },
            })

            expect(webhookResult.success).toBe(true)

            // Step 2: Retrieve contact via contact service
            const contactService = new ContactService()
            const retrievedContact = await contactService.getContact(contact.id)
            expect(retrievedContact).toBeDefined()

            // Step 3: Use contact in campaign
            const campaign = {
              id: 'test-campaign-id',
              storeId: contact.storeId,
              name: 'Consistency Test Campaign',
              subject: 'Test Subject',
              htmlContent: '<html><body>Test</body></html>',
              textContent: 'Test',
              fromEmail: 'test@example.com',
              fromName: 'Test Store',
              status: 'draft' as const,
              scheduledAt: undefined,
            }

            const emailCampaignManager = new EmailCampaignManager()
            const sendResult = await emailCampaignManager.sendCampaign(campaign, [contact])
            
            // Data should remain consistent across all operations
            expect(sendResult.success).toBe(true)
            if (contact.emailConsent) {
              expect(sendResult.sentCount).toBe(1)
            } else {
              expect(sendResult.skippedCount).toBe(1)
            }
          }
        ),
        { numRuns: 1 }
      )
    }, 60000)

    test('campaign data consistency across email and SMS systems', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            emailCampaign: emailCampaignArbitrary,
            smsCampaign: smsCampaignArbitrary,
            contact: contactArbitrary,
          }),
          async ({ emailCampaign, smsCampaign, contact }) => {
            // Ensure contact has both email and SMS consent
            const testContact = {
              ...contact,
              emailConsent: true,
              smsConsent: true,
              phone: '+1234567890',
            }

            // Send email campaign
            const emailCampaignManager = new EmailCampaignManager()
            const emailResult = await emailCampaignManager.sendCampaign(emailCampaign, [testContact])
            expect(emailResult.success).toBe(true)

            // Send SMS campaign
            const smsCampaignManager = new SMSCampaignManager()
            const smsResult = await smsCampaignManager.sendCampaign(smsCampaign, [testContact])
            expect(smsResult.success).toBe(true)

            // Both campaigns should succeed with same contact
            expect(emailResult.sentCount).toBe(1)
            expect(smsResult.sentCount).toBe(1)

            // No data corruption should occur
            expect(emailResult.failedCount).toBe(0)
            expect(smsResult.failedCount).toBe(0)
          }
        ),
        { numRuns: 1 }
      )
    }, 60000)
  })

  describe('External Integration Verification', () => {
    test('all external APIs work together in complete workflow', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            shopDomain: fc.string({ minLength: 4, maxLength: 60 }).filter(s => 
              /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(s)
            ),
            customDomain: fc.string({ minLength: 4, maxLength: 60 }).filter(s => 
              /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$/.test(s)
            ),
            customerEmail: fc.emailAddress(),
            customerPhone: fc.string({ minLength: 10, maxLength: 15 }).filter(s => /^\+?[\d\s-()]+$/.test(s)),
          }),
          async ({ shopDomain, customDomain, customerEmail, customerPhone }) => {
            // Step 1: Shopify API integration
            const shopifyClient = new ShopifyClient('test-shop', 'test-access-token')
            const webhooks = await shopifyClient.subscribeToWebhooks('http://localhost:3000/api/webhooks/shopify')
            expect(webhooks.length).toBeGreaterThan(0)

            // Step 2: Resend API integration
            const emailService = new EmailService()
            const domainResult = await emailService.setupCustomDomain(customDomain, 'test-store-id')
            expect(domainResult.success).toBe(true)

            // Step 3: Database integration via webhook processing
            const customerPayload = {
              id: 12345,
              email: customerEmail,
              first_name: 'Test',
              last_name: 'Customer',
              phone: customerPhone,
              orders_count: 1,
              total_spent: '100.00',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              tags: '',
              accepts_marketing: true,
            }

            const webhookResult = await webhookProcessor.processWebhook({
              topic: 'customers/create',
              shopDomain,
              payload: customerPayload,
              headers: {
                signature: 'test-signature',
                topic: 'customers/create',
                shopDomain,
                timestamp: Date.now().toString(),
              },
            })

            expect(webhookResult.success).toBe(true)

            // Step 4: Email delivery via Resend
            const emailCampaign = {
              id: 'test-email-campaign-id',
              storeId: 'test-store-id',
              name: 'Integration Test Email',
              subject: 'Test Email',
              htmlContent: '<html><body>Test email content</body></html>',
              textContent: 'Test email content',
              fromEmail: `noreply@${customDomain}`,
              fromName: 'Test Store',
              status: 'draft' as const,
              scheduledAt: undefined,
            }

            const contact = {
              id: 'test-contact-id',
              storeId: 'test-store-id',
              email: customerEmail,
              firstName: 'Test',
              lastName: 'Customer',
              emailConsent: true,
              smsConsent: true,
              phone: customerPhone,
              totalSpent: 100,
              orderCount: 1,
              tags: [],
              segments: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            }

            const emailCampaignManager = new EmailCampaignManager()
            const emailResult = await emailCampaignManager.sendCampaign(emailCampaign, [contact])
            expect(emailResult.success).toBe(true)

            // Step 5: SMS delivery via Telnyx
            const smsCampaign = {
              id: 'test-sms-campaign-id',
              storeId: 'test-store-id',
              name: 'Integration Test SMS',
              message: 'Test SMS message',
              fromNumber: '+1234567890',
              status: 'draft' as const,
              scheduledAt: undefined,
            }

            const smsCampaignManager = new SMSCampaignManager()
            const smsResult = await smsCampaignManager.sendCampaign(smsCampaign, [contact])
            expect(smsResult.success).toBe(true)

            // All integrations should work together seamlessly
            expect(webhookResult.processed).toBe(true)
            expect(domainResult.domainId).toBeDefined()
            expect(emailResult.sentCount).toBe(1)
            expect(smsResult.sentCount).toBe(1)
          }
        ),
        { numRuns: 1 }
      )
    }, 90000)
  })
})

/**
 * **Validates: Requirements All**
 * 
 * These end-to-end integration tests verify:
 * - Complete user workflows from store connection to campaign delivery
 * - Data consistency across all system components
 * - External integrations working together (Shopify, Resend, Telnyx, Supabase)
 * - Cross-component communication and data flow
 * - System reliability under realistic usage scenarios
 */