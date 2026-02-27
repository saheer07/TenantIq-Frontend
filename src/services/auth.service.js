// src/services/auth.service.js
import { authAPI, subscriptionAPI } from './api';

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  SUBSCRIPTION: 'subscription',
  PENDING_EMAIL: 'pending_verification_email',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatFieldName = (field) => {
  if (field === 'non_field_errors') return 'Error';
  return field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const decodeToken = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode token:', e);
    return null;
  }
};

const parseStorageItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Failed to parse ${key}:`, error);
    localStorage.removeItem(key);
    return null;
  }
};

// ── AuthService ───────────────────────────────────────────────────────────────
class AuthService {
  constructor() {
    this._logAuthStatus = false;
  }

  // ==================== AUTHENTICATION ====================

  async login({ email, password }) {
    if (!email || !password) throw new Error('Email and password are required');

    try {

      const response = await authAPI.login(email, password);
      const { access, refresh, user } = response.data;

      if (!access || !user) throw new Error('Invalid login response from server');

      this.setToken(access);
      this.setRefreshToken(refresh);
      this.setCurrentUser(user);


      return response.data;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw this.formatError(error, 'Invalid email or password');
    }
  }

  async register(userData) {
    if (!userData || typeof userData !== 'object') throw new Error('Invalid signup data');

    try {

      const response = await authAPI.signup(userData);

      return response.data;
    } catch (error) {
      console.error('❌ Registration failed:', error);

      if (error.response?.status === 400) {
        const data = error.response.data;

        if (data.errors && typeof data.errors === 'object') {
          const messages = Object.entries(data.errors).map(([field, msgs]) => {
            const fieldName = formatFieldName(field);
            const text = Array.isArray(msgs) ? msgs.join(', ') : msgs;
            return `${fieldName}: ${text}`;
          });
          throw new Error(messages.join('\n'));
        }

        if (typeof data === 'object' && !data.detail && !data.message) {
          const messages = Object.entries(data)
            .filter(([field]) => field !== 'success')
            .map(([field, msgs]) => {
              const fieldName = formatFieldName(field);
              const text = Array.isArray(msgs) ? msgs.join(', ') : msgs;
              return `${fieldName}: ${text}`;
            });
          if (messages.length > 0) throw new Error(messages.join('\n'));
        }
      }

      throw this.formatError(error, 'Signup failed. Please check your information and try again.');
    }
  }

  async logout() {
    try {

      try {
        await authAPI.logout();

      } catch (error) {
        console.warn('⚠️ Logout API call failed, clearing tokens anyway:', error);
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      this.clearAuth();

    }
  }

  // ==================== PASSWORD MANAGEMENT ====================

  async forgotPassword(email) {
    if (!email) throw new Error('Email is required');
    try {

      const response = await authAPI.requestPasswordReset(email.trim().toLowerCase());

      return response.data;
    } catch (error) {
      console.error('❌ Password reset request failed:', error);
      throw this.formatError(error, 'Failed to send password reset email');
    }
  }

  async resetPassword({ email, token, new_password }) {
    if (!token || !new_password) throw new Error('Token and new password are required');
    try {

      const response = await authAPI.resetPassword(email?.trim().toLowerCase(), token, new_password);

      return response.data;
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw this.formatError(error, 'Failed to reset password');
    }
  }

  async changePassword(oldPassword, newPassword) {
    if (!oldPassword || !newPassword) throw new Error('Old and new password are required');
    try {

      const response = await authAPI.changePassword(oldPassword, newPassword);

      return response.data;
    } catch (error) {
      console.error('❌ Password change failed:', error);
      throw this.formatError(error, 'Change password failed');
    }
  }

  // ==================== EMAIL VERIFICATION ====================

  async verifyEmail({ email, otp }) {
    if (!email || !otp) throw new Error('Email and OTP are required');
    try {

      const response = await authAPI.verifyEmail(email, otp);

      return response.data;
    } catch (error) {
      console.error('❌ Email verification failed:', error);
      const msg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        'OTP verification failed';
      throw new Error(msg);
    }
  }

  async resendVerification(emailOrObject) {
    const email = typeof emailOrObject === 'string' ? emailOrObject : emailOrObject?.email;
    if (!email) throw new Error('Email is required');
    try {

      const response = await authAPI.resendVerification(email);

      return response.data;
    } catch (error) {
      console.error('❌ Resend verification failed:', error);
      throw this.formatError(error, 'Failed to resend verification code');
    }
  }

  // ==================== USER ====================

  async fetchCurrentUser() {
    try {

      const response = await authAPI.me();
      const user = response.data;
      this.setCurrentUser(user);

      return user;
    } catch (error) {
      console.error('❌ Failed to fetch user:', error);
      if (error.response?.status === 401) {

        return null;
      }
      throw this.formatError(error, 'Failed to fetch user information');
    }
  }

  // ==================== SUBSCRIPTION ====================

  async checkSubscription() {
    try {

      // ✅ FIXED: uses subscriptionAPI.getCurrent() → GET /api/subscription/current/
      const response = await subscriptionAPI.getCurrent();

      if (response.data) {
        this.setSubscription(response.data);

      }

      return response.data;
    } catch (error) {
      console.error('❌ Subscription check failed:', error);

      // Return safe defaults — never throw here, it would block the whole app
      const defaultSubscription = {
        has_subscription: false,
        is_active: false,
        plan_name: null,
        next_billing_date: null,
        user_limit: null,
        user_count: 0,
        storage_limit: null,
      };

      this.setSubscription(defaultSubscription);

      return defaultSubscription;
    }
  }

  // ==================== TOKEN MANAGEMENT ====================

  setToken(token) {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);

    }
  }

  getToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  setRefreshToken(token) {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);

    }
  }

  getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  removeToken() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

  }

  // ==================== USER DATA ====================

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    }
  }

  getCurrentUser() {
    return parseStorageItem(STORAGE_KEYS.USER);
  }

  getUser() {
    // Priority 1: Decoded JWT payload (requested by user)
    const token = this.getToken();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) return decoded;
    }

    // Fallback: Stored user object
    return this.getCurrentUser();
  }

  removeCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.USER);

  }

  // ==================== SUBSCRIPTION DATA ====================

  setSubscription(subscription) {
    if (subscription) {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(subscription));

    }
  }

  getSubscription() {
    return parseStorageItem(STORAGE_KEYS.SUBSCRIPTION);
  }

  removeSubscription() {
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION);

  }

  // ==================== AUTH STATE ====================

  clearAuth() {

    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();

  }

  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  hasRole(roles) {
    const user = this.getCurrentUser();
    if (!user?.role) return false;
    return Array.isArray(roles) ? roles.includes(user.role) : user.role === roles;
  }

  isVerified() {
    const user = this.getCurrentUser();
    return user?.is_verified === true;
  }

  hasActiveSubscription() {
    const subscription = this.getSubscription();
    return subscription?.is_active === true;
  }

  // ==================== SESSION ====================

  async validateSession() {
    if (!this.isAuthenticated()) {

      return false;
    }
    try {

      await authAPI.me();

      return true;
    } catch (error) {
      console.error('❌ Session validation failed:', error);
      if (error.response?.status === 401) {

        return true;
      }
      this.clearAuth();
      return false;
    }
  }

  // ==================== PENDING EMAIL ====================

  setPendingEmail(email) {
    if (email) localStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, email);
  }

  getPendingEmail() {
    return localStorage.getItem(STORAGE_KEYS.PENDING_EMAIL);
  }

  removePendingEmail() {
    localStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
  }

  // ==================== ROLE SHORTCUTS ====================

  isTenantAdmin() { return this.hasRole('TENANT_ADMIN'); }
  isSuperAdmin() { return this.hasRole('SUPER_ADMIN'); }
  isRegularUser() { return this.hasRole('USER'); }

  // ==================== SUBSCRIPTION SHORTCUTS ====================

  canManageUsers() {
    const subscription = this.getSubscription();
    const user = this.getCurrentUser();
    return (
      subscription?.is_active === true &&
      (user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN')
    );
  }

  canAccessDocuments() {
    return this.getSubscription()?.is_active === true;
  }

  getRemainingUserSlots() {
    const subscription = this.getSubscription();
    if (!subscription?.is_active) return 0;
    return Math.max(0, (subscription.user_limit || 0) - (subscription.user_count || 0));
  }

  // ==================== ERROR FORMATTER ====================

  formatError(error, fallback) {
    if (!error.response) return new Error(fallback || 'Network error. Please check your connection.');

    const data = error.response.data;
    if (typeof data === 'string') return new Error(data);
    if (data?.detail) return new Error(data.detail);
    if (data?.error) return new Error(data.error);
    if (data?.message) return new Error(data.message);

    if (typeof data === 'object') {
      const firstKey = Object.keys(data).find((k) => k !== 'success');
      if (firstKey && data[firstKey]) {
        const value = data[firstKey];
        return new Error(Array.isArray(value) ? value[0] : value);
      }
    }

    return new Error(fallback || 'An error occurred');
  }

  // Kept for backward compat — interceptor handles refresh now
  async refreshAccessToken() {
    console.warn('⚠️ refreshAccessToken() is deprecated — interceptor handles refresh automatically');
    throw new Error('Token refresh is handled by axios interceptor');
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
const authService = new AuthService();
export default authService;
export { AuthService };