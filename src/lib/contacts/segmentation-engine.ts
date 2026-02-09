import { ContactRepository } from '../database/repositories'
import { Contact } from '../database/types'
import { DatabaseResult, DatabaseListResult } from '../database/client'

// Segmentation criteria types
export interface SegmentCriteria {
  name: string
  description?: string
  conditions: SegmentCondition[]
  operator: 'AND' | 'OR' // How to combine multiple conditions
}

export interface SegmentCondition {
  field: SegmentField
  operator: SegmentOperator
  value: string | number | Date | boolean | string[]
  valueType?: 'string' | 'number' | 'date' | 'boolean' | 'array'
}

export type SegmentField = 
  | 'email'
  | 'first_name'
  | 'last_name'
  | 'phone'
  | 'total_spent'
  | 'order_count'
  | 'email_consent'
  | 'sms_consent'
  | 'tags'
  | 'segments'
  | 'created_at'
  | 'updated_at'
  | 'last_order_at'
  | 'shopify_customer_id'

export type SegmentOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'
  | 'has_tag'
  | 'not_has_tag'
  | 'has_any_tag'
  | 'has_all_tags'
  | 'in_segment'
  | 'not_in_segment'

export interface SegmentResult {
  segmentName: string
  contacts: Contact[]
  count: number
  criteria: SegmentCriteria
  lastUpdated: Date
}

export interface SegmentPerformance {
  segmentName: string
  contactCount: number
  emailOpenRate?: number
  emailClickRate?: number
  smsResponseRate?: number
  totalRevenue: number
  averageOrderValue: number
  conversionRate?: number
  lastCampaignSent?: Date
  performance: 'high' | 'medium' | 'low'
}

// Pre-defined segment templates
export const SEGMENT_TEMPLATES: Record<string, SegmentCriteria> = {
  'high-value-customers': {
    name: 'High Value Customers',
    description: 'Customers who have spent more than $500',
    operator: 'AND',
    conditions: [
      {
        field: 'total_spent',
        operator: 'greater_than',
        value: 500,
        valueType: 'number'
      }
    ]
  },
  'frequent-buyers': {
    name: 'Frequent Buyers',
    description: 'Customers with 5 or more orders',
    operator: 'AND',
    conditions: [
      {
        field: 'order_count',
        operator: 'greater_than_or_equal',
        value: 5,
        valueType: 'number'
      }
    ]
  },
  'recent-customers': {
    name: 'Recent Customers',
    description: 'Customers who made a purchase in the last 30 days',
    operator: 'AND',
    conditions: [
      {
        field: 'last_order_at',
        operator: 'greater_than',
        value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        valueType: 'date'
      }
    ]
  },
  'email-subscribers': {
    name: 'Email Subscribers',
    description: 'Customers who have consented to email marketing',
    operator: 'AND',
    conditions: [
      {
        field: 'email_consent',
        operator: 'equals',
        value: true,
        valueType: 'boolean'
      }
    ]
  },
  'sms-subscribers': {
    name: 'SMS Subscribers',
    description: 'Customers who have consented to SMS marketing',
    operator: 'AND',
    conditions: [
      {
        field: 'sms_consent',
        operator: 'equals',
        value: true,
        valueType: 'boolean'
      }
    ]
  },
  'vip-customers': {
    name: 'VIP Customers',
    description: 'High value customers with frequent purchases',
    operator: 'AND',
    conditions: [
      {
        field: 'total_spent',
        operator: 'greater_than',
        value: 1000,
        valueType: 'number'
      },
      {
        field: 'order_count',
        operator: 'greater_than_or_equal',
        value: 3,
        valueType: 'number'
      }
    ]
  },
  'at-risk-customers': {
    name: 'At Risk Customers',
    description: 'Customers who haven\'t purchased in 90+ days but have made purchases before',
    operator: 'AND',
    conditions: [
      {
        field: 'order_count',
        operator: 'greater_than',
        value: 0,
        valueType: 'number'
      },
      {
        field: 'last_order_at',
        operator: 'less_than',
        value: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        valueType: 'date'
      }
    ]
  },
  'new-customers': {
    name: 'New Customers',
    description: 'Customers who joined in the last 7 days',
    operator: 'AND',
    conditions: [
      {
        field: 'created_at',
        operator: 'greater_than',
        value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        valueType: 'date'
      }
    ]
  }
}

export class SegmentationEngine {
  private repository: ContactRepository

  constructor(useServiceRole = false) {
    this.repository = new ContactRepository(useServiceRole)
  }

