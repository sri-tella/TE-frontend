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

const AVATAR_COLORS = ['#154734','#1a5c40','#0a7c4f','#2d6a4f','#1b6ca8','#7b2d8b','#b5451b','#0d6e4a'];
const getAvatarColor = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const getInitials = (name) => {
  const p = name.trim().split(' ').filter(Boolean);
  if (!p.length) return '?';
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
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

  const getInstructorName = (r) => {
    const i = r.evaluation?.instructor;
    if (!i) return 'N/A';
    const f = (i.firstName ?? i.firstname) || '';
    const l = (i.lastName  ?? i.lastname)  || '';
    return `${f} ${l}`.trim() || `Instructor #${i.id}`;
  };

  const getObserverName = (r) => {
    const o = r.evaluation?.observer;
    if (!o) return 'N/A';
    const f = (o.firstName ?? o.firstname) || '';
    const l = (o.lastName  ?? o.lastname)  || '';
    return `${f} ${l}`.trim() || `Observer #${o.id}`;
  };

  const getCourseTitle = (r) => {
    const c = r.evaluation?.className;
    if (!c) return 'N/A';
    return c.courseTitle || c.title || `Course #${c.class_id}`;
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  const handleDownloadPDF = async (id) => {
    setDownloadingId(id);
    try { await reportApi.downloadPdf(id); }
    catch { toast.error('Failed to download PDF.'); }
    finally { setDownloadingId(null); }
  };

  const filteredReports = useMemo(() => {
    let list = Array.isArray(reports) ? [...reports] : [];
    list.sort((a, b) => (b.createdAt ? new Date(b.createdAt) : 0) - (a.createdAt ? new Date(a.createdAt) : 0));
    const latestId = list[0]?.report_id ?? null;

    const isAdmin      = roles.includes('ADMIN');
    const isObserver   = roles.includes('OBSERVER');
    const isInstructor = roles.includes('INSTRUCTOR');

    if (!isAdmin) {
      if (isObserver)   list = list.filter(r => (r.evaluation?.observer?.observer_id   || r.evaluation?.observer?.id)   == user?.observerId);
      if (isInstructor) list = list.filter(r => (r.evaluation?.instructor?.Instructor_id || r.evaluation?.instructor?.instructor_id || r.evaluation?.instructor?.id) == user?.instructorId);
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
      <div className="rl-mesh" />

      {/* HEADER */}
      <div className="rl-header">
        <InlineEdit pageKey="reports-title"    defaultValue="Evaluation Reports"                         canEdit={canEdit} tag="h1" className="rl-title" />
        <InlineEdit pageKey="reports-subtitle" defaultValue="View and manage teaching assessment history" canEdit={canEdit} tag="p"  className="rl-subtitle" />
      </div>

      {/* CARD */}
      <div className="rl-wrap">
        <div className="rl-card">

          {/* TOOLBAR */}
          <div className="rl-toolbar">
            <div className="rl-count-pill">
              <span className="rl-count-num">{filteredReports.length}</span>
              <span className="rl-count-label">reports</span>
            </div>
            <div className="rl-search-wrap">
              <Search size={13} className="rl-search-icon" />
              <input
                type="text"
                placeholder="Search instructor, course, observer…"
                className="rl-search-input"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="rl-search-clear" onClick={() => setSearchTerm('')}>
                  <XCircle size={13} />
                </button>
              )}
            </div>
          </div>

          {/* TABLE */}
          {isLoading ? (
            <div className="rl-state">
              <Spinner animation="border" style={{ color: '#154734', width: 32, height: 32 }} />
              <p>Loading reports…</p>
            </div>
          ) : isError ? (
            <div className="rl-state">
              <FileText size={44} style={{ color: '#fca5a5' }} />
              <p>Error loading reports.</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="rl-state">
              <FileText size={44} style={{ color: '#cbd5e1' }} />
              <p>{searchTerm ? 'No results found.' : 'No reports yet.'}</p>
              {searchTerm && <button className="rl-clear-btn" onClick={() => setSearchTerm('')}>Clear search</button>}
            </div>
          ) : (
            <div className="rl-table-wrap">
              <table className="rl-table">
                <thead>
                  <tr>
                    <th>Instructor</th>
                    <th>Observer</th>
                    <th>Course</th>
                    <th>Date</th>
                    <th className="rl-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => {
                    const instructor = getInstructorName(report);
                    const observer   = getObserverName(report);
                    const course     = getCourseTitle(report);
                    return (
                      <tr key={report.report_id} className={report.isLatest ? 'rl-row-latest' : ''}>
                        <td>
                          <div className="rl-person">
                            <div className="rl-avatar" style={{ background: getAvatarColor(instructor) }}>
                              {getInitials(instructor)}
                            </div>
                            <div>
                              <div className="rl-person-name">{instructor}</div>
                              <div className="rl-person-meta">
                                #{report.report_id}
                                {report.isLatest && <span className="rl-latest-badge">Latest</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="rl-meta-line">
                            <Person size={13} />
                            {observer}
                          </div>
                        </td>
                        <td>
                          <div className="rl-course">{course}</div>
                          <div className="rl-eval-id">Eval #{report.evaluation?.evaluation_id}</div>
                        </td>
                        <td>
                          <div className="rl-meta-line">
                            <Clock size={12} />
                            {formatDate(report.createdAt)}
                          </div>
                        </td>
                        <td className="rl-td-actions">
                          <button
                            className="rl-btn rl-btn--ghost"
                            onClick={() => handleDownloadPDF(report.report_id)}
                            disabled={downloadingId === report.report_id}
                            title="Download PDF"
                          >
                            {downloadingId === report.report_id
                              ? <Spinner size="sm" animation="border" />
                              : <><FileEarmarkPdf size={13} /><span>PDF</span></>
                            }
                          </button>
                          <button
                            className="rl-btn rl-btn--solid"
                            onClick={() => navigate('/report-viewer', {
                              state: { reportId: report.report_id, evaluationId: report.evaluation?.evaluation_id, classId: report.evaluation?.className?.class_id, isReadOnly: true },
                            })}
                            title="View Report"
                          >
                            <Eye size={13} /><span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsList;
