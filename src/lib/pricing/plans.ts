// Centralized pricing configuration
// This is the single source of truth for plan prices

export const PLAN_PRICES = {
  starter: 29,
  professional: 79,
  enterprise: 199
} as const

export type PlanName = keyof typeof PLAN_PRICES

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  description: string
  currency: string
  billing_period: string
  features: {
    contacts: number
    email_credits: number
    sms_credits: number
    automations: number
    campaigns?: number
    templates?: number
    analytics?: boolean
    support?: string
  }
  popular?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: PLAN_PRICES.starter,
    description: 'Perfect for small businesses getting started',
    currency: 'USD',
    billing_period: 'monthly',
    features: {
      contacts: 1000,
      email_credits: 10000,
      sms_credits: 100,
      automations: 5,
      campaigns: 50,
      templates: 10,
      analytics: true,
      support: 'email'
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: PLAN_PRICES.professional,
    description: 'For growing businesses with advanced needs',
    currency: 'USD',
    billing_period: 'monthly',
    features: {
      contacts: 10000,
      email_credits: 100000,
      sms_credits: 1000,
      automations: 50,
      campaigns: 500,
      templates: 50,
      analytics: true,
      support: 'priority'
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: PLAN_PRICES.enterprise,
    description: 'Unlimited power for large organizations',
    currency: 'USD',
    billing_period: 'monthly',
    features: {
      contacts: 100000,
      email_credits: 1000000,
      sms_credits: 10000,
      automations: -1,
      campaigns: -1,
      templates: -1,
      analytics: true,
      support: 'dedicated'
    }
  }
]

export function formatFeatureValue(value: number): string {
  if (value === -1) return 'Unlimited'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

export function validatePlanPrice(plan: string, amount: number): boolean {
  const expectedPrice = PLAN_PRICES[plan as PlanName]
  return expectedPrice !== undefined && amount === expectedPrice
}

export function getPlanPrice(plan: string): number | null {
  return PLAN_PRICES[plan as PlanName] || null
}

export function isValidPlan(plan: string): plan is PlanName {
  return plan in PLAN_PRICES
}

export function getPlanLimits(plan: string) {
  const limits = {
    Free: {
      contacts: 100,
      emailsPerMonth: 500,
      smsPerMonth: 0,
      campaigns: 5,
      automations: 0,
      templates: 3,
      analytics: false,
      support: 'community'
    },
    starter: {
      contacts: 1000,
      emailsPerMonth: 10000,
      smsPerMonth: 100,
      campaigns: 50,
      automations: 5,
      templates: 10,
      analytics: true,
      support: 'email'
    },
    professional: {
      contacts: 10000,
      emailsPerMonth: 100000,
      smsPerMonth: 1000,
      campaigns: 500,
      automations: 50,
      templates: 50,
      analytics: true,
      support: 'priority'
    },
    enterprise: {
      contacts: 100000,
      emailsPerMonth: 1000000,
      smsPerMonth: 10000,
      campaigns: -1,
      automations: -1,
      templates: -1,
      analytics: true,
      support: 'dedicated'
    }
  }

  return limits[plan as keyof typeof limits] || limits.Free
}
