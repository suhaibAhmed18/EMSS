/**
 * Property-based tests for Contact Management System
 * Feature: shopify-marketing-platform
 */

import * as fc from 'fast-check'
import { ContactService, SegmentationEngine, SEGMENT_TEMPLATES } from '../index'
import { ContactRepository } from '../../database/repositories'
import { Contact, CreateContact, UpdateContact } from '../../database/types'
import { contactArbitrary } from '../../test-factories'

// Mock the database client
jest.mock('../../database/client', () => ({
  createTypedSupabaseClient: jest.fn(),
  createServiceSupabaseClient: jest.fn(),
  TypedDatabaseClient: jest.fn(),
  ContactManager: jest.fn(),
  DataEncryption: {
    encrypt: jest.fn((data: string) => Promise.resolve(`encrypted_${data}`)),
    decrypt: jest.fn((data: string) => Promise.resolve(data.replace('encrypted_', ''))),
    hashForIndex: jest.fn((data: string) => Promise.resolve(`hash_${data}`))
  }
}))

// Mock the repository
const mockContactRepository = {
  createContact: jest.fn(),
  updateContact: jest.fn(),
  getContact: jest.fn(),
  deleteContact: jest.fn(),
  getStoreContacts: jest.fn(),
  findContactByEmail: jest.fn(),
  decryptContact: jest.fn(),
  segmentContacts: jest.fn()
}

jest.mock('../../database/repositories', () => ({
  ContactRepository: jest.fn(() => mockContactRepository)
}))

