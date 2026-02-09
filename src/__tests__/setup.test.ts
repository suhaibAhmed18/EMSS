import * as fc from 'fast-check'
import { contactArbitrary, emailCampaignArbitrary } from '@/lib/test-factories'

describe('Testing Framework Setup', () => {
  test('Jest is working correctly', () => {
    expect(1 + 1).toBe(2)
  })

  test('Fast-check property testing is working', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n
      })
    )
  })

  test('Test factories generate valid data', () => {
    fc.assert(
      fc.property(contactArbitrary, (contact) => {
        expect(contact.id).toBeDefined()
        expect(contact.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        expect(contact.totalSpent).toBeGreaterThanOrEqual(0)
        return true
      })
    )
  })

  test('Email campaign factory generates valid data', () => {
    fc.assert(
      fc.property(emailCampaignArbitrary, (campaign) => {
        expect(campaign.id).toBeDefined()
        expect(campaign.name.length).toBeGreaterThan(0)
        expect(campaign.subject.length).toBeGreaterThan(0)
        expect(['draft', 'scheduled', 'sending', 'sent', 'failed']).toContain(campaign.status)
        return true
      })
    )
  })
})