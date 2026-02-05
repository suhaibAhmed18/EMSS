export interface UserStore {
  id: string
  userId: string
  shopDomain: string
  displayName?: string
  logoUrl?: string
  planType: string
  subscriptionStatus: string
  role: string
  currency: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface StoreAnalytics {
  totalContacts: number
  emailCampaigns: number
  smsCampaigns: number
  automations: number
  revenue: number
}

class MultiStoreManager {
  async getUserStores(userId: string): Promise<UserStore[]> {
    try {
      const response = await fetch(`/api/stores?userId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch stores')
      }
      const data = await response.json()
      return data.stores || []
    } catch (error) {
      console.error('Error fetching user stores:', error)
      return []
    }
  }

  async getStoreAnalytics(storeId: string): Promise<StoreAnalytics> {
    try {
      const response = await fetch(`/api/stores/${storeId}/analytics`)
      if (!response.ok) {
        throw new Error('Failed to fetch store analytics')
      }
      const data = await response.json()
      return data.analytics || {
        totalContacts: 0,
        emailCampaigns: 0,
        smsCampaigns: 0,
        automations: 0,
        revenue: 0
      }
    } catch (error) {
      console.error('Error fetching store analytics:', error)
      return {
        totalContacts: 0,
        emailCampaigns: 0,
        smsCampaigns: 0,
        automations: 0,
        revenue: 0
      }
    }
  }

  async connectStore(shopDomain: string): Promise<UserStore> {
    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shopDomain })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to connect store')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error connecting store:', error)
      throw error
    }
  }

  async disconnectStore(storeId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to disconnect store')
      }
      
      const data = await response.json()
      return data.success || false
    } catch (error) {
      console.error('Error disconnecting store:', error)
      return false
    }
  }

  async addUserToStore(userId: string, storeId: string, role: string = 'admin'): Promise<boolean> {
    try {
      const response = await fetch(`/api/stores/${storeId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role })
      })
      
      if (!response.ok) {
        throw new Error('Failed to add user to store')
      }
      
      const data = await response.json()
      return data.success || false
    } catch (error) {
      console.error('Error adding user to store:', error)
      return false
    }
  }
}

export const multiStoreManager = new MultiStoreManager()