import { createClient } from '@supabase/supabase-js'

// Test database configuration - use main Supabase instance for tests
// In production, you would use a separate test database
export const testSupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.TEST_SUPABASE_URL || 'https://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.TEST_SUPABASE_SERVICE_KEY || 'test-service-key'
)

// Helper functions for test database setup and teardown
export async function setupTestDatabase() {
  // This would typically set up test data or reset the database
  // For now, we'll just return a mock setup
  return {
    cleanup: async () => {
      // Cleanup test data
    }
  }
}

export async function cleanupTestDatabase() {
  // Clean up test data after tests
  // This would typically truncate tables or reset state
}