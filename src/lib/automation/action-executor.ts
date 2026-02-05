// Workflow action execution system
import { EmailCampaignManager } from '../campaigns/email-campaign-manager'
import { SMSCampaignManager } from '../campaigns/sms-campaign-manager'
import { ContactRepository } from '../database/repositories'
import { Contact } from '../database/types'

export interface WorkflowAction {
  id: string
  type: 'send_email' | 'send_sms' | 'delay' | 'add_tag' | 'update_customer' | 'remove_tag'
  config: ActionConfig
  delay?: number // minutes
}

export interface ActionConfig {
  [key: string]: unknown
}

export interface EmailActionConfig extends ActionConfig {
  templateId?: string
  subject: string
  htmlContent: string
  textContent?: string
  fromEmail: string
  fromName: string
}

export interface SMSActionConfig extends ActionConfig {
  templateId?: string
  message: string
  fromNumber: string
}

export interface TagActionConfig extends ActionConfig {
  tags: string[]
}

export interface CustomerUpdateActionConfig extends ActionConfig {
  updates: {
    firstName?: string
    lastName?: string
    phone?: string
    segments?: string[]
  }
}

export interface ActionExecutionResult {
  success: boolean
  actionId: string
  actionType: string
  executedAt: Date
  error?: string
  metadata?: Record<string, unknown>
}

export interface WorkflowExecutionContext {
  workflowId: string
  storeId: string
  triggerData: Record<string, unknown>
  contactId?: string
  contact?: Contact
}

export class WorkflowActionExecutor {
  private emailCampaignManager: EmailCampaignManager
  private smsCampaignManager: SMSCampaignManager
  private contactRepository: ContactRepository

  constructor() {
    this.emailCampaignManager = new EmailCampaignManager()
    this.smsCampaignManager = new SMSCampaignManager()
    this.contactRepository = new ContactRepository(true) // Use service role
  }

