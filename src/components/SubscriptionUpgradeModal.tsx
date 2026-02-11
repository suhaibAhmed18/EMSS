'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { loadStripe } from '@stripe/stripe-js';

interface Plan {
  plan_id: string;
  plan_name: string;
  plan_description: string;
  plan_price: number;
  current_plan_price: number;
  price_difference: number;
  features: {
    sms_credits?: number;
    email_credits?: number;
    contacts?: string | number;
    automations?: string | number;
    daily_sms_limit?: number;
    features?: string[];
  };
  is_current_plan: boolean;
  can_upgrade: boolean;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isExpired?: boolean;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function SubscriptionUpgradeModal({ isOpen, onClose, userId: initialUserId, isExpired = false }: UpgradeModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [userId, setUserId] = useState<string>(initialUserId);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (isOpen) {
      initializeUser();
    }
  }, [isOpen]);

  const initializeUser = async () => {
    // If userId is not provided, fetch it
    if (!userId || userId === '') {
      console.log('No userId provided, fetching from session');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('User ID from session:', session.user.id);
        setUserId(session.user.id);
        // Load plans after getting userId
        await loadPlansWithUserId(session.user.id);
      } else {
        console.error('No session found');
        alert('Please log in to view upgrade options');
        onClose();
      }
    } else {
      // Load plans with provided userId
      await loadPlansWithUserId(userId);
    }
  };

  const loadPlansWithUserId = async (uid: string) => {
    setLoading(true);
    try {
      console.log('Loading plans for user:', uid);
      
      // Try using the RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_available_upgrades', {
        p_user_id: uid
      });

      if (rpcError) {
        console.warn('RPC function not available, using fallback:', rpcError);
        // Fallback: Load plans directly and compare manually
        await loadPlansDirectly(uid);
        return;
      }
      
      console.log('Plans loaded via RPC:', rpcData);
      setPlans(rpcData || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      // Try fallback method
      try {
        await loadPlansDirectly(uid);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        alert('Failed to load subscription plans. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPlansDirectly = async (uid: string) => {
    console.log('Loading plans directly from table');
    
    // Get user's current plan
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', uid)
      .single();
    
    const currentPlan = userData?.subscription_plan || 'Starter';
    console.log('Current plan:', currentPlan);
    
    // Get all plans
    const { data: allPlans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    if (plansError) {
      console.error('Error loading plans:', plansError);
      throw plansError;
    }
    
    console.log('All plans:', allPlans);
    
    // Get current plan price
    const currentPlanData = allPlans?.find(p => p.name.toLowerCase() === currentPlan.toLowerCase());
    const currentPrice = currentPlanData?.price || 0;
    
    // Transform plans to match expected format
    const transformedPlans = (allPlans || []).map(plan => ({
      plan_id: plan.id,
      plan_name: plan.name,
      plan_description: plan.description || '',
      plan_price: parseFloat(plan.price),
      current_plan_price: currentPrice,
      price_difference: parseFloat(plan.price) - currentPrice,
      features: plan.features || {},
      is_current_plan: plan.name.toLowerCase() === currentPlan.toLowerCase(),
      can_upgrade: parseFloat(plan.price) > currentPrice
    }));
    
    console.log('Transformed plans:', transformedPlans);
    setPlans(transformedPlans);
  };

  const handleUpgradeClick = (plan: Plan) => {
    console.log('Upgrade clicked for plan:', plan);
    if (plan.is_current_plan) {
      console.log('Cannot upgrade to current plan');
      return;
    }
    setSelectedPlan(plan);
  };

  const handleUpgradeNow = async () => {
    if (!selectedPlan) return;

    setUpgrading(true);
    try {
      console.log('Starting upgrade to:', selectedPlan.plan_name, 'Price:', selectedPlan.plan_price);
      
      // Create Stripe checkout session for upgrade
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: selectedPlan.plan_name,
          planPrice: selectedPlan.plan_price
        })
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        // Direct URL redirect (more reliable)
        console.log('Redirecting to Stripe URL:', data.url);
        window.location.href = data.url;
      } else if (data.sessionId) {
        // Fallback to Stripe.js redirect
        const stripe = await stripePromise;
        if (stripe) {
          console.log('Redirecting to Stripe checkout with session:', data.sessionId);
          const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
          if (error) {
            console.error('Stripe redirect error:', error);
            throw error;
          }
        } else {
          throw new Error('Stripe not initialized');
        }
      } else {
        throw new Error('No session ID or URL returned from API');
      }
    } catch (error) {
      console.error('Error upgrading:', error);
      alert(`Failed to process upgrade: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUpgrading(false);
    }
    // Don't set upgrading to false here - let the redirect happen
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0f0d] rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0f0d] border-b border-white/10 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              {selectedPlan ? `Upgrade to ${selectedPlan.plan_name}` : 'Choose Your Plan'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading plans...</p>
            </div>
          ) : selectedPlan ? (
            // Upgrade Confirmation View
            <div className="max-w-2xl mx-auto">
              {/* Current Plan Comparison */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="bg-[#0f0f0f] rounded-xl p-6 border border-white/10">
                  <h4 className="text-sm font-semibold text-white/60 mb-2">Current Plan</h4>
                  <div className="text-2xl font-bold text-white mb-4">
                    {plans.find(p => p.is_current_plan)?.plan_name || 'Free'}
                  </div>
                  <div className="space-y-2">
                    {plans.find(p => p.is_current_plan)?.features.features?.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-white/60">
                        <svg className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#16a085]/10 rounded-xl p-6 border-2 border-[#16a085]">
                  <h4 className="text-sm font-semibold text-[#16a085] mb-2">Upgrading To</h4>
                  <div className="text-2xl font-bold text-white mb-4">
                    {selectedPlan.plan_name}
                  </div>
                  <div className="space-y-2">
                    {selectedPlan.features.features?.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-white/80">
                        <svg className="w-4 h-4 text-[#16a085] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-white mb-2">
                  {formatPrice(selectedPlan.plan_price)}
                  <span className="text-xl text-white/60 font-normal">/month</span>
                </div>
                <p className="text-white/60">Subscription will be extended by 1 month • Cancel anytime</p>
              </div>

              <div className="bg-[#0f0f0f] rounded-xl p-6 mb-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">What you'll get with this upgrade:</h3>
                <div className="space-y-3">
                  {selectedPlan.features.features?.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#16a085] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-200">
                    You'll be redirected to Stripe to complete your upgrade securely. 
                    Your subscription will be extended by 1 month with the new plan. 
                    The pricing and overview will be updated according to your new plan.
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgradeNow}
                  disabled={upgrading}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {upgrading ? 'Processing...' : 'Upgrade Now'}
                </button>
              </div>
            </div>
          ) : (
            // Plans Grid View
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.plan_id}
                  className={`relative rounded-xl border p-6 transition-all ${
                    plan.is_current_plan
                      ? 'border-[#16a085] bg-[#16a085]/5'
                      : 'border-white/10 bg-[#0f0f0f] hover:border-white/20'
                  }`}
                >
                  {plan.is_current_plan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#16a085] text-white text-xs font-semibold rounded-full">
                      Current Plan
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-4">{plan.plan_name}</h3>
                    <div className="text-4xl font-bold text-white mb-1">
                      {formatPrice(plan.plan_price)}
                      <span className="text-base text-white/60 font-normal">/mo</span>
                    </div>
                  </div>

                  <p className="text-sm text-white/60 mb-6 text-center min-h-[3rem]">
                    {plan.plan_description}
                  </p>

                  <div className="space-y-3 mb-6">
                    {plan.features.features?.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-[#16a085] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-white/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => !plan.is_current_plan && handleUpgradeClick(plan)}
                    disabled={plan.is_current_plan && !isExpired}
                    className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                      plan.is_current_plan && !isExpired
                        ? 'bg-white/[0.04] text-white/40 border border-white/10 cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                  >
                    {plan.is_current_plan && !isExpired ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
