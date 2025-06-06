import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import Header from '../../components/Header/header';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './mainform.css';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist/webpack';

const EditReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [reportContent, setReportContent] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reportId, setReportId] = useState(null);

  useEffect(() => {
    if (location.state && location.state.reportId) {
      const { reportId } = location.state;
      setReportId(reportId);

      // Fetch the PDF content by reportId from the backend
      axios.get(`http://localhost:8080/api/reports/${reportId}/pdf`, {
        responseType: 'arraybuffer'
      })
      .then(response => {
        const pdfContent = new Uint8Array(response.data);

        // Convert PDF to HTML or plain text
        convertPdfToHtml(pdfContent).then(html => {
          setReportContent(html);  // Pre-fill the editor with existing report content
        });
      })
      .catch(error => {
        console.error('Error fetching report content:', error);
      });
    }
  }, [location.state]);

  // Function to convert PDF to HTML
  const convertPdfToHtml = async (pdfUint8Array) => {
    const pdf = await pdfjsLib.getDocument({ data: pdfUint8Array }).promise;
    let html = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      html += `<h2>Page ${pageNum}</h2>`;
      textContent.items.forEach(item => {
        html += `<p>${item.str}</p>`;
      });
    }

    return html;
  };

  // Function to handle saving the updated report content
  const handleSaveEvaluation = async () => {
    try {
      const response = await axios.put(`http://localhost:8080/api/reports/${reportId}/update`, {
        reportContent
      });

      if (response.status === 200) {
        setSuccessMessage('Report saved successfully!');
      } else {
        throw new Error('Failed to save the report.');
      }
    } catch (error) {
      console.error('Error saving report:', error);
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
            style={{ height: '400px', marginBottom: '5rem' }}
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
