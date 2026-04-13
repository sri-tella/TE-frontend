import { apiClient } from './apiClient';

export const evaluationApi = {
  getEvaluation: (id) => apiClient(`/api/evaluations/${id}`),
  
  updateActivityLog: (evaluationId, activityLog) => {
    return apiClient(`/api/evaluations/${evaluationId}/activity-log`, {
      method: 'PUT',
      body: { activityLog: JSON.stringify(activityLog) },
    });
  }
};
