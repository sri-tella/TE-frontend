import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Spinner, Card } from 'react-bootstrap';
import { 
  ArrowLeft, Save, FileEarmarkPdf, FileEarmarkWord, Robot,
  TypeBold, TypeItalic, TypeUnderline, ListUl, 
  TypeH3, TextLeft, TextCenter, ArrowClockwise
} from 'react-bootstrap-icons';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { toast } from 'react-toastify';

import ReportPdfDocument from '../../components/Report/ReportPdfDocument';
import ActivityLog from '../../components/ActivityLog/ActivityLog.jsx';
import { useEvaluationStore } from '../../store/evaluationStore';
import { generateWordReport } from '../../utils/WordGenerator';
import { useAuthStore } from '../../store/authStore';
import { classApi } from '../../api/classApi';
import { reportApi } from '../../api/reportApi';
import { evaluationApi } from '../../api/evaluationApi';
import './ReportViewer.css';

const MenuBar = ({ editor, onRefresh }) => {
  if (!editor) return null;
  return (
    <div className="tiptap-menubar">
      <button type="button" onClick={onRefresh} className="menu-btn-v3" title="Refresh Timeline"><ArrowClockwise size={20} /></button>
      <div className="menu-divider-v3" />
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`menu-btn-v3 ${editor.isActive('bold') ? 'is-active' : ''}`}><TypeBold size={20} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`menu-btn-v3 ${editor.isActive('italic') ? 'is-active' : ''}`}><TypeItalic size={20} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`menu-btn-v3 ${editor.isActive('underline') ? 'is-active' : ''}`}><TypeUnderline size={20} /></button>
      <div className="menu-divider-v3" />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`menu-btn-v3 ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}><TypeH3 size={20} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`menu-btn-v3 ${editor.isActive('bulletList') ? 'is-active' : ''}`}><ListUl size={20} /></button>
      <div className="menu-divider-v3" />
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`menu-btn-v3 ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}><TextLeft size={20} /></button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`menu-btn-v3 ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}><TextCenter size={20} /></button>
    </div>
  );
};

const formatAiResponse = (text, category) => {
    if (!text) return '';
    let clean = text.replace(/\*\*/g, '').replace(/##/g, '').replace(/^\s*\* /gm, '');
    const catEscaped = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const headerRegex = new RegExp(`^${catEscaped}[:\\-]?\\s*`, 'i');
    clean = clean.replace(headerRegex, '').trim();

    return `
        <div class="ai-analysis-block">
            <strong style="color: #154734; font-size: 11pt; display: block; margin-bottom: 8px;">Institutional AI Analysis</strong>
            <div style="font-size: 10.5pt; color: #374151; line-height: 1.6;">${clean.replace(/\n/g, '<br/>')}</div>
        </div>
    `;
};

const ReportViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activityLog, setActivityLog, clearLog } = useEvaluationStore();
  
  const state = useMemo(() => location.state || {}, [location.state]);
  
  const [evaluationId, setEvaluationId] = useState(state.evaluationId);
  const [classId, setClassId] = useState(state.classId);
  const [loading, setLoading] = useState({ ai: false, save: false, init: true });
  const [reportHtml, setReportContent] = useState('');
  const [classData, setClassData] = useState(null);
  const hasSetInitialContent = React.useRef(false);

  const canonicalSections = [
    "Specific Activities", 
    "Student-Instructor Interactions", 
    "Content Focused Instructor Choices", 
    "Expectations for Student Behavior", 
    "Pacing", 
    "Affect", 
    "Speech & Delivery", 
    "Visuals & PPT"
  ];
  
  const sectionMapping = {
    "Specific Activities": "Specific Activities",
    "Student-Instructor Interactions": "Student-Instructor Interactions",
    "Content Focused Instructor Choices": "Content Focused Instructor Choices",
    "Expectations for Student Behavior": "Expectations for Student Behavior",
    "Pacing": "Pacing",
    "Affect": "Affect",
    "Speech & Delivery": "Speech & Delivery",
    "Visuals & PPT": "Visuals & PPT"
  };

  const genAI = useMemo(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    return apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }, []);

  const editor = useEditor({
    extensions: [StarterKit, Underline, TextAlign.configure({ types: ['heading', 'paragraph'] }), Link.configure({ openOnClick: false }), TextStyle, Color],
    content: '',
    onUpdate: ({ editor }) => setReportContent(editor.getHTML()),
    editorProps: { attributes: { class: 'tiptap-editor-content' } },
  });

  const constructFullReport = useCallback((cData, aiFbs) => {
    const observerName = `${user?.firstName || user?.firstname || ''} ${user?.lastName || user?.lastname || ''}`.trim();
    const ins = cData?.instructor;
    const instructorName = ins ? `${ins.firstName || ins.firstname || ''} ${ins.lastName || ins.lastname || ''}`.trim() : "Loading...";
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let html = `<h2>Teaching Evaluation Report</h2><hr/>`;
    html += `<h3>Observation Information</h3><p><strong>Instructor:</strong> ${instructorName}</p><p><strong>Date:</strong> ${dateStr}</p><p><strong>Time:</strong> ${timeStr}</p><p><strong>Class Topic:</strong> ${cData?.courseTitle || cData?.title || 'Loading...'}</p><p><strong>Observer:</strong> ${observerName}</p>`;
    html += `<h3>Background Information</h3><p><strong>Learning Goal/Objective:</strong><br/>${cData?.goal || 'Loading...'}</p><p><strong>Outline:</strong><br/>${cData?.outline || 'Loading...'}</p><hr/>`;
    html += `<h3>Observation Details</h3>`;

    const groupedData = {};
    canonicalSections.forEach(s => groupedData[s] = { observations: [], recommendations: [] });
    
    const obs = state.allObservations || [];
    const recs = state.allRecommendations || [];

    obs.forEach(section => {
      const normalized = section.title.replace(/^\d+\.\s*/, '');
      const target = sectionMapping[normalized];
      if (target) section.options.forEach(opt => { if (opt.selected) groupedData[target].observations.push({ text: opt.description, comment: opt.feedbackText }); });
    });

    recs.forEach(section => {
      const normalized = section.title.replace(/^\d+\.\s*/, '');
      const target = sectionMapping[normalized];
      if (target) section.options.forEach(rec => { if (rec.selected) groupedData[target].recommendations.push({ text: rec.description, comment: rec.feedbackText }); });
    });

    canonicalSections.forEach((sectionName, index) => {
      html += `<h4>${index + 1}. ${sectionName}</h4>`;
      if (sectionName === "Student-Instructor Interactions") {
        const validLogs = activityLog.filter(log => log.time.trim() || log.activity.trim());
        if (validLogs.length > 0) {
          html += `<p><strong>Activity Timeline:</strong></p><ul>`;
          validLogs.forEach(log => { html += `<li><strong>${log.time} ${log.period}</strong> — ${log.activity}</li>`; });
          html += `</ul>`;
        } else {
          html += `<p><em>No activities recorded in timeline.</em></p>`;
        }
      }
      html += `<p><strong>Observations:</strong></p>`;
      if (groupedData[sectionName].observations.length > 0) {
        html += `<ul>${groupedData[sectionName].observations.map(o => `<li>${o.text}${o.comment ? `<br/><em>Observation Note: ${o.comment}</em>` : ''}</li>`).join('')}</ul>`;
      } else { html += `<p>No observations recorded.</p>`; }
      html += `<p><strong>Recommendations:</strong></p>`;
      if (groupedData[sectionName].recommendations.length > 0) {
        html += `<ul>${groupedData[sectionName].recommendations.map(r => `<li>${r.text}${r.comment ? `<br/><em>Recommendation Note: ${r.comment}</em>` : ''}</li>`).join('')}</ul>`;
      } else { html += `<p>No recommendations recorded.</p>`; }
      if (aiFbs && aiFbs[sectionName]) html += aiFbs[sectionName];
      html += `<br/>`;
    });

    const addObs = (state.allObservations || []).find(r => r.title.includes('Additional Feedback'));
    const addRecs = (state.allRecommendations || []).find(r => r.title.includes('Additional Feedback'));
    const additional = addRecs || addObs;
    html += `<h3 style="color: #154734;">Additional Feedback</h3>`;
    ["Did the class session meet the instructor's goal or objective?", "Other Comments or Recommendations"].forEach(qText => {
      const opt = additional?.options?.find(o => o.description.includes(qText.split(' ')[0])); 
      const answer = opt?.feedbackText?.trim();
      html += `<h4>${qText}</h4>`;
      html += answer ? `<p style="color: #374151; line-height: 1.6; padding-left: 5px; margin-bottom: 20px;">${answer}</p>` : `<p style="color: #6b7280; font-style: italic; padding-left: 5px; margin-bottom: 20px;">No additional feedback provided.</p>`;
    });
    return html;
  }, [state, user, activityLog]);

  const handleRefresh = useCallback(() => {
    if (!editor) return;
    const currentHtml = constructFullReport(classData, {});
    editor.commands.setContent(currentHtml);
    setReportContent(currentHtml);
    toast.info("Timeline synced!");
  }, [editor, classData, constructFullReport]);

  // Unified Loader
  useEffect(() => {
    const init = async () => {
      if (!editor || hasSetInitialContent.current) return;
      try {
        if (state.reportId) {
          const reports = await reportApi.fetchReports();
          const myReport = reports.find(r => r.report_id === state.reportId);
          if (myReport) {
            if (!evaluationId) setEvaluationId(myReport.evaluation?.evaluation_id);
            if (!classId) setClassId(myReport.evaluation?.className?.class_id);
            if (myReport.reportContent) {
              editor.commands.setContent(myReport.reportContent);
              setReportContent(myReport.reportContent);
              hasSetInitialContent.current = true;
              setLoading(prev => ({ ...prev, init: false }));
              return;
            }
          }
        }
        if (!state.isReadOnly) {
          let cData = classData;
          if (!cData && (classId || state.classId)) {
            cData = await classApi.fetchClassDetails(classId || state.classId);
            setClassData(cData);
          }
          const html = constructFullReport(cData, {});
          editor.commands.setContent(html);
          setReportContent(html);
          hasSetInitialContent.current = true;
        }
      } catch (err) { console.error(err); }
      finally { setLoading(prev => ({ ...prev, init: false })); }
    };
    init();
  }, [editor, state.reportId, evaluationId, classId, state.isReadOnly, constructFullReport, classData, state.classId]);

  // REACTIVE LOG UPDATE
  useEffect(() => {
    if (editor && hasSetInitialContent.current && !state.isReadOnly) {
        // We only auto-update if the user hasn't made huge changes, 
        // but for now, let's just make it update whenever log changes as requested.
        const html = constructFullReport(classData, {});
        editor.commands.setContent(html);
        setReportContent(html);
    }
  }, [activityLog, editor, classData, constructFullReport, state.isReadOnly]);

  const handleSaveReport = async () => {
    if (!evaluationId || !editor) return;
    let html = editor.getHTML();
    const el = document.querySelector('.tiptap-editor-content');
    if (el && el.innerHTML.length > html.length) html = el.innerHTML;
    
    setLoading(prev => ({ ...prev, init: true }));
    try {
      const validLogs = activityLog.filter(log => log.time.trim() || log.activity.trim());
      if (validLogs.length > 0) await evaluationApi.updateActivityLog(evaluationId, validLogs);
      const doc = <ReportPdfDocument htmlContent={html} />;
      const blob = await pdf(doc).toBlob();
      await reportApi.savePdfReport(new File([blob], `Report_${evaluationId}.pdf`, { type: 'application/pdf' }), evaluationId, html);
      toast.success("Saved!");
      navigate('/reports');
    } catch (err) { toast.error("Error saving."); }
    finally { setLoading(prev => ({ ...prev, init: false })); }
  };

  return (
    <div id="evaluation-container-v3">
      <ActivityLog />
      <div className="container py-5">
        <div className="text-center mb-5">
          <h1 className="eval-page-heading">Final Report</h1>
          <p className="eval-page-subtext">Review and Edit</p>
        </div>
        <Card className="report-card shadow-sm mb-5">
          <div className="tiptap-editor-wrapper">
            <MenuBar editor={editor} onRefresh={handleRefresh} />
            <EditorContent editor={editor} />
            {loading.init && <div className="text-center p-4">Finalizing...</div>}
          </div>
        </Card>
        <div className="report-actions-footer">
          <Button onClick={() => navigate(-1)} className="btn-report-utility"><ArrowLeft /> BACK</Button>
          {!state.isReadOnly && <Button onClick={handleSaveReport} disabled={loading.init} className="btn-report-save"><Save /> SAVE REPORT</Button>}
          {reportHtml && (
            <PDFDownloadLink document={<ReportPdfDocument htmlContent={reportHtml} />} fileName="Report.pdf">
              <Button className="btn-report-utility">PDF</Button>
            </PDFDownloadLink>
          )}
          <Button onClick={() => generateWordReport(editor.getHTML())} className="btn-report-utility">WORD</Button>
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;
