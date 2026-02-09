// Automation management interface for CRUD operations and analytics
import { AutomationWorkflowRepository } from '../database/repositories'
import { AutomationWorkflow, CreateAutomationWorkflow, UpdateAutomationWorkflow } from '../database/types'
import { DatabaseResult, DatabaseListResult } from '../database/client'
import { AutomationEngine, WorkflowExecution } from './automation-engine'
import { WorkflowTriggerSystem } from './trigger-system'
import { WorkflowActionExecutor, ActionExecutionResult } from './action-executor'

export interface WorkflowValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface WorkflowAnalytics {
  workflowId: string
  workflowName: string
  isActive: boolean
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  successRate: number
  averageExecutionTime: number
  lastExecutionAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AutomationPerformanceMetrics {
  totalWorkflows: number
  activeWorkflows: number
  totalExecutions: number
  successRate: number
  averageExecutionTime: number
  topPerformingWorkflows: WorkflowAnalytics[]
  recentExecutions: Array<Record<string, unknown>>
}

export class AutomationManager {
  private workflowRepository: AutomationWorkflowRepository
  private automationEngine: AutomationEngine
  private triggerSystem: WorkflowTriggerSystem
  private actionExecutor: WorkflowActionExecutor

  constructor() {
    this.workflowRepository = new AutomationWorkflowRepository(true) // Use service role
    this.automationEngine = new AutomationEngine()
    this.triggerSystem = new WorkflowTriggerSystem()
    this.actionExecutor = new WorkflowActionExecutor()
  }

  /**
   * Create a new automation workflow
   */
  async createWorkflow(data: CreateAutomationWorkflow): Promise<DatabaseResult<AutomationWorkflow>> {
    try {
      // Validate workflow configuration before creating
      const validation = await this.validateWorkflowData(data)
      if (!validation.isValid) {
        return {
          data: null,
          error: new Error(`Workflow validation failed: ${validation.errors.join(', ')}`)
        }
      }

      // Create the workflow
      const result = await this.workflowRepository.createWorkflow(data)
      
      if (result.data) {
        console.log(`Created automation workflow: ${result.data.id} - ${result.data.name}`)
      }

      return result
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error creating workflow')
      }
    }
  }

