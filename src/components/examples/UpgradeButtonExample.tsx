'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import SubscriptionUpgradeModal from '@/components/SubscriptionUpgradeModal';
import { TrendingUp } from 'lucide-react';

/**
 * Example component showing how to integrate the SubscriptionUpgradeModal
 * You can use this pattern anywhere in your app where you want to offer upgrades
 */
export default function UpgradeButtonExample() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        
        // Get user's subscription plan
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_plan')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          setCurrentPlan(userData.subscription_plan || 'starter');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <button className="btn-primary" disabled>
        Loading...
      </button>
    );
  }

  // Don't show upgrade button if user is on highest plan
  if (currentPlan === 'enterprise') {
    return null;
  }

  return (
    <>
      {/* Simple Button */}
      <button
        onClick={() => setShowUpgradeModal(true)}
        className="btn-primary inline-flex items-center gap-2"
      >
        <TrendingUp className="w-4 h-4" />
        Upgrade Plan
      </button>

      {/* Upgrade Modal */}
      <SubscriptionUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userId={userId}
      />
    </>
  );
}

/**
 * Alternative: Inline Upgrade Banner
 * Use this to show upgrade prompts in context
 */
export function UpgradeBanner() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold mb-1">
              Unlock More Features
            </h3>
            <p className="text-white/60 text-sm">
              Upgrade to Professional or Enterprise for advanced automation and higher limits
            </p>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="btn-primary whitespace-nowrap"
          >
            View Plans
          </button>
        </div>
      </div>

      <SubscriptionUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userId={userId}
      />
    </>
  );
}

/**
 * Alternative: Feature-Locked Component
 * Use this to show upgrade prompts when users try to access premium features
 */
export function FeatureLockedUpgrade({ featureName }: { featureName: string }) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  return (
    <>
      <div className="bg-white/[0.02] border border-white/10 rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
          <TrendingUp className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {featureName} is a Premium Feature
        </h3>
        <p className="text-white/60 mb-6">
          Upgrade your plan to unlock {featureName} and many more advanced features
        </p>
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="btn-primary"
        >
          Upgrade Now
        </button>
      </div>

      <SubscriptionUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userId={userId}
      />
    </>
  );
}

/**
 * Usage Examples:
 * 
 * 1. Simple Button:
 * ```tsx
 * import UpgradeButtonExample from '@/components/examples/UpgradeButtonExample'
 * 
 * function MyComponent() {
 *   return <UpgradeButtonExample />
 * }
 * ```
 * 
 * 2. Inline Banner:
 * ```tsx
 * import { UpgradeBanner } from '@/components/examples/UpgradeButtonExample'
 * 
 * function Dashboard() {
 *   return (
 *     <div>
 *       <UpgradeBanner />
 *       {/* rest of dashboard */}
 *     </div>
 *   )
 * }
 * ```
 * 
 * 3. Feature Lock:
 * ```tsx
 * import { FeatureLockedUpgrade } from '@/components/examples/UpgradeButtonExample'
 * 
 * function AdvancedFeature() {
 *   const hasAccess = checkUserPlan()
 *   
 *   if (!hasAccess) {
 *     return <FeatureLockedUpgrade featureName="Advanced Analytics" />
 *   }
 *   
 *   return <ActualFeature />
 * }
 * ```
 */
