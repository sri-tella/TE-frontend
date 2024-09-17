import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import Header from '../../components/Header/header';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './mainform.css';

const ViewReports = () => {
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
          sectionTitle: rec.sectionTitle
        })),
      };

      try {
        const response = await fetch('https://te-backend-production.up.railway.app/api/evaluations/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(evaluationData),
        });

        if (!response.ok) {
          throw new Error('Failed to save evaluation');
        }

        // Generate the PDF
        const input = document.getElementById('report-content');
        const canvas = await html2canvas(input);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgWidth = 190; // Set your desired width
        const pageHeight = pdf.internal.pageSize.height;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const pdfBlob = pdf.output('blob');

        // Save PDF to the backend
        const formData = new FormData();
        formData.append('file', pdfBlob, 'report.pdf');
        formData.append('evaluationId', 1); // Pass the evaluation ID

        const pdfResponse = await fetch('https://te-backend-production.up.railway.app/api/reports/save-pdf', {
          method: 'POST',
          body: formData,
        });

        if (!pdfResponse.ok) {
          throw new Error('Failed to save PDF');
        }

        setSuccessMessage('Report saved successfully!');
      } catch (error) {
        console.error('Error saving evaluation or PDF:', error);
        setSuccessMessage('Failed to save the report.');
      }
    };

  const handleDownloadPDF = () => {
    console.log("Downloading PDF...");
    const input = document.getElementById('report-content');

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 190; // Set your desired width
      const pageHeight = pdf.internal.pageSize.height;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('report.pdf');
    });
    setTimeout(() => {
          navigate('/reports');
        }, 10000);
  };

  return (
    <>
      <Header />
      <div className="container mt-4">
        <h4>Final Report</h4>

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
          <Button onClick={handleDownloadPDF} className="button-custom mr-2">
            Download PDF
          </Button>
          {successMessage && (
            <div className="text-success-custom">
              Report saved successfully!
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewReports;
