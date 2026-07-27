import { apiClient } from './apiClient';

// Shared shape between /login and /user/{id} responses.
export const parseUserResponse = (data) => ({
  firstName: data.firstName,
  lastName: data.lastName,
  email: data.email,
  roles: data.roles ? data.roles.replace(/[\[\]]/g, '').split(', ') : [],
  instructorId: data.instructorId,
  observerId: data.observerId,
  userId: data.userId,
  canEditContent: data.canEditContent === 'true',
  activeRole: data.activeRole || null,
});

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
  setActiveRole: async (userId, role) => {
    return apiClient(`/api/auth/users/${userId}/active-role`, {
      method: 'PATCH',
      body: { activeRole: role },
    });
  },
  getUser: async (userId) => {
    return apiClient(`/api/auth/user/${userId}`);
  },
};
