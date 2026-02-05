export interface WorkflowTrigger {
  type: 'order_created' | 'order_paid' | 'cart_abandoned' | 'customer_created'
  conditions: any[]
}

export interface WorkflowAction {
  type: 'send_email' | 'send_sms' | 'delay' | 'add_tag' | 'update_customer'
  config: any
  delay?: number
}

export interface WorkflowCondition {
  field: string
  operator: string
  value: any
}

export interface AutomationWorkflow {
  id: string
  name: string
  description: string
  trigger: WorkflowTrigger
  actions: WorkflowAction[]
  conditions: WorkflowCondition[]
  is_active: boolean
  store_id: string
  created_at: string
  updated_at: string
}