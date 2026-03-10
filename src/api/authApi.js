import { apiClient } from './apiClient';

export const authApi = {
  login: async (credentials) => {
    return apiClient('/api/auth/login', { body: credentials });
  },
  signup: async (userData) => {
    return apiClient('/api/auth/signup', { body: userData });
  },
  changePassword: async (passwordData) => {
    return apiClient('/api/auth/change-password', { body: passwordData });
  },
};
