import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card } from 'react-bootstrap';
import {
  ArrowLeft, Save, FileEarmarkPdf, Robot,
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
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'react-toastify';
import { Node, mergeAttributes } from '@tiptap/core';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';

// Preserves class attribute on <ul> / <ol> (e.g. red-bullets) across TipTap roundtrips
const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: el => el.getAttribute('class'),
        renderHTML: attrs => attrs.class ? { class: attrs.class } : {},
      },
    };
  },
});

const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: el => el.getAttribute('class'),
        renderHTML: attrs => attrs.class ? { class: attrs.class } : {},
      },
    };
  },
});

// Custom Div extension to allow structured HTML with classes
const Div = Node.create({
  name: 'div',
  group: 'block',
  content: 'block*',
  addAttributes() {
    return {
      class: { default: null },
      style: { default: null },
    };
  },
  parseHTML() { return [{ tag: 'div' }]; },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes), 0]; },
});

const AI_MESSAGES = [
  'Analyzing observations...',
  'Generating insights...',
  'Processing recommendations...',
  'Composing feedback...',
  'Almost there...',
];

const AiLoadingOverlay = () => {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMsgIdx(i => (i + 1) % AI_MESSAGES.length), 2500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="report-ai-overlay">
      <div className="ai-analyzing-box">
        <div className="ai-spinner-v3" />
        <span className="ai-analyzing-text">{AI_MESSAGES[msgIdx]}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          This may take up to 30 seconds
        </span>
      </div>
    </div>
  );
};

import ReportPdfDocument from '../../components/Report/ReportPdfDocument';
import ProgressStepper from '../../components/ProgressStepper/ProgressStepper';
import ActivityLog from '../../components/ActivityLog/ActivityLog.jsx';
import InlineEdit from '../../components/InlineEdit/InlineEdit.jsx';
import { useRoles } from '../../hooks/useRoles';
import { useEvaluationStore } from '../../store/evaluationStore';
import { generateWordReport } from '../../utils/WordGenerator';
import { useAuthStore } from '../../store/authStore';
import { classApi } from '../../api/classApi';
import { reportApi } from '../../api/reportApi';
import { evaluationApi } from '../../api/evaluationApi';
import { storageKeys } from '../../utils/storageKeys';
import './ReportViewer.css';

