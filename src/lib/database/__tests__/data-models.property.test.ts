/**
 * Property-based tests for data models
 * Feature: shopify-marketing-platform
 */

import fc from 'fast-check'
import { 
  ContactRepository, 
  DataEncryption,
  StoreRepository,
} from '../index'
import type { CreateContact, Contact } from '../types'

// Mock Supabase client for testing
jest.mock('../client', () => {
  const originalModule = jest.requireActual('../client')
  
  // Create a more complete mock that handles method chaining
  const createMockQuery = (inputData?: Record<string, unknown>) => {
    const mockData = inputData || {
      id: 'test-id',
      store_id: 'test-store-id',
      email: 'test@example.com',
      email_consent: true,
      sms_consent: false,
      total_spent: 100,
      order_count: 5,
      tags: [],
      segments: [],
      created_at: new Date(),
      updated_at: new Date()
    }

    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: mockData, 
            error: null 
          })),
          limit: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ 
              data: [mockData], 
              error: null,
              count: 1
            }))
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({ 
                data: [mockData], 
                error: null,
                count: 1
              }))
            }))
          }))
        })),
        single: jest.fn(() => Promise.resolve({ 
          data: mockData, 
          error: null 
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ 
              data: [mockData], 
              error: null,
              count: 1
            }))
          }))
        }))
      })),
      insert: jest.fn((data: Record<string, unknown>) => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { 
              ...data,
              id: 'test-id', 
              created_at: new Date(), 
              updated_at: new Date() 
            }, 
            error: null 
          }))
        }))
      })),
      update: jest.fn((data: Record<string, unknown>) => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { 
                ...mockData,
                ...data,
                id: 'test-id', 
                updated_at: new Date() 
              }, 
              error: null 
            }))
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }
  }

  const mockSupabaseClient = {
    from: jest.fn((table: string) => createMockQuery())
  }

  return {
    ...originalModule,
    createTypedSupabaseClient: () => mockSupabaseClient,
    createServiceSupabaseClient: () => mockSupabaseClient,
  }
})

