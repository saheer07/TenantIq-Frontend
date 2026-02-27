// ==================== src/components/SubscriptionManagement.jsx ====================
import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  Zap,
  Shield,
  Star,
  Crown,
  ArrowRight,
  Download,
  FileText,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

const SubscriptionManagement = ({ user, subscription, onRefresh }) => {
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [usageStats, setUsageStats] = useState(null);

  useEffect(() => {
    fetchSubscriptionData();
    fetchBillingHistory();
    fetchUsageStats();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await api.get('/subscriptions/current/');
      if (response.data.has_subscription && response.data.subscription) {
        setCurrentSubscription(response.data.subscription);
      } else {
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setCurrentSubscription(subscription);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      const response = await api.get('/subscriptions/history/');
      // Transform the data to match our UI format
      const formattedHistory = response.data.map(sub => ({
        id: sub.id,
        date: sub.start_date,
        amount: sub.plan_details?.price || 0,
        status: sub.status === 'active' ? 'paid' : sub.status,
        invoice_url: '#',
        description: `${sub.plan_details?.name || 'Plan'} - ${sub.plan_details?.plan_type || 'Monthly'}`
      }));
      setBillingHistory(formattedHistory);
    } catch (error) {
      console.error('Failed to fetch billing history:', error);
      setBillingHistory([]);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const response = await api.get('/subscriptions/status/');
      if (response.data.is_active) {
        // Get actual usage from backend or use defaults
        setUsageStats({
          users: 15, // You'll need to add an endpoint for this
          maxUsers: response.data.max_users || 25,
          documents: 45,
          maxDocuments: 100,
          apiCalls: 8750,
          maxApiCalls: 10000
        });
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
      setUsageStats({
        users: 15,
        maxUsers: 25,
        documents: 45,
        maxDocuments: 100,
        apiCalls: 8750,
        maxApiCalls: 10000
      });
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      yearlyPrice: 290,
      plan_type: 'monthly',
      icon: Zap,
      color: 'blue',
      popular: false,
      features: [
        '5 Team Members',
        '25 Documents',
        '1,000 AI Queries/month',
        'Email Support',
        'Basic Analytics',
        'Standard Security'
      ],
      limits: {
        max_users: 5,
        max_documents: 25,
        max_storage_mb: 500
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99,
      yearlyPrice: 990,
      plan_type: 'monthly',
      icon: Star,
      color: 'purple',
      popular: true,
      features: [
        '25 Team Members',
        '100 Documents',
        '10,000 AI Queries/month',
        'Priority Support',
        'Advanced Analytics',
        'Custom Branding',
        'API Access',
        'SSO Integration'
      ],
      limits: {
        max_users: 25,
        max_documents: 100,
        max_storage_mb: 5000
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      yearlyPrice: 2990,
      plan_type: 'monthly',
      icon: Crown,
      color: 'amber',
      popular: false,
      features: [
        'Unlimited Team Members',
        'Unlimited Documents',
        'Unlimited AI Queries',
        '24/7 Premium Support',
        'Enterprise Analytics',
        'Custom Branding',
        'Full API Access',
        'SSO Integration',
        'Dedicated Account Manager',
        'Custom Integration Support',
        'SLA Guarantee'
      ],
      limits: {
        max_users: 999999,
        max_documents: 999999,
        max_storage_mb: 999999
      }
    }
  ];

  const handleUpgrade = async (plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan) return;

    setUpgrading(true);
    try {
      const hasSubscription = currentSubscription?.status === 'active' || subscription?.status === 'active';
      const endpoint = hasSubscription ? '/subscriptions/upgrade/' : '/subscriptions/create/';
      const payload = hasSubscription ? { new_plan_id: selectedPlan.id } : { plan_id: selectedPlan.id };

      const response = await api.post(endpoint, payload);

      alert(response.data.message || (hasSubscription ? 'Subscription upgraded successfully!' : 'Subscription purchased successfully!'));
      setShowUpgradeModal(false);
      setSelectedPlan(null);
      await fetchSubscriptionData();
      await fetchBillingHistory();

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Subscription action failed:', error);
      alert(error.response?.data?.error || 'Failed to process subscription');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      return;
    }

    try {
      await api.post('/subscriptions/cancel/');
      alert('Subscription cancelled. You will have access until the end of your billing period.');
      await fetchSubscriptionData();

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Cancel failed:', error);
      alert('Failed to cancel subscription');
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      'active': {
        color: 'bg-green-100 text-green-700',
        icon: CheckCircle,
        text: 'Active'
      },
      'cancelled': {
        color: 'bg-red-100 text-red-700',
        icon: XCircle,
        text: 'Cancelled'
      },
      'past_due': {
        color: 'bg-yellow-100 text-yellow-700',
        icon: AlertCircle,
        text: 'Past Due'
      },
      'trialing': {
        color: 'bg-teal-500/10 text-teal-700',
        icon: Clock,
        text: 'Trial'
      }
    };

    const config = configs[status] || configs['active'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.text}
      </span>
    );
  };

  const getUsagePercentage = (current, max) => {
    if (!max || max === 999999) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#0F172A] rounded-lg shadow-sm p-6">
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-400">Loading subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* No Active Subscription Notice */}
      {(!currentSubscription?.status || currentSubscription?.status === 'cancelled') &&
        (!subscription?.status || subscription?.status === 'cancelled') && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-orange-900 mb-2">No Active Subscription</h3>
                <p className="text-orange-700 mb-4">
                  You currently don't have an active subscription. Choose a plan below to unlock all premium features and start using our AI platform.
                </p>
                <div className="flex flex-wrap gap-2 text-sm text-orange-600">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Unlimited AI Queries
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Team Collaboration
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Document Management
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Priority Support
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Current Subscription Overview */}
      {((currentSubscription?.status && currentSubscription?.status !== 'cancelled') ||
        (subscription?.status && subscription?.status !== 'cancelled')) && (
          <div className="bg-[#0F172A] rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-teal-600" />
                Current Subscription
              </h2>
              <button
                onClick={fetchSubscriptionData}
                className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-500/10 rounded-lg transition"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-teal-500/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-teal-700 font-medium">Plan</span>
                  {getStatusBadge(currentSubscription?.status || subscription?.status || 'active')}
                </div>
                <div className="text-2xl font-bold text-white">
                  {currentSubscription?.plan_details?.name || subscription?.plan_name || 'Professional'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-700" />
                  <span className="text-sm text-green-700 font-medium">Amount</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  ${currentSubscription?.plan_details?.price || subscription?.amount || 99}
                  <span className="text-sm font-normal text-green-700">
                    /{currentSubscription?.plan_details?.plan_type || subscription?.billing_cycle || 'month'}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-700" />
                  <span className="text-sm text-purple-700 font-medium">Next Billing</span>
                </div>
                <div className="text-lg font-bold text-purple-900">
                  {currentSubscription?.next_billing_date || subscription?.next_billing_date || currentSubscription?.end_date || subscription?.end_date
                    ? new Date(currentSubscription?.next_billing_date || subscription?.next_billing_date || currentSubscription?.end_date || subscription?.end_date).toLocaleDateString()
                    : 'Feb 15, 2026'
                  }
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span className="text-sm text-amber-700 font-medium">Member Since</span>
                </div>
                <div className="text-lg font-bold text-amber-900">
                  {currentSubscription?.created_at || subscription?.created_at
                    ? new Date(currentSubscription?.created_at || subscription?.created_at).toLocaleDateString()
                    : 'Jan 2026'
                  }
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            {usageStats && (
              <div className="border-t border-[#334155] pt-6">
                <h3 className="font-semibold text-white mb-4">Usage This Month</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Team Members
                      </span>
                      <span className="font-medium text-white">
                        {usageStats.users} / {usageStats.maxUsers === 999999 ? '∞' : usageStats.maxUsers}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getUsageColor(getUsagePercentage(usageStats.users, usageStats.maxUsers))}`}
                        style={{ width: `${getUsagePercentage(usageStats.users, usageStats.maxUsers)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Documents
                      </span>
                      <span className="font-medium text-white">
                        {usageStats.documents} / {usageStats.maxDocuments === 999999 ? '∞' : usageStats.maxDocuments}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getUsageColor(getUsagePercentage(usageStats.documents, usageStats.maxDocuments))}`}
                        style={{ width: `${getUsagePercentage(usageStats.documents, usageStats.maxDocuments)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        AI Queries
                      </span>
                      <span className="font-medium text-white">
                        {usageStats.apiCalls.toLocaleString()} / {usageStats.maxApiCalls === 999999 ? '∞' : usageStats.maxApiCalls.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getUsageColor(getUsagePercentage(usageStats.apiCalls, usageStats.maxApiCalls))}`}
                        style={{ width: `${getUsagePercentage(usageStats.apiCalls, usageStats.maxApiCalls)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Available Plans */}
      <div className="bg-[#0F172A] rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold mb-2">
          {((currentSubscription?.status && currentSubscription?.status !== 'cancelled') ||
            (subscription?.status && subscription?.status !== 'cancelled'))
            ? 'Available Plans'
            : 'Choose Your Plan'
          }
        </h3>
        <p className="text-slate-400 mb-6">
          {((currentSubscription?.status && currentSubscription?.status !== 'cancelled') ||
            (subscription?.status && subscription?.status !== 'cancelled'))
            ? 'Upgrade or downgrade your subscription anytime'
            : 'Select the perfect plan for your team and start today'
          }
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const PlanIcon = plan.icon;
            const currentPlanName = currentSubscription?.plan_details?.name || subscription?.plan_name;
            const isCurrentPlan = currentPlanName?.toLowerCase() === plan.name.toLowerCase();

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 transition-all hover:shadow-lg ${isCurrentPlan
                  ? 'border-teal-500 shadow-md'
                  : plan.popular
                    ? 'border-purple-300'
                    : 'border-[#334155]'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-teal-600 text-white px-4 py-1 rounded-full text-xs font-medium shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-teal-600 text-white px-4 py-1 rounded-full text-xs font-medium shadow-lg">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-3">
                    <PlanIcon className="w-6 h-6 text-teal-600" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    ${plan.price}
                    <span className="text-sm text-slate-400 font-normal">/month</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    or ${plan.yearlyPrice}/year (save 17%)
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrentPlan || upgrading}
                  className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${isCurrentPlan
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-teal-600 text-white hover:from-purple-700 hover:to-teal-700 shadow-lg'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                >
                  {isCurrentPlan ? (
                    'Current Plan'
                  ) : ((currentSubscription?.status && currentSubscription?.status !== 'cancelled') ||
                    (subscription?.status && subscription?.status !== 'cancelled')) ? (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Purchase {plan.name}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History - Only show if has active subscription */}
      {((currentSubscription?.status && currentSubscription?.status !== 'cancelled') ||
        (subscription?.status && subscription?.status !== 'cancelled')) && (
          <div className="bg-[#0F172A] rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold mb-6">Billing History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1E293B] border-b border-[#334155]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Description</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Amount</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {billingHistory.map((bill) => (
                    <tr key={bill.id} className="hover:bg-[#1E293B]">
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {new Date(bill.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{bill.description}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        ${bill.amount}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bill.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                          }`}>
                          {bill.status === 'paid' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={bill.invoice_url}
                          className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Danger Zone - Only show if has active subscription */}
      {((currentSubscription?.status && currentSubscription?.status !== 'cancelled') ||
        (subscription?.status && subscription?.status !== 'cancelled')) && (
          <div className="bg-[#0F172A] rounded-lg shadow-sm p-6 border-2 border-red-200">
            <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Danger Zone
            </h3>
            <p className="text-slate-400 mb-4">
              Once you cancel your subscription, you will lose access to all premium features at the end of your billing period.
            </p>
            <button
              onClick={handleCancelSubscription}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Cancel Subscription
            </button>
          </div>
        )}

      {/* Upgrade/Purchase Modal */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">
              {((currentSubscription?.status && currentSubscription?.status !== 'cancelled') ||
                (subscription?.status && subscription?.status !== 'cancelled'))
                ? `Upgrade to ${selectedPlan.name}`
                : `Purchase ${selectedPlan.name} Plan`
              }
            </h3>

            <div className="bg-teal-500/10 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-700">Monthly Price</span>
                <span className="text-2xl font-bold text-teal-600">
                  ${selectedPlan.price}
                </span>
              </div>
              <div className="text-sm text-slate-400">
                Billed monthly • Cancel anytime
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-3">What you'll get:</h4>
              <ul className="space-y-2">
                {selectedPlan.features.slice(0, 5).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedPlan(null);
                }}
                disabled={upgrading}
                className="flex-1 px-4 py-3 border border-[#334155] text-slate-700 rounded-lg hover:bg-[#1E293B] transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpgrade}
                disabled={upgrading}
                className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition"
              >
                {upgrading
                  ? 'Processing...'
                  : ((currentSubscription?.status && currentSubscription?.status !== 'cancelled') ||
                    (subscription?.status && subscription?.status !== 'cancelled'))
                    ? 'Confirm Upgrade'
                    : 'Purchase Now'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;