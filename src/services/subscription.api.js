// src/services/subscription.service.js
import { subscriptionAPI } from './api';

class SubscriptionService {

  // ── GET PLANS ──────────────────────────────────────────────────────────────
  // GET /api/subscription/plans/
  async getPlans() {
    try {
      console.log('📋 Fetching subscription plans...');
      const response = await subscriptionAPI.getPlans();
      console.log('✅ Plans fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch plans:', error);
      throw this.formatError(error, 'Failed to load subscription plans');
    }
  }

  // ── GET CURRENT SUBSCRIPTION ───────────────────────────────────────────────
  // GET /api/subscription/current/
  async getCurrentSubscription() {
    try {
      console.log('🔍 Fetching current subscription...');
      const response = await subscriptionAPI.getCurrent();
      console.log('✅ Current subscription:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch subscription:', error);
      // Return safe defaults — never throw, prevents app breakage
      return {
        has_subscription:  false,
        is_active:         false,
        plan_name:         null,
        next_billing_date: null,
        user_limit:        null,
        user_count:        0,
      };
    }
  }

  // ── CREATE RAZORPAY ORDER ──────────────────────────────────────────────────
  // POST /api/subscription/razorpay/create-order/
  async createRazorpayOrder(planId, billingCycle = 'monthly') {
    try {
      console.log('💰 Creating Razorpay order...', { planId, billingCycle });
      const response = await subscriptionAPI.createOrder(planId, billingCycle);
      console.log('✅ Razorpay order created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create order:', error);
      throw this.formatError(error, 'Failed to create payment order');
    }
  }

  // ── VERIFY RAZORPAY PAYMENT ────────────────────────────────────────────────
  // POST /api/subscription/razorpay/verify/
  async verifyRazorpayPayment(paymentData) {
    try {
      console.log('✅ Verifying Razorpay payment...');
      const response = await subscriptionAPI.verify(paymentData);
      console.log('✅ Payment verified:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Payment verification failed:', error);
      throw this.formatError(error, 'Payment verification failed');
    }
  }

  // ── CANCEL SUBSCRIPTION ────────────────────────────────────────────────────
  // POST /api/subscription/cancel/
  async cancelSubscription() {
    try {
      console.log('❌ Cancelling subscription...');
      const response = await subscriptionAPI.cancel();
      console.log('✅ Subscription cancelled:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      throw this.formatError(error, 'Failed to cancel subscription');
    }
  }

  // ── SUBSCRIPTION CHECKS ────────────────────────────────────────────────────

  hasActiveSubscription(subscription) {
    if (!subscription) return false;
    return subscription.is_active === true || subscription.has_subscription === true;
  }

  canAccessFeature(subscription, feature) {
    if (!this.hasActiveSubscription(subscription)) return false;

    switch (feature) {
      case 'ai_chat':             return subscription.ai_enabled === true;
      case 'documents':           return true;
      case 'team_management':     return true;
      case 'advanced_analytics':  return ['professional', 'enterprise'].includes(subscription.plan_type);
      case 'api_access':          return ['professional', 'enterprise'].includes(subscription.plan_type);
      case 'priority_support':    return subscription.plan_type === 'enterprise';
      default:                    return false;
    }
  }

  getRemainingSeats(subscription, currentEmployeeCount) {
    if (!subscription || !subscription.max_users) return 0;
    if (subscription.max_users >= 9999) return Infinity;
    return Math.max(0, subscription.max_users - (currentEmployeeCount || 0));
  }

  canAddEmployee(subscription, currentEmployeeCount) {
    const remaining = this.getRemainingSeats(subscription, currentEmployeeCount);
    return remaining === Infinity || remaining > 0;
  }

  isExpiringSoon(subscription) {
    if (!subscription?.next_billing_date) return false;
    const days = this.getDaysUntilBilling(subscription);
    return days !== null && days > 0 && days <= 7;
  }

  isExpired(subscription) {
    if (!subscription?.next_billing_date) return false;
    return new Date() > new Date(subscription.next_billing_date);
  }

  getDaysUntilBilling(subscription) {
    if (!subscription?.next_billing_date) return null;
    const diff = new Date(subscription.next_billing_date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ── FORMATTING HELPERS ─────────────────────────────────────────────────────

  formatPrice(price, currency = 'INR') {
    if (!price) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style:                'currency',
      currency:             currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  calculateYearlySavings(monthlyPrice, yearlyPrice) {
    if (!monthlyPrice || !yearlyPrice) return { amount: 0, percentage: 0, formatted: '₹0' };
    const totalMonthly = monthlyPrice * 12;
    const savings      = totalMonthly - yearlyPrice;
    return {
      amount:    savings,
      percentage: Math.round((savings / totalMonthly) * 100),
      formatted: this.formatPrice(savings),
    };
  }

  getRecommendedPlan(plans, teamSize, needsAI = true) {
    if (!plans?.length) return null;
    const suitable = plans.filter((p) => p.max_users >= teamSize || p.max_users >= 9999);
    if (!suitable.length) return plans[plans.length - 1];
    if (needsAI) {
      const aiPlans = suitable.filter((p) => p.ai_enabled);
      if (aiPlans.length) return aiPlans[0];
    }
    return suitable[0];
  }

  comparePlans(currentPlan, newPlan) {
    return {
      priceChange:     newPlan.monthly_price   - currentPlan.monthly_price,
      userChange:      newPlan.max_users        - currentPlan.max_users,
      documentsChange: newPlan.max_documents    - currentPlan.max_documents,
      isUpgrade:       newPlan.monthly_price    > currentPlan.monthly_price,
      isDowngrade:     newPlan.monthly_price    < currentPlan.monthly_price,
    };
  }

  // ── ERROR FORMATTER ────────────────────────────────────────────────────────

  formatError(error, fallback) {
    if (!error.response) return new Error(fallback || 'Network error occurred');
    const data = error.response.data;
    if (typeof data === 'string') return new Error(data);
    if (data?.detail)             return new Error(data.detail);
    if (data?.error)              return new Error(data.error);
    if (data?.message)            return new Error(data.message);
    return new Error(fallback || 'An error occurred');
  }
}

const subscriptionService = new SubscriptionService();
export default subscriptionService;
export { SubscriptionService };