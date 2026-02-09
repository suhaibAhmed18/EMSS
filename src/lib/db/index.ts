import { createServiceSupabaseClient } from '@/lib/database/client'
import type { Database } from '@/lib/database/supabase-types'

// Create a Supabase client instance
const supabase = createServiceSupabaseClient()

// Type for stores table (Shopify stores)
type StoreRow = Database['public']['Tables']['stores']['Row']

// Extended type with field name mapping for backward compatibility
type Store = StoreRow & {
  store_name?: string | null
}

// Helper to map database fields to expected field names
function mapStoreFields(store: StoreRow | null): Store | null {
  if (!store) return null
  
  return {
    ...store,
    store_name: store.display_name, // Map display_name to store_name for backward compatibility
  }
}

// Helper to create a query-like interface similar to Drizzle ORM
export const db = {
  query: {
    shopifyStores: {
      async findFirst(options: {
        where: (stores: any, operators: { eq: (field: any, value: any) => any }) => any
      }): Promise<Store | null> {
        // Extract the where condition by calling the function
        // The where function is called with a proxy object that captures the field and value
        let fieldName: string | null = null
        let fieldValue: any = null

        const storesProxy = new Proxy({}, {
          get: (target, prop) => prop
        })

        const operators = {
          eq: (field: any, value: any) => {
            fieldName = field as string
            fieldValue = value
            return true
          }
        }

        options.where(storesProxy, operators)

        // Build the query - use 'stores' table which contains Shopify store data
        let query = supabase
          .from('stores')
          .select('*')

        // Apply the where condition if captured
        if (fieldName && fieldValue !== null) {
          query = query.eq(fieldName, fieldValue)
        }

        const { data, error } = await query.limit(1).maybeSingle()

        if (error) {
          console.error('Error querying stores:', error)
          return null
        }

        return mapStoreFields(data)
      },
    },
  },
}

// Export the Supabase client for direct access if needed
export { supabase }

// Export a query function for raw SQL queries (for backward compatibility)
// Note: Supabase doesn't support raw SQL queries directly in the client
// This is a placeholder that should be replaced with proper Supabase queries
export async function query(sql: string, params?: any[]): Promise<any[]> {
  console.warn('Raw SQL queries are not supported with Supabase. Please use the Supabase client methods instead.')
  throw new Error('Raw SQL queries are not supported. Please use Supabase client methods.')
}