// Maps each app section_id to the corresponding document category
const DOC_SECTIONS = [
  {
    name: "Introduction",
    question: "In what ways did the introduction capture your (and students') interest? How were the first few minutes of class related to the purpose of the class session overall?",
    sectionIds: [41, 34]
  },
  {
    name: "Organization",
    question: "How was the class time organized? How were materials used? Were transitions between activities or materials clear and effective?",
    sectionIds: [26, 37, 38]
  },
  {
    name: "Content",
    question: "How well did the instructor demonstrate thorough understanding of the content? Did the instructor support his or her points? How was the instructor's level of content competence related to students' learning?",
    sectionIds: [30, 44, 50, 51]
  },
  {
    name: "Visual Aids and Technology",
    question: "How were visual aids used? How was technology used? Were the visual aids/technology appropriate for the lesson and context? How did the visual aids/technology enhance or improve the learning process?",
    sectionIds: [52, 54, 55, 56, 57, 58, 59]
  },
  {
    name: "Delivery",
    question: "Was the instructor's teaching persona effective? Consider tone and volume of voice, gestures, posture, and expressions. What strengths of delivery did you observe? Any recommendations in the area of delivery?",
    sectionIds: [2, 4, 9, 11, 36, 40, 43, 45, 48, 49]
  },
  {
    name: "Activities",
    question: "How did the instructor encourage student participation or create the environment for students to participate? How well did these activities relate to the goal, objective, or purpose of the class session? How well did the instructor direct students' behavior to promote learning? How did the instructor engage with or respond to student's contributions?",
    sectionIds: [8, 16, 18, 21, 22, 23, 27, 42, 47]
  },
  {
    name: "Student Behavior",
    question: "How engaged were students in the class session? Did students seem to be aware of the learning goal, objective, or purpose of the class session? In what ways did students interact with the professor and each other? How would you describe the attitude of students?",
    sectionIds: [1, 3, 5, 7, 10, 12, 13, 14, 15, 19, 20, 31, 32, 33]
  },
  {
    name: "Conclusion",
    question: "Did the instructor end the class session effectively? Did he/she summarize key points? Leave time for questions? Tease the next topic?",
    sectionIds: [6, 28]
  }
];

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
            <strong style="color: #1a2535; font-size: 11pt; display: block; margin-bottom: 8px;">AI Analysis</strong>
            <div style="font-size: 10.5pt; color: #374151; line-height: 1.6;">${clean.replace(/\n/g, '<br/>')}</div>
        </div>
    `;
};

const formatAiSubBlock = (text, label) => {
    if (!text) return '';
    const clean = text.replace(/\*\*/g, '').replace(/##/g, '').trim();
    return `
        <div class="ai-sub-block" style="margin: 6px 0 4px 20px; padding: 7px 12px; background: #f5f9ff; border-left: 3px solid #2dd4bf; border-radius: 0 6px 6px 0;">
            <strong style="color: #1a2535; font-size: 10pt; display: block; margin-bottom: 4px;">${label}</strong>
            <div style="font-size: 10pt; color: #374151; line-height: 1.55;">${clean.replace(/\n/g, '<br/>')}</div>
        </div>
    `;
};

const ReportViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { canEdit } = useRoles();
  const { activityLog, setActivityLog, clearLog } = useEvaluationStore();
  
  const state = useMemo(() => location.state || {}, [location.state]);
  
  const [evaluationId, setEvaluationId] = useState(state.evaluationId);
  const [classId, setClassId] = useState(state.classId);
  const [loading, setLoading] = useState({ ai: false, save: false, init: true });
  const [reportHtml, setReportContent] = useState('');
  const [classData, setClassData] = useState(null);
  const hasSetInitialContent = React.useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { HTMLAttributes: { class: 'custom-heading' } },
        paragraph: { HTMLAttributes: { class: 'custom-para' } },
        bulletList: false,
        orderedList: false,
      }),
      CustomBulletList,
      CustomOrderedList,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph', 'div'] }),
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
      Div,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    onUpdate: ({ editor }) => setReportContent(editor.getHTML()),
    editorProps: { 
        attributes: { class: 'tiptap-editor-content' },
        handlePaste: () => false, // Default paste behavior
    },
  });

  const constructFullReport = useCallback((cData, aiFbs, aiObsMap = {}, aiRecMap = {}) => {
    const observerName = `${user?.firstName || user?.firstname || ''} ${user?.lastName || user?.lastname || ''}`.trim() || user?.email || '—';
    const ins = cData?.instructor;
    const instructorName = ins ? `${ins.firstName || ins.firstname || ''} ${ins.lastName || ins.lastname || ''}`.trim() : '—';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const allObs = state.allObservations || [];
    const allRecs = state.allRecommendations || [];
    const obsFlat = allObs.flatMap(s => s.options);
    const recsFlat = allRecs.flatMap(s => s.options);

    let html = `<h1>Teaching Observation Form</h1>`;

    // ── Section: Observation Information ──────────────────────────────────
    html += `
        <div class="section-header">Observation Information</div>
        <div class="form-row">
            <div class="form-label">Instructor:</div>
            <div>${instructorName}</div>
        </div>
        <div class="indent-group">
            <div class="indent-row">
                <div class="indent-label">Date of Observation: ${dateStr}</div>
                <div>Time: ${timeStr}</div>
            </div>
            <div class="indent-row">
                <div class="indent-label" style="line-height: 1.1;">Class Session Topic or<br>Course Subject:</div>
                <div>${cData?.courseTitle || cData?.title || '—'}</div>
            </div>
        </div>
        <div class="form-row" style="margin-top: 20px;">
            <div class="form-label">Observer:</div>
            <div>${observerName}</div>
        </div>
    `;

    // ── Section: Background Information ───────────────────────────────────
    html += `
        <div class="section-header">Background Information</div>
        <div class="instruction-text">To be provided by the instructor for the observer prior to scheduled observation.</div>
        <ol>
            <li>What is the learning goal or objective for today’s class session?
                <div>${cData?.goal || '<em>Not specified</em>'}</div>
            </li>
            <li>Please provide a brief outline or sketch of how the class session will proceed; for example, “mini-lecture; small group activity; mini-lecture; quiz; review.”
                <div>${cData?.outline || '<em>Not specified</em>'}</div>
            </li>
            <li>How might the observer be particularly helpful in the observation process? Are there elements of the class session that might benefit from detailed feedback or focused attention; e.g., class activities, facilitation of discussion, or assessment strategies?
                <div class="question-space"></div>
            </li>
        </ol>
    `;

    const validLogs = activityLog.filter(log => log.time.trim() || log.activity.trim());

    // ── Section: Observation ──────────────────────────────────────────────
    html += `
        <div class="section-header">Observation</div>
        <div class="normal-italic" style="font-weight: bold;">Please comment on the instructor’s effectiveness in each of the following eight categories. Use specific examples when possible. Use #10 below to make additional suggestions and additional statements may be attached.</div>
        <ol>
    `;

    DOC_SECTIONS.forEach((docSec, idx) => {
      const selectedObs = obsFlat.filter(o => docSec.sectionIds.includes(o.section_id) && o.selected);
      const selectedRecs = recsFlat.filter(r =>
        r.selected && selectedObs.some(o => o.description === r.observedDescription)
      );

      // Question text from DOC_SECTIONS
      html += `<li><u>${docSec.name}:</u> ${docSec.question}`;

      // Activity log injected under Organization
      if (docSec.name === 'Organization' && validLogs.length > 0) {
        html += '<div style="margin-left: 20px; margin-top: 8px;">';
        validLogs.forEach(log => {
          html += `<p style="margin: 2px 0;"><strong>${log.time} ${log.period}</strong> — ${log.activity}</p>`;
        });
        html += '</div>';
      }

      // Content for the category
      if (selectedObs.length > 0) {
        html += '<div style="margin-left: 20px; margin-top: 8px;">';
        html += '<p style="margin-bottom: 4px;"><em>Observations:</em></p>';
        html += '<ul class="red-bullets">';
        selectedObs.forEach(obs => {
          html += `<li><span style="color: red;">${obs.description}</span></li>`;
          if (obs.feedbackText?.trim()) {
            html += `<li style="list-style:none; margin-left: -20px;"><span style="color:#888888"><em>↳ ${obs.feedbackText}</em></span></li>`;
          }
        });
        html += '</ul>';
        html += '</div>';
        if (aiObsMap[docSec.name]) {
          html += formatAiSubBlock(aiObsMap[docSec.name], 'Observations (AI):');
        }
      }

      if (selectedRecs.length > 0) {
        html += '<div style="margin-left: 20px; margin-top: 8px;">';
        html += '<p style="margin-bottom: 4px;"><em>Recommendations:</em></p><ul>';
        selectedRecs.forEach(rec => {
          html += `<li>${rec.description}</li>`;
          if (rec.feedbackText?.trim()) {
            html += `<li style="list-style:none; margin-left: -20px;"><span style="color:#888888"><em>↳ ${rec.feedbackText}</em></span></li>`;
          }
        });
        html += '</ul>';
        html += '</div>';
        if (aiRecMap[docSec.name]) {
          html += formatAiSubBlock(aiRecMap[docSec.name], 'Recommendations (AI):');
        }
      }

      if (aiFbs && aiFbs[docSec.name]) {
          html += aiFbs[docSec.name];
      }

      html += `</li>`;
    });

    html += `</ol>`;

    // ── Section: Additional Feedback ─────────────────────────────────────
    html += `<div class="section-header">Additional Feedback</div>`;
    html += `<ol start="9">`;
    
    const addObs = allObs.find(r => r.title.includes('Additional Feedback'));
    const addRecs = allRecs.find(r => r.title.includes('Additional Feedback'));
    const additional = addRecs || addObs;
    
    [
      { key: 'Did',   label: "Did the class session meet the instructor's goal or objective (if a goal or objective was identified)? What other responses do you have regarding the class goal or objective?" },
      { key: 'Other', label: "Other comments or recommendations:" }
    ].forEach(({ key, label }) => {
      const opt = additional?.options?.find(o => o.description.includes(key));
      const answer = opt?.feedbackText?.trim();
      html += `<li>${label} ${answer ? `<p>${answer}</p>` : '<div class="question-space"></div>'}</li>`;
    });

    html += `</ol>`;

    return html;
  }, [state, user, activityLog]);

  const handleRefresh = useCallback(() => {
    if (!editor) return;
    const currentHtml = constructFullReport(classData, {});
    editor.commands.setContent(currentHtml);
    setReportContent(currentHtml);
    toast.info("Timeline synced!");
  }, [editor, classData, constructFullReport]);

  const handleAiFeedback = useCallback(async () => {
    setLoading(prev => ({ ...prev, ai: true }));

    const buildSections = () => {
      const obs = state.allObservations?.length
        ? state.allObservations
        : JSON.parse(localStorage.getItem(storageKeys.evalResponses(evaluationId)) || '[]');
      const recs = state.allRecommendations?.length
        ? state.allRecommendations
        : JSON.parse(localStorage.getItem(storageKeys.recsData(evaluationId)) || '[]');
      const obsFlat = obs.flatMap(s => s.options);
      const recsFlat = recs.flatMap(s => s.options);
      return DOC_SECTIONS.map(docSec => {
        const selectedObs = obsFlat.filter(o => docSec.sectionIds.includes(o.section_id) && o.selected);
        const selectedRecs = recsFlat.filter(r =>
          r.selected && selectedObs.some(o => o.description === r.observedDescription)
        );
        return {
          sectionName: docSec.name,
          selected: selectedObs.map(o => ({
            description: o.description,
            note: o.feedbackText?.trim() || '',
          })),
          recSelected: selectedRecs.map(r => ({
            description: r.description,
            note: r.feedbackText?.trim() || '',
          })),
        };
      });
    };

    const attemptFetch = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 55_000);
      try {
        const res = await fetch('/.netlify/functions/ai-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sections: buildSections() }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`AI request failed (${res.status})`);
        return res.json();
      } finally {
        clearTimeout(timer);
      }
    };

    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 2500));
        const { feedbacks = {}, obsAnalysis = {}, recAnalysis = {} } = await attemptFetch();
        const aiFeedbacks = {};
        for (const [sectionName, text] of Object.entries(feedbacks)) {
          aiFeedbacks[sectionName] = formatAiResponse(text, sectionName);
        }
        const newHtml = constructFullReport(classData, aiFeedbacks, obsAnalysis, recAnalysis);
        editor.commands.setContent(newHtml);
        setReportContent(newHtml);
        toast.success('AI analysis added!');
        setLoading(prev => ({ ...prev, ai: false }));
        return;
      } catch (err) {
        lastErr = err;
      }
    }

    console.error('[AI feedback]', lastErr);
    toast.error('AI generation failed. Please try again.');
    setLoading(prev => ({ ...prev, ai: false }));
  }, [state, classData, editor, constructFullReport, evaluationId]);

  // Unified Loader
  useEffect(() => {
    const init = async () => {
      if (!editor || hasSetInitialContent.current) return;
      try {
        let resolvedClassId = classId || state.classId;

        if (state.reportId) {
          const reports = await reportApi.fetchReports();
          const myReport = reports.find(r => r.report_id === state.reportId);
          if (myReport) {
            if (!evaluationId) setEvaluationId(myReport.evaluation?.evaluation_id);
            resolvedClassId = resolvedClassId || myReport.evaluation?.className?.class_id;
            if (!classId) setClassId(resolvedClassId);
            if (myReport.reportContent) {
              editor.commands.setContent(myReport.reportContent);
              setReportContent(myReport.reportContent);
              hasSetInitialContent.current = true;
              setLoading(prev => ({ ...prev, init: false }));
              return;
            }
          }
        }

        // Build report from scratch (new evaluation OR read-only with no saved content)
        let cData = classData;
        if (!cData && resolvedClassId) {
          cData = await classApi.fetchClassDetails(resolvedClassId);
          setClassData(cData);
        }
        if (cData) {
          const html = constructFullReport(cData, {});
          editor.commands.setContent(html);
          setReportContent(html);
          hasSetInitialContent.current = true;
        }
      } catch (err) {
        toast.error('Failed to load report.');
      } finally {
        setLoading(prev => ({ ...prev, init: false }));
      }
    };
    init();
  }, [editor, state.reportId, evaluationId, classId, state.isReadOnly, constructFullReport, classData, state.classId]);

  // REACTIVE LOG UPDATE — only when classData is loaded to prevent overwriting with "Loading..."
  useEffect(() => {
    if (editor && hasSetInitialContent.current && !state.isReadOnly && classData) {
      const html = constructFullReport(classData, {});
      editor.commands.setContent(html);
      setReportContent(html);
    }
  }, [activityLog, editor, classData, constructFullReport, state.isReadOnly]);

  const handlePdfDownload = async () => {
    if (!editor) return;
    try {
      const blob = await pdf(<ReportPdfDocument htmlContent={editor.getHTML()} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Report.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to generate PDF');
    }
  };

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
      {loading.init && (
        <div className="report-ai-overlay">
          <div className="ai-analyzing-box">
            <div className="ai-spinner-v3" />
            <span className="ai-analyzing-text">Building Report</span>
          </div>
        </div>
      )}
      {loading.ai && <AiLoadingOverlay />}
      <ActivityLog />
      <div className="container py-5">
        <ProgressStepper currentStep={3} />
        <div className="text-center mb-4">
          <h1 className="eval-page-heading">Final Report</h1>
          <p className="eval-page-subtext">Review and Edit</p>
        </div>
        <div className="guide-cards mb-4">
          <div className="guide-card">
            <FileEarmarkPdf className="guide-card-icon guide-card-icon--bounce" />
            <InlineEdit pageKey="report-guide-card1-label" defaultValue="About this report" canEdit={canEdit} tag="p" className="guide-card-label" />
            <InlineEdit pageKey="report-guide-p1" defaultValue="This page assembles everything into a complete, formatted evaluation document — the kind of document that would be printed or sent to the instructor." canEdit={canEdit} tag="p" className="guide-para" />
          </div>
          <div className="guide-card">
            <ListUl className="guide-card-icon guide-card-icon--pulse" />
            <InlineEdit pageKey="report-guide-card2-label" defaultValue="The report contains:" canEdit={canEdit} tag="p" className="guide-card-label" />
            <ul className="guide-list">
              <li><InlineEdit pageKey="report-guide-item-1" defaultValue="A university logo header." canEdit={canEdit} /></li>
              <li><InlineEdit pageKey="report-guide-item-2" defaultValue="Observation information: instructor name, observer name, date, time, course topic." canEdit={canEdit} /></li>
              <li><InlineEdit pageKey="report-guide-item-3" defaultValue="Background information: the learning goal and class outline the instructor shared before the observation." canEdit={canEdit} /></li>
            </ul>
          </div>
          <div className="guide-card">
            <Robot className="guide-card-icon guide-card-icon--wobble" />
            <InlineEdit pageKey="report-guide-card3-label" defaultValue="What you can do:" canEdit={canEdit} tag="p" className="guide-card-label" />
            <ul className="guide-list">
              <li><InlineEdit pageKey="report-guide-action-1" defaultValue="Edit any section of the report directly in the editor below." canEdit={canEdit} /></li>
              <li><InlineEdit pageKey="report-guide-action-2" defaultValue="Download as PDF for printing or sending to the instructor." canEdit={canEdit} /></li>
              <li><InlineEdit pageKey="report-guide-action-3" defaultValue="Use AI Analysis to generate written feedback automatically." canEdit={canEdit} /></li>
            </ul>
          </div>
        </div>
        <Card className="report-card shadow-sm mb-5">
          <div className="tiptap-editor-wrapper">
            <MenuBar editor={editor} onRefresh={handleRefresh} />
            <EditorContent editor={editor} />
          </div>
        </Card>
        <div className="report-actions-footer">
          <Button onClick={() => navigate(-1)} className="btn-report-utility"><ArrowLeft /> BACK</Button>
          {!state.isReadOnly && (
            <>
              <Button onClick={handleAiFeedback} disabled={loading.ai || loading.init} className="btn-report-utility">
                <Robot /> AI FEEDBACK
              </Button>
              <Button onClick={handleSaveReport} disabled={loading.init} className="btn-report-save"><Save /> SAVE REPORT</Button>
            </>
          )}
          <Button onClick={handlePdfDownload} disabled={loading.init} className="btn-report-utility"><FileEarmarkPdf /> PDF</Button>
          <Button onClick={() => generateWordReport(editor.getHTML())} className="btn-report-utility">WORD</Button>
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;
