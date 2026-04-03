import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach JWT ────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    console.info(`DEBUG: Sending request to: ${config.baseURL}${config.url}`);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('rental_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('rental_token');
      localStorage.removeItem('rental_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Users ──────────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
};

// ── Properties ─────────────────────────────────────────────────────────────────
export const propertiesAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  getMyProperties: (params) => api.get('/properties/owner/mine', { params }),
  getAdminAll: (params) => api.get('/properties/admin/all', { params }),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  approve: (id, is_approved) => api.patch(`/properties/${id}/approve`, { is_approved }),
  checkAvailability: (id, params) => api.get(`/properties/${id}/availability`, { params }),
};

// ── Bookings ───────────────────────────────────────────────────────────────────
export const bookingsAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  updateStatus: (id, data) => api.patch(`/bookings/${id}/status`, data),
  getCalendar: (propertyId, params) => api.get(`/bookings/calendar/${propertyId}`, { params }),
};

// ── Payments ───────────────────────────────────────────────────────────────────
export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
  refund: (id) => api.post(`/payments/${id}/refund`),
  getEarnings: () => api.get('/payments/earnings'),
};

// ── Maintenance ────────────────────────────────────────────────────────────────
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  updateStatus: (id, data) => api.patch(`/maintenance/${id}/status`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
};

// ── Reviews ────────────────────────────────────────────────────────────────────
export const reviewsAPI = {
  getByProperty: (propertyId, params) => api.get(`/reviews/property/${propertyId}`, { params }),
  getMyReviews: (params) => api.get('/reviews/me', { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  ownerResponse: (id, response) => api.post(`/reviews/${id}/owner-response`, { response }),
};

// ── Notifications ──────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ── Admin ──────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getPayments: (params) => api.get('/admin/payments', { params }),
};

export default api;
