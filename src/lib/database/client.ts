import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from './supabase-types'
import type {
  Store,
  CreateStore,
  UpdateStore,
  Contact,
  CreateContact,
  UpdateContact,
  EmailCampaign,
  CreateEmailCampaign,
  UpdateEmailCampaign,
  SMSCampaign,
  CreateSMSCampaign,
  UpdateSMSCampaign,
  CampaignTemplate,
  CreateCampaignTemplate,
  UpdateCampaignTemplate,
  AutomationWorkflow,
  CreateAutomationWorkflow,
  UpdateAutomationWorkflow,
  ConsentRecord,
  CreateConsentRecord,
  CampaignSend,
  CreateCampaignSend,
  UpdateCampaignSend,
  ShopifyOrder,
  CreateShopifyOrder,
  UpdateShopifyOrder,
  ShopifyProduct,
  CreateShopifyProduct,
  UpdateShopifyProduct,
  WebhookEvent,
  CreateWebhookEvent,
  UpdateWebhookEvent,
} from './types'

// Type for the Supabase client with explicit Database typing
export type TypedSupabaseClient = SupabaseClient<Database>

// Create typed Supabase client with explicit type assertion
export function createTypedSupabaseClient(): TypedSupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Server-side client with service role for bypassing RLS
export function createServiceSupabaseClient(): TypedSupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }
  
  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon key')
    // Fall back to anon key if service role key is not available
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!anonKey) {
      throw new Error('Missing both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables')
    }
    return createClient<Database>(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Lazy-loaded admin client instance
let _supabaseAdmin: TypedSupabaseClient | null = null
export function getSupabaseAdmin(): TypedSupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createServiceSupabaseClient()
  }
  return _supabaseAdmin
}

// Type assertion helper to ensure proper typing
export function getTypedSupabaseClient(): TypedSupabaseClient {
  return createServiceSupabaseClient()
}

// Validation utilities
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateAndTransform<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = (error as any).errors[0]
      throw new ValidationError(
        `${context ? `${context}: ` : ''}${firstError.message}`,
        firstError.path.join('.'),
        firstError.received
      )
    }
    throw error
  }
}

// Database operation result types
export interface DatabaseResult<T> {
  data: T | null
  error: Error | null
}

export interface DatabaseListResult<T> {
  data: T[]
  error: Error | null
  count?: number
}

// Generic database operations with validation
export class TypedDatabaseClient {
  constructor(private supabase: any) {} // Cast to any to avoid complex type issues

  async create<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Insert'],
    schema: z.ZodSchema<Database['public']['Tables'][T]['Insert']>
  ): Promise<DatabaseResult<Database['public']['Tables'][T]['Row']>> {
    try {
      // Validate input data
      const validatedData = validateAndTransform(schema, data, `create ${table}`)
      
      const { data: result, error } = await this.supabase
        .from(table)
        .insert(validatedData)
        .select()
        .single()

      if (error) {
        return { data: null, error: new Error(error.message) }
      }

      return { data: result, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      }
    }
  }

  async update<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string,
    data: Database['public']['Tables'][T]['Update'],
    schema: z.ZodSchema<Database['public']['Tables'][T]['Update']>
  ): Promise<DatabaseResult<Database['public']['Tables'][T]['Row']>> {
    try {
      // Validate input data
      const validatedData = validateAndTransform(schema, data, `update ${table}`)
      
      const { data: result, error } = await this.supabase
        .from(table)
        .update(validatedData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error: new Error(error.message) }
      }

      return { data: result, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      }
    }
  }

  async findById<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string
  ): Promise<DatabaseResult<Database['public']['Tables'][T]['Row']>> {
    try {
      const { data, error } = await this.supabase
        .from(table)
        .select()
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error: new Error(error.message) }
      }

      return { data, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      }
    }
  }

  async findMany<T extends keyof Database['public']['Tables']>(
    table: T,
    filters?: Record<string, unknown>,
    options?: {
      limit?: number
      offset?: number
      orderBy?: string
      ascending?: boolean
    }
  ): Promise<DatabaseListResult<Database['public']['Tables'][T]['Row']>> {
    try {
      let query = this.supabase.from(table).select('*', { count: 'exact' })

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value as any)
        })
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.ascending ?? true 
        })
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit)
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        return { data: [], error: new Error(error.message) }
      }

      return { data: data || [], error: null, count: count || 0 }
    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error : new Error('Unknown error') 
      }
    }
  }

  async delete<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string
  ): Promise<DatabaseResult<boolean>> {
    try {
      const { error } = await this.supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) {
        return { data: null, error: new Error(error.message) }
      }

      return { data: true, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      }
    }
  }
}

