// Automation engine exports
export { WorkflowTriggerSystem, workflowTriggerSystem } from './trigger-system'
export { WorkflowActionExecutor, workflowActionExecutor } from './action-executor'
export { AutomationEngine, automationEngine } from './automation-engine'
export { AutomationManager, automationManager } from './automation-manager'

// Type exports
export type {
  TriggerEvent,
  TriggerCondition,
  WorkflowTrigger,
  TriggerEvaluationResult
} from './trigger-system'

export type {
  WorkflowAction,
  ActionConfig,
  EmailActionConfig,
  SMSActionConfig,
  TagActionConfig,
  CustomerUpdateActionConfig,
  ActionExecutionResult,
  WorkflowExecutionContext
} from './action-executor'

export type {
  WorkflowExecution,
  WorkflowExecutionStats
} from './automation-engine'

export type {
  WorkflowValidationResult,
  WorkflowAnalytics,
  AutomationPerformanceMetrics
} from './automation-manager'