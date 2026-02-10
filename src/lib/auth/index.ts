// Authentication module exports
export * from './types'
export * from './client'
export * from './server'
export * from './session'

// Re-export commonly used items
export { authClient } from './client'
export { authServer } from './server'
export { SessionProvider, useSession, useRequireAuth } from './session'