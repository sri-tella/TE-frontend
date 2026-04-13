import { apiClient } from './apiClient';

export const reportApi = {
  fetchReports: () => apiClient('/api/reports'),
  
  downloadPdf: async (reportId) => {
    const blob = await apiClient(`/api/reports/${reportId}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Evaluation_Report_${reportId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  savePdfReport: (file, evaluationId, reportContent) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('evaluationId', evaluationId);
    if (reportContent) {
      formData.append('reportContent', reportContent);
    }

    return apiClient('/api/reports/save-pdf', {
      method: 'POST',
      body: formData,
    });
  }

};
