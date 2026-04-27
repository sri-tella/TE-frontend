import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function apiClient(endpoint, { body, ...customConfig } = {}) {
  const token = useAuthStore.getState().token;

  const headers = {};

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method: body !== undefined ? (customConfig.method || 'POST') : (customConfig.method || 'GET'),
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body !== undefined && !(body instanceof FormData)) {
    config.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    config.body = body;
    delete config.headers['Content-Type'];
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  let data = null;
  const contentType = response.headers.get('content-type');

  if (response.status !== 204) {
    if (customConfig.responseType === 'blob') {
      data = await response.blob();
    } else if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error('Server returned invalid data format.');
      }
    } else {
      data = await response.text();
    }
  }

  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (response.ok) {
    return data;
  }

  throw new Error(data?.message || (typeof data === 'string' ? data : null) || response.statusText);
}
