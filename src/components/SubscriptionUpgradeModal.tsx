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
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function SubscriptionUpgradeModal({ isOpen, onClose, userId }: UpgradeModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      console.log('Loading plans for user:', userId);
      const { data, error } = await supabase.rpc('get_available_upgrades', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error loading plans from RPC:', error);
        throw error;
      }
      console.log('Plans loaded:', data);
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      alert('Failed to load subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = (plan: Plan) => {
    if (plan.is_current_plan) return;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 p-6">
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
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-white mb-2">
                  {formatPrice(selectedPlan.plan_price)}
                  <span className="text-xl text-gray-400 font-normal">/month</span>
                </div>
                <p className="text-gray-400">Billed monthly • Cancel anytime</p>
              </div>

              <div className="bg-[#0f0f0f] rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">What's included:</h3>
                <div className="space-y-3">
                  {selectedPlan.features.features?.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-200">
                    You'll be redirected to Stripe to complete your upgrade securely. 
                    Your subscription will be extended by 1 month with the new plan.
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgradeNow}
                  disabled={upgrading}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className={`relative rounded-lg border-2 p-6 transition-all ${
                    plan.is_current_plan
                      ? 'border-emerald-500 bg-emerald-900/10'
                      : 'border-gray-800 bg-[#0f0f0f] hover:border-gray-700 cursor-pointer'
                  }`}
                  onClick={() => !plan.is_current_plan && handleUpgradeClick(plan)}
                >
                  {plan.is_current_plan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">
                      Current Plan
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.plan_name}</h3>
                    <div className="text-3xl font-bold text-white mb-1">
                      {formatPrice(plan.plan_price)}
                      <span className="text-sm text-gray-400 font-normal">/mo</span>
                    </div>
                    {!plan.is_current_plan && plan.price_difference > 0 && (
                      <p className="text-sm text-emerald-400">
                        +{formatPrice(plan.price_difference)} more
                      </p>
                    )}
                    {!plan.is_current_plan && plan.price_difference < 0 && (
                      <p className="text-sm text-blue-400">
                        {formatPrice(Math.abs(plan.price_difference))} less
                      </p>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mb-6 min-h-[3rem]">
                    {plan.plan_description}
                  </p>

                  <div className="space-y-3 mb-6">
                    {plan.features.features?.slice(0, 5).map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => !plan.is_current_plan && handleUpgradeClick(plan)}
                    disabled={plan.is_current_plan}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      plan.is_current_plan
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : plan.can_upgrade
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {plan.is_current_plan
                      ? 'Current Plan'
                      : plan.can_upgrade
                      ? 'Upgrade'
                      : 'Downgrade'}
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
