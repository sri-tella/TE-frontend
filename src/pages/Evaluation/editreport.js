import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import Header from '../../components/Header/header';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './mainform.css';

const EditReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [reportContent, setReportContent] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (location.state) {
      const { selectedRecommendations, feedbacks } = location.state;

      let report = '<h2>Final Report</h2>';

      if (selectedRecommendations.length > 0) {
        report += '<h3>Selected Recommendations:</h3>';
        selectedRecommendations.forEach((rec, index) => {
          if (rec.selected) {
            report += `<p>${index + 1}. ${rec.description}.</p>`;
          }
        });
      }

      if (Object.keys(feedbacks).length > 0) {
        report += '<h3>Additional Feedback:</h3>';
        Object.entries(feedbacks).forEach(([sectionTitle, feedback]) => {
          if (feedback) {
            report += `<p>${feedback}</p>`;
          }
        });
      }

      setReportContent(report);
    }
  }, [location.state]);

  const handleSaveEvaluation = async () => {
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const { selectedRecommendations, evaluationId } = location.state;

    const evaluationData = {
      date: currentDate,
      recommendations: selectedRecommendations.map(rec => ({
        description: rec.description,
        sectionTitle: rec.sectionTitle,
      })),
    };

    try {
      const response = await fetch('http://localhost:8080/api/evaluations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationData),
      });

      if (!response.ok) {
        throw new Error('Failed to save evaluation');
      }

      setSuccessMessage('Report saved successfully!');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      setSuccessMessage('Failed to save the report.');
    }
  };

  return (
    <>
      <Header />
      <div className="container mt-4">
        <h4>Edit Report</h4>

        <div id="report-content" style={{ padding: '20px', backgroundColor: '#fff', marginBottom: '20px' }}>
          <ReactQuill
            value={reportContent}
            onChange={setReportContent}
            theme="snow"
            modules={{
              toolbar: [
                [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{'align': []}],
                ['link', 'image'],
                ['clean']
              ],
            }}
            formats={[
              'header', 'font',
              'bold', 'italic', 'underline', 'strike', 'blockquote',
              'list', 'bullet',
              'link', 'image', 'align'
            ]}
            style={{ height: '400px', marginBottom: '5rem' }}  // Adjust the height here
          />
        </div>
        <div className="mt-3">
          <Button onClick={handleSaveEvaluation} className="button-custom mr-2">
            Save Report
          </Button>
          {successMessage && (
            <div className="text-success-custom">
              {successMessage}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EditReport;
