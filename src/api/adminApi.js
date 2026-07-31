import { apiClient } from './apiClient';

export const adminApi = {
  // Current admins
  fetchAdmins: () => apiClient('/api/admins'),
  addAdmin: (adminData) => apiClient('/api/admins', { body: adminData }),
  deleteAdmin: (id) => apiClient(`/api/admins/${id}`, { method: 'DELETE' }),

  // Role requests
  fetchRoleRequests: () => apiClient('/api/admins/roleRequests'),
  approveRequest: (requestId) => apiClient(`/api/admins/roleRequests/${requestId}/approve`, { method: 'POST' }),
  
  requestDualRole: async (userId, requestedRole) => {
    return apiClient('/api/admins/roleRequests', {
      body: { id: userId, requestedRole }
    });
  },

  fetchObservers: () => apiClient('/api/admins/observers'),
  fetchAllUsers: () => apiClient('/api/admins/all-users'),
  toggleContentPermission: (userId, canEditContent) =>
    apiClient(`/api/admins/users/${userId}/content-permission`, {
      method: 'PATCH',
      body: { canEditContent }
    }),
  toggleRoleSwitch: (userId) =>
    apiClient(`/api/admins/users/${userId}/toggle-role-switch`, { method: 'PATCH' }),
};
