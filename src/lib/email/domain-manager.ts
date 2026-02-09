// Domain management for custom email sending
import { resendEmailService } from './resend-client'
import { getSupabaseAdmin } from '../database/client'
import { Store } from '../database/types'

export interface DomainConfig {
  id: string
  storeId: string
  domain: string
  verified: boolean
  dnsRecords: Array<{
    type: string
    name: string
    value: string
    status?: 'pending' | 'verified' | 'failed'
  }>
  createdAt: Date
  verifiedAt?: Date
}

export interface DomainVerificationResult {
  domain: string
  verified: boolean
  errors?: string[]
  nextSteps?: string[]
}

export class DomainManager {
  /**
   * Setup custom domain for a store
   */
  async setupDomain(storeId: string, domain: string): Promise<DomainConfig> {
    // Validate domain format
    if (!this.isValidDomain(domain)) {
      throw new Error('Invalid domain format')
    }

    // Check if domain is already configured
    const existingDomain = await this.getDomainByStore(storeId)
    if (existingDomain && existingDomain.domain === domain) {
      return existingDomain
    }

    try {
      // Setup domain with Resend
      const setupResult = await resendEmailService.setupCustomDomain(domain, storeId)
      
      // Store domain configuration in database
      const domainConfig: DomainConfig = {
        id: crypto.randomUUID(),
        storeId,
        domain: setupResult.domain,
        verified: setupResult.verified,
        dnsRecords: setupResult.dnsRecords.map(record => ({
          ...record,
          status: 'pending' as const
        })),
        createdAt: new Date(),
        verifiedAt: setupResult.verified ? new Date() : undefined
      }

      const supabaseAdmin = getSupabaseAdmin()
      // Update store settings with domain configuration
      await (supabaseAdmin as any)
        .from('stores')
        .update({
          settings: {
            custom_domain: domainConfig,
            email_from_domain: domain
          },
          updated_at: new Date()
        })
        .eq('id', storeId)

      return domainConfig
    } catch (error) {
      throw new Error(`Failed to setup domain: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Verify domain setup
   */
  async verifyDomain(storeId: string): Promise<DomainVerificationResult> {
    const domainConfig = await this.getDomainByStore(storeId)
    if (!domainConfig) {
      throw new Error('No domain configured for this store')
    }

    try {
      const verified = await resendEmailService.verifyDomain(domainConfig.domain)
      
      if (verified) {
        // Update domain configuration
        const updatedConfig = {
          ...domainConfig,
          verified: true,
          verifiedAt: new Date(),
          dnsRecords: domainConfig.dnsRecords.map(record => ({
            ...record,
            status: 'verified' as const
          }))
        }

        const supabaseAdmin = getSupabaseAdmin()
        await (supabaseAdmin as any)
          .from('stores')
          .update({
            settings: {
              custom_domain: updatedConfig
            },
            updated_at: new Date()
          })
          .eq('id', storeId)

        return {
          domain: domainConfig.domain,
          verified: true
        }
      } else {
        return {
          domain: domainConfig.domain,
          verified: false,
          errors: ['Domain verification failed'],
          nextSteps: [
            'Ensure all DNS records are properly configured',
            'Wait for DNS propagation (up to 48 hours)',
            'Try verification again'
          ]
        }
      }
    } catch (error) {
      return {
        domain: domainConfig.domain,
        verified: false,
        errors: [error instanceof Error ? error.message : 'Verification failed']
      }
    }
  }

  /**
   * Get domain configuration for a store
   */
  async getDomainByStore(storeId: string): Promise<DomainConfig | null> {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single()

    if (error || !(store as any)?.settings?.custom_domain) {
      return null
    }

    return (store as any).settings.custom_domain as DomainConfig
  }

  /**
   * Get all configured domains
   */
  async getAllDomains(): Promise<DomainConfig[]> {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: stores, error } = await supabaseAdmin
      .from('stores')
      .select('id, settings')
      .not('settings->custom_domain', 'is', null)

    if (error || !stores) {
      return []
    }

    return stores
      .map(store => (store as any).settings?.custom_domain as DomainConfig)
      .filter(Boolean)
  }

  /**
   * Remove domain configuration
   */
  async removeDomain(storeId: string): Promise<void> {
    const domainConfig = await this.getDomainByStore(storeId)
    if (!domainConfig) {
      return
    }

    try {
      // Remove domain from Resend (if supported)
      // Note: Resend API doesn't currently support domain deletion
      // This would need to be done manually in the Resend dashboard

      // Remove from store settings
      const supabaseAdmin = getSupabaseAdmin()
      await (supabaseAdmin as any)
        .from('stores')
        .update({
          settings: {
            custom_domain: null,
            email_from_domain: null
          },
          updated_at: new Date()
        })
        .eq('id', storeId)
    } catch (error) {
      throw new Error(`Failed to remove domain: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get recommended from email address for a store
   */
  async getFromEmailAddress(storeId: string, emailType: 'marketing' | 'transactional' = 'marketing'): Promise<string> {
    const domainConfig = await this.getDomainByStore(storeId)
    
    if (domainConfig && domainConfig.verified) {
      // Use custom domain
      const prefix = emailType === 'marketing' ? 'marketing' : 'noreply'
      return `${prefix}@${domainConfig.domain}`
    } else {
      // Get store domain from Shopify
      const supabaseAdmin = getSupabaseAdmin()
      const { data: store } = await supabaseAdmin
        .from('stores')
        .select('shop_domain')
        .eq('id', storeId)
        .single()

      if ((store as any)?.shop_domain) {
        // Extract domain from Shopify domain (remove .myshopify.com)
        const domain = (store as any).shop_domain.replace('.myshopify.com', '')
        const prefix = emailType === 'marketing' ? 'marketing' : 'noreply'
        return `${prefix}@${domain}.com`
      }
    }

    // Fallback to generic address
    return emailType === 'marketing' ? 'marketing@example.com' : 'noreply@example.com'
  }

  /**
   * Check if domain can send emails
   */
  async canSendFromDomain(storeId: string): Promise<boolean> {
    const domainConfig = await this.getDomainByStore(storeId)
    return domainConfig?.verified || false
  }

  /**
   * Get domain setup instructions
   */
  getDomainSetupInstructions(domainConfig: DomainConfig): Array<{
    step: number
    title: string
    description: string
    dnsRecord?: {
      type: string
      name: string
      value: string
    }
  }> {
    const instructions: Array<{
      step: number
      title: string
      description: string
      dnsRecord?: {
        type: string
        name: string
        value: string
      }
    }> = [
      {
        step: 1,
        title: 'Access your domain DNS settings',
        description: 'Log in to your domain registrar or DNS provider (e.g., GoDaddy, Namecheap, Cloudflare)'
      }
    ]

    domainConfig.dnsRecords.forEach((record, index) => {
      instructions.push({
        step: index + 2,
        title: `Add ${record.type} record`,
        description: `Create a new ${record.type} record with the following details:`,
        dnsRecord: {
          type: record.type,
          name: record.name,
          value: record.value
        }
      })
    })

    instructions.push({
      step: domainConfig.dnsRecords.length + 2,
      title: 'Wait for DNS propagation',
      description: 'DNS changes can take up to 48 hours to propagate. You can verify the setup once propagation is complete.'
    })

    return instructions
  }

  /**
   * Validate domain format
   */
  private isValidDomain(domain: string): boolean {
    // Very permissive domain validation for testing
    // Just check basic format: something.something
    const parts = domain.split('.')
    if (parts.length < 2) return false
    
    // Each part should have at least 1 character and only contain valid characters
    return parts.every(part => 
      part.length > 0 && 
      /^[a-zA-Z0-9-]+$/.test(part) &&
      !part.startsWith('-') &&
      !part.endsWith('-')
    )
  }
}

// Export singleton instance
export const domainManager = new DomainManager()