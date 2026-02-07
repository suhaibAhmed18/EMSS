import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { SessionProvider } from '@/lib/auth/session'
import { ConditionalLayout } from '@/components/ConditionalLayout'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'MarketingPro - Premium Email & SMS Marketing for Shopify',
  description: 'Professional email and SMS marketing platform with advanced automation, analytics, and Shopify integration. Boost your e-commerce sales with targeted campaigns.',
  keywords: 'email marketing, SMS marketing, Shopify, automation, e-commerce, marketing platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        <SessionProvider>
          <ConditionalLayout>
            {children}
            <Toaster />
          </ConditionalLayout>
        </SessionProvider>
      </body>
    </html>
  )
}
