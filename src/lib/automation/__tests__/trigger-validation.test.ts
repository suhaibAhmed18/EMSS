/**
 * Comprehensive test suite for automation trigger validation
 * Tests all trigger types to ensure they work correctly
 */

import { WorkflowTriggerSystem, TriggerEvent } from '../trigger-system'
import { AutomationWorkflowRepository } from '../../database/repositories'
import { AutomationWorkflow } from '../../database/types'

// Mock the repository
jest.mock('../../database/repositories')

describe('Automation Trigger Validation', () => {
  let triggerSystem: WorkflowTriggerSystem
  let mockRepository: jest.Mocked<AutomationWorkflowRepository>

  // All supported trigger types from the system
  const ALL_TRIGGER_TYPES = [
    'order_created',
    'order_paid',
    'order_updated',
    'customer_created',
    'customer_updated',
    'cart_abandoned',
    'order_refunded',
    'ordered_product',
    'paid_for_order',
    'placed_order',
    'product_back_in_stock',
    'special_occasion_birthday',
    'started_checkout',
    'customer_subscribed',
    'viewed_page',
    'viewed_product',
    'clicked_message',
    'entered_segment',
    'exited_segment',
    'marked_message_as_spam',
    'message_delivery_failed',
    'message_sent',
    'opened_message',
    'order_canceled',
    'order_fulfilled'
  ] as const

  beforeEach(() => {
    triggerSystem = new WorkflowTriggerSystem()
    mockRepository = new AutomationWorkflowRepository(true) as jest.Mocked<AutomationWorkflowRepository>
  })

  describe('Trigger Type Validation', () => {
    it('should validate all core trigger types', () => {
      const coreTriggers = [
        'order_created',
        'order_paid',
        'order_updated',
        'customer_created',
        'customer_updated',
        'cart_abandoned'
      ]

      coreTriggers.forEach(triggerType => {
        const result = triggerSystem.validateTriggerConfig({
          type: triggerType,
          conditions: []
        })

        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject invalid trigger types', () => {
      const result = triggerSystem.validateTriggerConfig({
        type: 'invalid_trigger_type',
        conditions: []
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid trigger type: invalid_trigger_type')
    })

    it('should require trigger type', () => {
      const result = triggerSystem.validateTriggerConfig({
        type: '',
        conditions: []
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Trigger type is required'))).toBe(true)
    })
  })

  describe('Trigger Event Processing', () => {
    const storeId = 'test-store-123'

    beforeEach(() => {
      // Mock repository to return active workflows
      mockRepository.getActiveWorkflows = jest.fn()
    })

    it('should process order_created trigger', async () => {
      const workflow: AutomationWorkflow = {
        id: 'wf-1',
        store_id: storeId,
        name: 'Order Created Workflow',
        description: 'Test workflow',
        trigger_type: 'order_created',
        trigger_config: { type: 'order_created', conditions: [] },
        actions: [{ type: 'send_email', config: {} }],
        conditions: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockRepository.getActiveWorkflows.mockResolvedValue({
        data: [workflow],
        error: null
      })

      const event: TriggerEvent = {
        type: 'order_created',
        storeId,
        data: {
          order: { id: '123', total: 100 },
          customer: { email: 'test@example.com' }
        },
        timestamp: new Date()
      }

      const result = await triggerSystem.processTriggerEvent(event)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('wf-1')
    })

    it('should process order_paid trigger', async () => {
      const workflow: AutomationWorkflow = {
        id: 'wf-2',
        store_id: storeId,
        name: 'Order Paid Workflow',
        description: 'Test workflow',
        trigger_type: 'order_paid',
        trigger_config: { type: 'order_paid', conditions: [] },
        actions: [{ type: 'send_email', config: {} }],
        conditions: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockRepository.getActiveWorkflows.mockResolvedValue({
        data: [workflow],
        error: null
      })

      const event: TriggerEvent = {
        type: 'order_paid',
        storeId,
        data: {
          order: { id: '123', total: 100, financial_status: 'paid' },
          customer: { email: 'test@example.com' }
        },
        timestamp: new Date()
      }

      const result = await triggerSystem.processTriggerEvent(event)

      expect(result).toHaveLength(1)
      expect(result[0].trigger_type).toBe('order_paid')
    })

    it('should process customer_created trigger', async () => {
      const workflow: AutomationWorkflow = {
        id: 'wf-3',
        store_id: storeId,
        name: 'Welcome New Customer',
        description: 'Test workflow',
        trigger_type: 'customer_created',
        trigger_config: { type: 'customer_created', conditions: [] },
        actions: [{ type: 'send_email', config: {} }],
        conditions: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockRepository.getActiveWorkflows.mockResolvedValue({
        data: [workflow],
        error: null
      })

      const event: TriggerEvent = {
        type: 'customer_created',
        storeId,
        data: {
          customer: {
            id: '456',
            email: 'newcustomer@example.com',
            first_name: 'John',
            last_name: 'Doe'
          }
        },
        timestamp: new Date()
      }

      const result = await triggerSystem.processTriggerEvent(event)

      expect(result).toHaveLength(1)
      expect(result[0].trigger_type).toBe('customer_created')
    })

    it('should process cart_abandoned trigger', async () => {
      const workflow: AutomationWorkflow = {
        id: 'wf-4',
        store_id: storeId,
        name: 'Cart Abandonment Recovery',
        description: 'Test workflow',
        trigger_type: 'cart_abandoned',
        trigger_config: { type: 'cart_abandoned', conditions: [] },
        actions: [{ type: 'send_email', config: {} }],
        conditions: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockRepository.getActiveWorkflows.mockResolvedValue({
        data: [workflow],
        error: null
      })

      const event: TriggerEvent = {
        type: 'cart_abandoned',
        storeId,
        data: {
          cart: {
            id: '789',
            items: [{ product_id: '123', quantity: 1 }],
            total: 50
          },
          email: 'customer@example.com'
        },
        timestamp: new Date()
      }

      const result = await triggerSystem.processTriggerEvent(event)

      expect(result).toHaveLength(1)
      expect(result[0].trigger_type).toBe('cart_abandoned')
    })

    it('should not trigger workflows for different trigger types', async () => {
      const workflow: AutomationWorkflow = {
        id: 'wf-5',
        store_id: storeId,
        name: 'Order Created Only',
        description: 'Test workflow',
        trigger_type: 'order_created',
        trigger_config: { type: 'order_created', conditions: [] },
        actions: [{ type: 'send_email', config: {} }],
        conditions: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockRepository.getActiveWorkflows.mockResolvedValue({
        data: [workflow],
        error: null
      })

      // Send a different trigger type
      const event: TriggerEvent = {
        type: 'customer_created',
        storeId,
        data: { customer: { email: 'test@example.com' } },
        timestamp: new Date()
      }

      const result = await triggerSystem.processTriggerEvent(event)

      expect(result).toHaveLength(0)
    })
  })

  describe('Trigger Conditions', () => {
    it('should evaluate equals condition correctly', () => {
      const trigger = {
        type: 'order_created',
        conditions: [
          { field: 'total', operator: 'equals' as const, value: 100 }
        ]
      }

      const event: TriggerEvent = {
        type: 'order_created',
        storeId: 'test-store',
        data: { total: 100 },
        timestamp: new Date()
      }

      const result = triggerSystem.evaluateTriggerConditions(trigger, event)

      expect(result.shouldTrigger).toBe(true)
      expect(result.matchedConditions).toHaveLength(1)
      expect(result.failedConditions).toHaveLength(0)
    })

    it('should evaluate greater_than condition correctly', () => {
      const trigger = {
        type: 'order_created',
        conditions: [
          { field: 'total', operator: 'greater_than' as const, value: 50 }
        ]
      }

      const event: TriggerEvent = {
        type: 'order_created',
        storeId: 'test-store',
        data: { total: 100 },
        timestamp: new Date()
      }

      const result = triggerSystem.evaluateTriggerConditions(trigger, event)

      expect(result.shouldTrigger).toBe(true)
    })

    it('should evaluate contains condition correctly', () => {
      const trigger = {
        type: 'customer_created',
        conditions: [
          { field: 'email', operator: 'contains' as const, value: '@example.com' }
        ]
      }

      const event: TriggerEvent = {
        type: 'customer_created',
        storeId: 'test-store',
        data: { email: 'test@example.com' },
        timestamp: new Date()
      }

      const result = triggerSystem.evaluateTriggerConditions(trigger, event)

      expect(result.shouldTrigger).toBe(true)
    })

    it('should fail when condition is not met', () => {
      const trigger = {
        type: 'order_created',
        conditions: [
          { field: 'total', operator: 'greater_than' as const, value: 200 }
        ]
      }

      const event: TriggerEvent = {
        type: 'order_created',
        storeId: 'test-store',
        data: { total: 100 },
        timestamp: new Date()
      }

      const result = triggerSystem.evaluateTriggerConditions(trigger, event)

      expect(result.shouldTrigger).toBe(false)
      expect(result.failedConditions).toHaveLength(1)
    })

    it('should require all conditions to be met', () => {
      const trigger = {
        type: 'order_created',
        conditions: [
          { field: 'total', operator: 'greater_than' as const, value: 50 },
          { field: 'currency', operator: 'equals' as const, value: 'USD' }
        ]
      }

      const event: TriggerEvent = {
        type: 'order_created',
        storeId: 'test-store',
        data: { total: 100, currency: 'EUR' },
        timestamp: new Date()
      }

      const result = triggerSystem.evaluateTriggerConditions(trigger, event)

      expect(result.shouldTrigger).toBe(false)
      expect(result.matchedConditions).toHaveLength(1)
      expect(result.failedConditions).toHaveLength(1)
    })
  })

  describe('Webhook Integration', () => {
    it('should create trigger event from webhook data', () => {
      const webhookData = {
        id: '123',
        total_price: '100.00',
        customer: {
          email: 'customer@example.com'
        }
      }

      const event = triggerSystem.createTriggerEventFromWebhook(
        'order_created',
        'store-123',
        webhookData
      )

      expect(event.type).toBe('order_created')
      expect(event.storeId).toBe('store-123')
      expect(event.data).toEqual(webhookData)
      expect(event.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('Condition Operators', () => {
    const testCases = [
      {
        operator: 'equals' as const,
        field: 'status',
        value: 'active',
        data: { status: 'active' },
        expected: true
      },
      {
        operator: 'not_equals' as const,
        field: 'status',
        value: 'inactive',
        data: { status: 'active' },
        expected: true
      },
      {
        operator: 'contains' as const,
        field: 'tags',
        value: 'vip',
        data: { tags: ['vip', 'premium'] },
        expected: true
      },
      {
        operator: 'greater_than' as const,
        field: 'amount',
        value: 50,
        data: { amount: 100 },
        expected: true
      },
      {
        operator: 'less_than' as const,
        field: 'amount',
        value: 200,
        data: { amount: 100 },
        expected: true
      },
      {
        operator: 'in' as const,
        field: 'country',
        value: ['US', 'CA', 'UK'],
        data: { country: 'US' },
        expected: true
      },
      {
        operator: 'not_in' as const,
        field: 'country',
        value: ['FR', 'DE'],
        data: { country: 'US' },
        expected: true
      }
    ]

    testCases.forEach(({ operator, field, value, data, expected }) => {
      it(`should correctly evaluate ${operator} operator`, () => {
        const trigger = {
          type: 'order_created',
          conditions: [{ field, operator, value }]
        }

        const event: TriggerEvent = {
          type: 'order_created',
          storeId: 'test-store',
          data,
          timestamp: new Date()
        }

        const result = triggerSystem.evaluateTriggerConditions(trigger, event)

        expect(result.shouldTrigger).toBe(expected)
      })
    })
  })

  describe('Nested Field Access', () => {
    it('should access nested fields using dot notation', () => {
      const trigger = {
        type: 'order_created',
        conditions: [
          { field: 'customer.email', operator: 'contains' as const, value: '@example.com' }
        ]
      }

      const event: TriggerEvent = {
        type: 'order_created',
        storeId: 'test-store',
        data: {
          customer: {
            email: 'test@example.com',
            name: 'Test User'
          }
        },
        timestamp: new Date()
      }

      const result = triggerSystem.evaluateTriggerConditions(trigger, event)

      expect(result.shouldTrigger).toBe(true)
    })

    it('should handle missing nested fields gracefully', () => {
      const trigger = {
        type: 'order_created',
        conditions: [
          { field: 'customer.address.city', operator: 'equals' as const, value: 'New York' }
        ]
      }

      const event: TriggerEvent = {
        type: 'order_created',
        storeId: 'test-store',
        data: {
          customer: {
            email: 'test@example.com'
          }
        },
        timestamp: new Date()
      }

      const result = triggerSystem.evaluateTriggerConditions(trigger, event)

      expect(result.shouldTrigger).toBe(false)
    })
  })
})
