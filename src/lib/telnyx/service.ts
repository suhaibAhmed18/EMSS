import Telnyx from 'telnyx'

const telnyx = new Telnyx(process.env.TELNYX_API_KEY || 'dummy_key')

interface PhoneNumber {
  id: string
  phoneNumber: string
  status: string
}

class TelnyxService {
  /**
   * Search for available phone numbers
   */
  async searchAvailableNumbers(countryCode: string = 'US', limit: number = 10): Promise<PhoneNumber[]> {
    try {
      if (!process.env.TELNYX_API_KEY || process.env.TELNYX_API_KEY === 'your_telnyx_api_key_here') {
        console.log('🔧 Development mode: Simulating Telnyx number search')
        // Return mock numbers for development
        return Array.from({ length: limit }, (_, i) => ({
          id: `mock_${Date.now()}_${i}`,
          phoneNumber: `+1555${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
          status: 'available',
        }))
      }

      const response = await telnyx.availablePhoneNumbers.list({
        filter: {
          country_code: countryCode,
          features: ['sms', 'mms'],
          limit,
        },
      })

      return response.data.map((number: any) => ({
        id: number.record_type,
        phoneNumber: number.phone_number,
        status: 'available',
      }))
    } catch (error) {
      console.error('Failed to search Telnyx numbers:', error)
      // Return mock numbers on error in development
      if (process.env.NODE_ENV === 'development') {
        return [{
          id: `mock_${Date.now()}`,
          phoneNumber: `+1555${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
          status: 'available',
        }]
      }
      throw error
    }
  }

  /**
   * Purchase and assign a phone number to a user
   */
  async assignPhoneNumber(userId: string, phoneNumber?: string): Promise<string> {
    try {
      let assignedNumber = phoneNumber

      if (!assignedNumber) {
        // Search for an available number
        const availableNumbers = await this.searchAvailableNumbers('US', 1)
        if (availableNumbers.length === 0) {
          throw new Error('No available phone numbers found')
        }
        assignedNumber = availableNumbers[0].phoneNumber
      }

      if (!process.env.TELNYX_API_KEY || process.env.TELNYX_API_KEY === 'your_telnyx_api_key_here') {
        console.log(`🔧 Development mode: Simulating Telnyx number assignment for user ${userId}`)
        console.log(`📱 Assigned number: ${assignedNumber}`)
        return assignedNumber
      }

      // In production, purchase the number through Telnyx API
      const response = await telnyx.phoneNumbers.create({
        phone_number: assignedNumber,
        connection_id: process.env.TELNYX_CONNECTION_ID,
        messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID,
      })

      console.log(`✅ Phone number ${assignedNumber} assigned to user ${userId}`)
      return assignedNumber
    } catch (error) {
      console.error('Failed to assign Telnyx number:', error)
      
      // In development, return a mock number
      if (process.env.NODE_ENV === 'development') {
        const mockNumber = `+1555${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`
        console.log(`🔧 Development mode: Using mock number ${mockNumber}`)
        return mockNumber
      }
      
      throw error
    }
  }

  /**
   * Send SMS using Telnyx
   */
  async sendSMS(from: string, to: string, message: string): Promise<boolean> {
    try {
      if (!process.env.TELNYX_API_KEY || process.env.TELNYX_API_KEY === 'your_telnyx_api_key_here') {
        console.log('🔧 Development mode: Simulating SMS send')
        console.log(`📱 From: ${from}, To: ${to}, Message: ${message}`)
        return true
      }

      await telnyx.messages.create({
        from,
        to,
        text: message,
      })

      console.log(`✅ SMS sent from ${from} to ${to}`)
      return true
    } catch (error) {
      console.error('Failed to send SMS:', error)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: SMS would be sent in production')
        return true
      }
      
      throw error
    }
  }

  /**
   * Release a phone number
   */
  async releasePhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      if (!process.env.TELNYX_API_KEY || process.env.TELNYX_API_KEY === 'your_telnyx_api_key_here') {
        console.log(`🔧 Development mode: Simulating number release for ${phoneNumber}`)
        return true
      }

      // In production, release the number through Telnyx API
      await telnyx.phoneNumbers.del(phoneNumber)

      console.log(`✅ Phone number ${phoneNumber} released`)
      return true
    } catch (error) {
      console.error('Failed to release phone number:', error)
      
      if (process.env.NODE_ENV === 'development') {
        return true
      }
      
      throw error
    }
  }
}

export const telnyxService = new TelnyxService()
