'use client'

import { useState, useEffect } from 'react'
import { Package, TrendingUp, Info, ExternalLink, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import SubscriptionUpgradeModal from '@/components/SubscriptionUpgradeModal'
import { getPlanLimits, getPlanPrice } from '@/lib/pricing/plans'
import { useSession } from '@/lib/auth/session'

export default function PricingAndUsage() {
  const [activeSubTab, setActiveSubTab] = useState('plan-overview')
  const [planData, setPlanData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useSession()

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

  const openUpgradeModal = () => {
    if (!user) {
      alert('Please log in to upgrade your plan');
      router.push('/auth/login');
      return;
    }
    setShowUpgradeModal(true);
  };

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
        
        {/* Expiry Warning */}
        {planData?.isExpired && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
            <p className="text-red-400 text-sm">
              Your subscription has expired. Please upgrade to continue using campaigns and automations.
            </p>
          </div>
        )}
        
        {planData?.expiresAt && !planData?.isExpired && (
          <p className="text-white/60 text-sm mb-2">
            Expires on {new Date(planData.expiresAt).toLocaleDateString()}
          </p>
        )}
        
        <p className="text-white/60 mb-6">
          {currentPlan === 'professional' || currentPlan === 'enterprise' 
            ? 'You have access to all premium features'
            : 'Upgrade to unlock more features and higher limits'}
        </p>
        {currentPlan !== 'enterprise' && (
          <button 
            onClick={openUpgradeModal}
            className="btn-primary inline-flex items-center"
          >
            {planData?.isExpired ? 'Renew Plan' : 'Upgrade Plan'}
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
        />
      )}
      {activeSubTab === 'sms-credits' && <SmsCredits usage={usage} />}
      {activeSubTab === 'add-ons' && <AddOns />}

      {/* Upgrade Modal */}
      {showUpgradeModal && user && (
        <SubscriptionUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          userId={user.id}
          isExpired={planData?.isExpired || false}
        />
      )}
    </div>
  )
}

function PlanOverview({ planData, onUpgrade }: any) {
  const usage = planData?.usage || {}
  const currentPlan = planData?.plan?.toLowerCase() || 'free'
  
  // Calculate email usage percentage
  const emailUsagePercent = usage.emailsLimit > 0 
    ? (usage.emailsSent / usage.emailsLimit) * 100 
    : 0

  // Get plan limits - CONSISTENT WITH DATABASE
  const limits = getPlanLimits(currentPlan)
  
  // Get plan price
  const planPrice = currentPlan === 'free' ? 0 : getPlanPrice(currentPlan) || 0

  return (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {planData?.plan || 'Free'} plan
            </h3>
            <p className="text-sm text-white/60 mt-1">
              ${planPrice}/month
            </p>
          </div>
          {currentPlan !== 'enterprise' && (
            <button 
              onClick={() => onUpgrade()}
              className="btn-secondary text-sm"
            >
              Upgrade Plan
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {limits.emailsPerMonth?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-white/60">Emails per month</div>
          </div>
          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {limits.contacts?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-white/60">Contacts</div>
          </div>
          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {limits.smsPerMonth?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-white/60">SMS per month</div>
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
                {usage.emailsSent || 0} of {limits.emailsPerMonth?.toLocaleString() || '0'} emails sent this billing cycle
              </span>
              {currentPlan !== 'enterprise' && (
                <button 
                  onClick={() => onUpgrade()}
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
      '100 SMS per month',
      'Basic email templates',
      'Email support'
    ],
    starter: [
      '5,000 emails per month',
      '1,000 contacts',
      '500 SMS per month',
      '5 automation workflows',
      'All email templates',
      'Basic analytics',
      'Email support',
      'Telnyx phone number'
    ],
    professional: [
      '20,000 emails per month',
      '10,000 contacts',
      '2,000 SMS per month',
      '20 automation workflows',
      'Advanced automation',
      'A/B testing',
      'Priority support',
      'Custom domains',
      'Advanced analytics'
    ],
    enterprise: [
      '100,000+ emails per month',
      '100,000 contacts',
      '50,000 SMS per month',
      'Unlimited automations',
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
