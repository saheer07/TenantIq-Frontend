// src/services/api.js - FIXED with Tenant Support
import axios from 'axios';
import authService from './auth.service';

const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL || 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

const chatApi = axios.create({
  baseURL: import.meta.env.VITE_AICHAT_API_URL || 'http://127.0.0.1:8002/api/chat',
  headers: { 'Content-Type': 'application/json' },
});

const docApi = axios.create({
  baseURL: import.meta.env.VITE_DOC_API_URL || 'http://127.0.0.1:8003/api',
  headers: { 'Content-Type': 'application/json' },
});

const api = authApi;

// ============================================================================
// HELPERS - Read current tenant/user from auth service
// ============================================================================

/**
 * Returns the tenant UUID string from the current user's subscription.
 * Returns undefined if not available (backend will use its fallback).
 */
const getCurrentTenantId = () => {
  try {
    const user = authService.getUser();
    return user?.tenant_id ?? undefined;
  } catch {
    return undefined;
  }
};

/**
 * Returns the user UUID string from the current auth session.
 * Returns undefined if not available.
 */
const getCurrentUserId = () => {
  try {
    const user = authService.getUser();
    return user?.id ?? user?.user_id ?? undefined;
  } catch {
    return undefined;
  }
};

// ============================================================================
// REQUEST INTERCEPTOR - Add Bearer token AND Tenant ID header
// ============================================================================
const addAuthInterceptor = (instance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Send tenant ID as a header on every request (backend reads this too)
      const tenantId = getCurrentTenantId();
      if (tenantId) {
        config.headers['X-Tenant-ID'] = tenantId;
      }


      return config;
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );
};

addAuthInterceptor(authApi);
addAuthInterceptor(chatApi);
addAuthInterceptor(docApi);

// ============================================================================
// RESPONSE INTERCEPTOR - Handle 401 and token refresh
// ============================================================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const updateAllInstancesWithToken = (token) => {
  if (token) {
    authApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    chatApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    docApi.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
};

const addResponseInterceptor = (instance) => {
  instance.interceptors.response.use(
    (response) => {
      // ✅ Log successful fetches for debugging, but only in dev
      if (import.meta.env.DEV && response.config.method === 'get') {
        const url = response.config.url;
        if (url.includes('/doc/documents/')) {
          // Special log for document fetching to help track polling
          // We'll keep this but ensure it doesn't spam too much
          // console.log(`📄 GET ${url} - Status: ${response.status}`);
        }
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Handle cases where response might be missing (network error)
      if (!error.response) {
        console.error('❌ Network Error:', error.message);
        return Promise.reject(error);
      }

      const { status, data } = error.response;
      console.error(`❌ ${status} Error:`, {
        url: originalRequest.url,
        method: originalRequest.method,
        data: data
      });

      // Special handling for 500 errors
      if (status >= 500) {
        console.error('🔥 Server Error (500+): Contact backend team.');
        // We can attach a friendlier error message here if we want to standardize it
        error.friendlyMessage = 'Oops! Something went wrong on our server. Please try again later.';
      }

      if (originalRequest?.url?.includes('/auth/token/refresh')) {
        isRefreshing = false;
        processQueue(error, null);
        authService.clearAuth();
        window.location.href = '/';
        return Promise.reject(error);
      }

      if (status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return instance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = authService.getRefreshToken();
          if (!refreshToken) throw new Error('No refresh token');

          const response = await axios.post(
            `${import.meta.env.VITE_AUTH_API_URL || 'http://127.0.0.1:8000/api'}/auth/token/refresh/`,
            { refresh: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const { access } = response.data;
          if (!access) throw new Error('No access token in refresh response');

          authService.setToken(access);
          updateAllInstancesWithToken(access);
          processQueue(null, access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          authService.clearAuth();
          window.location.href = '/';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

addResponseInterceptor(authApi);
addResponseInterceptor(chatApi);
addResponseInterceptor(docApi);

// ============================================================================
// AUTH API
// ============================================================================
export const authAPI = {
  // Correct paths: /auth/... (removed extra /auth/)
  login: (email, password) => authApi.post('/auth/login/', { email, password }),
  signup: (userData) => authApi.post('/auth/signup/', userData),
  logout: () => authApi.post('/auth/logout/'),
  me: () => authApi.get('/auth/me/'),
  refreshToken: (refresh) => authApi.post('/auth/token/refresh/', { refresh }),
  verifyEmail: (email, otp) => authApi.post('/auth/verify-email/', { email, otp }),
  resendVerification: (email) => authApi.post('/auth/resend-verification/', { email }),
  requestPasswordReset: (email) => authApi.post('/auth/request-password-reset/', { email }),
  resetPassword: (email, token, new_password) => authApi.post('/auth/reset-password/', { email, token, new_password }),
  changePassword: (old_password, new_password) => authApi.post('/auth/change-password/', { old_password, new_password }),
};

// ============================================================================
// SUBSCRIPTION API
// ============================================================================
export const subscriptionAPI = {
  getPlans: () => authApi.get('/subscription/plans/'),
  getCurrent: () => authApi.get('/subscription/current/'),
  createOrder: (plan_id, billing_cycle = 'monthly') => authApi.post('/subscription/razorpay/create-order/', { plan_id, billing_cycle }),
  verify: (paymentData) => authApi.post('/subscription/razorpay/verify/', paymentData),
  cancel: () => authApi.post('/subscription/cancel/'),
};

// ============================================================================
// DOCUMENT API - Tenant header added automatically by interceptor
// ============================================================================
export const documentAPI = {
  list: () => docApi.get('/doc/documents/'),

  create: (formData, onUploadProgress) =>
    docApi.post('/doc/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),

  get: (id) => docApi.get(`/doc/documents/${id}/`),
  update: (id, data) => docApi.put(`/doc/documents/${id}/`, data),
  delete: (id) => docApi.delete(`/doc/documents/${id}/`),
};

// ============================================================================
// CHAT API
// ============================================================================
export const chatAPI = {
  /**
   * Send a chat message.
   * tenant_id and user_id are included in the POST body so the backend can
   * search the correct tenant's vector store regardless of header parsing.
   */
  sendMessage: (message, conversationId = null) => {
    const tenantId = getCurrentTenantId();
    const userId = getCurrentUserId();
    return chatApi.post('/query/', {
      message,
      conversation_id: conversationId,
      ...(tenantId && { tenant_id: tenantId }),
      ...(userId && { user_id: userId }),
    });
  },

  getConversations: () => chatApi.get('/conversations/'),
  getChatHistory: (conversationId) => chatApi.get('/messages/', { params: { conversation_id: conversationId } }),
  createConversation: (title = null) => chatApi.post('/conversations/', { title }),
  deleteConversation: (conversationId) => chatApi.delete(`/conversations/${conversationId}/`),

  submitFeedback: (messageId, feedback, comment = '') =>
    chatApi.post(`/messages/${messageId}/feedback/`, { feedback, comment }),

  /**
   * Get RAG stats.
   * tenant_id sent as query param (belt-and-suspenders alongside X-Tenant-ID header).
   */
  getStats: () => {
    const tenantId = getCurrentTenantId();
    return chatApi.get('/stats/', {
      params: tenantId ? { tenant_id: tenantId } : {},
    });
  },

  healthCheck: () => chatApi.get('/health/'),
};

export default api;
export { authApi, chatApi, docApi };