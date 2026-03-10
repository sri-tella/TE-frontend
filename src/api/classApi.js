import { apiClient } from './apiClient';

export const classApi = {
  fetchClasses: async () => {
    return apiClient('/api/classes/with-instructors');
  },
  fetchClassDetails: async (classId) => {
    return apiClient(`/api/classes/${classId}`);
  },
  updateArchiveStatus: async (classId, isArchived) => {
    return apiClient(`/api/classes/${classId}/archive`, {
      method: 'PUT',
      body: isArchived
    });
  },
};

export const evaluationApi = {
  startEvaluation: async (payload) => {
    return apiClient('/api/evaluations/start', { body: payload });
  },
};

export const observerApi = {
  getByEmail: async (email) => {
    return apiClient(`/api/observers/email/${email}`);
  },
};
