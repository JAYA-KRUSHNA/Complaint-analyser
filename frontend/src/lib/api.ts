import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getMe: () => api.get('/auth/me'),

  updateProfile: (data: { name?: string; phone?: string }) =>
    api.put('/auth/me', data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/auth/change-password', data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

// ─── Complaints API ──────────────────────────────────────────
export const complaintsApi = {
  create: (data: {
    title: string;
    description: string;
    category_name?: string;
    latitude?: number;
    longitude?: number;
    location_text?: string;
    address?: string;
    language?: string;
    duration_hours?: number;
  }) => api.post('/complaints', data),

  list: (params?: {
    status?: string;
    category?: string;
    priority?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  }) => api.get('/complaints', { params }),

  getById: (id: string) => api.get(`/complaints/${id}`),

  update: (id: string, data: object) => api.put(`/complaints/${id}`, data),

  delete: (id: string) => api.delete(`/complaints/${id}`),

  updateStatus: (id: string, data: { status: string; comment?: string }) =>
    api.put(`/complaints/${id}/status`, data),

  getStatusHistory: (id: string) =>
    api.get(`/complaints/${id}/status-history`),
};

// ─── Dashboard API ───────────────────────────────────────────
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),

  getPriorityQueue: (params?: {
    status?: string;
    priority?: string;
    page?: number;
    page_size?: number;
  }) => api.get('/dashboard/priority-queue', { params }),

  getByCategory: () => api.get('/dashboard/by-category'),

  getByDepartment: () => api.get('/dashboard/by-department'),

  getRecentActivity: (limit?: number) =>
    api.get('/dashboard/recent-activity', { params: { limit: limit || 10 } }),
};

// ─── Analysis API ────────────────────────────────────────────
export const analysisApi = {
  analyze: (id: string) => api.post(`/analysis/${id}/analyze`),

  getExplanation: (id: string) => api.get(`/analysis/${id}/explanation`),
};

export default api;
