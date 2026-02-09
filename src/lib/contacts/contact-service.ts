import { ContactRepository } from '../database/repositories'
import { 
  Contact, 
  CreateContact, 
  UpdateContact,
  CreateContactSchema,
  UpdateContactSchema 
} from '../database/types'
import { DatabaseResult, DatabaseListResult, ValidationError } from '../database/client'
import { z } from 'zod'

// Enhanced search and filter options
export interface ContactSearchOptions {
  query?: string // Search in name, email
  tags?: string[]
  segments?: string[]
  emailConsent?: boolean
  smsConsent?: boolean
  minTotalSpent?: number
  maxTotalSpent?: number
  minOrderCount?: number
  maxOrderCount?: number
  hasPhone?: boolean
  createdAfter?: Date
  createdBefore?: Date
  lastOrderAfter?: Date
  lastOrderBefore?: Date
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'updated_at' | 'total_spent' | 'order_count' | 'last_order_at'
  sortOrder?: 'asc' | 'desc'
}

export interface ContactSearchResult {
  contacts: Contact[]
  total: number
  hasMore: boolean
}

// Data sanitization schemas
const SanitizeContactSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  phone: z.string().optional().transform(val => {
    if (!val) return undefined
    // Remove all non-digit characters except +
    return val.replace(/[^\d+]/g, '')
  }),
  first_name: z.string().optional().transform(val => {
    if (!val) return undefined
    // Trim and capitalize first letter
    return val.trim().replace(/^\w/, c => c.toUpperCase())
  }),
  last_name: z.string().optional().transform(val => {
    if (!val) return undefined
    // Trim and capitalize first letter
    return val.trim().replace(/^\w/, c => c.toUpperCase())
  }),
  tags: z.array(z.string()).optional().transform(val => {
    if (!val) return []
    // Remove duplicates and empty strings, trim all
    return [...new Set(val.map(tag => tag.trim()).filter(tag => tag.length > 0))]
  }),
  segments: z.array(z.string()).optional().transform(val => {
    if (!val) return []
    // Remove duplicates and empty strings, trim all
    return [...new Set(val.map(segment => segment.trim()).filter(segment => segment.length > 0))]
  })
})

export class ContactService {
  private repository: ContactRepository

  constructor(useServiceRole = false) {
    this.repository = new ContactRepository(useServiceRole)
  }

