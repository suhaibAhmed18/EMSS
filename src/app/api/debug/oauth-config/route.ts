import { NextResponse } from 'next/server'

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/auth/shopify/callback`
  
  return NextResponse.json({
    appUrl,
    redirectUri,
    clientId: process.env.SHOPIFY_CLIENT_ID ? 'Set' : 'Missing',
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET ? 'Set' : 'Missing',
    message: 'In Shopify Partners, set App URL to appUrl and Allowed Redirect URL to redirectUri'
  })
}
