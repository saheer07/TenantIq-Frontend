// SubscriptionPlans.jsx - Updated with proper Razorpay integration
import React, { useState, useEffect } from 'react';
import { Check, Sparkles, CreditCard, AlertCircle, Loader2, Shield, Clock, RefreshCw, Smartphone, Building } from 'lucide-react';
import api from '../services/api';

const SubscriptionPlans = ({ currentSubscription, onSubscriptionChange, isAdmin, user }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscribing, setSubscribing] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    fetchPlans();
  }, []);

  const getUserDisplayName = () => {
    if (!user) return 'Customer';
    if (user.full_name) return user.full_name;
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return 'Customer';
  };

  const getUserPhone = () => {
    if (!user) return '';
    return user.phone || user.mobile || user.phone_number || '';
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subscription/plans/');
      setPlans(response.data);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      setError('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (planId) => {
    if (!isAdmin) {
      alert('Only tenant administrators can manage subscriptions.');
      return;
    }

    try {
      setSubscribing(planId);

      const response = await api.post('/subscription/razorpay/create-order/', {
        plan_id: planId,
        billing_cycle: billingCycle
      });

      const orderData = response.data;
      console.log('Order created:', orderData);

      // Handle DEV MODE - subscription already activated
      if (orderData.dev_mode && orderData.success) {
        console.log('DEV MODE: Subscription activated, skipping Razorpay');
        alert('🎉 DEV MODE: Subscription activated successfully!');
        setSubscribing(null);
        if (onSubscriptionChange) await onSubscriptionChange();
        setTimeout(() => window.location.reload(), 500);
        return; // Exit early - don't load Razorpay
      }

      // Only load Razorpay if NOT in dev mode
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load payment gateway. Please check your internet connection.');
        setSubscribing(null);
        return;
      }

      const plan = plans.find(p => p.id === planId);
      const userDisplayName = getUserDisplayName();
      const userPhone = getUserPhone();

      // Handle subscription (monthly with auto-debit)
      if (orderData.type === 'subscription') {
        const options = {
          key: orderData.key,
          subscription_id: orderData.subscription_id,
          name: 'AI Knowledge Platform',
          description: `${orderData.plan_name} - Monthly Subscription`,

          handler: async function (response) {
            console.log('Subscription successful:', response);

            try {
              const verifyResponse = await api.post('/subscription/razorpay/verify/', {
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: planId,
                billing_cycle: billingCycle,
                type: 'subscription'
              });

              if (verifyResponse.data.success) {
                alert('🎉 Subscription activated with auto-renewal!');
                if (onSubscriptionChange) await onSubscriptionChange();
                window.location.reload();
              }
            } catch (error) {
              console.error('Verification error:', error);
              alert('Payment successful but verification failed. Please contact support.');
            } finally {
              setSubscribing(null);
            }
          },

          prefill: {
            name: userDisplayName,
            email: user?.email || '',
            contact: userPhone
          },

          theme: {
            color: '#3B82F6'
          },

          modal: {
            ondismiss: function () {
              setSubscribing(null);
            }
          }
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();

      } else {
        // Handle one-time order (yearly)
        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'AI Knowledge Platform',
          description: `${orderData.plan_name} - Yearly Subscription`,
          order_id: orderData.order_id,

          handler: async function (response) {
            console.log('Payment successful:', response);

            try {
              const verifyResponse = await api.post('/subscription/razorpay/verify/', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: planId,
                billing_cycle: billingCycle,
                type: 'order'
              });

              if (verifyResponse.data.success) {
                alert('🎉 Payment successful! Your yearly subscription is now active.');
                if (onSubscriptionChange) await onSubscriptionChange();
                window.location.reload();
              }
            } catch (error) {
              console.error('Verification error:', error);
              alert('Payment successful but verification failed. Please contact support with Payment ID: ' + response.razorpay_payment_id);
            } finally {
              setSubscribing(null);
            }
          },

          prefill: {
            name: userDisplayName,
            email: user?.email || '',
            contact: userPhone
          },

          notes: {
            user_id: user?.id || '',
            tenant_id: user?.tenant?.id || '',
            plan_id: planId
          },

          theme: {
            color: '#3B82F6'
          },

          modal: {
            ondismiss: function () {
              setSubscribing(null);
            }
          }
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
      }

    } catch (err) {
      console.error('Subscription error:', err);

      let errorMessage = 'Failed to process subscription. Please try again.';
      if (err.response?.data) {
        errorMessage = err.response.data.error ||
          err.response.data.message ||
          errorMessage;
      }

      alert(errorMessage);
      setSubscribing(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!isAdmin) {
      alert('Only tenant administrators can manage subscriptions.');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/subscription/cancel/');
      alert(response.data.message || 'Subscription cancelled successfully.');
      if (onSubscriptionChange) await onSubscriptionChange();
      window.location.reload();
    } catch (err) {
      console.error('Cancel error:', err);
      alert(err.response?.data?.error || 'Failed to cancel subscription.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getPlanPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthly_price : plan.yearly_price;
  };

  const getSavingsPercentage = (plan) => {
    if (!plan.yearly_price || !plan.monthly_price) return 0;
    const monthlyTotal = plan.monthly_price * 12;
    const savings = ((monthlyTotal - plan.yearly_price) / monthlyTotal) * 100;
    return Math.round(savings);
  };

  if (loading && plans.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6 uppercase tracking-tighter">
          Power Your <span className="text-teal-500">Intelligence</span>
        </h2>
        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed px-4">
          Select the architecture that best scales with your organizational needs.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="mt-8 sm:mt-12 inline-flex items-center p-1 sm:p-1.5 bg-[#1E293B] backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-[#334155] shadow-2xl">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all flex items-center gap-2 sm:gap-3 ${billingCycle === 'monthly'
              ? 'bg-teal-600 text-white shadow-xl shadow-teal-500/20 active:scale-95'
              : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 h-4 ${billingCycle === 'monthly' ? 'animate-spin-slow' : ''}`} />
            Monthly Sync
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all flex items-center gap-2 sm:gap-3 ${billingCycle === 'yearly'
              ? 'bg-teal-600 text-white shadow-xl shadow-teal-500/20 active:scale-95'
              : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            Annual Priority
            <span className="hidden sm:inline bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full text-[8px]">
              -20% OFF
            </span>
          </button>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="mb-10 sm:mb-16 bg-teal-600/5 border border-teal-500/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2 sm:gap-3 text-teal-400/80">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Secure Razorpay</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-teal-400/80">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Zero Lock-in</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-teal-400/80">
            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Integrity</span>
          </div>
        </div>
      </div>

      {/* Current Subscription */}
      {currentSubscription?.is_active && (
        <div className="mb-10 sm:mb-16 bg-gradient-to-r from-teal-600 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl shadow-teal-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-1000 hidden sm:block">
            <Sparkles className="w-32 h-32 text-white" />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2 uppercase tracking-tighter">
                Strategic Partnership Active
              </h3>
              <p className="text-teal-100 font-bold uppercase tracking-widest text-[10px] sm:text-xs">
                {currentSubscription.plan_name} Tier • {currentSubscription.billing_cycle} Cycle
              </p>
              {currentSubscription.end_date && (
                <p className="text-xs sm:text-sm text-teal-200/80 mt-2 font-medium">
                  Next Refresh: {new Date(currentSubscription.end_date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={handleCancelSubscription}
                className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl sm:rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all backdrop-blur-md"
              >
                Deactivate Pipeline
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {plans.map((plan) => {
          const price = getPlanPrice(plan);
          const savings = getSavingsPercentage(plan);
          const isCurrentPlan = currentSubscription?.plan_id === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative bg-[#0F172A] rounded-3xl sm:rounded-[3rem] border-2 transition-all duration-500 overflow-hidden flex flex-col group ${plan.recommended
                ? 'border-teal-500 shadow-2xl shadow-teal-500/10 lg:scale-105 z-10'
                : 'border-[#334155] hover:border-slate-700 shadow-xl'
                }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-teal-600 text-white px-6 sm:px-8 py-2 rounded-bl-2xl sm:rounded-bl-[2rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg">
                  Recommended
                </div>
              )}

              <div className="p-6 sm:p-10 flex-1 flex flex-col">
                <div className="mb-10">
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed min-h-[40px]">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white tracking-tighter">
                      {formatPrice(price)}
                    </span>
                    <span className="text-slate-500 text-lg font-bold uppercase tracking-widest text-xs">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>

                  {billingCycle === 'yearly' && savings > 0 && (
                    <div className="mt-4 inline-block bg-teal-500/10 text-teal-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                      LOCKED SAVINGS {savings}%
                    </div>
                  )}
                </div>

                <div className="space-y-5 mb-12 flex-1">
                  {plan.features?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-4 group/item">
                      <div className="w-2 h-2 bg-teal-500 rounded-full group-hover/item:scale-150 transition-transform"></div>
                      <span className="text-slate-400 text-sm font-medium group-hover/item:text-slate-200 transition-colors">{feature}</span>
                    </div>
                  ))}
                </div>

                {isCurrentPlan ? (
                  <div className="w-full py-5 bg-slate-900 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-[2rem] border border-[#334155] text-center">
                    Current Protocol
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!isAdmin || subscribing === plan.id}
                    className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 active:scale-95 ${plan.recommended
                      ? 'bg-teal-600 text-white shadow-2xl shadow-teal-500/40 hover:bg-teal-700'
                      : 'bg-white text-black hover:bg-slate-200 shadow-xl'
                      } ${!isAdmin || subscribing === plan.id ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                  >
                    {subscribing === plan.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Activate Tier
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPlans;