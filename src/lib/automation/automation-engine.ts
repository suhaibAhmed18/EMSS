// Main automation engine that orchestrates workflow execution
import { AutomationWorkflowRepository, ContactRepository } from '../database/repositories'
import { AutomationWorkflow } from '../database/types'
import { WorkflowTriggerSystem, TriggerEvent } from './trigger-system'
import { WorkflowActionExecutor, WorkflowAction, ActionExecutionResult, WorkflowExecutionContext } from './action-executor'
import { checkStoreSubscriptionStatus } from '../subscription/subscription-guard'

export interface WorkflowExecution {
  id: string
  workflowId: string
  storeId: string
  triggerEvent: TriggerEvent
  contactId?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: Date
  completedAt?: Date
  actionResults: ActionExecutionResult[]
  error?: string
}

export interface WorkflowExecutionStats {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
  lastExecutionAt?: Date
}

export class AutomationEngine {
  private workflowRepository: AutomationWorkflowRepository
  private contactRepository: ContactRepository
  private triggerSystem: WorkflowTriggerSystem
  private actionExecutor: WorkflowActionExecutor
  private executionHistory: Map<string, WorkflowExecution[]> = new Map()

  constructor() {
    this.workflowRepository = new AutomationWorkflowRepository(true) // Use service role
    this.contactRepository = new ContactRepository(true)
    this.triggerSystem = new WorkflowTriggerSystem()
    this.actionExecutor = new WorkflowActionExecutor()
  }

  /**
   * Process a trigger event and execute matching workflows
   */
  async processTriggerEvent(event: TriggerEvent): Promise<WorkflowExecution[]> {
    try {
      console.log(`Processing trigger event: ${event.type} for store ${event.storeId}`)

      // Find workflows that match this trigger
      const matchingWorkflows = await this.triggerSystem.processTriggerEvent(event)
      
      if (matchingWorkflows.length === 0) {
        console.log(`No matching workflows found for trigger: ${event.type}`)
        return []
      }

      console.log(`Found ${matchingWorkflows.length} matching workflows`)

      // Execute each matching workflow
      const executions: WorkflowExecution[] = []
      
      for (const workflow of matchingWorkflows) {
        try {
          const execution = await this.executeWorkflow(workflow, event)
          executions.push(execution)
        } catch (error) {
          console.error(`Failed to execute workflow ${workflow.id}:`, error)
          
          // Create failed execution record
          const failedExecution: WorkflowExecution = {
            id: this.generateExecutionId(),
            workflowId: workflow.id,
            storeId: workflow.store_id,
            triggerEvent: event,
            status: 'failed',
            startedAt: new Date(),
            completedAt: new Date(),
            actionResults: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          }
          
          executions.push(failedExecution)
          this.recordExecution(failedExecution)
        }
      }

      return executions
    } catch (error) {
      console.error('Error processing trigger event:', error)
      return []
    }
  }

  /**
   * Execute a specific workflow
   */
  async executeWorkflow(workflow: AutomationWorkflow, triggerEvent: TriggerEvent): Promise<WorkflowExecution> {
    const executionId = this.generateExecutionId()
    const startTime = new Date()

    console.log(`Starting workflow execution: ${executionId} for workflow ${workflow.id}`)

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      storeId: workflow.store_id,
      triggerEvent,
      status: 'running',
      startedAt: startTime,
      actionResults: []
    }

    try {
      // Check subscription status before executing automation
      const subscriptionStatus = await checkStoreSubscriptionStatus(workflow.store_id)
      
      if (!subscriptionStatus.isActive) {
        throw new Error('Subscription expired. Automation execution blocked.')
      }

      // Determine contact ID from trigger data
      const contactId = await this.extractContactId(triggerEvent)
      execution.contactId = contactId

      // Get contact if available
      let contact
      if (contactId) {
        const { data: contactData, error } = await this.contactRepository.getContact(contactId)
        if (error) {
          console.warn(`Failed to get contact ${contactId}:`, error)
        } else {
          contact = contactData
        }
      }

      // Extract workflow settings from trigger config
      const triggerConfig = workflow.trigger_config as any
      const workflowSettings = {
        send_to_subscribed_only: triggerConfig.send_to_subscribed_only !== false, // Default to true
        respect_quiet_hours: triggerConfig.respect_quiet_hours || false
      }

      // Create execution context with workflow settings
      const context: WorkflowExecutionContext = {
        workflowId: workflow.id,
        storeId: workflow.store_id,
        triggerData: {
          ...triggerEvent.data,
          workflowSettings // Pass workflow settings through trigger data
        },
        contactId,
        contact: contact || undefined
      }

      // Parse and validate workflow actions
      const actions = this.parseWorkflowActions(workflow.actions)
      
      // Execute actions in sequence
      const actionResults = await this.actionExecutor.executeActions(actions, context)
      execution.actionResults = actionResults

      // Determine final status
      const hasFailures = actionResults.some(result => !result.success)
      execution.status = hasFailures ? 'failed' : 'completed'
      execution.completedAt = new Date()

      if (hasFailures) {
        const failedActions = actionResults.filter(result => !result.success)
        execution.error = `${failedActions.length} action(s) failed: ${failedActions.map(a => a.error).join(', ')}`
      }

      console.log(`Workflow execution ${executionId} completed with status: ${execution.status}`)

    } catch (error) {
      execution.status = 'failed'
      execution.completedAt = new Date()
      execution.error = error instanceof Error ? error.message : 'Unknown error'
      
      console.error(`Workflow execution ${executionId} failed:`, error)
    }

    // Record execution for analytics
    this.recordExecution(execution)

