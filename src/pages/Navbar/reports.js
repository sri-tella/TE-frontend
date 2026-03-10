import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Spinner, Badge } from 'react-bootstrap';
import Header from '../../components/Header/header';
import { useNavigate } from 'react-router-dom';
import './reports.css';
import { reportService } from '../../services/apiService';
import { FileEarmarkPdf, Eye, FileText, Search } from 'react-bootstrap-icons';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [searchTerm, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    reportService.fetchReports()
      .then(response => {
        console.log("REPORTS API DATA:", response.data);
        setReports(Array.isArray(response.data) ? response.data : []);
      })
      .catch(error => {
        console.error('Error fetching reports:', error);
      })
      .finally(() => setLoading(false));
  }, []);

  const getInstructorName = (report) => {
    if (report.instructorName) return report.instructorName;
    if (report.instructorFirstName && report.instructorLastName) {
      return `${report.instructorFirstName} ${report.instructorLastName}`;
    }
    if (report.firstName && report.lastName) {
      return `${report.firstName} ${report.lastName}`;
    }
    return 'Instructor #' + (report.instructorId || report.instructor_id || 'N/A');
  };

  const getCourseTitle = (report) => {
    return report.courseTitle || report.title || report.courseName || 'Course #' + (report.classId || report.class_id || 'N/A');
  };

  const handleDownloadPDF = async (reportId) => {
    if (downloadingId) return;
    setDownloadingId(reportId);
    try {
      const response = await reportService.downloadPDF(reportId);
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Evaluation_Report_${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      console.error('Error downloading the PDF:', error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredReports = reports.filter(r => 
    getInstructorName(r).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCourseTitle(r).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (String(r.report_id)).includes(searchTerm)
  );

   return (
      <>
        <Header />
        <div id="reports-page-scoped">
          <div className="reports-hero-section text-center mb-5">
              <h1 className="reports-main-title">Evaluation Reports</h1>
              <p className="reports-sub-title">View and manage teaching assessment history</p>
          </div>

          <div className="container pb-5">
            <Card className="reports-main-card border-0 shadow-lg overflow-hidden">
              <div className="reports-toolbar p-4 d-flex justify-content-between align-items-center bg-white border-bottom">
                <div className="reports-count">
                  <Badge bg="success" className="baylor-badge">{reports.length}</Badge> Total Reports
                </div>
                <div className="reports-search-box position-relative">
                  <Search className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search instructor, course or ID..." 
                    className="form-control-v3 search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="reports-table-wrapper">
                {loading ? (
                  <div className="p-5 text-center">
                    <Spinner animation="border" variant="success" />
                    <p className="mt-3 text-muted">Loading your reports...</p>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="p-5 text-center no-reports-area">
                    <FileText size={64} className="text-muted mb-3 opacity-25" />
                    <h4 className="text-muted">No reports found</h4>
                    <p className="text-muted mb-0">Either no evaluations have been completed yet, or your search matched nothing.</p>
                  </div>
                ) : (
                  <Table responsive hover className="mb-0 custom-baylor-table">
                    <thead>
                      <tr>
                        <th className="pl-4">ID</th>
                        <th>Instructor</th>
                        <th>Course / Session</th>
                        <th>Created Date</th>
                        <th className="text-right pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((report) => (
                        <tr key={report.report_id}>
                          <td className="pl-4 text-muted font-weight-bold">#{report.report_id}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="instructor-avatar mr-2">
                                {getInstructorName(report).charAt(0)}
                              </div>
                              <span className="instructor-name">{getInstructorName(report)}</span>
                            </div>
                          </td>
                          <td>
                            <span className="course-title-text">{getCourseTitle(report)}</span>
                          </td>
                          <td className="text-muted">
                            {new Date(report.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="text-right pr-4">
                            <div className="d-flex justify-content-end gap-2">
                              <Button 
                                variant="outline-success" 
                                className="btn-action-baylor mr-2"
                                onClick={() => handleDownloadPDF(report.report_id)}
                                disabled={downloadingId === report.report_id}
                                title="Download PDF"
                              >
                                {downloadingId === report.report_id ? <Spinner animation="border" size="sm" /> : <FileEarmarkPdf />}
                              </Button>
                              <Button 
                                variant="success" 
                                className="btn-action-baylor-solid"
                                onClick={() => navigate(`/viewReport`, { state: { 
                                  reportId: report.report_id,
                                  evaluationId: report.evaluation?.evaluation_id 
                                } })}
                                title="View Details"
                              >
                                <Eye />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  };

export default Reports;