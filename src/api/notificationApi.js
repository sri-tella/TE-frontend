import { apiClient } from './apiClient';

export const notificationApi = {
  fetchByRole: (role) => apiClient(`/api/notifications/role/${role}`),
  markAsRead: (id) => apiClient(`/api/notifications/notifications/${id}/read`, { method: 'PATCH' })
};
