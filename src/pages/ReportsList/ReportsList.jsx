import React, { useState, useMemo } from 'react';
import { Table, Button, Card, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../../api/reportApi';
import { useAuthStore } from '../../store/authStore';
import { Eye, FileText, Search, FileEarmarkPdf, Clock, Person } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import InlineEdit from '../../components/InlineEdit/InlineEdit';
import './ReportsList.css';

const ReportsList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const roles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
  const canEdit = roles.includes('ADMIN') || !!user?.canEditContent;

  const { data: reports = [], isLoading, isError } = useQuery({
    queryKey: ['reports'],
    queryFn: reportApi.fetchReports,
  });

  const getInstructorName = (report) => {
    const instructor = report.evaluation?.instructor;
    if (!instructor) return 'N/A';
    const first = (instructor.firstName !== undefined ? instructor.firstName : instructor.firstname) || '';
    const last = (instructor.lastName !== undefined ? instructor.lastName : instructor.lastname) || '';
    return `${first} ${last}`.trim() || `Instructor #${instructor.id}`;
  };

  const getObserverName = (report) => {
    const observer = report.evaluation?.observer;
    if (!observer) return 'N/A';
    const first = (observer.firstName !== undefined ? observer.firstName : observer.firstname) || '';
    const last = (observer.lastName !== undefined ? observer.lastName : observer.lastname) || '';
    return `${first} ${last}`.trim() || `Observer #${observer.id}`;
  };

  const getCourseTitle = (report) => {
    const evalObj = report.evaluation;
    if (!evalObj?.className) return 'N/A';
    return evalObj.className.courseTitle || evalObj.className.title || `Course #${evalObj.className.class_id}`;
  };

  const handleDownloadPDF = async (reportId) => {
    setDownloadingId(reportId);
    try {
      await reportApi.downloadPdf(reportId);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error("Failed to download PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredReports = useMemo(() => {
    let list = Array.isArray(reports) ? [...reports] : [];

    // 1. Sort by date (newest first)
    list.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : 0;
      const dateB = b.createdAt ? new Date(b.createdAt) : 0;
      return dateB - dateA;
    });

    // 2. Identify the ABSOLUTE LATEST report ID
    const absoluteLatestId = list.length > 0 ? list[0].report_id : null;

    // 3. Filter by User Role
    const roles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
    const isAdmin = roles.includes('ADMIN');
    const isObserver = roles.includes('OBSERVER');
    const isInstructor = roles.includes('INSTRUCTOR');

    if (!isAdmin) {
      if (isObserver) {
        // Observers see only reports they authored
        list = list.filter(r => {
          const obsId = r.evaluation?.observer?.observer_id || r.evaluation?.observer?.id;
          return obsId == user?.observerId;
        });
      } else if (isInstructor) {
        // Instructors see only reports about them
        list = list.filter(r => {
          const insId = r.evaluation?.instructor?.Instructor_id || r.evaluation?.instructor?.instructor_id || r.evaluation?.instructor?.id;
          return insId == user?.instructorId;
        });
      }
    }

    // 4. Apply Search Filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      list = list.filter(r => {
        const instructor = getInstructorName(r).toLowerCase();
        const observer = getObserverName(r).toLowerCase();
        const course = getCourseTitle(r).toLowerCase();
        const id = String(r.report_id).toLowerCase();
        const evalId = String(r.evaluation?.evaluation_id || '').toLowerCase();

        return instructor.includes(query) || 
               observer.includes(query) || 
               course.includes(query) || 
               id.includes(query) || 
               evalId.includes(query);
      });
    }

    // 5. Map with isLatest flag
    return list.map(r => ({
      ...r,
      isLatest: r.report_id === absoluteLatestId
    }));
  }, [reports, user, searchTerm]);

  return (
    <div id="reports-page-scoped">
      <div className="reports-hero-section text-center mb-5">
        <InlineEdit
          pageKey="reports-title"
          defaultValue="Evaluation Reports"
          canEdit={canEdit}
          tag="h1"
          className="reports-main-title"
        />
        <InlineEdit
          pageKey="reports-subtitle"
          defaultValue="View and manage teaching assessment history"
          canEdit={canEdit}
          tag="p"
          className="reports-sub-title"
        />
      </div>

      <div className="container pb-5">
        <Card className="reports-main-card border-0 shadow-lg overflow-hidden">
          <div className="reports-toolbar p-4 d-flex justify-content-between align-items-center bg-white border-bottom">
            <div className="reports-count">
              <Badge bg="success" className="baylor-badge">{filteredReports.length}</Badge> Total Reports
            </div>
            <div className="reports-search-box position-relative">
              <Search className="search-icon" />
              <input 
                type="text" 
                placeholder="Search reports..." 
                className="form-control-v3 search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="reports-table-wrapper">
            {isLoading ? (
              <div className="p-5 text-center">
                <Spinner animation="border" variant="success" />
                <p className="mt-3 text-muted">Loading your reports...</p>
              </div>
            ) : isError ? (
              <div className="p-5 text-center no-reports-area">
                <h4 className="text-danger">Error loading reports</h4>
                <p className="text-muted">Please try again later.</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-5 text-center no-reports-area">
                <FileText size={64} className="text-muted mb-3 opacity-25" />
                <h4 className="text-muted">No reports found</h4>
                {searchTerm && <Button variant="link" onClick={() => setSearchTerm('')}>Clear search</Button>}
              </div>
            ) : (
              <Table responsive hover className="mb-0 custom-baylor-table">
                <thead>
                  <tr>
                    <th className="ps-4">ID</th>
                    <th>Instructor</th>
                    <th>Observer</th>
                    <th>Course / Session</th>
                    <th>Created At</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.report_id} className={report.isLatest ? "table-success-light" : ""}>
                      <td className="ps-4 text-muted fw-bold">
                        #{report.report_id}
                        {report.isLatest && <Badge bg="primary" className="ms-2" style={{fontSize: '0.65rem'}}>LATEST</Badge>}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="instructor-avatar">
                            {getInstructorName(report).charAt(0)}
                          </div>
                          <span className="instructor-name">{getInstructorName(report)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center text-muted small">
                          <Person size={14} className="me-1" />
                          {getObserverName(report)}
                        </div>
                      </td>
                      <td>
                        <div className="course-title-text">{getCourseTitle(report)}</div>
                        <div className="text-muted" style={{fontSize: '0.75rem'}}>Eval ID: #{report.evaluation?.evaluation_id}</div>
                      </td>
                      <td className="text-muted small">
                        <div className="d-flex align-items-center">
                          <Clock size={14} className="me-1" />
                          {report.createdAt ? new Date(report.createdAt).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 'N/A'}
                        </div>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-2">
                          <Button 
                            variant="outline-success" 
                            className="btn-action-baylor"
                            onClick={() => handleDownloadPDF(report.report_id)}
                            disabled={downloadingId === report.report_id}
                            title="Download PDF"
                          >
                            {downloadingId === report.report_id ? <Spinner size="sm" /> : <FileEarmarkPdf />}
                          </Button>
                          <Button 
                            variant="success" 
                            className="btn-action-baylor-solid"
                            onClick={() => navigate(`/report-viewer`, { 
                                state: { 
                                  reportId: report.report_id,
                                  evaluationId: report.evaluation?.evaluation_id,
                                  classId: report.evaluation?.className?.class_id,
                                  isReadOnly: true 
                                } 
                            })}
                            title="View Report"
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
  );
};

export default ReportsList;
