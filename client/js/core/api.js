/* =========================================================
   SHIFT AUTO SUPPLY — Core API Client
   Fetch wrapper with auth token injection + refresh logic
   ========================================================= */

const API_BASE = window.ENV?.API_URL || 'http://localhost:5000/api/v1';

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  refreshQueue = [];
};

const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = localStorage.getItem('sas_access_token');

    const config = {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body && !(options.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    let response = await fetch(url, config);

    // Token expired — try to refresh
    if (response.status === 401 && !options._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(newToken => {
          config.headers.Authorization = `Bearer ${newToken}`;
          return fetch(url, config).then(r => this._parseResponse(r));
        });
      }

      options._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newToken = data.data.accessToken;
          localStorage.setItem('sas_access_token', newToken);
          processQueue(null, newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
          response = await fetch(url, config);
        } else {
          processQueue(new Error('Refresh failed'));
          auth.logout();
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      } catch (err) {
        processQueue(err);
        auth.logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return this._parseResponse(response);
  },

  async _parseResponse(response) {
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch { data = { success: false, message: text }; }

    if (!response.ok) {
      const error = new Error(data.message || `HTTP ${response.status}`);
      error.statusCode = response.status;
      error.errors = data.errors || [];
      throw error;
    }
    return data;
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    ).toString();
    return this.request(`${endpoint}${query ? '?' + query : ''}`, { method: 'GET' });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'POST', body, ...options });
  },

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'PATCH', body, ...options });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  upload(endpoint, formData) {
    return this.request(endpoint, { method: 'POST', body: formData });
  },
};

// ── Product API ──────────────────────────────────────────
const productsAPI = {
  getAll: (params) => api.get('/products', params),
  getOne: (slug)   => api.get(`/products/${slug}`),
  getFeatured: ()  => api.get('/products/featured'),
  getCategories: () => api.get('/products/categories'),
  searchVin: (vin) => api.get(`/products/vin/${vin}`),
  create: (formData) => api.upload('/products', formData),
  update: (id, data) => api.patch(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  uploadImages: (id, formData) => api.upload(`/products/${id}/images`, formData),
};

// ── Orders API ───────────────────────────────────────────
const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my/orders', params),
  getOne: (id) => api.get(`/orders/${id}`),
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
  uploadProof: (id, formData) => api.upload(`/orders/${id}/proof`, formData),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
  // Admin
  getAll: (params) => api.get('/orders', params),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
  updateTracking: (id, data) => api.patch(`/orders/${id}/tracking`, data),
};

// ── Payments API ─────────────────────────────────────────
const paymentsAPI = {
  getMethods: () => api.get('/payments/methods'),
  getMethodDetails: (id) => api.get(`/payments/methods/${id}/details`),
  getMethodsAdmin: () => api.get('/payments/methods/admin'),
  updateMethod: (id, data) => api.patch(`/payments/methods/${id}`, data),
};

// ── Auth API ─────────────────────────────────────────────
const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  getMe: () => api.get('/auth/me'),
};

// ── Reviews API ──────────────────────────────────────────
const reviewsAPI = {
  getAll: (params) => api.get('/reviews', params),
  create: (data) => api.post('/reviews', data),
  approve: (id) => api.patch(`/reviews/${id}/approve`),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// ── Admin API ────────────────────────────────────────────
const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params) => api.get('/admin/users', params),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
};

window.SAS = window.SAS || {};
Object.assign(window.SAS, { api, productsAPI, ordersAPI, paymentsAPI, authAPI, reviewsAPI, adminAPI });
