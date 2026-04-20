import { apiClient } from './apiClient';

export const getPageContent = (pageKey) =>
  apiClient(`/api/content/${pageKey}`, { method: 'GET' });

export const savePageContent = (pageKey, htmlContent) =>
  apiClient(`/api/content/${pageKey}`, { method: 'PUT', body: { htmlContent } });

export const getContentPermission = (userId) =>
  apiClient(`/api/admins/users/${userId}/content-permission`, { method: 'GET' });
