// Environment configuration and validation

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  shopify: {
    clientId: process.env.SHOPIFY_CLIENT_ID!,
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET!,
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET!,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY!,
  },
  telnyx: {
    apiKey: process.env.TELNYX_API_KEY!,
    phoneNumber: process.env.TELNYX_PHONE_NUMBER!,
  },
  app: {
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    secret: process.env.NEXTAUTH_SECRET!,
  },
}

// Validate required environment variables
export function validateConfig() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SHOPIFY_CLIENT_ID',
    'SHOPIFY_CLIENT_SECRET',
    'SHOPIFY_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'TELNYX_API_KEY',
    'TELNYX_PHONE_NUMBER',
    'NEXTAUTH_SECRET',
  ]

  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}