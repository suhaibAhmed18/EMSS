// Email Campaign Management Service
import { 
  EmailCampaignRepository, 
  CampaignTemplateRepository,
  ContactRepository 
} from '../database/repositories'
import {
  EmailCampaign,
  CreateEmailCampaign,
  UpdateEmailCampaign,
  CampaignTemplate,
  CreateCampaignTemplate,
  Contact
} from '../database/types'
import { DatabaseResult, DatabaseListResult } from '../database/client'

export interface CampaignPreview {
  subject: string
  htmlContent: string
  textContent: string | null
  fromEmail: string
  fromName: string
  recipientCount: number
  estimatedDeliveryTime: string
}

export interface CampaignValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface TemplateVariable {
  name: string
  type: 'text' | 'number' | 'date' | 'boolean'
  defaultValue?: string
  required: boolean
}

export class EmailCampaignManager {
  private emailCampaignRepo: EmailCampaignRepository
  private templateRepo: CampaignTemplateRepository
  private contactRepo: ContactRepository

  constructor() {
    this.emailCampaignRepo = new EmailCampaignRepository()
    this.templateRepo = new CampaignTemplateRepository()
    this.contactRepo = new ContactRepository()
  }

  // Campaign CRUD Operations
  async createCampaign(data: CreateEmailCampaign): Promise<DatabaseResult<EmailCampaign>> {
    // Validate campaign data before creation
    const validation = await this.validateCampaign(data)
    if (!validation.isValid) {
      return {
        data: null,
        error: new Error(`Campaign validation failed: ${validation.errors.join(', ')}`)
      }
    }

    return this.emailCampaignRepo.createCampaign(data)
  }

  async updateCampaign(id: string, data: UpdateEmailCampaign): Promise<DatabaseResult<EmailCampaign>> {
    // If updating content fields, validate the campaign
    if (data.subject || data.html_content || data.from_email || data.from_name) {
      const { data: existingCampaign, error } = await this.emailCampaignRepo.getCampaign(id)
      if (error || !existingCampaign) {
        return { data: null, error: error || new Error('Campaign not found') }
      }

      const mergedData = { ...existingCampaign, ...data }
      const validation = await this.validateCampaign(mergedData)
      if (!validation.isValid) {
        return {
          data: null,
          error: new Error(`Campaign validation failed: ${validation.errors.join(', ')}`)
        }
      }
    }

    return this.emailCampaignRepo.updateCampaign(id, data)
  }

  async getCampaign(id: string): Promise<DatabaseResult<EmailCampaign>> {
    return this.emailCampaignRepo.getCampaign(id)
  }

  async getStoreCampaigns(storeId: string): Promise<DatabaseListResult<EmailCampaign>> {
    return this.emailCampaignRepo.getStoreCampaigns(storeId)
  }

  async deleteCampaign(id: string): Promise<DatabaseResult<boolean>> {
    // Check if campaign is in a state that allows deletion
    const { data: campaign, error } = await this.emailCampaignRepo.getCampaign(id)
    if (error || !campaign) {
      return { data: false, error: error || new Error('Campaign not found') }
    }

    if (campaign.status === 'sending') {
      return {
        data: false,
        error: new Error('Cannot delete campaign that is currently sending')
      }
    }

    return this.emailCampaignRepo.deleteCampaign(id)
  }

  // Campaign Validation
  async validateCampaign(campaign: CreateEmailCampaign | EmailCampaign): Promise<CampaignValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Required field validation
    if (!campaign.name?.trim()) {
      errors.push('Campaign name is required')
    }

    if (!campaign.subject?.trim()) {
      errors.push('Email subject is required')
    }

    if (!campaign.html_content?.trim()) {
      errors.push('Email content is required')
    }

    if (!campaign.from_email?.trim()) {
      errors.push('From email is required')
    }

    if (!campaign.from_name?.trim()) {
      errors.push('From name is required')
    }

    // Email format validation
    if (campaign.from_email && !this.isValidEmail(campaign.from_email)) {
      errors.push('From email must be a valid email address')
    }

    // Content validation
    if (campaign.subject && campaign.subject.length > 255) {
      errors.push('Email subject must be 255 characters or less')
    }

    if (campaign.html_content && campaign.html_content.length > 1000000) {
      warnings.push('Email content is very large and may cause delivery issues')
    }

    // Compliance validation
    if (campaign.html_content && !this.hasUnsubscribeLink(campaign.html_content)) {
      errors.push('Email content must include an unsubscribe link')
    }