  /**
   * Execute a single workflow action
   */
  async executeAction(
    action: WorkflowAction,
    context: WorkflowExecutionContext
  ): Promise<ActionExecutionResult> {
    const startTime = new Date()

    try {
      // Apply delay if specified
      if (action.delay && action.delay > 0) {
        await this.delay(action.delay * 60 * 1000) // Convert minutes to milliseconds
      }

      let result: ActionExecutionResult

      switch (action.type) {
        case 'send_email':
          result = await this.executeSendEmailAction(action, context)
          break
        
        case 'send_sms':
          result = await this.executeSendSMSAction(action, context)
          break
        
        case 'add_tag':
          result = await this.executeAddTagAction(action, context)
          break
        
        case 'remove_tag':
          result = await this.executeRemoveTagAction(action, context)
          break
        
        case 'update_customer':
          result = await this.executeUpdateCustomerAction(action, context)
          break
        
        case 'delay':
          result = await this.executeDelayAction(action, context)
          break
        
        default:
          throw new Error(`Unknown action type: ${action.type}`)
      }

      return {
        ...result,
        executedAt: startTime
      }
    } catch (error) {
      return {
        success: false,
        actionId: action.id,
        actionType: action.type,
        executedAt: startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Execute multiple actions in sequence
   */
  async executeActions(
    actions: WorkflowAction[],
    context: WorkflowExecutionContext
  ): Promise<ActionExecutionResult[]> {
    const results: ActionExecutionResult[] = []

    for (const action of actions) {
      const result = await this.executeAction(action, context)
      results.push(result)

      // Stop execution if an action fails
      if (!result.success) {
        console.error(`Action ${action.id} failed, stopping workflow execution:`, result.error)
        break
      }
    }

    return results
  }

  /**
   * Execute send email action
   */
  private async executeSendEmailAction(
    action: WorkflowAction,
    context: WorkflowExecutionContext
  ): Promise<ActionExecutionResult> {
    const config = action.config as EmailActionConfig
    
    // Get contact if not provided
    let contact = context.contact
    if (!contact && context.contactId) {
      const { data: contactData, error } = await this.contactRepository.getContact(context.contactId)
      if (error || !contactData) {
        throw new Error(`Failed to get contact: ${error?.message}`)
      }
      contact = contactData
    }

    if (!contact) {
      throw new Error('No contact available for email action')
    }

    // Check email consent
    if (!contact.email_consent) {
      throw new Error('Contact has not consented to email marketing')
    }

    // Create and send email campaign
    const campaignData = {
      store_id: context.storeId,
      name: `Automation: ${context.workflowId} - ${action.id}`,
      subject: this.interpolateTemplate(config.subject, context.triggerData, contact),
      html_content: this.interpolateTemplate(config.htmlContent, context.triggerData, contact),
      text_content: config.textContent ? this.interpolateTemplate(config.textContent, context.triggerData, contact) : null,
      from_email: config.fromEmail,
      from_name: config.fromName,
      status: 'draft' as const,
      scheduled_at: null,
      sent_at: null,
      recipient_count: 0,
      delivered_count: 0,
      opened_count: 0,
      clicked_count: 0
    }

    const { data: campaign, error: campaignError } = await this.emailCampaignManager.createCampaign(campaignData)
    if (campaignError || !campaign) {
      throw new Error(`Failed to create email campaign: ${campaignError?.message}`)
    }

    // Send to single contact using email service
    const { emailService } = await import('../email/email-service')
    const sendResult = await emailService.sendCampaign(campaign, [contact])
    if (sendResult.failed > 0) {
      throw new Error(`Failed to send email: ${sendResult.failed} failed out of ${sendResult.results.length}`)
    }

    return {
      success: true,
      actionId: action.id,
      actionType: action.type,
      executedAt: new Date(),
      metadata: {
        campaignId: campaign.id,
        recipientEmail: contact.email,
        sendResult
      }
    }
  }

  /**
   * Execute send SMS action
   */
  private async executeSendSMSAction(
    action: WorkflowAction,
    context: WorkflowExecutionContext
  ): Promise<ActionExecutionResult> {
    const config = action.config as SMSActionConfig
    
    // Get contact if not provided
    let contact = context.contact
    if (!contact && context.contactId) {
      const { data: contactData, error } = await this.contactRepository.getContact(context.contactId)
      if (error || !contactData) {
        throw new Error(`Failed to get contact: ${error?.message}`)
      }
      contact = contactData
    }

    if (!contact) {
      throw new Error('No contact available for SMS action')
    }

    // Check SMS consent and phone number
    if (!contact.sms_consent) {
      throw new Error('Contact has not consented to SMS marketing')
    }

    if (!contact.phone) {
      throw new Error('Contact has no phone number')
    }

    // Create and send SMS campaign
    const campaignData = {
      store_id: context.storeId,
      name: `Automation: ${context.workflowId} - ${action.id}`,
      message: this.interpolateTemplate(config.message, context.triggerData, contact),
      from_number: config.fromNumber,
      status: 'draft' as const,
      scheduled_at: null,
      sent_at: null,
      recipient_count: 0,
      delivered_count: 0
    }

    const { data: campaign, error: campaignError } = await this.smsCampaignManager.createCampaign(campaignData)
    if (campaignError || !campaign) {
      throw new Error(`Failed to create SMS campaign: ${campaignError?.message}`)
    }

    // Send to single contact using SMS service
    const { smsService } = await import('../sms/sms-service')
    const sendResult = await smsService.sendCampaign(campaign, [contact])
    if (sendResult.failed > 0) {
      throw new Error(`Failed to send SMS: ${sendResult.failed} failed out of ${sendResult.results.length}`)
    }

    return {
      success: true,
      actionId: action.id,
      actionType: action.type,
      executedAt: new Date(),
      metadata: {
        campaignId: campaign.id,
        recipientPhone: contact.phone,
        sendResult
      }
    }
  }

  /**
   * Execute add tag action
   */
  private async executeAddTagAction(
    action: WorkflowAction,
    context: WorkflowExecutionContext
  ): Promise<ActionExecutionResult> {
    const config = action.config as TagActionConfig
    
    if (!context.contactId) {
      throw new Error('No contact ID available for tag action')
    }

    // Get current contact
    const { data: contact, error } = await this.contactRepository.getContact(context.contactId)
    if (error || !contact) {
      throw new Error(`Failed to get contact: ${error?.message}`)
    }

    // Add new tags (avoid duplicates)
    const currentTags = new Set(contact.tags)
    config.tags.forEach(tag => currentTags.add(tag))
    const updatedTags = Array.from(currentTags)

    // Update contact
    const { error: updateError } = await this.contactRepository.updateContact(context.contactId, {
      tags: updatedTags
    })

    if (updateError) {
      throw new Error(`Failed to update contact tags: ${updateError.message}`)
    }

    return {
      success: true,
      actionId: action.id,
      actionType: action.type,
      executedAt: new Date(),
      metadata: {
        contactId: context.contactId,
        addedTags: config.tags,
        finalTags: updatedTags
      }
    }
  }

  /**
   * Execute remove tag action
   */
  private async executeRemoveTagAction(
    action: WorkflowAction,
    context: WorkflowExecutionContext
  ): Promise<ActionExecutionResult> {
    const config = action.config as TagActionConfig
    
    if (!context.contactId) {
      throw new Error('No contact ID available for tag action')
    }

    // Get current contact
    const { data: contact, error } = await this.contactRepository.getContact(context.contactId)
    if (error || !contact) {
      throw new Error(`Failed to get contact: ${error?.message}`)
    }

    // Remove specified tags
    const updatedTags = contact.tags.filter(tag => !config.tags.includes(tag))

    // Update contact
    const { error: updateError } = await this.contactRepository.updateContact(context.contactId, {
      tags: updatedTags
    })

    if (updateError) {
      throw new Error(`Failed to update contact tags: ${updateError.message}`)
    }

    return {
      success: true,
      actionId: action.id,
      actionType: action.type,
      executedAt: new Date(),
      metadata: {
        contactId: context.contactId,
        removedTags: config.tags,
        finalTags: updatedTags
      }
    }
  }

  /**
   * Execute update customer action
   */
  private async executeUpdateCustomerAction(
    action: WorkflowAction,
    context: WorkflowExecutionContext
  ): Promise<ActionExecutionResult> {
    const config = action.config as CustomerUpdateActionConfig
    
    if (!context.contactId) {
      throw new Error('No contact ID available for customer update action')
    }

    // Update contact
    const updateData: Record<string, unknown> = {}
    
    if (config.updates.firstName !== undefined) {
      updateData.first_name = config.updates.firstName
    }
    if (config.updates.lastName !== undefined) {
      updateData.last_name = config.updates.lastName
    }
    if (config.updates.phone !== undefined) {
      updateData.phone = config.updates.phone
    }
    if (config.updates.segments !== undefined) {
      updateData.segments = config.updates.segments
    }

    const { error: updateError } = await this.contactRepository.updateContact(context.contactId, updateData)

    if (updateError) {
      throw new Error(`Failed to update contact: ${updateError.message}`)
    }

    return {
      success: true,
      actionId: action.id,
      actionType: action.type,
      executedAt: new Date(),
      metadata: {
        contactId: context.contactId,
        updates: config.updates
      }
    }
  }

  /**
   * Execute delay action
   */
  private async executeDelayAction(
    action: WorkflowAction,
    _context: WorkflowExecutionContext
  ): Promise<ActionExecutionResult> {
    const delayMinutes = action.delay || 0
    
    if (delayMinutes > 0) {
      await this.delay(delayMinutes * 60 * 1000)
    }

    return {
      success: true,
      actionId: action.id,
      actionType: action.type,
      executedAt: new Date(),
      metadata: {
        delayMinutes
      }
    }
  }

  /**
   * Interpolate template with trigger data and contact info
   */
  private interpolateTemplate(template: string, triggerData: Record<string, unknown>, contact?: Contact): string {
    let result = template

    // Replace contact variables
    if (contact) {
      result = result.replace(/\{\{contact\.firstName\}\}/g, contact.first_name || '')
      result = result.replace(/\{\{contact\.lastName\}\}/g, contact.last_name || '')
      result = result.replace(/\{\{contact\.email\}\}/g, contact.email || '')
      result = result.replace(/\{\{contact\.phone\}\}/g, contact.phone || '')
      result = result.replace(/\{\{contact\.totalSpent\}\}/g, contact.total_spent.toString())
      result = result.replace(/\{\{contact\.orderCount\}\}/g, contact.order_count.toString())
    }

    // Replace trigger data variables
    if (triggerData) {
      // Handle nested object properties
      const replaceNestedVars = (obj: Record<string, unknown>, prefix = 'trigger') => {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null) {
            replaceNestedVars(value as Record<string, unknown>, `${prefix}.${key}`)
          } else {
            const pattern = new RegExp(`\\{\\{${prefix}\\.${key}\\}\\}`, 'g')
            result = result.replace(pattern, String(value || ''))
          }
        }
      }
      
      replaceNestedVars(triggerData)
    }

    return result
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Validate action configuration
   */
  validateActionConfig(action: WorkflowAction): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!action.id) {
      errors.push('Action ID is required')
    }

    if (!action.type) {
      errors.push('Action type is required')
    }

    const validActionTypes = ['send_email', 'send_sms', 'delay', 'add_tag', 'remove_tag', 'update_customer']
    if (action.type && !validActionTypes.includes(action.type)) {
      errors.push(`Invalid action type: ${action.type}`)
    }

    // Validate specific action configs
    switch (action.type) {
      case 'send_email':
        const emailConfig = action.config as EmailActionConfig
        if (!emailConfig.subject) errors.push('Email action: subject is required')
        if (!emailConfig.htmlContent) errors.push('Email action: htmlContent is required')
        if (!emailConfig.fromEmail) errors.push('Email action: fromEmail is required')
        if (!emailConfig.fromName) errors.push('Email action: fromName is required')
        break

      case 'send_sms':
        const smsConfig = action.config as SMSActionConfig
        if (!smsConfig.message) errors.push('SMS action: message is required')
        if (!smsConfig.fromNumber) errors.push('SMS action: fromNumber is required')
        break

      case 'add_tag':
      case 'remove_tag':
        const tagConfig = action.config as TagActionConfig
        if (!tagConfig.tags || !Array.isArray(tagConfig.tags) || tagConfig.tags.length === 0) {
          errors.push(`${action.type} action: tags array is required`)
        }
        break

      case 'update_customer':
        const updateConfig = action.config as CustomerUpdateActionConfig
        if (!updateConfig.updates || Object.keys(updateConfig.updates).length === 0) {
          errors.push('Update customer action: updates object is required')
        }
        break
    }

    if (action.delay !== undefined && (typeof action.delay !== 'number' || action.delay < 0)) {
      errors.push('Action delay must be a non-negative number')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Singleton instance
export const workflowActionExecutor = new WorkflowActionExecutor()