  /**
   * Evaluate segmentation criteria and return matching contacts
   */
  async evaluateSegment(
    storeId: string,
    criteria: SegmentCriteria
  ): Promise<DatabaseResult<SegmentResult>> {
    try {
      // Get all contacts for the store
      const contactsResult = await this.repository.getStoreContacts(storeId)
      
      if (contactsResult.error) {
        return {
          data: null,
          error: contactsResult.error
        }
      }

      const allContacts = contactsResult.data
      const matchingContacts = this.filterContactsByCriteria(allContacts, criteria)

      return {
        data: {
          segmentName: criteria.name,
          contacts: matchingContacts,
          count: matchingContacts.length,
          criteria,
          lastUpdated: new Date()
        },
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to evaluate segment')
      }
    }
  }

  /**
   * Get contacts for a pre-defined segment template
   */
  async getSegmentContacts(
    storeId: string,
    segmentName: string
  ): Promise<DatabaseResult<SegmentResult>> {
    const template = SEGMENT_TEMPLATES[segmentName]
    if (!template) {
      return {
        data: null,
        error: new Error(`Unknown segment template: ${segmentName}`)
      }
    }

    return await this.evaluateSegment(storeId, template)
  }

  /**
   * Update contact segments based on current data
   */
  async updateContactSegments(storeId: string): Promise<DatabaseResult<{
    updated: number
    segments: Record<string, number>
  }>> {
    try {
      const results: Record<string, number> = {}
      let totalUpdated = 0

      // Process each segment template
      for (const [segmentKey, criteria] of Object.entries(SEGMENT_TEMPLATES)) {
        const segmentResult = await this.evaluateSegment(storeId, criteria)
        
        if (segmentResult.error) {
          continue
        }

        const matchingContacts = segmentResult.data!.contacts
        results[segmentKey] = matchingContacts.length

        // Update each contact's segments
        for (const contact of matchingContacts) {
          if (!contact.segments.includes(segmentKey)) {
            const updatedSegments = [...contact.segments, segmentKey]
            await this.repository.updateContact(contact.id, {
              segments: updatedSegments
            })
            totalUpdated++
          }
        }

        // Remove segment from contacts that no longer match
        const allContactsResult = await this.repository.getStoreContacts(storeId)
        if (allContactsResult.data) {
          const contactsWithSegment = allContactsResult.data.filter(c => 
            c.segments.includes(segmentKey)
          )
          
          for (const contact of contactsWithSegment) {
            const stillMatches = this.evaluateContactAgainstCriteria(contact, criteria)
            if (!stillMatches) {
              const updatedSegments = contact.segments.filter(s => s !== segmentKey)
              await this.repository.updateContact(contact.id, {
                segments: updatedSegments
              })
              totalUpdated++
            }
          }
        }
      }

      return {
        data: {
          updated: totalUpdated,
          segments: results
        },
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to update contact segments')
      }
    }
  }

  /**
   * Get segment performance analytics
   */
  async getSegmentPerformance(
    storeId: string,
    segmentName?: string
  ): Promise<DatabaseResult<SegmentPerformance[]>> {
    try {
      const segmentsToAnalyze = segmentName 
        ? [segmentName] 
        : Object.keys(SEGMENT_TEMPLATES)

      const performances: SegmentPerformance[] = []

      for (const segment of segmentsToAnalyze) {
        const segmentResult = await this.getSegmentContacts(storeId, segment)
        
        if (segmentResult.error || !segmentResult.data) {
          continue
        }

        const contacts = segmentResult.data.contacts
        const contactCount = contacts.length

        if (contactCount === 0) {
          performances.push({
            segmentName: segment,
            contactCount: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            performance: 'low'
          })
          continue
        }

        // Calculate metrics
        const totalRevenue = contacts.reduce((sum, c) => sum + c.total_spent, 0)
        const totalOrders = contacts.reduce((sum, c) => sum + c.order_count, 0)
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        // Determine performance level based on revenue and engagement
        let performance: 'high' | 'medium' | 'low' = 'low'
        if (averageOrderValue > 100 && totalRevenue > 5000) {
          performance = 'high'
        } else if (averageOrderValue > 50 || totalRevenue > 1000) {
          performance = 'medium'
        }

        performances.push({
          segmentName: segment,
          contactCount,
          totalRevenue,
          averageOrderValue,
          performance
        })
      }

      return {
        data: performances,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to get segment performance')
      }
    }
  }

  /**
   * Create a custom segment
   */
  async createCustomSegment(
    storeId: string,
    criteria: SegmentCriteria
  ): Promise<DatabaseResult<SegmentResult>> {
    // Validate criteria
    if (!criteria.name || criteria.conditions.length === 0) {
      return {
        data: null,
        error: new Error('Segment must have a name and at least one condition')
      }
    }

    return await this.evaluateSegment(storeId, criteria)
  }

  /**
   * Get available segment templates
   */
  getSegmentTemplates(): Record<string, SegmentCriteria> {
    return { ...SEGMENT_TEMPLATES }
  }

