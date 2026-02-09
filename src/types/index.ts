export interface WorkflowTrigger {
  type: 'order_created' | 'order_paid' | 'cart_abandoned' | 'customer_created' | 
        'order_refunded' | 'ordered_product' | 'paid_for_order' | 'placed_order' | 
        'product_back_in_stock' | 'special_occasion_birthday' | 'started_checkout' | 
        'customer_subscribed' | 'viewed_page' | 'viewed_product' | 'clicked_message' | 
        'entered_segment' | 'exited_segment' | 'marked_message_as_spam' | 
        'message_delivery_failed' | 'message_sent' | 'opened_message' | 
        'order_canceled' | 'order_fulfilled'
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