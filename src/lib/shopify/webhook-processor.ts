// Shopify webhook processing system
import { createClient } from '../supabase/server'
import { shopifyStoreManager } from './store-manager'
import { 
  ShopifyError,
  type ShopifyCustomer,
  type ShopifyOrder 
} from './types'
import type { Contact, CreateContact } from '../database/types'

export interface WebhookPayload {
  topic: string
  shopDomain: string
  payload: Record<string, unknown>
  headers: {
    signature: string
    topic: string
    shopDomain: string
    timestamp: string
  }
}

export interface WebhookProcessingResult {
  success: boolean
  processed: boolean
  error?: string
  data?: Record<string, unknown>
}

export class WebhookProcessor {
  /**
   * Process incoming webhook
   */
  async processWebhook(webhook: WebhookPayload): Promise<WebhookProcessingResult> {
    const { topic, shopDomain, payload } = webhook

    try {
      // Get store from database
      const store = await shopifyStoreManager.getStoreByDomain(shopDomain)
      if (!store) {
        throw new ShopifyError(`Store not found for domain: ${shopDomain}`, 'STORE_NOT_FOUND')
      }

      // Process based on webhook topic
      switch (topic) {
        case 'orders/create':
          return await this.processOrderCreated(store.id, payload as any)
        
        case 'orders/paid':
          return await this.processOrderPaid(store.id, payload as any)
        
        case 'orders/updated':
          return await this.processOrderUpdated(store.id, payload as any)
        
        case 'customers/create':
          return await this.processCustomerCreated(store.id, payload as any)
        
        case 'customers/update':
          return await this.processCustomerUpdated(store.id, payload as any)
        
        case 'checkouts/create':
          return await this.processCheckoutCreated(store.id, payload as any)
        
        case 'checkouts/update':
          return await this.processCheckoutUpdated(store.id, payload as any)
        
        default:
          console.warn(`Unhandled webhook topic: ${topic}`)
          return {
            success: true,
            processed: false,
            error: `Unhandled topic: ${topic}`,
          }
      }
    } catch (error) {
      console.error(`Webhook processing error for ${topic}:`, error)
      return {
        success: false,
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Process order created webhook
   */
  private async processOrderCreated(storeId: string, order: any): Promise<WebhookProcessingResult> {
    try {
      const supabase = await createClient()

      // Store order data
      const orderData = {
        store_id: storeId,
        shopify_order_id: order.id.toString(),
        order_number: order.order_number,
        total_price: parseFloat(String(order.total_price || '0')),
        currency: order.currency,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        created_at_shopify: new Date(order.created_at),
        updated_at_shopify: new Date(order.updated_at),
      }

      // Insert or update order
      const { error: orderError } = await (supabase
        .from('shopify_orders') as any)
        .upsert(orderData, { 
          onConflict: 'store_id,shopify_order_id',
          ignoreDuplicates: false 
        })

      if (orderError) {
        console.error('Failed to store order:', orderError)
      }

      // Update or create customer contact
      if (order.customer) {
        await this.upsertCustomerContact(storeId, order.customer)
      }

      // Trigger automation workflows for order created
      await this.triggerAutomations(storeId, 'order_created', {
        order,
        customer: order.customer,
      })

      return {
        success: true,
        processed: true,
        data: { orderId: order.id },
      }
    } catch (error) {
      throw new ShopifyError(`Failed to process order created: ${error instanceof Error ? error.message : 'Unknown error'}`, 'WEBHOOK_PROCESSING_ERROR')
    }
  }

  /**
   * Process order paid webhook
   */
  private async processOrderPaid(storeId: string, order: any): Promise<WebhookProcessingResult> {
    try {
      const supabase = await createClient()

      // Update order financial status
      const { error } = await (supabase
        .from('shopify_orders') as any)
        .update({
          financial_status: order.financial_status,
          updated_at_shopify: new Date(order.updated_at),
        })
        .eq('store_id', storeId)
        .eq('shopify_order_id', order.id.toString())

      if (error) {
        console.error('Failed to update order payment status:', error)
      }

      // Update customer total spent
      if (order.customer) {
        await this.updateCustomerMetrics(storeId, order.customer.id, {
          totalSpent: parseFloat(order.customer.total_spent || '0'),
          orderCount: order.customer.orders_count || 0,
        })
      }

      // Trigger automation workflows for order paid
      await this.triggerAutomations(storeId, 'order_paid', {
        order,
        customer: order.customer,
      })

      return {
        success: true,
        processed: true,
        data: { orderId: order.id },
      }
    } catch (error) {
      throw new ShopifyError(`Failed to process order paid: ${error instanceof Error ? error.message : 'Unknown error'}`, 'WEBHOOK_PROCESSING_ERROR')
    }
  }

  /**
   * Process order updated webhook
   */
  private async processOrderUpdated(storeId: string, order: any): Promise<WebhookProcessingResult> {
    try {
      const supabase = await createClient()

      // Update order data
      const { error } = await (supabase
        .from('shopify_orders') as any)
        .update({
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status,
          updated_at_shopify: new Date(order.updated_at),
        })
        .eq('store_id', storeId)
        .eq('shopify_order_id', order.id.toString())

      if (error) {
        console.error('Failed to update order:', error)
      }

      // Trigger automation workflows for order updated
      await this.triggerAutomations(storeId, 'order_updated', {
        order,
        customer: order.customer,
      })

      return {
        success: true,
        processed: true,
        data: { orderId: order.id },
      }
    } catch (error) {
      throw new ShopifyError(`Failed to process order updated: ${error instanceof Error ? error.message : 'Unknown error'}`, 'WEBHOOK_PROCESSING_ERROR')
    }
  }

  /**
   * Process customer created webhook
   */
  private async processCustomerCreated(storeId: string, customer: any): Promise<WebhookProcessingResult> {
    try {
      await this.upsertCustomerContact(storeId, customer)

      // Trigger automation workflows for customer created
      await this.triggerAutomations(storeId, 'customer_created', {
        customer,
      })

      return {
        success: true,
        processed: true,
        data: { customerId: customer.id },
      }
    } catch (error) {
      throw new ShopifyError(`Failed to process customer created: ${error instanceof Error ? error.message : 'Unknown error'}`, 'WEBHOOK_PROCESSING_ERROR')
    }
  }

  /**
   * Process customer updated webhook
   */
  private async processCustomerUpdated(storeId: string, customer: any): Promise<WebhookProcessingResult> {
    try {
      await this.upsertCustomerContact(storeId, customer)

      // Trigger automation workflows for customer updated
      await this.triggerAutomations(storeId, 'customer_updated', {
        customer,
      })

      return {
        success: true,
        processed: true,
        data: { customerId: customer.id },
      }
    } catch (error) {
      throw new ShopifyError(`Failed to process customer updated: ${error instanceof Error ? error.message : 'Unknown error'}`, 'WEBHOOK_PROCESSING_ERROR')
    }
  }

  /**
   * Process checkout created webhook
   */
  private async processCheckoutCreated(storeId: string, checkout: any): Promise<WebhookProcessingResult> {
    try {
      const supabase = await createClient()

      // Store checkout data for abandonment tracking
      const checkoutData = {
        store_id: storeId,
        shopify_checkout_token: checkout.token,
        email: checkout.email,
        cart_token: checkout.cart_token,
        total_price: parseFloat(String(checkout.total_price || '0')),
        currency: checkout.currency,
        line_items_count: checkout.line_items?.length || 0,
        created_at_shopify: new Date(checkout.created_at),
        updated_at_shopify: new Date(checkout.updated_at),
        completed_at: checkout.completed_at ? new Date(checkout.completed_at) : null,
        abandoned: false
      }

      // Insert or update checkout record
      const { error } = await (supabase
        .from('shopify_checkouts') as any)
        .upsert(checkoutData, { 
          onConflict: 'store_id,shopify_checkout_token',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Failed to store checkout:', error)
      }

      console.log(`Checkout created: ${checkout.token} for store ${storeId}`)

      return {
        success: true,
        processed: true,
        data: { checkoutToken: checkout.token }
      }
    } catch (error) {
      throw new ShopifyError(
        `Failed to process checkout created: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'WEBHOOK_PROCESSING_ERROR'
      )
    }
  }

  /**
   * Process checkout updated webhook
   */
  private async processCheckoutUpdated(storeId: string, checkout: any): Promise<WebhookProcessingResult> {
    try {
      const supabase = await createClient()

      // Check if checkout was completed (converted to order)
      const isCompleted = checkout.completed_at !== null

      if (isCompleted) {
        // Mark as completed, not abandoned
        await (supabase
          .from('shopify_checkouts') as any)
          .update({
            completed_at: new Date(checkout.completed_at),
            abandoned: false,
            updated_at_shopify: new Date(checkout.updated_at)
          })
          .eq('store_id', storeId)
          .eq('shopify_checkout_token', checkout.token)

        console.log(`Checkout completed: ${checkout.token}`)
      } else {
        // Check if checkout should be marked as abandoned
        const createdAt = new Date(checkout.created_at)
        const now = new Date()
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

        // Mark as abandoned if more than 1 hour old and not completed
        if (hoursSinceCreation >= 1) {
          // Update checkout as abandoned
          const { data: existingCheckout } = await (supabase
            .from('shopify_checkouts') as any)
            .select('abandoned')
            .eq('store_id', storeId)
            .eq('shopify_checkout_token', checkout.token)
            .single()

          // Only trigger automation if not already marked as abandoned
          if (existingCheckout && !existingCheckout.abandoned) {
            await (supabase
              .from('shopify_checkouts') as any)
              .update({
                abandoned: true,
                updated_at_shopify: new Date(checkout.updated_at)
              })
              .eq('store_id', storeId)
              .eq('shopify_checkout_token', checkout.token)

            console.log(`Checkout abandoned: ${checkout.token}`)

            // Trigger cart abandonment automation
            await this.triggerAutomations(storeId, 'cart_abandoned', {
              checkout,
              email: checkout.email,
              cart_token: checkout.cart_token,
              total_price: checkout.total_price,
              line_items: checkout.line_items,
              abandoned_checkout_url: checkout.abandoned_checkout_url
            })
          }
        }
      }

      return {
        success: true,
        processed: true,
        data: { checkoutToken: checkout.token }
      }
    } catch (error) {
      throw new ShopifyError(
        `Failed to process checkout updated: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'WEBHOOK_PROCESSING_ERROR'
      )
    }
  }

  /**
   * Upsert customer contact from Shopify customer data
   */
  private async upsertCustomerContact(storeId: string, customer: ShopifyCustomer): Promise<void> {
    const supabase = await createClient()

    const contactData: CreateContact = {
      store_id: storeId,
      email: customer.email,
      phone: customer.phone || null,
      first_name: customer.first_name || null,
      last_name: customer.last_name || null,
      shopify_customer_id: customer.id.toString(),
      tags: Array.isArray(customer.tags) ? customer.tags : [],
      segments: [], // Initialize empty segments array
      email_consent: customer.accepts_marketing || false,
      sms_consent: false, // Default to false, will be updated based on actual consent
      total_spent: parseFloat(customer.total_spent || '0'),
      order_count: customer.orders_count || 0,
      last_order_at: null, // Will be updated when processing orders
    }

    const { error } = await supabase
      .from('contacts')
      .upsert(contactData, {
        onConflict: 'store_id,email',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Failed to upsert customer contact:', error)
      throw new ShopifyError('Failed to update customer contact', 'CONTACT_UPDATE_ERROR')
    }
  }

  /**
   * Update customer metrics
   */
  private async updateCustomerMetrics(storeId: string, customerId: number, metrics: { totalSpent: number; orderCount: number }): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('contacts')
      .update({
        total_spent: metrics.totalSpent,
        order_count: metrics.orderCount,
        updated_at: new Date(),
      })
      .eq('store_id', storeId)
      .eq('shopify_customer_id', customerId.toString())

    if (error) {
      console.error('Failed to update customer metrics:', error)
    }
  }

  /**
   * Trigger automation workflows
   */
  private async triggerAutomations(storeId: string, triggerType: string, data: Record<string, unknown>): Promise<void> {
    try {
      // Import automation engine dynamically to avoid circular dependencies
      const { automationEngine } = await import('../automation')
      
      // Create trigger event
      const triggerEvent = {
        type: triggerType as 'order_created' | 'order_paid' | 'order_updated' | 'customer_created' | 'customer_updated' | 'cart_abandoned' | 
              'order_refunded' | 'ordered_product' | 'paid_for_order' | 'placed_order' | 'product_back_in_stock' | 
              'special_occasion_birthday' | 'started_checkout' | 'customer_subscribed' | 'viewed_page' | 'viewed_product' | 
              'clicked_message' | 'entered_segment' | 'exited_segment' | 'marked_message_as_spam' | 'message_delivery_failed' | 
              'message_sent' | 'opened_message' | 'order_canceled' | 'order_fulfilled',
        storeId,
        data,
        timestamp: new Date()
      }

      // Process trigger event through automation engine
      const executions = await automationEngine.processTriggerEvent(triggerEvent)
      
      console.log(`Triggered ${executions.length} workflow executions for ${triggerType}`)
      
      // Log execution results
      for (const execution of executions) {
        if (execution.status === 'failed') {
          console.error(`Workflow execution failed: ${execution.workflowId} - ${execution.error}`)
        } else {
          console.log(`Workflow execution ${execution.status}: ${execution.workflowId}`)
        }
      }
    } catch (error) {
      console.error('Failed to trigger automations:', error)
    }
  }

  /**
   * Get webhook processing statistics
   */
  async getProcessingStats(storeId: string, since?: Date): Promise<{
    totalProcessed: number
    successfullyProcessed: number
    failedProcessing: number
    byTopic: Record<string, number>
  }> {
    // This would typically query a webhook_logs table
    // For now, return mock data
    return {
      totalProcessed: 0,
      successfullyProcessed: 0,
      failedProcessing: 0,
      byTopic: {},
    }
  }
}

// Export singleton instance
export const webhookProcessor = new WebhookProcessor()