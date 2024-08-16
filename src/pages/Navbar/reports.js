import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Button } from 'react-bootstrap';
import Header from '../../components/Header/header';
import './reports.css';

const Reports = () => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // Fetch all reports from API on component mount
    axios.get('http://localhost:8080/api/reports')
      .then(response => {
        setReports(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the reports!', error);
      });
  }, []);

  const handleDownloadPDF = async (reportId) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/reports/${reportId}/pdf`, { responseType: 'blob' });
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
          <h2 className="reports-heading">Reports</h2>
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
                      <Button className="btn-download-pdf" onClick={() => handleDownloadPDF(report.report_id)}>
                        Download PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      </>
    );
  };


export default Reports;
