// SMS Campaign Management Service
import { 
  SMSCampaignRepository, 
  CampaignTemplateRepository,
  ContactRepository 
} from '../database/repositories'
import {
  SMSCampaign,
  CreateSMSCampaign,
  UpdateSMSCampaign,
  CampaignTemplate,
  CreateCampaignTemplate,
  Contact
} from '../database/types'
import { DatabaseResult, DatabaseListResult } from '../database/client'

export interface SMSCampaignPreview {
  message: string
  fromNumber: string
  recipientCount: number
  estimatedDeliveryTime: string
  characterCount: number
  messageSegments: number
  estimatedCost: number
}

export interface SMSCampaignValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface SMSTemplateVariable {
  name: string
  type: 'text' | 'number' | 'date' | 'boolean'
  defaultValue?: string
  required: boolean
}

export class SMSCampaignManager {
  private smsCampaignRepo: SMSCampaignRepository
  private templateRepo: CampaignTemplateRepository
  private contactRepo: ContactRepository

  // SMS pricing constants (approximate Telnyx rates)
  private readonly SMS_COST_PER_SEGMENT = 0.004 // $0.004 per segment
  private readonly SMS_SEGMENT_LENGTH = 160 // characters per segment

  constructor() {
    this.smsCampaignRepo = new SMSCampaignRepository()
    this.templateRepo = new CampaignTemplateRepository()
    this.contactRepo = new ContactRepository()
  }

  // Campaign CRUD Operations
  async createCampaign(data: CreateSMSCampaign): Promise<DatabaseResult<SMSCampaign>> {
    // Validate campaign data before creation
    const validation = await this.validateCampaign(data)
    if (!validation.isValid) {
      return {
        data: null,
        error: new Error(`SMS campaign validation failed: ${validation.errors.join(', ')}`)
      }
    }

    return this.smsCampaignRepo.createCampaign(data)
  }

  async updateCampaign(id: string, data: UpdateSMSCampaign): Promise<DatabaseResult<SMSCampaign>> {
    // If updating content fields, validate the campaign
    if (data.message || data.from_number) {
      const { data: existingCampaign, error } = await this.smsCampaignRepo.getCampaign(id)
      if (error || !existingCampaign) {
        return { data: null, error: error || new Error('Campaign not found') }
      }

      const mergedData = { ...existingCampaign, ...data }
      const validation = await this.validateCampaign(mergedData)
      if (!validation.isValid) {
        return {
          data: null,
          error: new Error(`SMS campaign validation failed: ${validation.errors.join(', ')}`)
        }
      }
    }

    return this.smsCampaignRepo.updateCampaign(id, data)
  }

  async getCampaign(id: string): Promise<DatabaseResult<SMSCampaign>> {
    return this.smsCampaignRepo.getCampaign(id)
  }

  async getStoreCampaigns(storeId: string): Promise<DatabaseListResult<SMSCampaign>> {
    return this.smsCampaignRepo.getStoreCampaigns(storeId)
  }

  async deleteCampaign(id: string): Promise<DatabaseResult<boolean>> {
    // Check if campaign is in a state that allows deletion
    const { data: campaign, error } = await this.smsCampaignRepo.getCampaign(id)
    if (error || !campaign) {
      return { data: false, error: error || new Error('Campaign not found') }
    }

    if (campaign.status === 'sending') {
      return {
        data: false,
        error: new Error('Cannot delete SMS campaign that is currently sending')
      }
    }

    return this.smsCampaignRepo.deleteCampaign(id)
  }

  // Campaign Validation
  async validateCampaign(campaign: CreateSMSCampaign | SMSCampaign): Promise<SMSCampaignValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Required field validation
    if (!campaign.name?.trim()) {
      errors.push('Campaign name is required')
    }

    if (!campaign.message?.trim()) {
      errors.push('SMS message is required')
    }

    if (!campaign.from_number?.trim()) {
      errors.push('From number is required')
    }

    // Phone number format validation
    if (campaign.from_number && !this.isValidPhoneNumber(campaign.from_number)) {
      errors.push('From number must be a valid phone number')
    }

    // Message length validation
    if (campaign.message) {
      const messageLength = campaign.message.length
      const segments = Math.ceil(messageLength / this.SMS_SEGMENT_LENGTH)

      if (messageLength > 1600) { // 10 segments max
        errors.push('SMS message is too long (maximum 1600 characters)')
      } else if (segments > 3) {
        warnings.push(`SMS message will be sent as ${segments} segments, which may increase costs`)
      }

      if (messageLength > 160) {
        warnings.push('SMS message exceeds single segment length (160 characters)')
      }
    }