    // Check for spam trigger words
    const spamScore = this.calculateSpamScore(campaign.subject || '', campaign.html_content || '')
    if (spamScore > 5) {
      warnings.push('Email content may trigger spam filters')
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
  ): Promise<DatabaseResult<CampaignPreview>> {
    const { data: campaign, error } = await this.emailCampaignRepo.getCampaign(campaignId)
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
      emailConsent: true
    })
    const recipientCount = allContacts.length

    // Personalize content if contact is available
    const personalizedSubject = contact ? this.personalizeContent(campaign.subject, contact) : campaign.subject
    const personalizedHtmlContent = contact ? this.personalizeContent(campaign.html_content, contact) : campaign.html_content
    const personalizedTextContent = campaign.text_content && contact ? 
      this.personalizeContent(campaign.text_content, contact) : campaign.text_content

    // Estimate delivery time (rough calculation)
    const estimatedMinutes = Math.ceil(recipientCount / 100) // Assume 100 emails per minute
    const estimatedDeliveryTime = estimatedMinutes < 60 ? 
      `${estimatedMinutes} minutes` : 
      `${Math.ceil(estimatedMinutes / 60)} hours`

    return {
      data: {
        subject: personalizedSubject,
        htmlContent: personalizedHtmlContent,
        textContent: personalizedTextContent,
        fromEmail: campaign.from_email,
        fromName: campaign.from_name,
        recipientCount,
        estimatedDeliveryTime
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

    if (data.type !== 'email') {
      return { data: null, error: new Error('Invalid template type for email campaign') }
    }

    return this.templateRepo.createTemplate(data)
  }

  async getTemplate(id: string): Promise<DatabaseResult<CampaignTemplate>> {
    return this.templateRepo.getTemplate(id)
  }

  async getStoreTemplates(storeId: string): Promise<DatabaseListResult<CampaignTemplate>> {
    return this.templateRepo.getStoreTemplates(storeId, 'email')
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
    campaignData: Partial<CreateEmailCampaign>
  ): Promise<DatabaseResult<EmailCampaign>> {
    const { data: template, error } = await this.templateRepo.getTemplate(templateId)
    if (error || !template) {
      return { data: null, error: error || new Error('Template not found') }
    }

    if (template.type !== 'email') {
      return { data: null, error: new Error('Template is not an email template') }
    }

    // Create campaign with template content
    const newCampaign: CreateEmailCampaign = {
      store_id: template.store_id,
      name: campaignData.name || `Campaign from ${template.name}`,
      subject: campaignData.subject || 'New Campaign',
      html_content: template.content,
      text_content: campaignData.text_content || null,
      from_email: campaignData.from_email || '',
      from_name: campaignData.from_name || '',
      status: 'draft',
      scheduled_at: campaignData.scheduled_at || null,
      sent_at: null,
      recipient_count: 0,
      delivered_count: 0,
      opened_count: 0,
      clicked_count: 0,
      ...campaignData
    }

    return this.createCampaign(newCampaign)
  }

  // Helper Methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private hasUnsubscribeLink(content: string): boolean {
    // Check for common unsubscribe patterns
    const unsubscribePatterns = [
      /unsubscribe/i,
      /opt.?out/i,
      /remove.?me/i,
      /{{unsubscribe_url}}/i,
      /%unsubscribe_url%/i
    ]

    return unsubscribePatterns.some(pattern => pattern.test(content))
  }

  private calculateSpamScore(subject: string, content: string): number {
    const spamWords = [
      'free', 'urgent', 'limited time', 'act now', 'click here',
      'guaranteed', 'no obligation', 'risk free', 'winner', 'congratulations'
    ]

    const text = (subject + ' ' + content).toLowerCase()
    let score = 0

    spamWords.forEach(word => {
      const matches = (text.match(new RegExp(word, 'g')) || []).length
      score += matches
    })

    // Additional checks
    if (subject.includes('!!!')) score += 2
    if (subject.toUpperCase() === subject && subject.length > 10) score += 2
    if (content.includes('$$$')) score += 1

    return score
  }

  private personalizeContent(content: string, contact: Contact): string {
    let personalized = content

    // Replace common personalization tokens
    const replacements: Record<string, string> = {
      '{{first_name}}': contact.first_name || 'there',
      '{{last_name}}': contact.last_name || '',
      '{{email}}': contact.email,
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
  extractTemplateVariables(content: string): TemplateVariable[] {
    const variableRegex = /\{\{(\w+)\}\}/g
    const variables: TemplateVariable[] = []
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

  // Alias for compatibility
  async getCampaignsByStore(storeId: string): Promise<EmailCampaign[]> {
    const result = await this.getStoreCampaigns(storeId)
    return result.data || []
  }
}

// Export singleton instance
export const emailCampaignManager = new EmailCampaignManager()