  /**
   * Filter contacts based on criteria
   */
  private filterContactsByCriteria(
    contacts: Contact[],
    criteria: SegmentCriteria
  ): Contact[] {
    return contacts.filter(contact => 
      this.evaluateContactAgainstCriteria(contact, criteria)
    )
  }

  /**
   * Evaluate a single contact against segment criteria
   */
  private evaluateContactAgainstCriteria(
    contact: Contact,
    criteria: SegmentCriteria
  ): boolean {
    const conditionResults = criteria.conditions.map(condition =>
      this.evaluateCondition(contact, condition)
    )

    if (criteria.operator === 'AND') {
      return conditionResults.every(result => result)
    } else {
      return conditionResults.some(result => result)
    }
  }

  /**
   * Evaluate a single condition against a contact
   */
  private evaluateCondition(contact: Contact, condition: SegmentCondition): boolean {
    const fieldValue = this.getContactFieldValue(contact, condition.field)
    const conditionValue = condition.value

    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue

      case 'not_equals':
        return fieldValue !== conditionValue

      case 'contains':
        return typeof fieldValue === 'string' && 
               typeof conditionValue === 'string' &&
               fieldValue.toLowerCase().includes(conditionValue.toLowerCase())

      case 'not_contains':
        return typeof fieldValue === 'string' && 
               typeof conditionValue === 'string' &&
               !fieldValue.toLowerCase().includes(conditionValue.toLowerCase())

      case 'starts_with':
        return typeof fieldValue === 'string' && 
               typeof conditionValue === 'string' &&
               fieldValue.toLowerCase().startsWith(conditionValue.toLowerCase())

      case 'ends_with':
        return typeof fieldValue === 'string' && 
               typeof conditionValue === 'string' &&
               fieldValue.toLowerCase().endsWith(conditionValue.toLowerCase())

      case 'greater_than':
        return typeof fieldValue === 'number' && 
               typeof conditionValue === 'number' &&
               fieldValue > conditionValue

      case 'greater_than_or_equal':
        return typeof fieldValue === 'number' && 
               typeof conditionValue === 'number' &&
               fieldValue >= conditionValue

      case 'less_than':
        return typeof fieldValue === 'number' && 
               typeof conditionValue === 'number' &&
               fieldValue < conditionValue

      case 'less_than_or_equal':
        return typeof fieldValue === 'number' && 
               typeof conditionValue === 'number' &&
               fieldValue <= conditionValue

      case 'between':
        if (Array.isArray(conditionValue) && conditionValue.length === 2) {
          const [min, max] = conditionValue
          return typeof fieldValue === 'number' && fieldValue >= Number(min) && fieldValue <= Number(max)
        }
        return false

      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue as any)

      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue as any)

      case 'is_null':
        return fieldValue === null || fieldValue === undefined

      case 'is_not_null':
        return fieldValue !== null && fieldValue !== undefined

      case 'has_tag':
        return Array.isArray(contact.tags) && 
               typeof conditionValue === 'string' &&
               contact.tags.includes(conditionValue)

      case 'not_has_tag':
        return Array.isArray(contact.tags) && 
               typeof conditionValue === 'string' &&
               !contact.tags.includes(conditionValue)

      case 'has_any_tag':
        return Array.isArray(contact.tags) && 
               Array.isArray(conditionValue) &&
               conditionValue.some(tag => contact.tags.includes(tag))

      case 'has_all_tags':
        return Array.isArray(contact.tags) && 
               Array.isArray(conditionValue) &&
               conditionValue.every(tag => contact.tags.includes(tag))

      case 'in_segment':
        return Array.isArray(contact.segments) && 
               typeof conditionValue === 'string' &&
               contact.segments.includes(conditionValue)

      case 'not_in_segment':
        return Array.isArray(contact.segments) && 
               typeof conditionValue === 'string' &&
               !contact.segments.includes(conditionValue)

      default:
        return false
    }
  }

  /**
   * Get field value from contact
   */
  private getContactFieldValue(contact: Contact, field: SegmentField): string | number | Date | boolean | string[] | null {
    switch (field) {
      case 'email':
        return contact.email
      case 'first_name':
        return contact.first_name
      case 'last_name':
        return contact.last_name
      case 'phone':
        return contact.phone
      case 'total_spent':
        return contact.total_spent
      case 'order_count':
        return contact.order_count
      case 'email_consent':
        return contact.email_consent
      case 'sms_consent':
        return contact.sms_consent
      case 'tags':
        return contact.tags
      case 'segments':
        return contact.segments
      case 'created_at':
        return contact.created_at
      case 'updated_at':
        return contact.updated_at
      case 'last_order_at':
        return contact.last_order_at
      case 'shopify_customer_id':
        return contact.shopify_customer_id
      default:
        return null
    }
  }
}