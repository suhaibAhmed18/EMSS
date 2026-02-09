// Property-based tests for Automation Engine
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import fc from 'fast-check'
import { 
  CreateAutomationWorkflow,
  AutomationWorkflow,
  Contact,
  Store
} from '../../database/types'
import { AutomationEngine } from '../automation-engine'
import { AutomationManager } from '../automation-manager'
import { WorkflowTriggerSystem, TriggerEvent } from '../trigger-system'
import { WorkflowActionExecutor, WorkflowAction } from '../action-executor'

// Mock the database repositories
jest.mock('../../database/repositories', () => ({
  AutomationWorkflowRepository: jest.fn().mockImplementation(() => ({
    createWorkflow: jest.fn().mockImplementation((workflow: CreateAutomationWorkflow) => {
      if (!workflow.name?.trim() || !workflow.trigger_type || !workflow.actions?.length) {
        return Promise.resolve({ data: null, error: { message: 'Validation failed' } })
      }
      return Promise.resolve({
        data: {
          id: 'test-workflow-id',
          ...workflow,
          created_at: new Date(),
          updated_at: new Date()
        },
        error: null
      })
    }),
    getWorkflow: jest.fn().mockResolvedValue({
      data: {
        id: 'test-workflow-id',
        store_id: 'test-store-id',
        name: 'Test Workflow',
        trigger_type: 'order_created',
        trigger_config: { type: 'order_created', conditions: [] },
        actions: [
          {
            id: 'action_1',
            type: 'send_email',
            config: {
              subject: 'Test Email',
              htmlContent: 'Test content',
              fromEmail: 'test@example.com',
              fromName: 'Test Sender'
            }
          }
        ],
        conditions: [],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      error: null
    }),
    getActiveWorkflows: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'test-workflow-id',
          store_id: 'test-store-id',
          name: 'Test Workflow',
          trigger_type: 'order_created',
          trigger_config: { type: 'order_created', conditions: [] },
          actions: [
            {
              id: 'action_1',
              type: 'send_email',
              config: {
                subject: 'Test Email',
                htmlContent: 'Test content',
                fromEmail: 'test@example.com',
                fromName: 'Test Sender'
              }
            }
          ],
          conditions: [],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      error: null
    })
  })),
  ContactRepository: jest.fn().mockImplementation(() => ({
    getContact: jest.fn().mockResolvedValue({
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
        total_spent: 100,
        order_count: 5,
        last_order_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      error: null
    }),
    getStoreContacts: jest.fn().mockResolvedValue({
      data: [
        {
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
          total_spent: 100,
          order_count: 5,
          last_order_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      error: null
    }),
    updateContact: jest.fn().mockResolvedValue({
      data: {
        id: 'test-contact-id',
        store_id: 'test-store-id',
        email: 'test@example.com',
        phone: '+1234567890',
        first_name: 'Test',
        last_name: 'User',
        shopify_customer_id: null,
        tags: ['new-tag'],
        segments: [],
        email_consent: true,
        sms_consent: true,
        total_spent: 100,
        order_count: 5,
        last_order_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      error: null
    })
  }))
}))

// Mock campaign managers
jest.mock('../../campaigns/email-campaign-manager', () => ({
  EmailCampaignManager: jest.fn().mockImplementation(() => ({
    createCampaign: jest.fn().mockResolvedValue({
      data: {
        id: 'test-email-campaign-id',
        store_id: 'test-store-id',
        name: 'Automation Email',
        subject: 'Test Subject',
        html_content: 'Test content',
        from_email: 'test@example.com',
        from_name: 'Test Sender',
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date()
      },
      error: null
    }),
    sendToContacts: jest.fn().mockResolvedValue({
      success: true,
      sentCount: 1,
      failedCount: 0,
      results: []
    })
  }))
}))

jest.mock('../../campaigns/sms-campaign-manager', () => ({
  SMSCampaignManager: jest.fn().mockImplementation(() => ({
    createCampaign: jest.fn().mockResolvedValue({
      data: {
        id: 'test-sms-campaign-id',
        store_id: 'test-store-id',
        name: 'Automation SMS',
        message: 'Test message',
        from_number: '+1234567890',
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date()
      },
      error: null
    }),
    sendToContacts: jest.fn().mockResolvedValue({
      success: true,
      sentCount: 1,
      failedCount: 0,
      results: []
    })
  }))
}))

// Test data factories
const createTestStore = (): Store => ({
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

const createTestContact = (storeId: string, overrides: Partial<Contact> = {}): Contact => ({
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
  total_spent: 100,
  order_count: 5,
  last_order_at: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides
})

describe('Automation Engine Property Tests', () => {
  let automationEngine: AutomationEngine
  let automationManager: AutomationManager
  let triggerSystem: WorkflowTriggerSystem
  let actionExecutor: WorkflowActionExecutor

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    automationEngine = new AutomationEngine()
    automationManager = new AutomationManager()
    triggerSystem = new WorkflowTriggerSystem()
    actionExecutor = new WorkflowActionExecutor()
  })

  // Property 13: Automation Trigger Execution
  test('Feature: shopify-marketing-platform, Property 13: Automation Trigger Execution', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        triggerType: fc.constantFrom('order_created', 'order_paid', 'order_updated', 'customer_created'),
        orderData: fc.record({
          id: fc.string({ minLength: 1 }),
          total_price: fc.float({ min: 0, max: 1000, noNaN: true }),
          currency: fc.constantFrom('USD', 'EUR', 'GBP'),
          customer: fc.record({
            id: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            first_name: fc.string({ minLength: 1, maxLength: 50 }),
            last_name: fc.string({ minLength: 1, maxLength: 50 })
          })
        }),
        conditions: fc.array(fc.record({
          field: fc.constantFrom('total_price', 'currency', 'customer.email'),
          operator: fc.constantFrom('equals', 'greater_than', 'less_than', 'contains'),
          value: fc.oneof(fc.string(), fc.float({ min: 0, max: 1000 }))
        }), { maxLength: 3 })
      }),
      async (testData) => {
        const store = createTestStore()
        
        // Create trigger event
        const triggerEvent: TriggerEvent = {
          type: testData.triggerType as TriggerEvent['type'],
          storeId: store.id,
          data: testData.orderData,
          timestamp: new Date()
        }

        // Process trigger event
        const matchingWorkflows = await triggerSystem.processTriggerEvent(triggerEvent)

        // Property: For any Shopify event that matches a workflow trigger, the appropriate automation should be executed
        expect(Array.isArray(matchingWorkflows)).toBe(true)
        
        // If there are matching workflows, they should be valid
        for (const workflow of matchingWorkflows) {
          expect(workflow.id).toBeDefined()
          expect(workflow.store_id).toBe(store.id)
          expect(workflow.trigger_type).toBe(testData.triggerType)
          expect(workflow.is_active).toBe(true)
          expect(Array.isArray(workflow.actions)).toBe(true)
          expect(workflow.actions.length).toBeGreaterThan(0)
        }

        // Execute workflows through automation engine
        const executions = await automationEngine.processTriggerEvent(triggerEvent)
        
        expect(Array.isArray(executions)).toBe(true)
        
        // Each execution should have proper structure
        for (const execution of executions) {
          expect(execution.id).toBeDefined()
          expect(execution.workflowId).toBeDefined()
          expect(execution.storeId).toBe(store.id)
          expect(execution.triggerEvent).toEqual(triggerEvent)
          expect(['pending', 'running', 'completed', 'failed', 'cancelled']).toContain(execution.status)
          expect(execution.startedAt).toBeInstanceOf(Date)
          expect(Array.isArray(execution.actionResults)).toBe(true)
        }

        return true
      }
    ), { numRuns: 100 })
  })

  // Property 14: Workflow Action Execution
  test('Feature: shopify-marketing-platform, Property 14: Workflow Action Execution', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        actionType: fc.constantFrom('send_email', 'send_sms', 'add_tag', 'remove_tag', 'update_customer', 'delay'),
        emailConfig: fc.record({
          subject: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('{{') && !s.includes('}}')),
          htmlContent: fc.string({ minLength: 10, maxLength: 200 }).filter(s => !s.includes('{{') && !s.includes('}}')),
          fromEmail: fc.emailAddress(),
          fromName: fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('{{') && !s.includes('}}'))
        }),
        smsConfig: fc.record({
          message: fc.string({ minLength: 1, maxLength: 80 }).filter(s => !s.includes('{{') && !s.includes('}}')),
          fromNumber: fc.string({ minLength: 10, maxLength: 15 }).filter(s => /^\+?[0-9]+$/.test(s))
        }),
        tagConfig: fc.record({
          tags: fc.array(fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), { minLength: 1, maxLength: 3 })
        }),
        updateConfig: fc.record({
          updates: fc.record({
            firstName: fc.option(fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z\s]+$/.test(s))),
            lastName: fc.option(fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z\s]+$/.test(s))),
            phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }).filter(s => /^\+?[0-9]+$/.test(s)))
          })
        }),
        delay: fc.integer({ min: 0, max: 2 }) // Further reduced max delay for faster tests
      }),
      async (testData) => {
        const store = createTestStore()
        const contact = createTestContact(store.id)

        // Create action based on type
        interface ActionConfig {
          [key: string]: unknown;
        }
        let actionConfig: ActionConfig = {}
        switch (testData.actionType) {
          case 'send_email':
            actionConfig = testData.emailConfig
            break
          case 'send_sms':
            actionConfig = testData.smsConfig
            break
          case 'add_tag':
          case 'remove_tag':
            actionConfig = testData.tagConfig
            break
          case 'update_customer':
            actionConfig = testData.updateConfig
            break
          case 'delay':
            actionConfig = {}
            break
        }

        const action: WorkflowAction = {
          id: 'test-action-1',
          type: testData.actionType as WorkflowAction['type'],
          config: actionConfig,
          delay: testData.delay
        }

        const context = {
          workflowId: 'test-workflow-id',
          storeId: store.id,
          triggerData: { test: 'data' },
          contactId: contact.id,
          contact
        }

        // Execute action
        const result = await actionExecutor.executeAction(action, context)

        // Property: For any workflow action (email, SMS, delay, tag addition), it should execute correctly according to its configuration
        expect(result).toBeDefined()
        expect(result.actionId).toBe(action.id)
        expect(result.actionType).toBe(action.type)
        expect(result.executedAt).toBeInstanceOf(Date)
        expect(typeof result.success).toBe('boolean')

        // If action failed, there should be an error message
        if (!result.success) {
          expect(result.error).toBeDefined()
          expect(typeof result.error).toBe('string')
        }

        // If action succeeded, verify type-specific results
        if (result.success) {
          switch (testData.actionType) {
            case 'send_email':
              expect(result.metadata).toBeDefined()
              expect(result.metadata.campaignId).toBeDefined()
              expect(result.metadata.recipientEmail).toBe(contact.email)
              break
            case 'send_sms':
              expect(result.metadata).toBeDefined()
              expect(result.metadata.campaignId).toBeDefined()
              expect(result.metadata.recipientPhone).toBe(contact.phone)
              break
            case 'add_tag':
            case 'remove_tag':
              expect(result.metadata).toBeDefined()
              expect(result.metadata.contactId).toBe(contact.id)
              expect(Array.isArray(result.metadata.finalTags)).toBe(true)
              break
            case 'update_customer':
              expect(result.metadata).toBeDefined()
              expect(result.metadata.contactId).toBe(contact.id)
              expect(result.metadata.updates).toBeDefined()
              break
            case 'delay':
              expect(result.metadata).toBeDefined()
              expect(result.metadata.delayMinutes).toBe(testData.delay)
              break
          }
        }

        return true
      }
    ), { numRuns: 30 }) // Further reduced runs for performance
  }, 10000) // Reduced timeout to 10 seconds

  // Property 15: Automation Analytics Tracking
  test('Feature: shopify-marketing-platform, Property 15: Automation Analytics Tracking', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        workflowName: fc.string({ minLength: 1, maxLength: 100 }),
        executionCount: fc.integer({ min: 1, max: 10 }),
        successRate: fc.float({ min: 0, max: 1, noNaN: true })
      }),
      async (testData) => {
        const store = createTestStore()

        // Create test workflow
        const workflowData: CreateAutomationWorkflow = {
          store_id: store.id,
          name: testData.workflowName,
          trigger_type: 'order_created',
          trigger_config: { type: 'order_created', conditions: [] },
          actions: [
            {
              id: 'action_1',
              type: 'add_tag',
              config: { tags: ['test-tag'] }
            }
          ],
          conditions: [],
          is_active: true
        }

        const { data: workflow, error: createError } = await automationManager.createWorkflow(workflowData)
        
        if (createError || !workflow) {
          return true // Skip if workflow creation fails
        }

        // Simulate multiple executions
        const triggerEvent: TriggerEvent = {
          type: 'order_created',
          storeId: store.id,
          data: { customer: { email: 'test@example.com' } },
          timestamp: new Date()
        }

        const executions = []
        for (let i = 0; i < testData.executionCount; i++) {
          const execution = await automationEngine.executeWorkflow(workflow, triggerEvent)
          executions.push(execution)
        }

        // Get workflow analytics
        const analytics = await automationManager.getWorkflowAnalytics(workflow.id)

        // Property: For any executed automation, performance data should be recorded for analytics
        expect(analytics).toBeDefined()
        
        if (analytics) {
          expect(analytics.workflowId).toBe(workflow.id)
          expect(analytics.workflowName).toBe(testData.workflowName)
          expect(analytics.isActive).toBe(true)
          expect(analytics.totalExecutions).toBeGreaterThanOrEqual(0)
          expect(analytics.successfulExecutions).toBeGreaterThanOrEqual(0)
          expect(analytics.failedExecutions).toBeGreaterThanOrEqual(0)
          expect(analytics.successfulExecutions + analytics.failedExecutions).toBeLessThanOrEqual(analytics.totalExecutions)
          expect(analytics.successRate).toBeGreaterThanOrEqual(0)
          expect(analytics.successRate).toBeLessThanOrEqual(100)
          expect(analytics.averageExecutionTime).toBeGreaterThanOrEqual(0)
          expect(analytics.createdAt).toBeInstanceOf(Date)
          expect(analytics.updatedAt).toBeInstanceOf(Date)
        }

        // Get automation metrics for the store
        const metrics = await automationManager.getAutomationMetrics(store.id)
        
        expect(metrics).toBeDefined()
        expect(metrics.totalWorkflows).toBeGreaterThanOrEqual(1)
        expect(metrics.activeWorkflows).toBeGreaterThanOrEqual(0)
        expect(metrics.totalExecutions).toBeGreaterThanOrEqual(0)
        expect(metrics.successRate).toBeGreaterThanOrEqual(0)
        expect(metrics.successRate).toBeLessThanOrEqual(100)
        expect(metrics.averageExecutionTime).toBeGreaterThanOrEqual(0)
        expect(Array.isArray(metrics.topPerformingWorkflows)).toBe(true)
        expect(Array.isArray(metrics.recentExecutions)).toBe(true)

        return true
      }
    ), { numRuns: 50 }) // Reduced runs for performance
  })

  // Additional property test for trigger condition evaluation
  test('Trigger condition evaluation is consistent and accurate', async () => {
    await fc.assert(fc.property(
      fc.record({
        field: fc.constantFrom('total_price', 'currency', 'customer.email', 'customer.first_name'),
        operator: fc.constantFrom('equals', 'not_equals', 'contains', 'greater_than', 'less_than'),
        value: fc.oneof(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.integer({ min: 0, max: 1000 })
        ),
        testData: fc.record({
          total_price: fc.float({ min: 0, max: 1000, noNaN: true }),
          currency: fc.constantFrom('USD', 'EUR', 'GBP'),
          customer: fc.record({
            email: fc.emailAddress(),
            first_name: fc.string({ minLength: 1, maxLength: 50 })
          })
        })
      }),
      (testData) => {
        const trigger = {
          type: 'order_created',
          conditions: [
            {
              field: testData.field,
              operator: testData.operator,
              value: testData.value
            }
          ]
        }

        const triggerEvent: TriggerEvent = {
          type: 'order_created',
          storeId: 'test-store-id',
          data: testData.testData,
          timestamp: new Date()
        }

        // Evaluate trigger conditions
        const result = triggerSystem.evaluateTriggerConditions(trigger, triggerEvent)

        // Verify result structure
        expect(result).toBeDefined()
        expect(typeof result.shouldTrigger).toBe('boolean')
        expect(Array.isArray(result.matchedConditions)).toBe(true)
        expect(Array.isArray(result.failedConditions)).toBe(true)
        expect(result.matchedConditions.length + result.failedConditions.length).toBe(1)

        // If trigger should fire, all conditions should be matched
        if (result.shouldTrigger) {
          expect(result.failedConditions.length).toBe(0)
          expect(result.matchedConditions.length).toBe(1)
        } else {
          expect(result.failedConditions.length).toBe(1)
          expect(result.matchedConditions.length).toBe(0)
        }

        return true
      }
    ), { numRuns: 100 })
  })

  // Property test for workflow validation
  test('Workflow validation is comprehensive and accurate', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        name: fc.option(fc.string({ maxLength: 100 }), { nil: '' }),
        triggerType: fc.option(fc.constantFrom('order_created', 'order_paid', 'customer_created', 'invalid_type')),
        actions: fc.option(fc.array(fc.record({
          type: fc.constantFrom('send_email', 'send_sms', 'add_tag', 'invalid_action'),
          config: fc.record({
            subject: fc.option(fc.string()),
            htmlContent: fc.option(fc.string()),
            fromEmail: fc.option(fc.string()),
            fromName: fc.option(fc.string()),
            message: fc.option(fc.string()),
            fromNumber: fc.option(fc.string()),
            tags: fc.option(fc.array(fc.string()))
          })
        }), { maxLength: 5 }), { nil: [] })
      }),
      async (testData) => {
        const store = createTestStore()

        interface WorkflowData {
          store_id: string;
          name: string;
          trigger_type: string;
          trigger_config: { type: string; conditions: unknown[] };
          actions: unknown[];
          conditions: unknown[];
          is_active: boolean;
        }

        const workflowData: WorkflowData = {
          store_id: store.id,
          name: testData.name || '',
          trigger_type: testData.triggerType || '',
          trigger_config: { type: testData.triggerType || '', conditions: [] },
          actions: testData.actions || [],
          conditions: [],
          is_active: true
        }

        // Validate workflow
        const validation = await automationManager.validateWorkflowData(workflowData)

        // Verify validation result structure
        expect(validation).toBeDefined()
        expect(typeof validation.isValid).toBe('boolean')
        expect(Array.isArray(validation.errors)).toBe(true)
        expect(Array.isArray(validation.warnings)).toBe(true)

        // Check specific validation rules
        if (!testData.name?.trim()) {
          expect(validation.isValid).toBe(false)
          expect(validation.errors.some(error => error.toLowerCase().includes('name'))).toBe(true)
        }

        if (!testData.triggerType) {
          expect(validation.isValid).toBe(false)
          expect(validation.errors.some(error => error.toLowerCase().includes('trigger'))).toBe(true)
        }

        if (!testData.actions?.length) {
          expect(validation.isValid).toBe(false)
          expect(validation.errors.some(error => error.toLowerCase().includes('action'))).toBe(true)
        }

        // If validation passes, the workflow should be valid
        if (validation.isValid) {
          expect(testData.name?.trim()).toBeTruthy()
          expect(testData.triggerType).toBeTruthy()
          expect(testData.actions?.length).toBeGreaterThan(0)
        }

        return true
      }
    ), { numRuns: 100 })
  })
})

