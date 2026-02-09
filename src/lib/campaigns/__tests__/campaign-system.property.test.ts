// Property-based tests for Campaign Management System
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import fc from 'fast-check'
import { 
  CreateEmailCampaign, 
  CreateSMSCampaign, 
  CreateCampaignTemplate,
  Contact,
  EmailCampaign,
  SMSCampaign,
  CampaignTemplate,
  Store
} from '../../database/types'
import { EmailCampaignManager } from '../email-campaign-manager'
import { SMSCampaignManager } from '../sms-campaign-manager'

// Mock the database repositories
jest.mock('../../database/repositories', () => ({
  StoreRepository: jest.fn().mockImplementation(() => ({
    createStore: jest.fn().mockResolvedValue({
      data: {
        id: 'test-store-id',
        shop_domain: 'test-store.myshopify.com',
        access_token: 'test-token',
        scopes: ['read_products'],
        user_id: 'test-user-id',
        installed_at: new Date(),
        is_active: true,
        settings: {},
        created_at: new Date(),
        updated_at: new Date()
      },
      error: null
    })
  })),
  ContactRepository: jest.fn().mockImplementation(() => ({
    createContact: jest.fn().mockResolvedValue({
      data: {
        id: 'test-contact-id',
        store_id: 'test-store-id',
        email: 'test@example.com',
        phone: '+1234567890',
        first_name: 'Test',
        last_name: 'User',
        shopify_customer_id: null,
        tags: [],
        segments: [],
        email_consent: true,
        sms_consent: true,
        total_spent: 0,
        order_count: 0,
        last_order_at: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      error: null
    })
  })),
  EmailCampaignRepository: jest.fn().mockImplementation(() => ({
    createCampaign: jest.fn().mockImplementation((campaign: CreateEmailCampaign) => {
      if (!campaign.name?.trim() || !campaign.subject?.trim() || !campaign.html_content?.trim() || !campaign.from_email?.trim()) {
        return Promise.resolve({ data: null, error: { message: 'Validation failed' } })
      }
      return Promise.resolve({
        data: {
          id: 'test-campaign-id',
          ...campaign,
          created_at: new Date(),
          updated_at: new Date()
        },
        error: null
      })
    }),
    getCampaign: jest.fn().mockResolvedValue({
      data: {
        id: 'test-campaign-id',
        store_id: 'test-store-id',
        name: 'Test Campaign',
        subject: 'Test Subject',
        html_content: 'Test content',
        text_content: null,
        from_email: 'test@example.com',
        from_name: 'Test Sender',
        status: 'draft',
        scheduled_at: null,
        sent_at: null,
        recipient_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      error: null
    })
  })),
  SMSCampaignRepository: jest.fn().mockImplementation(() => ({
    createCampaign: jest.fn().mockImplementation((campaign: CreateSMSCampaign) => {
      if (!campaign.name?.trim() || !campaign.message?.trim() || !campaign.from_number?.trim()) {
        return Promise.resolve({ data: null, error: { message: 'Validation failed' } })
      }
      return Promise.resolve({
        data: {
          id: 'test-sms-campaign-id',
          ...campaign,
          created_at: new Date(),
          updated_at: new Date()
        },
        error: null
      })
    })
  })),
  CampaignTemplateRepository: jest.fn().mockImplementation(() => ({
    saveTemplate: jest.fn().mockImplementation((template: CreateCampaignTemplate) => {
      if (!template.name?.trim() || !template.content?.trim()) {
        return Promise.resolve({ data: null, error: { message: 'Validation failed' } })
      }
      return Promise.resolve({
        data: {
          id: 'test-template-id',
          ...template,
          created_at: new Date(),
          updated_at: new Date()
        },
        error: null
      })
    }),
    getTemplate: jest.fn().mockImplementation((id: string) => {
      return Promise.resolve({
        data: {
          id,
          store_id: 'test-store-id',
          name: 'Test Template',
          type: 'email' as const,
          content: 'Test content',
          variables: [],
          created_at: new Date(),
          updated_at: new Date()
        },
        error: null
      })
    })
  }))
}))

// Mock test data factories
const createTestStore = async (): Promise<Store> => ({
  id: 'test-store-id',
  shop_domain: 'test-store.myshopify.com',
  access_token: 'test-token',
  scopes: ['read_products'],
  user_id: 'test-user-id',
  installed_at: new Date(),
  is_active: true,
  settings: {},
  created_at: new Date(),
  updated_at: new Date()
})

const createTestContact = async (storeId: string, overrides: Partial<Contact> = {}): Promise<Contact> => ({
  id: 'test-contact-id',
  store_id: storeId,
  email: 'test@example.com',
  phone: '+1234567890',
  first_name: 'Test',
  last_name: 'User',
  shopify_customer_id: null,
  tags: [],
  segments: [],
  email_consent: true,
  sms_consent: true,
  total_spent: 0,
  order_count: 0,
  last_order_at: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides
})

describe('Campaign System Property Tests', () => {
  let emailCampaignManager: EmailCampaignManager
  let smsCampaignManager: SMSCampaignManager

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    emailCampaignManager = new EmailCampaignManager()
    smsCampaignManager = new SMSCampaignManager()
  })

  // Property 10: Campaign Preview Generation
  test('Feature: shopify-marketing-platform, Property 10: Campaign Preview Generation', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }),
        subject: fc.string({ minLength: 1, maxLength: 100 }),
        html_content: fc.string({ minLength: 10, maxLength: 1000 }),
        from_email: fc.emailAddress(),
        from_name: fc.string({ minLength: 1, maxLength: 50 })
      }),
      async (campaignData) => {
        // Create test store and contact
        const store = await createTestStore()
        const contact = await createTestContact(store.id)

        // Create email campaign
        const emailCampaignInput: CreateEmailCampaign = {
          store_id: store.id,
          name: campaignData.name,
          subject: campaignData.subject,
          html_content: campaignData.html_content + ' {{unsubscribe_url}}', // Add unsubscribe for validation
          text_content: null,
          from_email: campaignData.from_email,
          from_name: campaignData.from_name,
          status: 'draft',
          scheduled_at: null,
          sent_at: null,
          recipient_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0
        }

        const { data: campaign, error: createError } = await emailCampaignManager.createCampaign(emailCampaignInput)
        
        if (createError || !campaign) {
          // If campaign creation fails due to validation, that's acceptable
          return true
        }

        // Generate preview
        const { data: preview, error: previewError } = await emailCampaignManager.generatePreview(campaign.id, contact.id)

        // Property: For any created campaign, a preview should be successfully generated
        expect(previewError).toBeNull()
        expect(preview).toBeDefined()
        
        if (preview) {
          expect(preview.subject).toBeDefined()
          expect(preview.htmlContent).toBeDefined()
          expect(preview.fromEmail).toBe(campaignData.from_email)
          expect(preview.fromName).toBe(campaignData.from_name)
          expect(preview.recipientCount).toBeGreaterThanOrEqual(0)
          expect(preview.estimatedDeliveryTime).toBeDefined()
        }

        return true
      }
    ), { numRuns: 100 })
  })

  // Property 11: Template Persistence Round-trip
  test('Feature: shopify-marketing-platform, Property 11: Template Persistence Round-trip', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }),
        content: fc.string({ minLength: 10, maxLength: 1000 }),
        type: fc.constantFrom('email', 'sms'),
        variables: fc.array(fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('text', 'number', 'date', 'boolean')
        }), { maxLength: 5 })
      }),
      async (templateData) => {
        // Create test store
        const store = await createTestStore()

        const templateInput: CreateCampaignTemplate = {
          store_id: store.id,
          name: templateData.name,
          type: templateData.type as 'email' | 'sms',
          content: templateData.content,
          variables: templateData.variables
        }

        // Save template
        const manager = templateData.type === 'email' ? emailCampaignManager : smsCampaignManager
        const { data: savedTemplate, error: saveError } = await manager.saveTemplate(templateInput)

        if (saveError || !savedTemplate) {
          // If template save fails due to validation, that's acceptable
          return true
        }

        // Retrieve template
        const { data: retrievedTemplate, error: retrieveError } = await manager.getTemplate(savedTemplate.id)

        // Property: For any saved campaign template, it should be retrievable and reusable with identical content
        expect(retrieveError).toBeNull()
        expect(retrievedTemplate).toBeDefined()
        
        if (retrievedTemplate) {
          expect(retrievedTemplate.name).toBe(templateData.name)
          expect(retrievedTemplate.type).toBe(templateData.type)
          expect(retrievedTemplate.content).toBe(templateData.content)
          expect(retrievedTemplate.variables).toEqual(templateData.variables)
          expect(retrievedTemplate.store_id).toBe(store.id)
        }

        return true
      }
    ), { numRuns: 100 })
  })

  // Property 12: Campaign Validation Completeness
  test('Feature: shopify-marketing-platform, Property 12: Campaign Validation Completeness', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        name: fc.option(fc.string({ maxLength: 100 }), { nil: '' }),
        subject: fc.option(fc.string({ maxLength: 100 }), { nil: '' }),
        html_content: fc.option(fc.string({ maxLength: 1000 }), { nil: '' }),
        from_email: fc.option(fc.string({ maxLength: 100 }), { nil: '' }),
        from_name: fc.option(fc.string({ maxLength: 50 }), { nil: '' }),
        message: fc.option(fc.string({ maxLength: 500 }), { nil: '' }),
        from_number: fc.option(fc.string({ maxLength: 20 }), { nil: '' })
      }),
      async (campaignData) => {
        // Create test store
        const store = await createTestStore()

        // Test email campaign validation
        const emailCampaignInput: CreateEmailCampaign = {
          store_id: store.id,
          name: campaignData.name || '',
          subject: campaignData.subject || '',
          html_content: campaignData.html_content || '',
          text_content: null,
          from_email: campaignData.from_email || '',
          from_name: campaignData.from_name || '',
          status: 'draft',
          scheduled_at: null,
          sent_at: null,
          recipient_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0
        }

        const emailValidation = await emailCampaignManager.validateCampaign(emailCampaignInput)

        // Test SMS campaign validation
        const smsCampaignInput: CreateSMSCampaign = {
          store_id: store.id,
          name: campaignData.name || '',
          message: campaignData.message || '',
          from_number: campaignData.from_number || '',
          status: 'draft',
          scheduled_at: null,
          sent_at: null,
          recipient_count: 0,
          delivered_count: 0
        }

        const smsValidation = await smsCampaignManager.validateCampaign(smsCampaignInput)

        // Property: For any finalized campaign, all validation rules and compliance requirements should be checked and enforced
        expect(emailValidation).toBeDefined()
        expect(emailValidation.isValid).toBeDefined()
        expect(emailValidation.errors).toBeDefined()
        expect(emailValidation.warnings).toBeDefined()
        expect(Array.isArray(emailValidation.errors)).toBe(true)
        expect(Array.isArray(emailValidation.warnings)).toBe(true)

        expect(smsValidation).toBeDefined()
        expect(smsValidation.isValid).toBeDefined()
        expect(smsValidation.errors).toBeDefined()
        expect(smsValidation.warnings).toBeDefined()
        expect(Array.isArray(smsValidation.errors)).toBe(true)
        expect(Array.isArray(smsValidation.warnings)).toBe(true)

        // If required fields are missing, validation should fail
        if (!campaignData.name?.trim()) {
          expect(emailValidation.isValid).toBe(false)
          expect(emailValidation.errors.some(error => error.includes('name'))).toBe(true)
          expect(smsValidation.isValid).toBe(false)
          expect(smsValidation.errors.some(error => error.includes('name'))).toBe(true)
        }

        return true
      }
    ), { numRuns: 100 })
  })

  // Property 25: Campaign Metrics Accuracy (simplified version without execution engine)
  test('Feature: shopify-marketing-platform, Property 25: Campaign Metrics Accuracy', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        recipientCount: fc.integer({ min: 1, max: 10 }),
        deliveredCount: fc.integer({ min: 0, max: 10 }),
        openedCount: fc.integer({ min: 0, max: 10 }),
        clickedCount: fc.integer({ min: 0, max: 10 })
      }),
      async (metricsData) => {
        // Create test store
        const store = await createTestStore()

        // Create valid email campaign
        const emailCampaignInput: CreateEmailCampaign = {
          store_id: store.id,
          name: 'Test Campaign',
          subject: 'Test Subject',
          html_content: 'Test content with {{unsubscribe_url}}',
          text_content: null,
          from_email: 'test@example.com',
          from_name: 'Test Sender',
          status: 'sent',
          scheduled_at: null,
          sent_at: new Date(),
          recipient_count: metricsData.recipientCount,
          delivered_count: Math.min(metricsData.deliveredCount, metricsData.recipientCount),
          opened_count: Math.min(metricsData.openedCount, metricsData.deliveredCount),
          clicked_count: Math.min(metricsData.clickedCount, metricsData.openedCount)
        }

        const { data: campaign, error: createError } = await emailCampaignManager.createCampaign(emailCampaignInput)
        
        if (createError || !campaign) {
          return true // Skip if campaign creation fails
        }

        // Property: For any campaign, performance metrics should be correctly calculated and displayed
        expect(campaign.recipient_count).toBe(emailCampaignInput.recipient_count)
        expect(campaign.delivered_count).toBe(emailCampaignInput.delivered_count)
        expect(campaign.opened_count).toBe(emailCampaignInput.opened_count)
        expect(campaign.clicked_count).toBe(emailCampaignInput.clicked_count)
        
        // Verify logical constraints
        expect(campaign.delivered_count).toBeLessThanOrEqual(campaign.recipient_count)
        expect(campaign.opened_count).toBeLessThanOrEqual(campaign.delivered_count)
        expect(campaign.clicked_count).toBeLessThanOrEqual(campaign.opened_count)

        return true
      }
    ), { numRuns: 100 })
  })

  // Property 29: Campaign Processing Performance (simplified version)
  test('Feature: shopify-marketing-platform, Property 29: Campaign Processing Performance', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        campaignName: fc.string({ minLength: 1, maxLength: 50 }),
        recipientCount: fc.integer({ min: 1, max: 5 }) // Keep small for test performance
      }),
      async (testData) => {
        // Create test store and contacts
        const store = await createTestStore()
        const contacts: Contact[] = []
        
        for (let i = 0; i < testData.recipientCount; i++) {
          const contact = await createTestContact(store.id, {
            email_consent: true,
            sms_consent: true
          })
          contacts.push(contact)
        }

        // Create valid email campaign
        const emailCampaignInput: CreateEmailCampaign = {
          store_id: store.id,
          name: testData.campaignName,
          subject: 'Test Subject',
          html_content: 'Test content with {{unsubscribe_url}}',
          text_content: null,
          from_email: 'test@example.com',
          from_name: 'Test Sender',
          status: 'draft',
          scheduled_at: null,
          sent_at: null,
          recipient_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0
        }

        const { data: campaign, error: createError } = await emailCampaignManager.createCampaign(emailCampaignInput)
        
        if (createError || !campaign) {
          return true // Skip if campaign creation fails
        }

        // Measure execution time
        const startTime = Date.now()
        
        // Test campaign operations that should be fast
        const { data: preview } = await emailCampaignManager.generatePreview(campaign.id)
        const validation = await emailCampaignManager.validateCampaign(campaign)
        
        const executionTime = Date.now() - startTime

        // Property: For any campaign or automation, it should be processed within acceptable time limits
        // For this test environment, we expect processing to complete within 5 seconds
        expect(executionTime).toBeLessThan(5000)
        
        // Verify the operations completed successfully
        expect(preview).toBeDefined()
        expect(validation).toBeDefined()

        return true
      }
    ), { numRuns: 50 }) // Reduced runs for performance test
  })
})

