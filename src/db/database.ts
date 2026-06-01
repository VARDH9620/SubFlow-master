// ============================================================
// SubFlow — Client Database Layer (API Client)
// All operations now fetch from the backend PostgreSQL server
// ============================================================

import type {
  User, Service, Plan, Subscription, Invoice, Payment,
  SupportTicket, TicketMessage, Notification, PaymentMethod,
  DashboardStats, ChartDataPoint, PaymentStats, UserRole,
  SubscriptionStatus, PaymentStatus,
} from '../types';
import emailjs from '@emailjs/browser';

const API_BASE = '/api';

// In-memory cache for GET requests to dramatically improve perceived performance
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Helper for making fetch requests
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const method = options?.method || 'GET';

  // If it's a GET request, check the cache first
  if (method === 'GET') {
    const cached = apiCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      // Return cached data instantly to prevent layout shifts and loading spinners
      return cached.data as T;
    }
  } else {
    // If it's a mutation (POST, PUT, DELETE), clear the cache so fresh data is fetched next time
    apiCache.clear();
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // Save successful GET requests to cache
  if (method === 'GET') {
    apiCache.set(url, { data, timestamp: Date.now() });
  }

  return data;
}

// ====================================================================
// DATABASE INITIALIZATION
// ====================================================================

export async function initializeDatabase(): Promise<void> {
  // Backend database is initialized and seeded server-side.
  return Promise.resolve();
}

export async function resetDatabase(): Promise<void> {
  // Resetting database is handled via backend if desired.
  return Promise.resolve();
}

// ====================================================================
// AUTH FUNCTIONS
// ====================================================================

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    return await apiFetch<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return null;
  }
}