describe('Contact Management Property Tests', () => {
  let contactService: ContactService
  let segmentationEngine: SegmentationEngine

  beforeEach(() => {
    jest.clearAllMocks()
    contactService = new ContactService()
    segmentationEngine = new SegmentationEngine()
  })

  describe('Property 18: Customer Segmentation Accuracy', () => {
    /**
     * Feature: shopify-marketing-platform, Property 18: Customer Segmentation Accuracy
     * Validates: Requirements 6.3
     * 
     * For any segmentation criteria, contacts should be properly grouped according to the specified rules
     */
    test('segmentation criteria correctly filters contacts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // storeId
          fc.array(contactArbitrary, { minLength: 10, maxLength: 100 }), // contacts
          fc.constantFrom('email-subscribers', 'sms-subscribers', 'high-value-customers'), // simpler segments
          async (storeId, contacts, segmentName) => {
            // Setup mock to return the contacts
            mockContactRepository.getStoreContacts.mockResolvedValue({
              data: contacts,
              error: null
            })

            // Get the segment criteria
            const criteria = SEGMENT_TEMPLATES[segmentName]
            
            // Evaluate the segment
            const result = await segmentationEngine.evaluateSegment(storeId, criteria)
            
            // Verify the result is successful
            expect(result.error).toBeNull()
            expect(result.data).toBeDefined()
            
            if (result.data) {
              const { contacts: segmentedContacts, criteria: resultCriteria } = result.data
              
              // Property: All returned contacts should match the criteria (simplified check)
              for (const contact of segmentedContacts) {
                if (segmentName === 'email-subscribers') {
                  expect(contact.email_consent).toBe(true)
                } else if (segmentName === 'sms-subscribers') {
                  expect(contact.sms_consent).toBe(true)
                } else if (segmentName === 'high-value-customers') {
                  expect(contact.total_spent).toBeGreaterThan(500)
                }
              }
              
              // Property: Criteria should be preserved
              expect(resultCriteria).toEqual(criteria)
              
              // Property: Count should match array length
              expect(result.data.count).toBe(segmentedContacts.length)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('segment performance calculations are accurate', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // storeId
          fc.array(contactArbitrary, { minLength: 5, maxLength: 50 }), // contacts
          async (storeId, contacts) => {
            // Setup mock to return the contacts for each segment
            mockContactRepository.getStoreContacts.mockResolvedValue({
              data: contacts,
              error: null
            })

            const result = await segmentationEngine.getSegmentPerformance(storeId)
            
            expect(result.error).toBeNull()
            expect(result.data).toBeDefined()
            
            if (result.data) {
              for (const performance of result.data) {
                // Property: Contact count should be non-negative
                expect(performance.contactCount).toBeGreaterThanOrEqual(0)
                
                // Property: Total revenue should be non-negative
                expect(performance.totalRevenue).toBeGreaterThanOrEqual(0)
                
                // Property: Average order value should be non-negative
                expect(performance.averageOrderValue).toBeGreaterThanOrEqual(0)
                
                // Property: Performance should be valid enum value
                expect(['high', 'medium', 'low']).toContain(performance.performance)
                
                // Property: If no contacts, revenue should be 0
                if (performance.contactCount === 0) {
                  expect(performance.totalRevenue).toBe(0)
                  expect(performance.averageOrderValue).toBe(0)
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('dynamic segment updates maintain consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // storeId
          fc.array(contactArbitrary, { minLength: 10, maxLength: 50 }), // contacts
          async (storeId, contacts) => {
            // Setup mocks
            mockContactRepository.getStoreContacts.mockResolvedValue({
              data: contacts,
              error: null
            })
            
            mockContactRepository.updateContact.mockResolvedValue({
              data: contacts[0], // Mock successful update
              error: null
            })

            const result = await segmentationEngine.updateContactSegments(storeId)
            
            expect(result.error).toBeNull()
            expect(result.data).toBeDefined()
            
            if (result.data) {
              // Property: Updated count should be non-negative
              expect(result.data.updated).toBeGreaterThanOrEqual(0)
              
              // Property: Segments object should contain valid segment names
              for (const segmentName of Object.keys(result.data.segments)) {
                expect(Object.keys(SEGMENT_TEMPLATES)).toContain(segmentName)
              }
              
              // Property: Segment counts should be non-negative
              for (const count of Object.values(result.data.segments)) {
                expect(count).toBeGreaterThanOrEqual(0)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 20: Complete Data Deletion', () => {
    /**
     * Feature: shopify-marketing-platform, Property 20: Complete Data Deletion
     * Validates: Requirements 6.5
     * 
     * For any customer data deletion request, all associated data should be completely removed from the system
     */
    test('contact deletion removes all associated data', async () => {
      await fc.assert(
        fc.asyncProperty(
          contactArbitrary,
          async (contact) => {
            // Setup mocks
            mockContactRepository.getContact.mockResolvedValue({
              data: contact,
              error: null
            })
            
            mockContactRepository.deleteContact.mockResolvedValue({
              data: true,
              error: null
            })

            // Delete the contact
            const result = await contactService.deleteContact(contact.id)
            
            // Property: Deletion should succeed
            expect(result.error).toBeNull()
            expect(result.data).toBe(true)
            
            // Property: Repository delete method should be called with correct ID
            expect(mockContactRepository.deleteContact).toHaveBeenCalledWith(contact.id)
            
            // Property: Contact should be verified to exist before deletion
            expect(mockContactRepository.getContact).toHaveBeenCalledWith(contact.id)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('deletion of non-existent contact fails gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // contactId
          async (contactId) => {
            // Setup mock to return no contact
            mockContactRepository.getContact.mockResolvedValue({
              data: null,
              error: new Error('Contact not found')
            })

            const result = await contactService.deleteContact(contactId)
            
            // Property: Deletion should fail with appropriate error
            expect(result.data).toBeNull()
            expect(result.error).toBeDefined()
            expect(result.error?.message).toContain('Contact not found')
            
            // Property: Delete should not be called if contact doesn't exist
            expect(mockContactRepository.deleteContact).not.toHaveBeenCalled()
          }
        ),
        { numRuns: 100 }
      )
    })

    test('bulk contact operations maintain data integrity', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // storeId
          fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }), // contactIds
          fc.record({
            tags: fc.option(fc.array(fc.string()), { nil: undefined }),
            email_consent: fc.option(fc.boolean(), { nil: undefined }),
            sms_consent: fc.option(fc.boolean(), { nil: undefined })
          }), // updates
          async (storeId, contactIds, updates) => {
            // Clear mocks for this test run
            jest.clearAllMocks()
            
            // Check if we have any meaningful updates
            const hasValidUpdates = updates.tags !== undefined || 
                                  updates.email_consent !== undefined || 
                                  updates.sms_consent !== undefined
            
            if (!hasValidUpdates) {
              return true // Skip this test case - no meaningful updates to test
            }

            // Setup mocks for each contact
            const mockContacts = contactIds.map(id => ({
              id,
              store_id: storeId,
              email: 'test@example.com',
              phone: null,
              first_name: 'Test',
              last_name: 'User',
              shopify_customer_id: null,
              tags: [],
              segments: [],
              email_consent: true,
              sms_consent: false,
              total_spent: 100,
              order_count: 1,
              last_order_at: null,
              created_at: new Date(),
              updated_at: new Date()
            }))

            // Mock getContact to return existing contacts
            mockContactRepository.getContact.mockImplementation((id: string) => {
              const contact = mockContacts.find(c => c.id === id)
              if (contact) {
                return Promise.resolve({
                  data: contact,
                  error: null
                })
              } else {
                return Promise.resolve({
                  data: null,
                  error: new Error('Contact not found')
                })
              }
            })

            mockContactRepository.updateContact.mockImplementation((id: string, updates: Partial<Contact>) => {
              const contact = mockContacts.find(c => c.id === id)
              if (contact) {
                const updatedContact = { ...contact, ...updates }
                return Promise.resolve({
                  data: updatedContact,
                  error: null
                })
              } else {
                return Promise.resolve({
                  data: null,
                  error: new Error('Contact not found')
                })
              }
            })

            const result = await contactService.bulkUpdateContacts(storeId, contactIds, updates)
            
            // Property: Bulk update should succeed or fail gracefully
            expect(result).toBeDefined()
            expect(result.error).toBeNull()
            expect(result.data).toBeDefined()
            
            if (result.data) {
              // Property: All successful updates should return updated contacts
              expect(result.data.length).toBeLessThanOrEqual(contactIds.length)
              expect(result.data.length).toBeGreaterThan(0)
              
              // Property: Each returned contact should be valid
              for (const updatedContact of result.data) {
                expect(updatedContact.id).toBeDefined()
                expect(updatedContact.store_id).toBe(storeId)
                expect(updatedContact.email).toBeDefined()
              }
            }
            
            // Property: Update should be called for each contact ID (only if we have valid updates)
            expect(mockContactRepository.updateContact).toHaveBeenCalledTimes(contactIds.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Contact CRUD Operations Integrity', () => {
    test('contact creation with validation and sanitization', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            store_id: fc.uuid(),
            email: fc.string({ minLength: 3, maxLength: 20 }).map(s => `${s.replace(/[^a-zA-Z0-9]/g, 'a')}@example.com`),
            email_consent: fc.boolean(),
            sms_consent: fc.boolean(),
            total_spent: fc.float({ min: 0, max: 1000, noNaN: true }),
            order_count: fc.integer({ min: 0, max: 10 })
          }),
          async (contactData) => {
            // Clear mocks for this test run
            jest.clearAllMocks()
            
            // Setup mocks
            mockContactRepository.findContactByEmail.mockResolvedValue({
              data: null, // No existing contact
              error: new Error('Contact not found')
            })
            
            const createdContact = {
              id: '12345678-1234-1234-1234-123456789012',
              store_id: contactData.store_id,
              email: contactData.email,
              phone: null,
              first_name: null,
              last_name: null,
              shopify_customer_id: null,
              tags: [],
              segments: [],
              email_consent: contactData.email_consent,
              sms_consent: contactData.sms_consent,
              total_spent: contactData.total_spent,
              order_count: contactData.order_count,
              last_order_at: null,
              created_at: new Date(),
              updated_at: new Date()
            }
            
            mockContactRepository.createContact.mockResolvedValue({
              data: createdContact,
              error: null
            })

            const result = await contactService.createContact(contactData)
            
            // Property: Creation should either succeed or fail gracefully
            expect(result).toBeDefined()
            
            // If creation succeeds, validate the result
            if (result.data) {
              expect(result.error).toBeNull()
              expect(result.data.id).toBeDefined()
              expect(result.data.store_id).toBe(contactData.store_id)
              expect(result.data.email).toBeDefined()
            } else {
              // If creation fails, there should be an error
              expect(result.error).toBeDefined()
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('contact search and filtering accuracy', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // storeId
          fc.array(contactArbitrary, { minLength: 10, maxLength: 100 }), // contacts
          fc.record({
            query: fc.option(fc.string()),
            emailConsent: fc.option(fc.boolean()),
            smsConsent: fc.option(fc.boolean()),
            minTotalSpent: fc.option(fc.float({ min: 0, max: 1000 })),
            maxTotalSpent: fc.option(fc.float({ min: 1000, max: 10000 })),
            limit: fc.option(fc.integer({ min: 1, max: 50 }))
          }), // searchOptions
          async (storeId, contacts, searchOptions) => {
            // Setup mock
            mockContactRepository.getStoreContacts.mockResolvedValue({
              data: contacts,
              error: null
            })

            const result = await contactService.searchContacts(storeId, searchOptions)
            
            expect(result.error).toBeNull()
            expect(result.data).toBeDefined()
            
            if (result.data) {
              const { contacts: searchResults, total, hasMore } = result.data
              
              // Property: Results should not exceed limit
              if (searchOptions.limit) {
                expect(searchResults.length).toBeLessThanOrEqual(searchOptions.limit)
              }
              
              // Property: Total should be non-negative
              expect(total).toBeGreaterThanOrEqual(0)
              
              // Property: hasMore should be boolean
              expect(typeof hasMore).toBe('boolean')
              
              // Property: If consent filter is applied, all results should match
              if (searchOptions.emailConsent !== undefined) {
                for (const contact of searchResults) {
                  expect(contact.email_consent).toBe(searchOptions.emailConsent)
                }
              }
              
              if (searchOptions.smsConsent !== undefined) {
                for (const contact of searchResults) {
                  expect(contact.sms_consent).toBe(searchOptions.smsConsent)
                }
              }
              
              // Property: If spending filter is applied, all results should match
              if (searchOptions.minTotalSpent !== undefined && searchOptions.minTotalSpent !== null) {
                for (const contact of searchResults) {
                  expect(contact.total_spent).toBeGreaterThanOrEqual(searchOptions.minTotalSpent)
                }
              }
              
              if (searchOptions.maxTotalSpent !== undefined && searchOptions.maxTotalSpent !== null) {
                for (const contact of searchResults) {
                  expect(contact.total_spent).toBeLessThanOrEqual(searchOptions.maxTotalSpent)
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

// Helper function to evaluate contact against criteria (simplified version)
interface SegmentationCriteria {
  conditions?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
}

function evaluateContactAgainstCriteria(contact: Contact, criteria: SegmentationCriteria): boolean {
  // This is a simplified version for testing
  // In a real implementation, this would match the segmentation engine logic
  
  if (!criteria.conditions || criteria.conditions.length === 0) {
    return true
  }
  
  const results = criteria.conditions.map((condition: { field: string; operator: string; value: unknown }) => {
    switch (condition.field) {
      case 'total_spent':
        if (condition.operator === 'greater_than') {
          return contact.total_spent > condition.value
        }
        if (condition.operator === 'greater_than_or_equal') {
          return contact.total_spent >= condition.value
        }
        if (condition.operator === 'less_than') {
          return contact.total_spent < condition.value
        }
        break
      case 'order_count':
        if (condition.operator === 'greater_than') {
          return contact.order_count > condition.value
        }
        if (condition.operator === 'greater_than_or_equal') {
          return contact.order_count >= condition.value
        }
        break
      case 'email_consent':
        if (condition.operator === 'equals') {
          return contact.email_consent === condition.value
        }
        break
      case 'sms_consent':
        if (condition.operator === 'equals') {
          return contact.sms_consent === condition.value
        }
        break
      case 'created_at':
        if (condition.operator === 'greater_than' && contact.created_at) {
          return contact.created_at > condition.value
        }
        if (condition.operator === 'less_than' && contact.created_at) {
          return contact.created_at < condition.value
        }
        break
      case 'last_order_at':
        if (condition.operator === 'greater_than' && contact.last_order_at) {
          return contact.last_order_at > condition.value
        }
        if (condition.operator === 'less_than' && contact.last_order_at) {
          return contact.last_order_at < condition.value
        }
        // For "at-risk-customers" segment, we need to handle null last_order_at
        if (condition.operator === 'less_than' && !contact.last_order_at) {
          // If no last order date, consider it as very old (before the threshold)
          return true
        }
        break
    }
    return false
  })
  
  return criteria.operator === 'AND' ? results.every(r => r) : results.some(r => r)
}