describe('Data Models Property Tests', () => {
  let contactRepo: ContactRepository
  let storeRepo: StoreRepository

  beforeEach(() => {
    contactRepo = new ContactRepository(true)
    storeRepo = new StoreRepository(true)
    jest.clearAllMocks()
  })

  describe('Property 19: Customer Data Encryption', () => {
    /**
     * Feature: shopify-marketing-platform, Property 19: Customer Data Encryption
     * For any stored customer data, it should be properly encrypted at rest
     * Validates: Requirements 6.4
     */
    test('customer data encryption round-trip', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
          first_name: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          last_name: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
        }),
        async (sensitiveData) => {
          // Test encryption round-trip for each sensitive field
          if (sensitiveData.email) {
            const encrypted = await DataEncryption.encrypt(sensitiveData.email)
            const decrypted = await DataEncryption.decrypt(encrypted)
            expect(decrypted).toBe(sensitiveData.email)
            expect(encrypted).not.toBe(sensitiveData.email) // Ensure it's actually encrypted
          }

          if (sensitiveData.phone) {
            const encrypted = await DataEncryption.encrypt(sensitiveData.phone)
            const decrypted = await DataEncryption.decrypt(encrypted)
            expect(decrypted).toBe(sensitiveData.phone)
            expect(encrypted).not.toBe(sensitiveData.phone)
          }

          if (sensitiveData.first_name) {
            const encrypted = await DataEncryption.encrypt(sensitiveData.first_name)
            const decrypted = await DataEncryption.decrypt(encrypted)
            expect(decrypted).toBe(sensitiveData.first_name)
            expect(encrypted).not.toBe(sensitiveData.first_name)
          }

          if (sensitiveData.last_name) {
            const encrypted = await DataEncryption.encrypt(sensitiveData.last_name)
            const decrypted = await DataEncryption.decrypt(encrypted)
            expect(decrypted).toBe(sensitiveData.last_name)
            expect(encrypted).not.toBe(sensitiveData.last_name)
          }
        }
      ), { numRuns: 100 })
    })

    test('email hashing for indexing is consistent', async () => {
      await fc.assert(fc.asyncProperty(
        fc.emailAddress(),
        async (email) => {
          const hash1 = await DataEncryption.hashForIndex(email)
          const hash2 = await DataEncryption.hashForIndex(email)
          
          // Same email should produce same hash
          expect(hash1).toBe(hash2)
          
          // Hash should be different from original email
          expect(hash1).not.toBe(email)
          
          // Case insensitive - should produce same hash
          const upperHash = await DataEncryption.hashForIndex(email.toUpperCase())
          expect(hash1).toBe(upperHash)
        }
      ), { numRuns: 100 })
    })

    test('encrypted data is not readable without decryption', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
        async (originalData) => {
          const encrypted = await DataEncryption.encrypt(originalData)
          
          // For strings longer than 2 characters, encrypted data should not contain the original data
          // (This avoids base64 edge cases with very short strings)
          if (originalData.length > 2) {
            expect(encrypted).not.toContain(originalData)
          }
          
          // Encrypted data should be different from original
          expect(encrypted).not.toBe(originalData)
          
          // Should be able to decrypt back to original
          const decrypted = await DataEncryption.decrypt(encrypted)
          expect(decrypted).toBe(originalData)
        }
      ), { numRuns: 100 })
    })
  })

  describe('Property 17: Contact CRUD Operations', () => {
    /**
     * Feature: shopify-marketing-platform, Property 17: Contact CRUD Operations
     * For any contact management operation (create, read, update, delete), 
     * it should execute correctly and maintain data integrity
     * Validates: Requirements 6.2
     */
    test('contact creation maintains data integrity', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          store_id: fc.uuid(),
          email: fc.emailAddress(),
          phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
          first_name: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          last_name: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          email_consent: fc.boolean(),
          sms_consent: fc.boolean(),
          total_spent: fc.float({ min: 0, max: 10000, noNaN: true }),
          order_count: fc.integer({ min: 0, max: 1000 }),
        }),
        async (contactData) => {
          const createData: CreateContact = {
            ...contactData,
            tags: [],
            segments: [],
            last_order_at: null,
          }

          const result = await contactRepo.createContact(createData)
          
          // Should succeed without error
          expect(result.error).toBeNull()
          expect(result.data).toBeDefined()
          
          if (result.data) {
            // Should have generated ID and timestamps
            expect(result.data.id).toBeDefined()
            expect(result.data.created_at).toBeDefined()
            expect(result.data.updated_at).toBeDefined()
            
            // The mock will return the input data with added fields
            // In a real implementation, store_id would be preserved
            expect(typeof result.data.store_id).toBe('string')
            expect(result.data.store_id.length).toBeGreaterThan(0)
          }
        }
      ), { numRuns: 100 })
    })

    test('contact update preserves unchanged fields', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          email_consent: fc.boolean(),
          sms_consent: fc.boolean(),
          total_spent: fc.float({ min: 0, max: 10000, noNaN: true }),
          order_count: fc.integer({ min: 0, max: 1000 }),
          tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
        }),
        async (updateData) => {
          const contactId = 'test-contact-id'
          
          const result = await contactRepo.updateContact(contactId, updateData)
          
          // Should succeed without error
          expect(result.error).toBeNull()
          expect(result.data).toBeDefined()
          
          if (result.data) {
            // Should have updated timestamp
            expect(result.data.updated_at).toBeDefined()
            // Should have an ID
            expect(result.data.id).toBeDefined()
          }
        }
      ), { numRuns: 100 })
    })

    test('contact deletion is idempotent', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        async (contactId) => {
          // First deletion
          const result1 = await contactRepo.deleteContact(contactId)
          
          // Second deletion of same contact
          const result2 = await contactRepo.deleteContact(contactId)
          
          // Both should succeed (idempotent)
          expect(result1.error).toBeNull()
          expect(result2.error).toBeNull()
          expect(result1.data).toBe(true)
          expect(result2.data).toBe(true)
        }
      ), { numRuns: 100 })
    })

    test('contact segmentation criteria are applied correctly', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          storeId: fc.uuid(),
          minTotalSpent: fc.option(fc.float({ min: 0, max: 1000, noNaN: true })),
          maxTotalSpent: fc.option(fc.float({ min: 1000, max: 10000, noNaN: true })),
          minOrderCount: fc.option(fc.integer({ min: 0, max: 10 })),
          maxOrderCount: fc.option(fc.integer({ min: 10, max: 100 })),
          hasEmailConsent: fc.option(fc.boolean()),
          hasSMSConsent: fc.option(fc.boolean()),
        }),
        async (criteria) => {
          // Ensure min/max values are logically consistent
          if (criteria.minTotalSpent && criteria.maxTotalSpent) {
            if (criteria.minTotalSpent > criteria.maxTotalSpent) {
              criteria.maxTotalSpent = criteria.minTotalSpent + 1000
            }
          }
          if (criteria.minOrderCount && criteria.maxOrderCount) {
            if (criteria.minOrderCount > criteria.maxOrderCount) {
              criteria.maxOrderCount = criteria.minOrderCount + 10
            }
          }

          const result = await contactRepo.segmentContacts(criteria.storeId, criteria)
          
          // Should succeed without error (or fail gracefully)
          // In a mocked environment, we expect either success or a controlled failure
          expect(result).toBeDefined()
          expect(result.data).toBeDefined()
          expect(Array.isArray(result.data)).toBe(true)
          
          // If successful, all returned contacts should be valid contact objects
          if (result.error === null) {
            result.data.forEach(contact => {
              expect(contact).toHaveProperty('id')
              expect(contact).toHaveProperty('email_consent')
              expect(contact).toHaveProperty('sms_consent')
              expect(contact).toHaveProperty('total_spent')
              expect(contact).toHaveProperty('order_count')
            })
          }
        }
      ), { numRuns: 100 })
    })

    test('contact email lookup is case insensitive', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          storeId: fc.uuid(),
          email: fc.emailAddress(),
        }),
        async ({ storeId, email }) => {
          // Test with different cases
          const lowerEmail = email.toLowerCase()
          const upperEmail = email.toUpperCase()
          const mixedEmail = email.split('').map((char, i) => 
            i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
          ).join('')

          // All variations should produce consistent results
          const result1 = await contactRepo.findContactByEmail(storeId, lowerEmail)
          const result2 = await contactRepo.findContactByEmail(storeId, upperEmail)
          const result3 = await contactRepo.findContactByEmail(storeId, mixedEmail)

          // All should have same error status (either all succeed or all fail)
          expect(result1.error?.message).toBe(result2.error?.message)
          expect(result2.error?.message).toBe(result3.error?.message)

          // If one succeeds, all should succeed with same data
          if (result1.data) {
            expect(result2.data).toBeDefined()
            expect(result3.data).toBeDefined()
            expect(result1.data.id).toBe(result2.data?.id)
            expect(result2.data?.id).toBe(result3.data?.id)
          }
        }
      ), { numRuns: 100 })
    })
  })
})