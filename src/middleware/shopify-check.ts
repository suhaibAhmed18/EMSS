// Middleware to check if Shopify store is connected before allowing certain actions
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

export async function requireShopifyConnection() {
  const user = await authServer.getCurrentUser()
  
  if (!user) {
    return {
      connected: false,
      error: 'Authentication required'
    }
  }

  const stores = await databaseService.getStoresByUserId(user.id)
  
  if (stores.length === 0) {
    return {
      connected: false,
      error: 'No Shopify store connected. Please connect your store in Settings > Shopify.'
    }
  }

  return {
    connected: true,
    store: stores[0]
  }
}