  /**
   * Create a new contact with data validation and sanitization
   */
  async createContact(data: CreateContact): Promise<DatabaseResult<Contact>> {
    try {
      // Validate and sanitize input data
      const sanitizedData = this.sanitizeContactData(data)
      const validatedData = CreateContactSchema.parse(sanitizedData)

      // Check for duplicate email in the same store
      const existingContact = await this.repository.findContactByEmail(
        validatedData.store_id, 
        validatedData.email
      )

      if (existingContact.data) {
        return {
          data: null,
          error: new ValidationError('Contact with this email already exists', 'email', validatedData.email)
        }
      }

      return await this.repository.createContact(validatedData)
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to create contact')
      }
    }
  }

  /**
   * Update an existing contact with validation and sanitization
   */
  async updateContact(id: string, data: UpdateContact): Promise<DatabaseResult<Contact>> {
    try {
      // Validate contact exists
      const existingContact = await this.repository.getContact(id)
      if (!existingContact.data) {
        return {
          data: null,
          error: new Error('Contact not found')
        }
      }

      // Sanitize and validate update data
      const sanitizedData = this.sanitizeContactData(data)
      const validatedData = UpdateContactSchema.parse(sanitizedData)

      // If email is being updated, check for duplicates
      if (validatedData.email && validatedData.email !== existingContact.data.email) {
        const duplicateContact = await this.repository.findContactByEmail(
          existingContact.data.store_id,
          validatedData.email
        )

        if (duplicateContact.data && duplicateContact.data.id !== id) {
          return {
            data: null,
            error: new ValidationError('Contact with this email already exists', 'email', validatedData.email)
          }
        }
      }

      return await this.repository.updateContact(id, validatedData)
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to update contact')
      }
    }
  }

  /**
   * Get a contact by ID
   */
  async getContact(id: string): Promise<DatabaseResult<Contact>> {
    return await this.repository.getContact(id)
  }

  /**
   * Delete a contact and all associated data
   */
  async deleteContact(id: string): Promise<DatabaseResult<boolean>> {
    try {
      // Verify contact exists
      const contact = await this.repository.getContact(id)
      if (!contact.data) {
        return {
          data: null,
          error: new Error('Contact not found')
        }
      }

      // Delete the contact (cascade will handle related records)
      return await this.repository.deleteContact(id)
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to delete contact')
      }
    }
  }

  /**
   * Search and filter contacts with advanced options
   */
  async searchContacts(
    storeId: string, 
    options: ContactSearchOptions = {}
  ): Promise<DatabaseResult<ContactSearchResult>> {
    try {
      // Get all contacts for the store first (in a real implementation, this would be optimized with SQL)
      const allContactsResult = await this.repository.getStoreContacts(storeId)
      
      if (allContactsResult.error) {
        return {
          data: null,
          error: allContactsResult.error
        }
      }

      let filteredContacts = allContactsResult.data

      // Apply text search filter
      if (options.query) {
        const query = options.query.toLowerCase()
        filteredContacts = filteredContacts.filter(contact => {
          const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase()
          return (
            contact.email.toLowerCase().includes(query) ||
            fullName.includes(query) ||
            contact.tags.some(tag => tag.toLowerCase().includes(query))
          )
        })
      }

      // Apply tag filters
      if (options.tags && options.tags.length > 0) {
        filteredContacts = filteredContacts.filter(contact =>
          options.tags!.some(tag => contact.tags.includes(tag))
        )
      }

      // Apply segment filters
      if (options.segments && options.segments.length > 0) {
        filteredContacts = filteredContacts.filter(contact =>
          options.segments!.some(segment => contact.segments.includes(segment))
        )
      }

      // Apply consent filters
      if (options.emailConsent !== undefined) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.email_consent === options.emailConsent
        )
      }

      if (options.smsConsent !== undefined) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.sms_consent === options.smsConsent
        )
      }

      // Apply spending filters
      if (options.minTotalSpent !== undefined) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.total_spent >= options.minTotalSpent!
        )
      }

      if (options.maxTotalSpent !== undefined) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.total_spent <= options.maxTotalSpent!
        )
      }

      // Apply order count filters
      if (options.minOrderCount !== undefined) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.order_count >= options.minOrderCount!
        )
      }

      if (options.maxOrderCount !== undefined) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.order_count <= options.maxOrderCount!
        )
      }

      // Apply phone filter
      if (options.hasPhone !== undefined) {
        filteredContacts = filteredContacts.filter(contact =>
          options.hasPhone ? !!contact.phone : !contact.phone
        )
      }

      // Apply date filters
      if (options.createdAfter) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.created_at >= options.createdAfter!
        )
      }

      if (options.createdBefore) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.created_at <= options.createdBefore!
        )
      }

      if (options.lastOrderAfter) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.last_order_at && contact.last_order_at >= options.lastOrderAfter!
        )
      }

      if (options.lastOrderBefore) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.last_order_at && contact.last_order_at <= options.lastOrderBefore!
        )
      }

      // Apply sorting
      const sortBy = options.sortBy || 'created_at'
      const sortOrder = options.sortOrder || 'desc'

      filteredContacts.sort((a, b) => {
        let aValue: unknown = a[sortBy as keyof typeof a]
        let bValue: unknown = b[sortBy as keyof typeof b]

        // Handle null values
        if (aValue === null && bValue === null) return 0
        if (aValue === null) return sortOrder === 'asc' ? -1 : 1
        if (bValue === null) return sortOrder === 'asc' ? 1 : -1

        // Handle date values
        if (aValue instanceof Date && bValue instanceof Date) {
          aValue = aValue.getTime()
          bValue = bValue.getTime()
        }

        if ((aValue as any) < (bValue as any)) return sortOrder === 'asc' ? -1 : 1
        if ((aValue as any) > (bValue as any)) return sortOrder === 'asc' ? 1 : -1
        return 0
      })

      // Apply pagination
      const total = filteredContacts.length
      const offset = options.offset || 0
      const limit = options.limit || 50

      const paginatedContacts = filteredContacts.slice(offset, offset + limit)
      const hasMore = offset + limit < total

      return {
        data: {
          contacts: paginatedContacts,
          total,
          hasMore
        },
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to search contacts')
      }
    }
  }

  /**
   * Get contacts by store
   */
  async getContactsByStore(storeId: string): Promise<Contact[]> {
    const result = await this.searchContacts(storeId, {})
    return result.data?.contacts || []
  }

  /**
   * Get contacts by tags
   */
  async getContactsByTags(storeId: string, tags: string[]): Promise<DatabaseListResult<Contact>> {
    const searchResult = await this.searchContacts(storeId, { tags })
    
    if (searchResult.error) {
      return {
        data: [],
        error: searchResult.error
      }
    }

    return {
      data: searchResult.data!.contacts,
      error: null,
      count: searchResult.data!.total
    }
  }

  /**
   * Get contacts by segments
   */
  async getContactsBySegments(storeId: string, segments: string[]): Promise<DatabaseListResult<Contact>> {
    const searchResult = await this.searchContacts(storeId, { segments })
    
    if (searchResult.error) {
      return {
        data: [],
        error: searchResult.error
      }
    }

    return {
      data: searchResult.data!.contacts,
      error: null,
      count: searchResult.data!.total
    }
  }

  /**
   * Add tags to a contact
   */
  async addTagsToContact(id: string, tags: string[]): Promise<DatabaseResult<Contact>> {
    const contact = await this.repository.getContact(id)
    if (!contact.data) {
      return {
        data: null,
        error: new Error('Contact not found')
      }
    }

    const sanitizedTags = this.sanitizeTags(tags)
    const updatedTags = [...new Set([...contact.data.tags, ...sanitizedTags])]

    return await this.repository.updateContact(id, { tags: updatedTags })
  }

  /**
   * Remove tags from a contact
   */
  async removeTagsFromContact(id: string, tags: string[]): Promise<DatabaseResult<Contact>> {
    const contact = await this.repository.getContact(id)
    if (!contact.data) {
      return {
        data: null,
        error: new Error('Contact not found')
      }
    }

    const sanitizedTags = this.sanitizeTags(tags)
    const updatedTags = contact.data.tags.filter(tag => !sanitizedTags.includes(tag))

    return await this.repository.updateContact(id, { tags: updatedTags })
  }

  /**
   * Bulk update contacts
   */
  async bulkUpdateContacts(
    storeId: string,
    contactIds: string[],
    updates: Partial<UpdateContact>
  ): Promise<DatabaseResult<Contact[]>> {
    try {
      const results: Contact[] = []
      const errors: string[] = []

      for (const contactId of contactIds) {
        const result = await this.updateContact(contactId, updates)
        if (result.data) {
          results.push(result.data)
        } else {
          errors.push(`Failed to update contact ${contactId}: ${result.error?.message}`)
        }
      }

      if (errors.length > 0) {
        return {
          data: null,
          error: new Error(`Bulk update partially failed: ${errors.join(', ')}`)
        }
      }

      return {
        data: results,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Bulk update failed')
      }
    }
  }

  /**
   * Get contact statistics for a store
   */
  async getContactStats(storeId: string): Promise<DatabaseResult<{
    total: number
    emailConsented: number
    smsConsented: number
    totalSpent: number
    averageOrderValue: number
    topTags: Array<{ tag: string; count: number }>
    topSegments: Array<{ segment: string; count: number }>
  }>> {
    try {
      const contactsResult = await this.repository.getStoreContacts(storeId)
      
      if (contactsResult.error) {
        return {
          data: null,
          error: contactsResult.error
        }
      }

      const contacts = contactsResult.data
      const total = contacts.length
      const emailConsented = contacts.filter(c => c.email_consent).length
      const smsConsented = contacts.filter(c => c.sms_consent).length
      const totalSpent = contacts.reduce((sum, c) => sum + c.total_spent, 0)
      const totalOrders = contacts.reduce((sum, c) => sum + c.order_count, 0)
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

      // Calculate top tags
      const tagCounts = new Map<string, number>()
      contacts.forEach(contact => {
        contact.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        })
      })
      const topTags = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Calculate top segments
      const segmentCounts = new Map<string, number>()
      contacts.forEach(contact => {
        contact.segments.forEach(segment => {
          segmentCounts.set(segment, (segmentCounts.get(segment) || 0) + 1)
        })
      })
      const topSegments = Array.from(segmentCounts.entries())
        .map(([segment, count]) => ({ segment, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      return {
        data: {
          total,
          emailConsented,
          smsConsented,
          totalSpent,
          averageOrderValue,
          topTags,
          topSegments
        },
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to get contact stats')
      }
    }
  }

  /**
   * Sanitize contact data
   */
  private sanitizeContactData(data: Partial<CreateContact | UpdateContact>): Partial<CreateContact | UpdateContact> {
    try {
      return SanitizeContactSchema.partial().parse(data)
    } catch (error) {
      // If sanitization fails, return original data
      return data
    }
  }

  /**
   * Sanitize tags array
   */
  private sanitizeTags(tags: string[]): string[] {
    return [...new Set(tags.map(tag => tag.trim()).filter(tag => tag.length > 0))]
  }

  /**
   * Sync contacts from Shopify
   */
  async syncFromShopify(storeId: string) {
    try {
      // Get store information using Supabase admin client directly
      const { getSupabaseAdmin } = await import('@/lib/database/client')
      const supabase = getSupabaseAdmin()
      
      const { data: store, error: storeError } = await (supabase
        .from('stores') as any)
        .select('*')
        .eq('id', storeId)
        .single()

      if (storeError || !store) {
        throw new Error('Store not found')
      }

      if (!store.access_token) {
        throw new Error('Store access token not found')
      }

      // Fetch customers from Shopify
      const customers = await this.fetchShopifyCustomers(
        store.shop_domain,
        store.access_token
      )

      let imported = 0
      let updated = 0
      const errors: string[] = []

      // Process each customer
      for (const customer of customers) {
        try {
          // Check if contact already exists
          const { data: existingContact } = await (supabase
            .from('contacts') as any)
            .select('*')
            .eq('store_id', storeId)
            .eq('email', customer.email)
            .single()

          const contactData = {
            store_id: storeId,
            email: customer.email,
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            phone: customer.phone || null,
            tags: customer.tags ? customer.tags.split(',').map((t: string) => t.trim()) : [],
            email_consent: customer.email_marketing_consent?.state === 'subscribed',
            sms_consent: customer.sms_marketing_consent?.state === 'subscribed',
            total_spent: parseFloat(customer.total_spent || '0'),
            order_count: customer.orders_count || 0,
            last_order_at: customer.last_order_date || null,
            shopify_customer_id: customer.id.toString()
          }

          if (existingContact) {
            // Update existing contact
            const { error: updateError } = await (supabase
              .from('contacts') as any)
              .update({
                ...contactData,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingContact.id)

            if (updateError) {
              errors.push(`Failed to update ${customer.email}: ${updateError.message}`)
            } else {
              updated++
            }
          } else {
            // Create new contact
            const { error: insertError } = await (supabase
              .from('contacts') as any)
              .insert(contactData)

            if (insertError) {
              errors.push(`Failed to import ${customer.email}: ${insertError.message}`)
            } else {
              imported++
            }
          }
        } catch (err) {
          errors.push(`Error processing ${customer.email}: ${err}`)
        }
      }

      return {
        synced: imported + updated,
        updated,
        imported,
        total: customers.length,
        errors
      }
    } catch (error) {
      console.error('Shopify sync error:', error)
      throw error
    }
  }

  /**
   * Fetch customers from Shopify API
   */
  private async fetchShopifyCustomers(shopDomain: string, accessToken: string) {
    const customers: any[] = []
    let nextPageUrl: string | null = `https://${shopDomain}/admin/api/2024-01/customers.json?limit=250`

    try {
      while (nextPageUrl) {
        const response = await fetch(nextPageUrl, {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Shopify API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        customers.push(...(data.customers || []))

        // Check for pagination
        const linkHeader = response.headers.get('Link')
        nextPageUrl = this.getNextPageUrl(linkHeader)
      }

      return customers
    } catch (error) {
      console.error('Error fetching Shopify customers:', error)
      throw new Error(`Failed to fetch customers from Shopify: ${error}`)
    }
  }

  /**
   * Parse Link header for pagination
   */
  private getNextPageUrl(linkHeader: string | null): string | null {
    if (!linkHeader) return null

    const links = linkHeader.split(',')
    for (const link of links) {
      const match = link.match(/<([^>]+)>;\s*rel="next"/)
      if (match) {
        return match[1]
      }
    }

    return null
  }
}
// Export singleton instance
export const contactManager = new ContactService()