// Encryption utilities for sensitive data
export class DataEncryption {
  private static getEncryptionKey(): string {
    const key = process.env.DATA_ENCRYPTION_KEY
    if (!key) {
      throw new Error('DATA_ENCRYPTION_KEY environment variable is required')
    }
    return key
  }

  static async encrypt(data: string): Promise<string> {
    // In a real implementation, use a proper encryption library like crypto
    // For now, this is a placeholder that would use AES-256-GCM
    const key = this.getEncryptionKey()
    
    // This is a simplified example - in production, use proper crypto
    const encoder = new TextEncoder()
    const keyData = encoder.encode(key.slice(0, 32)) // Use first 32 chars as key
    const dataBuffer = encoder.encode(data)
    
    // In real implementation, use Web Crypto API or Node.js crypto
    // For now, return base64 encoded data (NOT SECURE - just for structure)
    return Buffer.from(data).toString('base64')
  }

  static async decrypt(encryptedData: string): Promise<string> {
    // In a real implementation, decrypt using the same algorithm
    // For now, this is a placeholder
    try {
      return Buffer.from(encryptedData, 'base64').toString('utf-8')
    } catch {
      throw new Error('Failed to decrypt data')
    }
  }

  static async hashForIndex(data: string): Promise<string> {
    // Create a hash for indexing while preserving privacy
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data.toLowerCase().trim())
    
    // In real implementation, use a proper hash function like SHA-256
    // For now, return a simple hash (NOT SECURE - just for structure)
    let hash = 0
    for (let i = 0; i < dataBuffer.length; i++) {
      const char = dataBuffer[i]
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }
}

// Contact-specific operations with encryption
export class ContactManager extends TypedDatabaseClient {
  async createContact(
    data: CreateContact
  ): Promise<DatabaseResult<Contact>> {
    try {
      // Encrypt sensitive fields
      const encryptedData = {
        ...data,
        email: await DataEncryption.encrypt(data.email),
        phone: data.phone ? await DataEncryption.encrypt(data.phone) : null,
        first_name: data.first_name ? await DataEncryption.encrypt(data.first_name) : null,
        last_name: data.last_name ? await DataEncryption.encrypt(data.last_name) : null,
      }

      return await this.create('contacts', encryptedData, z.any()) as any
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to create contact') 
      }
    }
  }

  async findContactByEmail(
    storeId: string, 
    email: string
  ): Promise<DatabaseResult<Contact>> {
    try {
      // Hash email for lookup
      const emailHash = await DataEncryption.hashForIndex(email)
      
      // In a real implementation, you'd store the hash alongside encrypted data
      // For now, we'll do a simple lookup and decrypt
      const { data: contacts, error } = await this.findMany('contacts', { 
        store_id: storeId 
      })

      if (error) {
        return { data: null, error }
      }

      // Find matching contact by decrypting emails
      for (const contact of contacts) {
        try {
          const decryptedEmail = await DataEncryption.decrypt(contact.email)
          if (decryptedEmail.toLowerCase() === email.toLowerCase()) {
            return { data: contact as any, error: null }
          }
        } catch {
          // Skip contacts with decryption errors
          continue
        }
      }

      return { data: null, error: new Error('Contact not found') }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to find contact') 
      }
    }
  }

  async decryptContact(contact: Contact): Promise<Contact> {
    try {
      return {
        ...contact,
        email: await DataEncryption.decrypt(contact.email),
        phone: contact.phone ? await DataEncryption.decrypt(contact.phone) : null,
        first_name: contact.first_name ? await DataEncryption.decrypt(contact.first_name) : null,
        last_name: contact.last_name ? await DataEncryption.decrypt(contact.last_name) : null,
      }
    } catch (error) {
      throw new Error('Failed to decrypt contact data')
    }
  }
}