export async function registerUser(data: {
  first_name: string; last_name: string;
  email: string; phone: string; password: string;
  is_verified?: boolean;
}): Promise<User | null> {
  try {
    return await apiFetch<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function generateOTP(email: string): Promise<string> {
  const { otp } = await apiFetch<{ otp: string }>('/auth/otp/generate', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  // Send real email to user in real-time using EmailJS
  emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID || 'default_service',
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'default_template',
    {
      email: email,
      passcode: otp,
      time: new Date(Date.now() + 10 * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    },
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'default_public_key'
  ).catch(err => {
    console.error("Failed to send verification email via EmailJS:", err);
  });

  return otp;
}

export async function verifyOTP(email: string, code: string): Promise<{ valid: boolean; error?: string }> {
  try {
    return await apiFetch<{ valid: boolean; error?: string }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
}

export async function markUserVerified(email: string): Promise<void> {
  await apiFetch<void>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const { exists } = await apiFetch<{ exists: boolean }>(`/auth/check-email?email=${encodeURIComponent(email)}`);
  return exists;
}

export async function resetPassword(email: string, newPassword: string): Promise<boolean> {
  try {
    await apiFetch<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
    return true;
  } catch {
    return false;
  }
}

// ====================================================================
// USERS FUNCTIONS
// ====================================================================

export async function getAllUsers(): Promise<User[]> {
  return apiFetch<User[]>('/users');
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    return await apiFetch<User>(`/users/${id}`);
  } catch {
    return null;
  }
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | null> {
  try {
    return await apiFetch<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    await apiFetch<void>(`/users/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

// ====================================================================
// SERVICES FUNCTIONS
// ====================================================================

export async function getAllServices(): Promise<Service[]> {
  return apiFetch<Service[]>('/services');
}

export async function getServiceById(id: string): Promise<Service | null> {
  try {
    return await apiFetch<Service>(`/services/${id}`);
  } catch {
    return null;
  }
}

export async function createService(data: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> {
  return apiFetch<Service>('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateService(id: string, data: Partial<Service>): Promise<Service | null> {
  try {
    return await apiFetch<Service>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function deleteService(id: string): Promise<boolean> {
  try {
    await apiFetch<void>(`/services/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

// ====================================================================
// PLANS FUNCTIONS
// ====================================================================

export async function getAllPlans(): Promise<Plan[]> {
  return apiFetch<Plan[]>('/plans');
}

export async function getPlansByService(serviceId: string): Promise<Plan[]> {
  return apiFetch<Plan[]>(`/plans?serviceId=${encodeURIComponent(serviceId)}`);
}

export async function getPlanById(id: string): Promise<Plan | null> {
  try {
    return await apiFetch<Plan>(`/plans/${id}`);
  } catch {
    return null;
  }
}

export async function createPlan(data: Omit<Plan, 'id' | 'created_at' | 'updated_at'>): Promise<Plan> {
  return apiFetch<Plan>('/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePlan(id: string, data: Partial<Plan>): Promise<Plan | null> {
  try {
    return await apiFetch<Plan>(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function deletePlan(id: string): Promise<boolean> {
  try {
    await apiFetch<void>(`/plans/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

// ====================================================================
// SUBSCRIPTIONS FUNCTIONS
// ====================================================================

export async function getSubscriptionsByUser(userId: string): Promise<Subscription[]> {
  return apiFetch<Subscription[]>(`/users/${userId}/subscriptions`);
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  return apiFetch<Subscription[]>('/subscriptions');
}

export async function createSubscription(userId: string, planId: string): Promise<Subscription> {
  return apiFetch<Subscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ userId, planId }),
  });
}

export async function updateSubscriptionStatus(id: string, status: SubscriptionStatus): Promise<Subscription | null> {
  try {
    return await apiFetch<Subscription>(`/subscriptions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  } catch {
    return null;
  }
}

export async function toggleAutoRenew(id: string): Promise<Subscription | null> {
  try {
    return await apiFetch<Subscription>(`/subscriptions/${id}/toggle-renew`, {
      method: 'PUT',
    });
  } catch {
    return null;
  }
}

// ====================================================================
// INVOICES FUNCTIONS
// ====================================================================

export async function getInvoicesByUser(userId: string): Promise<Invoice[]> {
  return apiFetch<Invoice[]>(`/users/${userId}/invoices`);
}

export async function getAllInvoices(): Promise<Invoice[]> {
  return apiFetch<Invoice[]>('/invoices');
}

export async function updateInvoiceStatus(id: string, status: PaymentStatus): Promise<Invoice | null> {
  try {
    return await apiFetch<Invoice>(`/invoices/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  } catch {
    return null;
  }
}

// ====================================================================
// SUPPORT TICKETS FUNCTIONS
// ====================================================================

export async function getTicketsByUser(userId: string): Promise<SupportTicket[]> {
  return apiFetch<SupportTicket[]>(`/users/${userId}/tickets`);
}

export async function getAllTickets(): Promise<SupportTicket[]> {
  return apiFetch<SupportTicket[]>('/tickets');
}

export async function createTicket(userId: string, data: {
  subject: string; description: string; category: string; priority: 'low' | 'medium' | 'high' | 'critical'
}): Promise<SupportTicket> {
  return apiFetch<SupportTicket>('/tickets', {
    method: 'POST',
    body: JSON.stringify({ userId, ...data }),
  });
}

export async function updateTicket(id: string, data: Partial<SupportTicket>): Promise<SupportTicket | null> {
  try {
    return await apiFetch<SupportTicket>(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

// ====================================================================
// TICKET MESSAGES FUNCTIONS
// ====================================================================

export async function getMessagesByTicket(ticketId: string): Promise<TicketMessage[]> {
  return apiFetch<TicketMessage[]>(`/tickets/${ticketId}/messages`);
}

export async function addTicketMessage(ticketId: string, senderId: string, senderRole: UserRole, message: string): Promise<TicketMessage> {
  return apiFetch<TicketMessage>(`/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ senderId, senderRole, message }),
  });
}

// ====================================================================
// ANALYTICS & DASHBOARD FUNCTIONS
// ====================================================================

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/analytics/dashboard');
}

export async function getRevenueChartData(): Promise<ChartDataPoint[]> {
  return apiFetch<ChartDataPoint[]>('/analytics/revenue');
}

export async function getUserGrowthChartData(): Promise<ChartDataPoint[]> {
  return apiFetch<ChartDataPoint[]>('/analytics/user-growth');
}

export async function getSubscriptionChartData(): Promise<ChartDataPoint[]> {
  return apiFetch<ChartDataPoint[]>('/analytics/subscriptions');
}

// ====================================================================
// PAYMENT METHODS FUNCTIONS
// ====================================================================

export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  return apiFetch<PaymentMethod[]>(`/users/${userId}/payment-methods`);
}

export async function addPaymentMethod(userId: string, data: {
  type: 'card' | 'paypal' | 'bank_transfer';
  label: string;
  last4?: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  holder_name?: string;
  is_default?: boolean;
}): Promise<PaymentMethod> {
  return apiFetch<PaymentMethod>(`/users/${userId}/payment-methods`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deletePaymentMethod(id: string): Promise<boolean> {
  try {
    await apiFetch<void>(`/payment-methods/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

export async function setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
  await apiFetch<void>(`/users/${userId}/payment-methods/${methodId}/default`, {
    method: 'PUT',
  });
}

export async function getDefaultPaymentMethod(userId: string): Promise<PaymentMethod | null> {
  try {
    return await apiFetch<PaymentMethod>(`/users/${userId}/payment-methods/default`);
  } catch {
    return null;
  }
}

// ====================================================================
// PROCESS PAYMENT FUNCTIONS
// ====================================================================

export async function processPayment(userId: string, invoiceId: string, paymentDetails: {
  method: string;
  method_type: 'card' | 'paypal' | 'bank_transfer';
  card_brand?: string;
  card_last4?: string;
  card_holder?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  billing_country?: string;
}): Promise<Payment> {
  return apiFetch<Payment>('/payments', {
    method: 'POST',
    body: JSON.stringify({ userId, invoiceId, paymentDetails }),
  });
}

export async function refundPayment(paymentId: string, reason: string, adminId: string): Promise<Payment | null> {
  try {
    return await apiFetch<Payment>(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason, adminId }),
    });
  } catch {
    return null;
  }
}

export async function getPaymentsByUser(userId: string): Promise<Payment[]> {
  return apiFetch<Payment[]>(`/users/${userId}/payments`);
}

export async function getAllPayments(): Promise<Payment[]> {
  return apiFetch<Payment[]>('/payments');
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  try {
    return await apiFetch<Payment>(`/payments/${id}`);
  } catch {
    return null;
  }
}

export async function getPaymentStats(): Promise<PaymentStats> {
  return apiFetch<PaymentStats>('/analytics/payment-stats');
}

export async function getCategoryDistribution(): Promise<{ name: string; value: number }[]> {
  return apiFetch<{ name: string; value: number }[]>('/analytics/category-distribution');
}

// ====================================================================
// NOTIFICATIONS FUNCTIONS
// ====================================================================

export async function createNotification(userId: string, data: {
  title: string; message: string; type: 'info' | 'success' | 'warning' | 'error';
}): Promise<Notification> {
  return apiFetch<Notification>('/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  return apiFetch<Notification[]>(`/users/${userId}/notifications`);
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch<void>(`/notifications/${id}/read`, {
    method: 'PUT',
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await apiFetch<void>(`/users/${userId}/notifications/read-all`, {
    method: 'PUT',
  });
}

export async function clearNotifications(userId: string): Promise<void> {
  await apiFetch<void>(`/users/${userId}/notifications`, {
    method: 'DELETE',
  });
}

// ====================================================================
// AUDIT LOGS FUNCTIONS
// ====================================================================

export interface AuditEntry {
  id: string; user_id: string; user_name: string; user_email: string;
  action: string; entity_type: string; entity_name: string;
  details: string; ip_address: string; created_at: string;
}

export async function addAuditLog(userId: string, action: string, entityType: string, entityId: string, details: string): Promise<void> {
  await apiFetch<void>('/audit-logs', {
    method: 'POST',
    body: JSON.stringify({ userId, action, entityType, entityId, details }),
  });
}

export async function getAuditLogs(): Promise<AuditEntry[]> {
  return apiFetch<AuditEntry[]>('/audit-logs');
}

export async function getUserActivityLog(userId: string): Promise<AuditEntry[]> {
  return apiFetch<AuditEntry[]>(`/users/${userId}/activity-log`);
}

// ====================================================================
// SERVICE REVIEWS FUNCTIONS
// ====================================================================

export interface Review {
  id: string; user_id: string; service_id: string;
  user_name: string; rating: number; title: string; body: string;
  helpful: number; created_at: string;
}

export async function addReview(userId: string, serviceId: string, rating: number, title: string, body: string): Promise<Review> {
  return apiFetch<Review>('/reviews', {
    method: 'POST',
    body: JSON.stringify({ userId, serviceId, rating, title, body }),
  });
}

export async function getServiceReviews(serviceId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/services/${serviceId}/reviews`);
}

export async function getServiceRating(serviceId: string): Promise<{ avg: number; count: number; distribution: number[] }> {
  return apiFetch<{ avg: number; count: number; distribution: number[] }>(`/services/${serviceId}/rating`);
}

export async function getUserReviewForService(userId: string, serviceId: string): Promise<Review | null> {
  try {
    return await apiFetch<Review>(`/users/${userId}/services/${serviceId}/reviews`);
  } catch {
    return null;
  }
}

// ====================================================================
// REFERRAL FUNCTIONS
// ====================================================================

export interface ReferralInfo {
  code: string; referred_count: number; credits_earned: number; credits_used: number;
  credits_balance: number; referrals: { email: string; status: string; date: string }[];
}

export async function getReferralInfo(userId: string): Promise<ReferralInfo> {
  return apiFetch<ReferralInfo>(`/users/${userId}/referrals`);
}

export async function applyReferralCode(code: string): Promise<boolean> {
  const { valid } = await apiFetch<{ valid: boolean }>(`/referrals/check-code?code=${encodeURIComponent(code)}`);
  return valid;
}

// ====================================================================
// SYSTEM STATUS FUNCTIONS
// ====================================================================

export interface SystemStatus {
  services: { name: string; status: 'operational' | 'degraded' | 'outage'; uptime: number; latency: number; lastIncident: string | null }[];
  overall: 'operational' | 'degraded' | 'outage';
  uptime30d: number;
  incidents: { title: string; status: string; started: string; resolved: string | null; updates: { time: string; message: string }[] }[];
}

export async function getSystemStatus(): Promise<SystemStatus> {
  return apiFetch<SystemStatus>('/system/status');
}

// ====================================================================
// ONBOARDING STATUS FUNCTIONS
// ====================================================================

export interface OnboardingStep {
  id: string; title: string; description: string; completed: boolean; link: string; icon: string;
}

export async function getOnboardingSteps(userId: string): Promise<OnboardingStep[]> {
  return apiFetch<OnboardingStep[]>(`/users/${userId}/onboarding-steps`);
}

export async function getOnboardingProgress(userId: string): Promise<number> {
  const { progress } = await apiFetch<{ progress: number }>(`/users/${userId}/onboarding-progress`);
  return progress;
}
