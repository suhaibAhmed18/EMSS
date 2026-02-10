'use client'

import { useState, useEffect } from 'react'
import { Package, TrendingUp, Info, ExternalLink, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PricingAndUsage() {
  const [activeSubTab, setActiveSubTab] = useState('plan-overview')
  const [planData, setPlanData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadPlanData()
    
    // Check for upgrade success
    if (searchParams.get('upgraded') === 'true') {
      const plan = searchParams.get('plan')
      alert(`Successfully upgraded to ${plan} plan!`)
      router.replace('/settings')
    }
  }, [searchParams])

  const loadPlanData = async () => {
    try {
      const response = await fetch('/api/settings/pricing')
      if (response.ok) {
        const data = await response.json()
        setPlanData(data)
      }
    } catch (error) {
      console.error('Failed to load plan data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan: string) => {
    setUpgrading(true)
    try {
      const response = await fetch('/api/settings/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to process upgrade')
        setUpgrading(false)
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to process upgrade. Please try again.')
      setUpgrading(false)
    }
  }

  const openUpgradeModal = (plan: string) => {
    setSelectedPlan(plan)
    setShowUpgradeModal(true)
  }

  if (loading) {
    return (
      <div className="card-premium p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  const currentPlan = planData?.plan?.toLowerCase() || 'free'
  const usage = planData?.usage || {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Pricing and usage</h2>
      </div>

      {/* Current Plan Banner */}
      <div className="card-premium p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
          <Package className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          You're currently on the {planData?.plan || 'Free'} plan
        </h3>
        <p className="text-white/60 mb-6">
          {currentPlan === 'professional' || currentPlan === 'enterprise' 
            ? 'You have access to all premium features'
            : 'Upgrade to unlock more features and higher limits'}
        </p>
        {currentPlan !== 'enterprise' && (
          <button 
            onClick={() => openUpgradeModal(currentPlan === 'professional' ? 'enterprise' : 'professional')}
            className="btn-primary inline-flex items-center"
            disabled={upgrading}
          >
            {upgrading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>Upgrade Plan</>
            )}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex space-x-8">
          {['Plan overview', 'SMS credits', 'Add-ons'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab.toLowerCase().replace(' ', '-'))}
              className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeSubTab === tab.toLowerCase().replace(' ', '-')
                  ? 'border-[#16a085] text-white'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeSubTab === 'plan-overview' && (
        <PlanOverview 
          planData={planData} 
          onUpgrade={openUpgradeModal}
          upgrading={upgrading}
        />
      )}
      {activeSubTab === 'sms-credits' && <SmsCredits usage={usage} />}
      {activeSubTab === 'add-ons' && <AddOns />}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          currentPlan={currentPlan}
          selectedPlan={selectedPlan}
          onConfirm={() => {
            setShowUpgradeModal(false)
            handleUpgrade(selectedPlan)
          }}
          onCancel={() => {
            setShowUpgradeModal(false)
            setSelectedPlan('')
          }}
        />
      )}
    </div>
  )
}

function PlanOverview({ planData, onUpgrade, upgrading }: any) {
  const usage = planData?.usage || {}
  const currentPlan = planData?.plan?.toLowerCase() || 'free'
  
  // Calculate email usage percentage
  const emailUsagePercent = usage.emailsLimit > 0 
    ? (usage.emailsSent / usage.emailsLimit) * 100 
    : 0

  // Get plan limits
  const planLimits: Record<string, { emails: number, contacts: number, price: number }> = {
    free: { emails: 500, contacts: 250, price: 0 },
    starter: { emails: 5000, contacts: 1000, price: 0 },
    professional: { emails: 50000, contacts: 10000, price: 49 },
    enterprise: { emails: 500000, contacts: 100000, price: 99 }
  }

  const limits = planLimits[currentPlan] || planLimits.free

  return (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {planData?.plan || 'Free'} plan
            </h3>
            <p className="text-sm text-white/60 mt-1">
              ${limits.price}/month
            </p>
          </div>
          {currentPlan !== 'enterprise' && (
            <button 
              onClick={() => onUpgrade(currentPlan === 'professional' ? 'enterprise' : 'professional')}
              className="btn-secondary text-sm"
              disabled={upgrading}
            >
              {upgrading ? 'Processing...' : 'Upgrade Plan'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {limits.emails.toLocaleString()}
            </div>
            <div className="text-sm text-white/60">Emails per month</div>
          </div>
          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {limits.contacts.toLocaleString()}
            </div>
            <div className="text-sm text-white/60">Contacts</div>
          </div>
          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {currentPlan === 'professional' || currentPlan === 'enterprise' ? 'Unlimited' : 'Limited'}
            </div>
            <div className="text-sm text-white/60">SMS campaigns</div>
          </div>
        </div>

        <p className="text-sm text-white/60 mb-6">
          Paid plans work as a monthly charge based on your current number of billable contacts. 
          The total cost places you in one of the billing tiers. We do not charge for unsubscribed contacts.
        </p>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white">Email Usage</h4>
          
          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/70">
                {usage.emailsSent || 0} of {limits.emails.toLocaleString()} emails sent this billing cycle
              </span>
              {currentPlan !== 'enterprise' && (
                <button 
                  onClick={() => onUpgrade(currentPlan === 'professional' ? 'enterprise' : 'professional')}
                  className="text-sm text-[#16a085] hover:underline"
                >
                  Upgrade to increase your email limit
                </button>
              )}
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-[#16a085] h-2 rounded-full transition-all" 
                style={{ width: `${Math.min(emailUsagePercent, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-white/50 mt-2">
              {usage.billingCycle?.end 
                ? `Resets on ${new Date(usage.billingCycle.end).toLocaleDateString()}`
                : 'Billing cycle not set'}
            </p>
          </div>
        </div>

        {/* Plan Features */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <h4 className="text-sm font-semibold text-white mb-4">Plan Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getPlanFeatures(currentPlan).map((feature, index) => (
              <div key={index} className="flex items-start">
                <Check className="w-4 h-4 text-[#16a085] mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/70">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function getPlanFeatures(plan: string): string[] {
  const features: Record<string, string[]> = {
    free: [
      '500 emails per month',
      '250 contacts',
      'Basic email templates',
      'Email support'
    ],
    starter: [
      '5,000 emails per month',
      '1,000 contacts',
      'All email templates',
      'Basic automation',
      'Email & chat support'
    ],
    professional: [
      '50,000 emails per month',
      '10,000 contacts',
      'Advanced automation',
      'SMS campaigns',
      'A/B testing',
      'Priority support',
      'Custom domains',
      'Advanced analytics'
    ],
    enterprise: [
      '500,000 emails per month',
      '100,000 contacts',
      'Everything in Professional',
      'Dedicated account manager',
      'Custom integrations',
      'White-label options',
      'SLA guarantee',
      '24/7 phone support'
    ]
  }

  return features[plan] || features.free
}

function SmsCredits({ usage }: any) {
  const smsCredits = usage?.smsCredits || 500
  const smsUsed = usage?.smsUsed || 0
  const smsUsagePercent = smsCredits > 0 ? (smsUsed / smsCredits) * 100 : 0
  const smsRemaining = Math.max(0, smsCredits - smsUsed)

  return (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-white mb-4">SMS monthly credits</h3>
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-200">
            <Info className="w-4 h-4 inline mr-2" />
            Upgrade to Professional or Enterprise to get monthly SMS credits included in your plan
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-white/70">CREDIT TYPE</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/70">STATUS</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/70">BALANCE</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-white/70">NEXT REFILL</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="py-4 px-4 text-sm text-white">Monthly SMS credits</td>
                <td className="py-4 px-4 text-sm text-white">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Active</span>
                </td>
                <td className="py-4 px-4 text-sm text-white">{smsCredits.toLocaleString()} SMS</td>
                <td className="py-4 px-4 text-sm text-white/60">
                  {usage?.billingCycle?.end 
                    ? `Resets ${new Date(usage.billingCycle.end).toLocaleDateString()}`
                    : 'Monthly'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-white mb-4">SMS usage</h4>
          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/70">
                {smsUsed.toLocaleString()} of {smsCredits.toLocaleString()} SMS sent this billing cycle
              </span>
              <span className="text-sm text-white/60">
                {smsRemaining.toLocaleString()} remaining
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-[#16a085] h-2 rounded-full transition-all" 
                style={{ width: `${Math.min(smsUsagePercent, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-white/50 mt-2">
              {usage?.billingCycle?.end 
                ? `Resets on ${new Date(usage.billingCycle.end).toLocaleDateString()}`
                : 'Upgrade to Professional or Enterprise for monthly SMS credit refills'}
            </p>
            {usage?.smsCost && (
              <p className="text-xs text-white/50 mt-1">
                Total cost: ${parseFloat(usage.smsCost).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AddOns() {
  return (
    <div className="card-premium p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Add-ons</h3>
      <p className="text-sm text-white/60 mb-6">
        Enhance your plan with additional features and services.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/[0.02] rounded-lg p-4 border border-white/10">
          <h4 className="text-sm font-semibold text-white mb-2">Extra SMS Credits</h4>
          <p className="text-xs text-white/60 mb-3">
            Purchase additional SMS credits for your campaigns
          </p>
          <button className="text-sm text-[#16a085] hover:underline">
            Coming soon
          </button>
        </div>
        
        <div className="bg-white/[0.02] rounded-lg p-4 border border-white/10">
          <h4 className="text-sm font-semibold text-white mb-2">Dedicated IP</h4>
          <p className="text-xs text-white/60 mb-3">
            Get a dedicated IP address for better email deliverability
          </p>
          <button className="text-sm text-[#16a085] hover:underline">
            Coming soon
          </button>
        </div>
      </div>
    </div>
  )
}

function UpgradeModal({ currentPlan, selectedPlan, onConfirm, onCancel }: any) {
  const planDetails: Record<string, { name: string, price: number, features: string[] }> = {
    professional: {
      name: 'Professional',
      price: 49,
      features: [
        '50,000 emails per month',
        '10,000 contacts',
        'Advanced automation',
        'SMS campaigns',
        'A/B testing',
        'Priority support'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: 99,
      features: [
        '500,000 emails per month',
        '100,000 contacts',
        'Everything in Professional',
        'Dedicated account manager',
        'Custom integrations',
        '24/7 phone support'
      ]
    }
  }

  const plan = planDetails[selectedPlan]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-premium max-w-lg w-full p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Upgrade to {plan?.name} Plan
        </h3>
        
        <div className="mb-6">
          <div className="text-3xl font-bold text-white mb-2">
            ${plan?.price}
            <span className="text-lg font-normal text-white/60">/month</span>
          </div>
          <p className="text-sm text-white/60">
            Billed monthly • Cancel anytime
          </p>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-white mb-3">What's included:</h4>
          <div className="space-y-2">
            {plan?.features.map((feature, index) => (
              <div key={index} className="flex items-start">
                <Check className="w-4 h-4 text-[#16a085] mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/70">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-200">
            <Info className="w-4 h-4 inline mr-2" />
            You'll be redirected to Stripe to complete your upgrade securely
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 btn-primary"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  )
}
