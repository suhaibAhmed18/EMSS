interface TelnyxConfig {
  apiKey: string
  baseUrl: string
}

const config: TelnyxConfig = {
  apiKey: process.env.TELNYX_API_KEY || '',
  baseUrl: 'https://api.telnyx.com/v2',
}

export interface TelnyxNumber {
  id: string
  phone_number: string
  status: string
  record_type: string
}

export async function searchAvailableNumbers(areaCode?: string): Promise<TelnyxNumber[]> {
  try {
    const params = new URLSearchParams({
      'filter[features]': 'sms,mms',
      'filter[limit]': '10',
    })

    if (areaCode) {
      params.append('filter[national_destination_code]', areaCode)
    }

    const response = await fetch(`${config.baseUrl}/available_phone_numbers?${params}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Telnyx API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error searching available numbers:', error)
    throw error
  }
}

export async function purchasePhoneNumber(phoneNumber: string): Promise<TelnyxNumber> {
  try {
    const response = await fetch(`${config.baseUrl}/number_orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_numbers: [{ phone_number: phoneNumber }],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to purchase number: ${error.errors?.[0]?.detail || response.statusText}`)
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error purchasing phone number:', error)
    throw error
  }
}

export async function releasePhoneNumber(numberId: string): Promise<void> {
  try {
    const response = await fetch(`${config.baseUrl}/phone_numbers/${numberId}/actions/release`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to release number: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error releasing phone number:', error)
    throw error
  }
}

export async function assignNumberToUser(userId: string, phoneNumber: string, numberId: string) {
  // This will be implemented with your database
  // Store the assignment in the telnyx_numbers table
  return {
    userId,
    phoneNumber,
    numberId,
    assignedAt: new Date().toISOString(),
  }
}