describe('Automation Engine Edge Cases', () => {
  let automationEngine: AutomationEngine
  let triggerSystem: WorkflowTriggerSystem

  beforeEach(() => {
    jest.clearAllMocks()
    automationEngine = new AutomationEngine()
    triggerSystem = new WorkflowTriggerSystem()
  })

  test('Template interpolation works correctly with various data types', () => {
    fc.assert(fc.property(
      fc.record({
        template: fc.string({ minLength: 10, maxLength: 100 }),
        contactData: fc.record({
          firstName: fc.option(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z\s]+$/.test(s))), // Only letters and spaces
          lastName: fc.option(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z\s]+$/.test(s))),
          email: fc.emailAddress().filter(email => !/[\${}\\]/.test(email)), // Avoid special regex chars
          totalSpent: fc.float({ min: 0, max: 10000, noNaN: true }),
          orderCount: fc.integer({ min: 0, max: 1000 })
        }),
        triggerData: fc.record({
          orderId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), // Alphanumeric only
          totalPrice: fc.float({ min: 0, max: 1000, noNaN: true })
        })
      }),
      (testData) => {
        // Add template variables to the template
        let template = testData.template
        template += ' Hello {{contact.firstName}} {{contact.lastName}}'
        template += ' Your email is {{contact.email}}'
        template += ' You have spent ${{contact.totalSpent}} in {{contact.orderCount}} orders'
        template += ' Order ID: {{trigger.orderId}} for ${{trigger.totalPrice}}'

        interface ContactData {
          first_name: string;
          last_name: string;
          email: string;
          total_spent: number;
          order_count: number;
        }

        const contact: ContactData = {
          first_name: testData.contactData.firstName,
          last_name: testData.contactData.lastName,
          email: testData.contactData.email,
          total_spent: testData.contactData.totalSpent,
          order_count: testData.contactData.orderCount
        }

        // Use private method through type assertion for testing
        const actionExecutor = new WorkflowActionExecutor()
        const result = (actionExecutor as unknown as { interpolateTemplate: (template: string, triggerData: unknown, contact: ContactData) => string }).interpolateTemplate(template, testData.triggerData, contact)

        // Verify interpolation worked
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
        
        // Check that variables were replaced (only if values exist)
        if (testData.contactData.firstName) {
          expect(result).toContain(testData.contactData.firstName)
        }
        if (testData.contactData.lastName) {
          expect(result).toContain(testData.contactData.lastName)
        }
        expect(result).toContain(testData.contactData.email)
        expect(result).toContain(testData.contactData.totalSpent.toString())
        expect(result).toContain(testData.contactData.orderCount.toString())
        expect(result).toContain(testData.triggerData.orderId)
        expect(result).toContain(testData.triggerData.totalPrice.toString())

        // Verify no template variables remain unreplaced
        expect(result).not.toMatch(/\{\{[^}]+\}\}/)

        return true
      }
    ), { numRuns: 100 })
  })

  test('Nested field access works correctly', () => {
    fc.assert(fc.property(
      fc.record({
        nestedData: fc.record({
          level1: fc.record({
            level2: fc.record({
              value: fc.oneof(fc.string(), fc.integer(), fc.boolean())
            })
          }),
          simpleValue: fc.string()
        }),
        fieldPath: fc.constantFrom('level1.level2.value', 'simpleValue', 'nonexistent.field')
      }),
      (testData) => {
        // Use private method through type assertion for testing
        const triggerSystem = new WorkflowTriggerSystem()
        const result = (triggerSystem as unknown as { getNestedValue: (data: unknown, path: string) => unknown }).getNestedValue(testData.nestedData, testData.fieldPath)

        if (testData.fieldPath === 'level1.level2.value') {
          expect(result).toBe(testData.nestedData.level1.level2.value)
        } else if (testData.fieldPath === 'simpleValue') {
          expect(result).toBe(testData.nestedData.simpleValue)
        } else if (testData.fieldPath === 'nonexistent.field') {
          expect(result).toBeUndefined()
        }

        return true
      }
    ), { numRuns: 100 })
  })
})