  /**
   * Update an existing automation workflow
   */
  async updateWorkflow(id: string, data: UpdateAutomationWorkflow): Promise<DatabaseResult<AutomationWorkflow>> {
    try {
      // Get existing workflow for validation
      const { data: existingWorkflow, error: getError } = await this.workflowRepository.getWorkflow(id)
      if (getError || !existingWorkflow) {
        return {
          data: null,
          error: new Error(`Workflow not found: ${id}`)
        }
      }

      // Merge with existing data for validation
      const mergedData = {
        ...existingWorkflow,
        ...data,
        store_id: existingWorkflow.store_id, // Ensure store_id doesn't change
        id: existingWorkflow.id // Ensure id doesn't change
      }

      // Validate merged configuration
      const validation = await this.validateWorkflowData(mergedData)
      if (!validation.isValid) {
        return {
          data: null,
          error: new Error(`Workflow validation failed: ${validation.errors.join(', ')}`)
        }
      }

      // Update the workflow
      const result = await this.workflowRepository.updateWorkflow(id, data)
      
      if (result.data) {
        console.log(`Updated automation workflow: ${result.data.id} - ${result.data.name}`)
      }

      return result
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error updating workflow')
      }
    }
  }

  /**
   * Get a specific automation workflow
   */
  async getWorkflow(id: string): Promise<DatabaseResult<AutomationWorkflow>> {
    return this.workflowRepository.getWorkflow(id)
  }

  /**
   * Get all workflows for a store
   */
  async getStoreWorkflows(storeId: string): Promise<DatabaseListResult<AutomationWorkflow>> {
    return this.workflowRepository.getStoreWorkflows(storeId)
  }

  /**
   * Get only active workflows for a store
   */
  async getActiveWorkflows(storeId: string): Promise<DatabaseListResult<AutomationWorkflow>> {
    return this.workflowRepository.getActiveWorkflows(storeId)
  }

  /**
   * Delete an automation workflow
   */
  async deleteWorkflow(id: string): Promise<DatabaseResult<boolean>> {
    try {
      const result = await this.workflowRepository.deleteWorkflow(id)
      
      if (result.data) {
        console.log(`Deleted automation workflow: ${id}`)
      }

      return result
    } catch (error) {
      return {
        data: false,
        error: error instanceof Error ? error : new Error('Unknown error deleting workflow')
      }
    }
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(id: string): Promise<DatabaseResult<AutomationWorkflow>> {
    return this.updateWorkflow(id, { is_active: true })
  }

  /**
   * Deactivate a workflow
   */
  async deactivateWorkflow(id: string): Promise<DatabaseResult<AutomationWorkflow>> {
    return this.updateWorkflow(id, { is_active: false })
  }

  /**
   * Test a workflow with sample data
   */
  async testWorkflow(id: string, sampleTriggerData: Record<string, unknown>, contactId?: string): Promise<{
    success: boolean
    execution?: WorkflowExecution
    actionResults?: ActionExecutionResult[]
    error?: string
  }> {
    try {
      const execution = await this.automationEngine.executeWorkflowById(id, sampleTriggerData, contactId)
      
      return {
        success: execution.status === 'completed',
        execution,
        actionResults: execution.actionResults,
        error: execution.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error testing workflow'
      }
    }
  }

  /**
   * Validate workflow configuration
   */
  async validateWorkflow(id: string): Promise<WorkflowValidationResult> {
    try {
      const { data: workflow, error } = await this.workflowRepository.getWorkflow(id)
      
      if (error || !workflow) {
        return {
          isValid: false,
          errors: [`Workflow not found: ${id}`],
          warnings: []
        }
      }

      return this.validateWorkflowData(workflow)
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
        warnings: []
      }
    }
  }

  /**
   * Get workflow analytics
   */
  async getWorkflowAnalytics(workflowId: string): Promise<WorkflowAnalytics | null> {
    try {
      const { data: workflow, error } = await this.workflowRepository.getWorkflow(workflowId)
      
      if (error || !workflow) {
        return null
      }

      const stats = this.automationEngine.getWorkflowStats(workflowId)
      const successRate = stats.totalExecutions > 0 
        ? (stats.successfulExecutions / stats.totalExecutions) * 100 
        : 0

      return {
        workflowId: workflow.id,
        workflowName: workflow.name,
        isActive: workflow.is_active,
        totalExecutions: stats.totalExecutions,
        successfulExecutions: stats.successfulExecutions,
        failedExecutions: stats.failedExecutions,
        successRate,
        averageExecutionTime: stats.averageExecutionTime,
        lastExecutionAt: stats.lastExecutionAt,
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at
      }
    } catch (error) {
      console.error('Error getting workflow analytics:', error)
      return null
    }
  }

  /**
   * Get automation performance metrics for a store
   */
  async getAutomationMetrics(storeId: string): Promise<AutomationPerformanceMetrics> {
    try {
      const { data: workflows } = await this.getStoreWorkflows(storeId)
      
      const activeWorkflows = workflows.filter(w => w.is_active).length
      
      // Collect analytics for all workflows
      const workflowAnalytics: WorkflowAnalytics[] = []
      let totalExecutions = 0
      let totalSuccessfulExecutions = 0
      let totalExecutionTime = 0
      let executionCount = 0

      for (const workflow of workflows) {
        const analytics = await this.getWorkflowAnalytics(workflow.id)
        if (analytics) {
          workflowAnalytics.push(analytics)
          totalExecutions += analytics.totalExecutions
          totalSuccessfulExecutions += analytics.successfulExecutions
          
          if (analytics.totalExecutions > 0) {
            totalExecutionTime += analytics.averageExecutionTime * analytics.totalExecutions
            executionCount += analytics.totalExecutions
          }
        }
      }

      const overallSuccessRate = totalExecutions > 0 
        ? (totalSuccessfulExecutions / totalExecutions) * 100 
        : 0

      const averageExecutionTime = executionCount > 0 
        ? totalExecutionTime / executionCount 
        : 0

      // Get top performing workflows (by success rate and execution count)
      const topPerformingWorkflows = workflowAnalytics
        .filter(w => w.totalExecutions > 0)
        .sort((a, b) => {
          // Sort by success rate first, then by execution count
          if (b.successRate !== a.successRate) {
            return b.successRate - a.successRate
          }
          return b.totalExecutions - a.totalExecutions
        })
        .slice(0, 5)

      // Get recent executions across all workflows
      const recentExecutions: Array<{
        workflowId: string
        contactId: string
        status: string
        executedAt: Date
        error?: string
      }> = []
      for (const workflow of workflows) {
        const executions = this.automationEngine.getRecentExecutions(workflow.id, 5)
        recentExecutions.push(...executions.filter(e => e.contactId).map(e => ({
          ...e,
          workflowName: workflow.name,
          executedAt: e.completedAt || e.startedAt,
          contactId: e.contactId!
        })))
      }

      // Sort by execution time and take most recent
      recentExecutions.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
      const limitedRecentExecutions = recentExecutions.slice(0, 10)

      return {
        totalWorkflows: workflows.length,
        activeWorkflows,
        totalExecutions,
        successRate: overallSuccessRate,
        averageExecutionTime,
        topPerformingWorkflows,
        recentExecutions: limitedRecentExecutions
      }
    } catch (error) {
      console.error('Error getting automation metrics:', error)
      return {
        totalWorkflows: 0,
        activeWorkflows: 0,
        totalExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        topPerformingWorkflows: [],
        recentExecutions: []
      }
    }
  }

  /**
   * Duplicate a workflow
   */
  async duplicateWorkflow(id: string, newName?: string): Promise<DatabaseResult<AutomationWorkflow>> {
    try {
      const { data: originalWorkflow, error } = await this.workflowRepository.getWorkflow(id)
      
      if (error || !originalWorkflow) {
        return {
          data: null,
          error: new Error(`Original workflow not found: ${id}`)
        }
      }

      const duplicateData: CreateAutomationWorkflow = {
        store_id: originalWorkflow.store_id,
        name: newName || `${originalWorkflow.name} (Copy)`,
        trigger_type: originalWorkflow.trigger_type,
        trigger_config: originalWorkflow.trigger_config,
        actions: originalWorkflow.actions,
        conditions: originalWorkflow.conditions,
        is_active: false // Start duplicated workflows as inactive
      }

      return this.createWorkflow(duplicateData)
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error duplicating workflow')
      }
    }
  }

  /**
   * Validate workflow data
   */
  private async validateWorkflowData(data: CreateAutomationWorkflow | AutomationWorkflow): Promise<WorkflowValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Workflow name is required')
    }

    if (!data.store_id) {
      errors.push('Store ID is required')
    }

    if (!data.trigger_type) {
      errors.push('Trigger type is required')
    }

    if (!data.trigger_config) {
      errors.push('Trigger configuration is required')
    }

    if (!data.actions || !Array.isArray(data.actions) || data.actions.length === 0) {
      errors.push('At least one action is required')
    }

    // Validate trigger configuration
    if (data.trigger_config) {
      const triggerValidation = this.triggerSystem.validateTriggerConfig(data.trigger_config as any)
      if (!triggerValidation.isValid) {
        errors.push(...triggerValidation.errors.map(e => `Trigger: ${e}`))
      }
    }

    // Validate actions
    if (data.actions && Array.isArray(data.actions)) {
      for (let i = 0; i < data.actions.length; i++) {
        const action = data.actions[i]
        
        // Ensure action has an ID
        if (!action.id) {
          action.id = `action_${i + 1}`
        }

        const actionValidation = this.actionExecutor.validateActionConfig(action as any)
        if (!actionValidation.isValid) {
          errors.push(...actionValidation.errors.map(e => `Action ${i + 1}: ${e}`))
        }

        // Check for potential issues
        if ((action as any).type === 'send_email' || (action as any).type === 'send_sms') {
          if (!(action as any).config.subject && !(action as any).config.message) {
            warnings.push(`Action ${i + 1}: No content specified`)
          }
        }

        if ((action as any).delay && (action as any).delay > 1440) { // More than 24 hours
          warnings.push(`Action ${i + 1}: Long delay (${(action as any).delay} minutes) may cause issues`)
        }
      }
    }

    // Check for workflow complexity
    if (data.actions && data.actions.length > 10) {
      warnings.push('Workflow has many actions, consider breaking it into smaller workflows')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Alias for compatibility
  async getAutomationsByStore(storeId: string): Promise<AutomationWorkflow[]> {
    const result = await this.getStoreWorkflows(storeId)
    return result.data || []
  }

  // Alias for compatibility
  async createAutomation(data: CreateAutomationWorkflow): Promise<DatabaseResult<AutomationWorkflow>> {
    return this.createWorkflow(data)
  }
}

// Singleton instance
export const automationManager = new AutomationManager()