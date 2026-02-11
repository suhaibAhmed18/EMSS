import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import crypto from 'crypto'
import type { Database } from './supabase-types'
import type {
  Contact,
  CreateContact,
} from './types'
import type { 
  DatabaseResult, 
  DatabaseListResult,
  JsonObject,
  EncryptedData 
} from './type-helpers'

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
  constructor(private supabase: TypedSupabaseClient) {}

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
  private static getEncryptionKey(): Buffer {
    const key = process.env.DATA_ENCRYPTION_KEY
    if (!key || key.length < 32) {
      throw new Error('DATA_ENCRYPTION_KEY must be at least 32 characters')
    }
    // Derive a proper 32-byte key using scrypt
    return crypto.scryptSync(key, 'salt-for-encryption', 32)
  }

  static encrypt(data: string): string {
    const algorithm = 'aes-256-gcm'
    const key = this.getEncryptionKey()
    const iv = crypto.randomBytes(16) // Initialization vector
    
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  static decrypt(encryptedData: string): string {
    const algorithm = 'aes-256-gcm'
    const key = this.getEncryptionKey()
    
    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
      // Try legacy base64 decoding for migration
      try {
        return Buffer.from(encryptedData, 'base64').toString('utf-8')
      } catch {
        throw new Error('Invalid encrypted data format')
      }
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  static hashForIndex(data: string): string {
    // Use HMAC for searchable hash
    const key = this.getEncryptionKey()
    return crypto
      .createHmac('sha256', key)
      .update(data.toLowerCase().trim())
      .digest('hex')
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