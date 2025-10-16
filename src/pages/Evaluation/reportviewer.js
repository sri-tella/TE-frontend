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
      let report = '<h2>Evaluation Summary Report</h2>';

      if (selectedRecommendations.length > 0) {
        report += '<h3>Selected Observations & Recommendations</h3>';

        const groupedBySection = {};

        // Group by section → then by observation → then recommendations
        selectedRecommendations.forEach((rec) => {
          if (!groupedBySection[rec.sectionTitle]) {
            groupedBySection[rec.sectionTitle] = {};
          }
          if (!groupedBySection[rec.sectionTitle][rec.observedDescription]) {
            groupedBySection[rec.sectionTitle][rec.observedDescription] = [];
          }
          groupedBySection[rec.sectionTitle][rec.observedDescription].push(rec.description);
        });

        Object.entries(groupedBySection).forEach(([sectionTitle, observations]) => {
          report += `<h3>${sectionTitle}</h3>`;
          Object.entries(observations).forEach(([observation, recs], idx) => {
            report += `<p><strong>Observation ${idx + 1}:</strong> ${observation}</p>`;
            recs.forEach((rec, rIndex) => {
              report += `<p style="margin-left:20px;">→ Recommendation: ${rec}</p>`;
            });
          });

          const sectionFeedback = feedbacks[sectionTitle];
          if (sectionFeedback && sectionFeedback.trim()) {
            report += `<p style="margin-top:10px;"><em>Section Feedback:</em><br>${sectionFeedback}</p>`;
          }
        });
      }

      // If there's general "Additional Feedback", show it at the end
      if (feedbacks['Additional Feedback']) {
        report += '<h3>Additional Feedback</h3>';
        report += `<p>${feedbacks['Additional Feedback']}</p>`;
      }

      setReportContent(report);
    }
  }, [location.state]);

  const handleSaveEvaluation = async () => {
    const currentDate = new Date().toISOString().split('T')[0];
    const { selectedRecommendations, evaluationId, observerId, instructorId, classId, feedbacks } = location.state;

    const evaluationData = {
      date: currentDate,
      observerId,
      instructorId,
      classId,
      recommendations: selectedRecommendations.map(rec => ({
        description: rec.description,
        sectionTitle: rec.sectionTitle,
        feedback: location.state.feedbacks?.[rec.sectionTitle] || '',
        selected: true
      }))
    };

      try {
        const response = await fetch('https://te-backend-production.up.railway.app/api/evaluations/save', {
        // const response = await fetch('http://localhost:8080/api/evaluations/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(evaluationData),
        });

      if (!response.ok) throw new Error('Failed to save evaluation');

      const input = document.getElementById('printable-report');
      const canvas = await html2canvas(input);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 190;
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
      const formData = new FormData();
      formData.append('file', pdfBlob, 'report.pdf');
      formData.append('evaluationId', evaluationId || 1);

        const pdfResponse = await fetch('https://te-backend-production.up.railway.app/api/reports/save-pdf', {
        // const pdfResponse = await fetch('http://localhost:8080/api/reports/save-pdf', {
          method: 'POST',
          body: formData,
        });

      if (!pdfResponse.ok) throw new Error('Failed to save PDF');
      localStorage.removeItem('selectedRecommendations');
      localStorage.removeItem('selectedRecFeedbacks');
      localStorage.removeItem('evaluateFeedbacks');
      localStorage.removeItem('selectedOptions');

      setSuccessMessage('Report saved successfully!');
    } catch (error) {
      console.error('Error saving evaluation or PDF:', error);
      setSuccessMessage('Failed to save the report.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const input = document.getElementById('printable-report');
      await new Promise(resolve => setTimeout(resolve, 300));
      const canvas = await html2canvas(input);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 190;
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
      //Clearing saved evaluation data from localStorage after PDF is downloaded
      localStorage.removeItem('selectedRecommendations');
      localStorage.removeItem('selectedRecFeedbacks');
      localStorage.removeItem('selectedOptions');
      localStorage.removeItem('evaluateFeedbacks');
      setTimeout(() => {
        navigate('/reports');
      }, 10000);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleDownloadDoc = () => {
  // Define the HTML with a footer for page numbers
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Document</title>
      <style>
        @page {
          margin: 1in;
        }
        .footer {
          position: running(footer);
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        @page {
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
          }
        }
      </style>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
    </head>
    <body>
      <div id="content">${reportContent}</div>
      <div class="footer"></div>
    </body>
    </html>`;

  const blob = new Blob(['\ufeff', header], {
    type: 'application/msword',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'report.doc';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clear localStorage after saving as DOC
  localStorage.removeItem('selectedRecommendations');
  localStorage.removeItem('selectedRecFeedbacks');
  localStorage.removeItem('selectedOptions');
  localStorage.removeItem('evaluateFeedbacks');

  setTimeout(() => {
    navigate('/reports');
  }, 3000);
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
            style={{ minHeight: '300px', maxHeight: 'none', marginBottom: '5rem' }}
          />
        </div>

        <div id="printable-report" style={{
          position: 'absolute',
          left: '-9999px',
          top: '0',
          visibility: 'visible',
          zIndex: -1,
          width: '800px',
          padding: '20px',
          color: '#000',
          fontSize: '14px'
        }} dangerouslySetInnerHTML={{ __html: reportContent }} />

        <div className="mt-3">
          <Button onClick={() => navigate('/SelectedRecommendations')} className="button-custom mr-2">
            Go Back
          </Button>
          <Button onClick={handleSaveEvaluation} className="button-custom mr-2">
            Save Report
          </Button>
          <Button onClick={handleDownloadDoc} className="button-custom mr-2">
            Download Word Doc
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

export default ViewReports;

