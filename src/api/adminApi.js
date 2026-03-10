import { apiClient } from './apiClient';

export const adminApi = {
  // Current admins
  fetchAdmins: () => apiClient('/api/admins'),
  addAdmin: (adminData) => apiClient('/api/admins', { body: adminData }),
  deleteAdmin: (id) => apiClient(`/api/admins/${id}`, { method: 'DELETE' }),

  // Role requests
  fetchRoleRequests: () => apiClient('/api/admins/roleRequests'),
  approveRequest: (requestId) => apiClient(`/api/admins/roleRequests/${requestId}/approve`, { method: 'POST' }),
  
  // Method from new project (keep it)
  requestDualRole: async (userId) => {
    return apiClient('/api/admins/roleRequests', {
      body: {
        id: userId,
        requestedRole: 'OBSERVER'
      }
    });
  }
};
