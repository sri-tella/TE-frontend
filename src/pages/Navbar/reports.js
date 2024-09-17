import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Button } from 'react-bootstrap';
import Header from '../../components/Header/header';
import { useNavigate } from 'react-router-dom';
import './reports.css';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();

  const handleViewEditReport = (reportId) => {
    navigate('/editReport', {
      state: {
        reportId: reportId,
      },
    });
  };

  useEffect(() => {
    // Fetch all reports from API on component mount
    axios.get('https://te-backend-production.up.railway.app/api/reports')
      .then(response => {
        setReports(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the reports!', error);
      });
  }, []);

  const handleDownloadPDF = async (reportId) => {
    try {
      const response = await axios.get(`https://te-backend-production.up.railway.app/api/reports/${reportId}/pdf`, { responseType: 'blob' });
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'report.pdf';
      link.click();
      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      console.error('Error downloading the PDF:', error);
    }
  };

   return (
      <>
        <Header />
        <div className="reports-container">
          {reports.length === 0 ? (
            // Display this message if the reports array is empty
            <div className="no-reports-message">
              <p>Currently, no reports are available.</p>
            </div>
          ) : (
            // Display the table if reports are present
            <div className="reports-table">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, index) => (
                    <tr key={report.report_id}>
                      <td>{index + 1}</td>
                      <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td className="reports-actions">
                        <button className="btn-download-pdf" onClick={() => handleDownloadPDF(report.report_id)}>
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </>
    );
  };


export default Reports;
