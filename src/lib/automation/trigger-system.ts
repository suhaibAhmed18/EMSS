// Workflow trigger system for automation engine
import { AutomationWorkflowRepository } from '../database/repositories'
import { AutomationWorkflow } from '../database/types'

export interface TriggerEvent {
  type: 'order_created' | 'order_paid' | 'order_updated' | 'customer_created' | 'customer_updated' | 'cart_abandoned' | 
        'order_refunded' | 'ordered_product' | 'paid_for_order' | 'placed_order' | 'product_back_in_stock' | 
        'special_occasion_birthday' | 'started_checkout' | 'customer_subscribed' | 'viewed_page' | 'viewed_product' | 
        'clicked_message' | 'entered_segment' | 'exited_segment' | 'marked_message_as_spam' | 'message_delivery_failed' | 
        'message_sent' | 'opened_message' | 'order_canceled' | 'order_fulfilled'
  storeId: string
  data: Record<string, unknown>
  timestamp: Date
}

export interface TriggerCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: unknown
}

export interface WorkflowTrigger {
  type: string
  conditions: TriggerCondition[]
}

export interface TriggerEvaluationResult {
  shouldTrigger: boolean
  matchedConditions: TriggerCondition[]
  failedConditions: TriggerCondition[]
}

export class WorkflowTriggerSystem {
  private workflowRepository: AutomationWorkflowRepository

  constructor() {
    this.workflowRepository = new AutomationWorkflowRepository(true) // Use service role
  }

  /**
   * Process a trigger event and find matching workflows
   */
  async processTriggerEvent(event: TriggerEvent): Promise<AutomationWorkflow[]> {
    try {
      // Get all active workflows for this store and trigger type
      const { data: workflows, error } = await this.workflowRepository.getActiveWorkflows(event.storeId)
      
      if (error) {
        console.error('Failed to get active workflows:', error)
        return []
      }

      // Filter workflows that match this trigger type
      const matchingTypeWorkflows = workflows.filter(workflow => 
        workflow.trigger_type === event.type
      )

      // Evaluate trigger conditions for each workflow
      const triggeredWorkflows: AutomationWorkflow[] = []
      
      for (const workflow of matchingTypeWorkflows) {
        const triggerConfig = workflow.trigger_config as unknown as WorkflowTrigger
        const evaluationResult = this.evaluateTriggerConditions(triggerConfig, event)
        
        if (evaluationResult.shouldTrigger) {
          triggeredWorkflows.push(workflow)
        }
      }

      return triggeredWorkflows
    } catch (error) {
      console.error('Error processing trigger event:', error)
      return []
    }
  }

  /**
   * Evaluate trigger conditions against event data
   */
  evaluateTriggerConditions(trigger: WorkflowTrigger, event: TriggerEvent): TriggerEvaluationResult {
    const matchedConditions: TriggerCondition[] = []
    const failedConditions: TriggerCondition[] = []

    // If no conditions, trigger should fire
    if (!trigger.conditions || trigger.conditions.length === 0) {
      return {
        shouldTrigger: true,
        matchedConditions: [],
        failedConditions: []
      }
    }

    for (const condition of trigger.conditions) {
      const conditionMet = this.evaluateCondition(condition, event.data)
      
      if (conditionMet) {
        matchedConditions.push(condition)
      } else {
        failedConditions.push(condition)
      }
    }

    // All conditions must be met for trigger to fire
    const shouldTrigger = failedConditions.length === 0

    return {
      shouldTrigger,
      matchedConditions,
      failedConditions
    }
  }

  /**
   * Evaluate a single condition against event data
   */
  private evaluateCondition(condition: TriggerCondition, eventData: Record<string, unknown>): boolean {
    const fieldValue = this.getNestedValue(eventData, condition.field)
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      
      case 'not_equals':
        return fieldValue !== condition.value
      
      case 'contains':
        if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
          return fieldValue.toLowerCase().includes(condition.value.toLowerCase())
        }
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(condition.value)
        }
        return false
      
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)
      
      case 'less_than':
        return Number(fieldValue) < Number(condition.value)
      
      case 'in':
        if (Array.isArray(condition.value)) {
          return condition.value.includes(fieldValue)
        }
        return false
      
      case 'not_in':
        if (Array.isArray(condition.value)) {
          return !condition.value.includes(fieldValue)
        }
        return true
      
      default:
        console.warn(`Unknown condition operator: ${condition.operator}`)
        return false
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: any, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  /**
   * Validate trigger configuration
   */
  validateTriggerConfig(trigger: WorkflowTrigger): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!trigger.type) {
      errors.push('Trigger type is required')
    }

    // All trigger types that are currently supported
    // Only include triggers that have webhook handlers or can be manually triggered
    const validTriggerTypes = [
      // Shopify webhook triggers (fully implemented)
      'order_created',      // orders/create webhook
      'order_paid',         // orders/paid webhook
      'order_updated',      // orders/updated webhook
      'customer_created',   // customers/create webhook
      'customer_updated',   // customers/update webhook
      
      // Additional triggers (require implementation)
      'cart_abandoned',     // Requires checkout tracking
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
    ]

    if (trigger.type && !validTriggerTypes.includes(trigger.type)) {
      errors.push(`Invalid trigger type: ${trigger.type}`)
    }

    if (trigger.conditions) {
      for (let i = 0; i < trigger.conditions.length; i++) {
        const condition = trigger.conditions[i]
        
        if (!condition.field) {
          errors.push(`Condition ${i + 1}: field is required`)
        }
        
        if (!condition.operator) {
          errors.push(`Condition ${i + 1}: operator is required`)
        }
        
        const validOperators = ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']
        if (condition.operator && !validOperators.includes(condition.operator)) {
          errors.push(`Condition ${i + 1}: invalid operator ${condition.operator}`)
        }
        
        if (condition.value === undefined || condition.value === null) {
          errors.push(`Condition ${i + 1}: value is required`)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Create a trigger event from Shopify webhook data
   */
  createTriggerEventFromWebhook(
    triggerType: TriggerEvent['type'],
    storeId: string,
    webhookData: Record<string, unknown>
  ): TriggerEvent {
    return {
      type: triggerType,
      storeId,
      data: webhookData,
      timestamp: new Date()
    }
  }
}

// Singleton instance
export const workflowTriggerSystem = new WorkflowTriggerSystem()