    return execution
  }

  /**
   * Execute a workflow by ID with custom trigger data
   */
  async executeWorkflowById(
    workflowId: string, 
    triggerData: Record<string, unknown>, 
    _contactId?: string
  ): Promise<WorkflowExecution> {
    const { data: workflow, error } = await this.workflowRepository.getWorkflow(workflowId)
    
    if (error || !workflow) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    if (!workflow.is_active) {
      throw new Error(`Workflow is not active: ${workflowId}`)
    }

    const triggerEvent: TriggerEvent = {
      type: workflow.trigger_type as TriggerEvent['type'],
      storeId: workflow.store_id,
      data: triggerData,
      timestamp: new Date()
    }

    return this.executeWorkflow(workflow, triggerEvent)
  }

  /**
   * Get workflow execution statistics
   */
  getWorkflowStats(workflowId: string): WorkflowExecutionStats {
    const executions = this.executionHistory.get(workflowId) || []
    
    if (executions.length === 0) {
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0
      }
    }

    const successfulExecutions = executions.filter(e => e.status === 'completed').length
    const failedExecutions = executions.filter(e => e.status === 'failed').length
    
    const completedExecutions = executions.filter(e => e.completedAt)
    const totalExecutionTime = completedExecutions.reduce((sum, execution) => {
      const duration = execution.completedAt!.getTime() - execution.startedAt.getTime()
      return sum + duration
    }, 0)
    
    const averageExecutionTime = completedExecutions.length > 0 
      ? totalExecutionTime / completedExecutions.length 
      : 0

    const lastExecution = executions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0]

    return {
      totalExecutions: executions.length,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime,
      lastExecutionAt: lastExecution?.startedAt
    }
  }

  /**
   * Get recent executions for a workflow
   */
  getRecentExecutions(workflowId: string, limit = 10): WorkflowExecution[] {
    const executions = this.executionHistory.get(workflowId) || []
    return executions
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit)
  }

  /**
   * Cancel a running workflow execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    // Find execution across all workflows
    for (const [_workflowId, executions] of this.executionHistory.entries()) {
      const execution = executions.find(e => e.id === executionId)
      if (execution && execution.status === 'running') {
        execution.status = 'cancelled'
        execution.completedAt = new Date()
        execution.error = 'Execution cancelled by user'
        return true
      }
    }
    return false
  }

  /**
   * Validate workflow configuration
   */
  async validateWorkflow(workflow: AutomationWorkflow): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    // Validate trigger configuration
    const triggerValidation = this.triggerSystem.validateTriggerConfig(workflow.trigger_config as any)
    if (!triggerValidation.isValid) {
      errors.push(...triggerValidation.errors.map(e => `Trigger: ${e}`))
    }

    // Validate actions
    try {
      const actions = this.parseWorkflowActions(workflow.actions)
      
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i]
        const actionValidation = this.actionExecutor.validateActionConfig(action)
        
        if (!actionValidation.isValid) {
          errors.push(...actionValidation.errors.map(e => `Action ${i + 1}: ${e}`))
        }
      }
    } catch (error) {
      errors.push(`Actions: ${error instanceof Error ? error.message : 'Invalid actions configuration'}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Parse workflow actions from database format
   */
  private parseWorkflowActions(actionsData: unknown[]): WorkflowAction[] {
    if (!Array.isArray(actionsData)) {
      throw new Error('Actions must be an array')
    }

    return actionsData.map((actionData: any, index) => {
      if (!actionData.id) {
        actionData.id = `action_${index + 1}`
      }
      
      return {
        id: actionData.id,
        type: actionData.type,
        config: actionData.config || {},
        delay: actionData.delay
      }
    })
  }

  /**
   * Extract contact ID from trigger event data
   */
  private async extractContactId(triggerEvent: TriggerEvent): Promise<string | undefined> {
    const { data } = triggerEvent

    // Try to get contact ID from different sources based on trigger type
    switch (triggerEvent.type) {
      case 'order_created':
      case 'order_paid':
      case 'order_updated':
        // Look for customer email in order data
        if ((data as any).customer?.email) {
          return this.findContactByEmail(triggerEvent.storeId, (data as any).customer.email)
        }
        break

      case 'customer_created':
      case 'customer_updated':
        // Look for customer email directly
        if ((data as any).email) {
          return this.findContactByEmail(triggerEvent.storeId, (data as any).email)
        }
        break

      case 'cart_abandoned':
        // Look for email in cart data
        if ((data as any).email) {
          return this.findContactByEmail(triggerEvent.storeId, (data as any).email)
        }
        break
    }

    return undefined
  }

  /**
   * Find contact by email address
   */
  private async findContactByEmail(storeId: string, email: string): Promise<string | undefined> {
    try {
      const { data: contacts } = await this.contactRepository.getStoreContacts(storeId)
      const contact = contacts.find(c => c.email.toLowerCase() === email.toLowerCase())
      return contact?.id
    } catch (error) {
      console.warn(`Failed to find contact by email ${email}:`, error)
      return undefined
    }
  }

  /**
   * Record execution for analytics
   */
  private recordExecution(execution: WorkflowExecution): void {
    const workflowId = execution.workflowId
    
    if (!this.executionHistory.has(workflowId)) {
      this.executionHistory.set(workflowId, [])
    }
    
    const executions = this.executionHistory.get(workflowId)!
    executions.push(execution)
    
    // Keep only last 100 executions per workflow to prevent memory issues
    if (executions.length > 100) {
      executions.splice(0, executions.length - 100)
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Singleton instance
export const automationEngine = new AutomationEngine()