    // Content validation
    if (campaign.message && this.containsProhibitedContent(campaign.message)) {
      errors.push('SMS message contains prohibited content')
    }

    // Compliance validation - SMS must include opt-out instructions
    if (campaign.message && !this.hasOptOutInstructions(campaign.message)) {
      errors.push('SMS message must include opt-out instructions (e.g., "Reply STOP to opt out")')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Campaign Preview
  async generatePreview(
    campaignId: string, 
    contactId?: string
  ): Promise<DatabaseResult<SMSCampaignPreview>> {
    const { data: campaign, error } = await this.smsCampaignRepo.getCampaign(campaignId)
    if (error || !campaign) {
      return { data: null, error: error || new Error('Campaign not found') }
    }

    // Get a sample contact for personalization if none provided
    let contact: Contact | null = null
    if (contactId) {
      const { data: specificContact, error: contactError } = await this.contactRepo.getContact(contactId)
      if (contactError) {
        return { data: null, error: contactError }
      }
      contact = specificContact
    } else {
      // Get first contact from store for preview
      const { data: contacts } = await this.contactRepo.getStoreContacts(campaign.store_id, { limit: 1 })
      contact = contacts.length > 0 ? contacts[0] : null
    }

    // Get recipient count
    const { data: allContacts } = await this.contactRepo.getStoreContacts(campaign.store_id, {
      smsConsent: true
    })
    const recipientCount = allContacts.length

    // Personalize content if contact is available
    const personalizedMessage = contact ? this.personalizeContent(campaign.message, contact) : campaign.message

    // Calculate message metrics
    const characterCount = personalizedMessage.length
    const messageSegments = Math.ceil(characterCount / this.SMS_SEGMENT_LENGTH)
    const estimatedCost = recipientCount * messageSegments * this.SMS_COST_PER_SEGMENT

    // Estimate delivery time (SMS is typically much faster than email)
    const estimatedMinutes = Math.ceil(recipientCount / 1000) // Assume 1000 SMS per minute
    const estimatedDeliveryTime = estimatedMinutes < 1 ? 
      'Less than 1 minute' : 
      estimatedMinutes < 60 ? `${estimatedMinutes} minutes` : `${Math.ceil(estimatedMinutes / 60)} hours`

    return {
      data: {
        message: personalizedMessage,
        fromNumber: campaign.from_number,
        recipientCount,
        estimatedDeliveryTime,
        characterCount,
        messageSegments,
        estimatedCost
      },
      error: null
    }
  }

  // Template Management
  async saveTemplate(data: CreateCampaignTemplate): Promise<DatabaseResult<CampaignTemplate>> {
    // Validate template data
    if (!data.name?.trim()) {
      return { data: null, error: new Error('Template name is required') }
    }

    if (!data.content?.trim()) {
      return { data: null, error: new Error('Template content is required') }
    }

    if (data.type !== 'sms') {
      return { data: null, error: new Error('Invalid template type for SMS campaign') }
    }

    // Validate SMS template content
    if (data.content.length > 1600) {
      return { data: null, error: new Error('SMS template content is too long (maximum 1600 characters)') }
    }

    return this.templateRepo.createTemplate(data)
  }

  async getTemplate(id: string): Promise<DatabaseResult<CampaignTemplate>> {
    return this.templateRepo.getTemplate(id)
  }

  async getStoreTemplates(storeId: string): Promise<DatabaseListResult<CampaignTemplate>> {
    return this.templateRepo.getStoreTemplates(storeId, 'sms')
  }

  async updateTemplate(id: string, data: Partial<CampaignTemplate>): Promise<DatabaseResult<CampaignTemplate>> {
    const updateData = { ...data }
    delete updateData.id
    delete updateData.store_id
    delete updateData.created_at
    delete updateData.updated_at

    return this.templateRepo.updateTemplate(id, updateData)
  }

  async deleteTemplate(id: string): Promise<DatabaseResult<boolean>> {
    return this.templateRepo.deleteTemplate(id)
  }

  async createCampaignFromTemplate(
    templateId: string, 
    campaignData: Partial<CreateSMSCampaign>
  ): Promise<DatabaseResult<SMSCampaign>> {
    const { data: template, error } = await this.templateRepo.getTemplate(templateId)
    if (error || !template) {
      return { data: null, error: error || new Error('Template not found') }
    }

    if (template.type !== 'sms') {
      return { data: null, error: new Error('Template is not an SMS template') }
    }

    // Create campaign with template content
    const newCampaign: CreateSMSCampaign = {
      store_id: template.store_id,
      name: campaignData.name || `SMS Campaign from ${template.name}`,
      message: template.content,
      from_number: campaignData.from_number || '',
      status: 'draft',
      scheduled_at: campaignData.scheduled_at || null,
      sent_at: null,
      recipient_count: 0,
      delivered_count: 0,
      ...campaignData
    }

    return this.createCampaign(newCampaign)
  }

  // Helper Methods
  private isValidPhoneNumber(phone: string): boolean {
    // Basic phone number validation - should start with + and contain only digits
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    return phoneRegex.test(phone)
  }

  private hasOptOutInstructions(message: string): boolean {
    // Check for common opt-out patterns
    const optOutPatterns = [
      /reply\s+stop/i,
      /text\s+stop/i,
      /send\s+stop/i,
      /opt.?out/i,
      /unsubscribe/i,
      /{{opt_out}}/i,
      /%opt_out%/i
    ]

    return optOutPatterns.some(pattern => pattern.test(message))
  }

  private containsProhibitedContent(message: string): boolean {
    // Check for prohibited content patterns
    const prohibitedPatterns = [
      /\b(loan|credit|debt)\b.*\b(guaranteed|approved)\b/i,
      /\b(free|win|winner|won)\b.*\b(money|cash|prize)\b/i,
      /\b(urgent|act now|limited time)\b.*\b(offer|deal)\b/i,
      /\b(click here|call now)\b/i
    ]

    return prohibitedPatterns.some(pattern => pattern.test(message))
  }

  private personalizeContent(content: string, contact: Contact): string {
    let personalized = content

    // Replace common personalization tokens
    const replacements: Record<string, string> = {
      '{{first_name}}': contact.first_name || 'there',
      '{{last_name}}': contact.last_name || '',
      '{{email}}': contact.email,
      '{{phone}}': contact.phone || '',
      '{{full_name}}': `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email,
      '{{total_spent}}': `$${contact.total_spent.toFixed(2)}`,
      '{{order_count}}': contact.order_count.toString()
    }

    Object.entries(replacements).forEach(([token, value]) => {
      personalized = personalized.replace(new RegExp(token, 'g'), value)
    })

    return personalized
  }

  // Extract template variables from content
  extractTemplateVariables(content: string): SMSTemplateVariable[] {
    const variableRegex = /\{\{(\w+)\}\}/g
    const variables: SMSTemplateVariable[] = []
    const found = new Set<string>()

    let match
    while ((match = variableRegex.exec(content)) !== null) {
      const variableName = match[1]
      if (!found.has(variableName)) {
        found.add(variableName)
        
        // Determine variable type based on common patterns
        let type: 'text' | 'number' | 'date' | 'boolean' = 'text'
        if (['total_spent', 'order_count', 'price', 'amount'].includes(variableName)) {
          type = 'number'
        } else if (['date', 'created_at', 'updated_at', 'last_order_at'].includes(variableName)) {
          type = 'date'
        } else if (['active', 'consent', 'subscribed'].includes(variableName)) {
          type = 'boolean'
        }

        variables.push({
          name: variableName,
          type,
          required: true,
          defaultValue: type === 'text' ? '' : undefined
        })
      }
    }

    return variables
  }

  // Calculate SMS metrics
  calculateSMSMetrics(message: string, recipientCount: number) {
    const characterCount = message.length
    const messageSegments = Math.ceil(characterCount / this.SMS_SEGMENT_LENGTH)
    const totalSegments = recipientCount * messageSegments
    const estimatedCost = totalSegments * this.SMS_COST_PER_SEGMENT

    return {
      characterCount,
      messageSegments,
      totalSegments,
      estimatedCost,
      costPerRecipient: messageSegments * this.SMS_COST_PER_SEGMENT
    }
  }

  // Alias for compatibility
  async getCampaignsByStore(storeId: string): Promise<SMSCampaign[]> {
    const result = await this.getStoreCampaigns(storeId)
    return result.data || []
  }
}

// Export singleton instance
export const smsCampaignManager = new SMSCampaignManager()