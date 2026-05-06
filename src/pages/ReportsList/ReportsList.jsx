import React, { useState, useMemo } from 'react';
import { Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../../api/reportApi';
import { useAuthStore } from '../../store/authStore';
import { Eye, FileText, Search, FileEarmarkPdf, Clock, Person, MortarboardFill, XCircle } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import InlineEdit from '../../components/InlineEdit/InlineEdit';
import './ReportsList.css';

const AVATAR_COLORS = [
  '#154734','#1a5c40','#0a7c4f','#0d6e4a',
  '#2d6a4f','#1b6ca8','#7b2d8b','#b5451b',
];

const getAvatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name) => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

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
    const last  = (instructor.lastName  !== undefined ? instructor.lastName  : instructor.lastname)  || '';
    return `${first} ${last}`.trim() || `Instructor #${instructor.id}`;
  };

  const getObserverName = (report) => {
    const observer = report.evaluation?.observer;
    if (!observer) return 'N/A';
    const first = (observer.firstName !== undefined ? observer.firstName : observer.firstname) || '';
    const last  = (observer.lastName  !== undefined ? observer.lastName  : observer.lastname)  || '';
    return `${first} ${last}`.trim() || `Observer #${observer.id}`;
  };

  const getCourseTitle = (report) => {
    const evalObj = report.evaluation;
    if (!evalObj?.className) return 'N/A';
    return evalObj.className.courseTitle || evalObj.className.title || `Course #${evalObj.className.class_id}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const handleDownloadPDF = async (reportId) => {
    setDownloadingId(reportId);
    try {
      await reportApi.downloadPdf(reportId);
    } catch {
      toast.error('Failed to download PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredReports = useMemo(() => {
    let list = Array.isArray(reports) ? [...reports] : [];
    list.sort((a, b) => {
      const dA = a.createdAt ? new Date(a.createdAt) : 0;
      const dB = b.createdAt ? new Date(b.createdAt) : 0;
      return dB - dA;
    });
    const latestId = list.length > 0 ? list[0].report_id : null;

    const isAdmin      = roles.includes('ADMIN');
    const isObserver   = roles.includes('OBSERVER');
    const isInstructor = roles.includes('INSTRUCTOR');

    if (!isAdmin) {
      if (isObserver) {
        list = list.filter(r => {
          const id = r.evaluation?.observer?.observer_id || r.evaluation?.observer?.id;
          return id == user?.observerId;
        });
      } else if (isInstructor) {
        list = list.filter(r => {
          const id = r.evaluation?.instructor?.Instructor_id || r.evaluation?.instructor?.instructor_id || r.evaluation?.instructor?.id;
          return id == user?.instructorId;
        });
      }
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(r =>
        getInstructorName(r).toLowerCase().includes(q) ||
        getObserverName(r).toLowerCase().includes(q)   ||
        getCourseTitle(r).toLowerCase().includes(q)    ||
        String(r.report_id).includes(q)
      );
    }

    return list.map(r => ({ ...r, isLatest: r.report_id === latestId }));
  }, [reports, user, searchTerm]);

  return (
    <div id="reports-page-scoped">

      {/* HERO */}
      <div className="rl-hero">
        <InlineEdit pageKey="reports-title"    defaultValue="Evaluation Reports"                    canEdit={canEdit} tag="h1" className="rl-hero-title" />
        <InlineEdit pageKey="reports-subtitle" defaultValue="View and manage teaching assessment history" canEdit={canEdit} tag="p"  className="rl-hero-sub" />

        <div className="rl-stats-row">
          <div className="rl-stat">
            <span className="rl-stat-num">{reports.length}</span>
            <span className="rl-stat-label">Total</span>
          </div>
          <div className="rl-stat-divider" />
          <div className="rl-stat">
            <span className="rl-stat-num">{filteredReports.length}</span>
            <span className="rl-stat-label">Shown</span>
          </div>
          <div className="rl-stat-divider" />
          <div className="rl-stat">
            <span className="rl-stat-num">
              {filteredReports.filter(r => {
                const d = r.createdAt ? new Date(r.createdAt) : null;
                if (!d) return false;
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length}
            </span>
            <span className="rl-stat-label">This month</span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="rl-content">

        {/* TOOLBAR */}
        <div className="rl-toolbar">
          <div className="rl-search-wrap">
            <Search size={14} className="rl-search-icon" />
            <input
              type="text"
              placeholder="Search by instructor, course, observer…"
              className="rl-search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="rl-search-clear" onClick={() => setSearchTerm('')}>
                <XCircle size={14} />
              </button>
            )}
          </div>
        </div>

        {/* LIST */}
        {isLoading ? (
          <div className="rl-state-box">
            <Spinner animation="border" style={{ color: '#154734' }} />
            <p>Loading reports…</p>
          </div>
        ) : isError ? (
          <div className="rl-state-box">
            <FileText size={48} className="rl-state-icon error" />
            <p>Error loading reports. Please try again.</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rl-state-box">
            <FileText size={52} className="rl-state-icon" />
            <p>{searchTerm ? 'No reports match your search.' : 'No reports yet.'}</p>
            {searchTerm && <button className="rl-clear-btn" onClick={() => setSearchTerm('')}>Clear search</button>}
          </div>
        ) : (
          <div className="rl-list">
            {filteredReports.map((report) => {
              const instructorName = getInstructorName(report);
              const observerName   = getObserverName(report);
              const courseTitle    = getCourseTitle(report);
              const avatarColor    = getAvatarColor(instructorName);

              return (
                <div key={report.report_id} className={`rl-card${report.isLatest ? ' rl-card--latest' : ''}`}>
                  <div className="rl-card-avatar" style={{ background: avatarColor }}>
                    {getInitials(instructorName)}
                  </div>

                  <div className="rl-card-body">
                    <div className="rl-card-top">
                      <span className="rl-course-name">{courseTitle}</span>
                      {report.isLatest && <span className="rl-latest-pill">Latest</span>}
                      <span className="rl-report-id">#{report.report_id}</span>
                    </div>
                    <div className="rl-card-meta">
                      <span className="rl-meta-item">
                        <MortarboardFill size={12} />
                        {instructorName}
                      </span>
                      <span className="rl-meta-sep">·</span>
                      <span className="rl-meta-item">
                        <Person size={13} />
                        {observerName}
                      </span>
                      <span className="rl-meta-sep">·</span>
                      <span className="rl-meta-item">
                        <Clock size={12} />
                        {formatDate(report.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="rl-card-actions">
                    <button
                      className="rl-btn rl-btn--outline"
                      onClick={() => handleDownloadPDF(report.report_id)}
                      disabled={downloadingId === report.report_id}
                      title="Download PDF"
                    >
                      {downloadingId === report.report_id
                        ? <Spinner size="sm" animation="border" />
                        : <><FileEarmarkPdf size={14} /><span>PDF</span></>
                      }
                    </button>
                    <button
                      className="rl-btn rl-btn--solid"
                      onClick={() => navigate('/report-viewer', {
                        state: {
                          reportId: report.report_id,
                          evaluationId: report.evaluation?.evaluation_id,
                          classId: report.evaluation?.className?.class_id,
                          isReadOnly: true,
                        },
                      })}
                      title="View Report"
                    >
                      <Eye size={14} /><span>View</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsList;
