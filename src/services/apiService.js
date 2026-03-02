import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  const isTokenValid = token && token !== 'null' && token !== 'undefined';

  if (isTokenValid) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authService = {
  
  login: (email, password) => {
    return api.post('/api/auth/login', { email, password });
  },
  changePassword: (passwordData) => {
    return api.post('/api/auth/change-password', passwordData);
  },
};

export const classService = {
  fetchClasses: () => {
    return api.get('/api/classes/with-instructors');
  },
  updateArchiveStatus: (classId, status) => {
    return api.put(`/api/classes/${classId}/archive`, status);
  },
  fetchClassDetails: (classId) => {
    return api.get(`/api/classes/${classId}`);
  },
};

export const reportService = {
  fetchReports: () => {
    return api.get('/api/reports');
  },
  fetchReportDetails: (reportId) => {
    return api.get(`/api/reports/${reportId}`);
  },
  downloadPDF: (reportId) => {
    return api.get(`/api/reports/${reportId}/pdf`, { responseType: 'blob' });
  },
};

export const evaluationService = {
  startEvaluation: async (observerEmail, instructorInfo) => {
    const observerRes = await api.get(`/api/observers/email/${observerEmail}`);
    const observerId = observerRes.data.observer_id;
    const startDate = new Date().toISOString().split('T')[0];
    
    const evaluationPayload = {
      observerId,
      instructorId: instructorInfo.instructorId,
      classId: instructorInfo.classId,
      date: startDate
    };

    return api.post('/api/evaluations/start', evaluationPayload);
  },
  saveEvaluation: (evaluationData) => {
    return api.post('/api/evaluations/save', evaluationData);
  },
};

export const notificationService = {
  fetchNotifications: (role) => {
    return api.get(`/api/notifications/role/${role}`);
  },
};

export const adminService = {
  requestDualRole: (userId) => {
    return api.post('/api/admins/roleRequests', {
      id: userId,
      requestedRole: 'OBSERVER'
    });
  }
};

export default api;