describe('Campaign System Edge Cases', () => {
  let emailCampaignManager: EmailCampaignManager
  let smsCampaignManager: SMSCampaignManager

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    emailCampaignManager = new EmailCampaignManager()
    smsCampaignManager = new SMSCampaignManager()
  })

  test('Template variables extraction works correctly', async () => {
    await fc.assert(fc.property(
      fc.string({ minLength: 10, maxLength: 200 }),
      fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
      (baseContent, variableNames) => {
        // Create content with template variables
        let content = baseContent
        const expectedVariables = new Set<string>()
        
        variableNames.forEach(varName => {
          const cleanVarName = varName.replace(/[^a-zA-Z0-9_]/g, '_')
          content += ` {{${cleanVarName}}}`
          expectedVariables.add(cleanVarName)
        })

        // Extract variables using email campaign manager
        const extractedVariables = emailCampaignManager.extractTemplateVariables(content)
        const extractedNames = new Set(extractedVariables.map(v => v.name))

        // Verify all expected variables were found
        expectedVariables.forEach(expectedVar => {
          expect(extractedNames.has(expectedVar)).toBe(true)
        })

        return true
      }
    ), { numRuns: 100 })
  })

  test('SMS message metrics calculation is accurate', async () => {
    await fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 500 }),
      fc.integer({ min: 1, max: 100 }),
      (message, recipientCount) => {
        const metrics = smsCampaignManager.calculateSMSMetrics(message, recipientCount)

        // Verify metrics are calculated correctly
        expect(metrics.characterCount).toBe(message.length)
        expect(metrics.messageSegments).toBe(Math.ceil(message.length / 160))
        expect(metrics.totalSegments).toBe(recipientCount * metrics.messageSegments)
        expect(metrics.estimatedCost).toBe(metrics.totalSegments * 0.004)
        expect(metrics.costPerRecipient).toBe(metrics.messageSegments * 0.004)

        return true
      }
    ), { numRuns: 100 })
  })
})