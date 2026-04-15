// frontend/src/services/api.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MAX_LOCAL_PORT_SCAN = 10;

const toHealthURL = (baseURL) => baseURL.replace(/\/api\/?$/, '/health');

const getCandidateBaseURLs = () => {
  try {
    const url = new URL(BASE_URL);
    const isLocalHost = ['localhost', '127.0.0.1'].includes(url.hostname);
    const port = Number(url.port);

    if (!isLocalHost || !port) return [BASE_URL];

    return Array.from({ length: MAX_LOCAL_PORT_SCAN + 1 }, (_, i) => {
      const next = new URL(url.toString());
      next.port = String(port + i);
      return next.toString().replace(/\/$/, '');
    });
  } catch {
    return [BASE_URL];
  }
};

let resolvedBaseURL = BASE_URL;
let baseURLResolutionPromise = null;

const resolveBaseURL = async () => {
  const candidates = getCandidateBaseURLs();

  for (const candidate of candidates) {
    try {
      await axios.get(toHealthURL(candidate), { timeout: 1200 });
      resolvedBaseURL = candidate;
      return resolvedBaseURL;
    } catch {
      // Try next port candidate.
    }
  }

  return resolvedBaseURL;
};

const ensureBaseURL = () => {
  if (!baseURLResolutionPromise) {
    baseURLResolutionPromise = resolveBaseURL()
      .finally(() => {
        baseURLResolutionPromise = null;
      });
  }

  return baseURLResolutionPromise;
};

const api = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  await ensureBaseURL();
  config.baseURL = resolvedBaseURL;

  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Auto refresh access token on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        await ensureBaseURL();
        const { data } = await axios.post(`${resolvedBaseURL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        api.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// Documents
export const documentAPI = {
  getAll: () => api.get('/documents'),
  search: (query) => api.get('/documents/search', { params: { q: query } }),
  create: (data) => api.post('/documents', data),
  get: (id) => api.get(`/documents/${id}`),
  update: (id, data) => api.patch(`/documents/${id}`, data),
  toggleBookmark: (id, isBookmarked) => api.patch(`/documents/${id}`, { is_bookmarked: isBookmarked }),
  delete: (id) => api.delete(`/documents/${id}`),
  enableShare: (id) => api.post(`/documents/${id}/share`),
  disableShare: (id) => api.delete(`/documents/${id}/share`),
  // Trash functionality
  getTrashed: () => api.get('/documents/trash'),
  restore: (id) => api.post(`/documents/${id}/restore`),
  permanentDelete: (id) => api.delete(`/documents/${id}/permanent`),
};

// Blocks
export const blockAPI = {
  create: (docId, data) => api.post(`/documents/${docId}/blocks`, data),
  update: (docId, blockId, data) => api.patch(`/documents/${docId}/blocks/${blockId}`, data),
  delete: (docId, blockId) => api.delete(`/documents/${docId}/blocks/${blockId}`),
  reorder: (docId, blocks) => api.post(`/documents/${docId}/blocks/reorder`, { blocks }),
  batchSave: (docId, blocks, version) =>
    api.post(`/documents/${docId}/blocks/batch`, { blocks, documentVersion: version }),
  // Trash functionality
  getTrashed: (docId) => api.get(`/documents/${docId}/blocks/trash`),
  restore: (docId, blockId) => api.post(`/documents/${docId}/blocks/${blockId}/restore`),
  permanentDelete: (docId, blockId) => api.delete(`/documents/${docId}/blocks/${blockId}/permanent`),
};

// Share (read-only, no auth needed)
export const shareAPI = {
  get: async (token) => {
    await ensureBaseURL();
    return axios.get(`${resolvedBaseURL}/share/${token}`);
  },
};

export default api;
