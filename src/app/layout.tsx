import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from '@/lib/auth/session'
import { Navigation } from '@/components/navigation'
import { ConditionalLayout } from '@/components/ConditionalLayout'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <SessionProvider>
          <ConditionalLayout>
            <Navigation />
            <main>
              {children}
            </main>
            <Toaster />
          </ConditionalLayout>
        </SessionProvider>
      </body>
    </html>
  )
}