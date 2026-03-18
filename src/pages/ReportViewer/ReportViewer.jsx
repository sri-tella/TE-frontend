import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Spinner, Card } from 'react-bootstrap';
import { 
  ArrowLeft, Save, FileEarmarkPdf, FileEarmarkWord, Robot,
  TypeBold, TypeItalic, TypeUnderline, ListUl, 
  TypeH3, TextLeft, TextCenter 
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
import { generateWordReport } from '../../utils/WordGenerator';
import { useAuthStore } from '../../store/authStore';
import { classApi } from '../../api/classApi';
import { reportApi } from '../../api/reportApi';
import './ReportViewer.css';

const MenuBar = ({ editor }) => {
  if (!editor) return null;
  return (
    <div className="tiptap-menubar">
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
    // Clean up markers
    let clean = text.replace(/\*\*/g, '').replace(/##/g, '').replace(/^\s*\* /gm, '');
    // Remove the category name itself from the start if it exists
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
  
  const state = useMemo(() => location.state || {}, [location.state]);
  
  const [evaluationId, setEvaluationId] = useState(state.evaluationId);
  const [classId, setClassId] = useState(state.classId);
  const [loading, setLoading] = useState({ ai: false, save: false, init: true });
  const [reportHtml, setReportContent] = useState('');
  const [classData, setClassData] = useState(null);

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
    const instructorName = ins 
      ? `${ins.firstName || ins.firstname || ''} ${ins.lastName || ins.lastname || ''}`.trim() 
      : "Loading...";
    
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
      if (target) {
        section.options.forEach(opt => {
          if (opt.selected) {
            groupedData[target].observations.push({ text: opt.description, comment: opt.feedbackText });
          }
        });
      }
    });

    recs.forEach(section => {
      const normalized = section.title.replace(/^\d+\.\s*/, '');
      const target = sectionMapping[normalized];
      if (target) {
        section.options.forEach(rec => {
          if (rec.selected) {
            groupedData[target].recommendations.push({ text: rec.description, comment: rec.feedbackText });
          }
        });
      }
    });

    canonicalSections.forEach((sectionName, index) => {
      html += `<h4>${index + 1}. ${sectionName}</h4>`;
      
      // Observations
      html += `<p><strong>Observations:</strong></p>`;
      if (groupedData[sectionName].observations.length > 0) {
        html += `<ul>${groupedData[sectionName].observations.map(o => 
          `<li>${o.text}${o.comment ? `<br/><em>Observation Note: ${o.comment}</em>` : ''}</li>`
        ).join('')}</ul>`;
      } else {
        html += `<p>No observations recorded.</p>`;
      }

      // Recommendations
      html += `<p><strong>Recommendations:</strong></p>`;
      if (groupedData[sectionName].recommendations.length > 0) {
        html += `<ul>${groupedData[sectionName].recommendations.map(r => 
          `<li>${r.text}${r.comment ? `<br/><em>Recommendation Note: ${r.comment}</em>` : ''}</li>`
        ).join('')}</ul>`;
      } else {
        html += `<p>No recommendations recorded.</p>`;
      }

      // AI Analysis for this section
      if (aiFbs && aiFbs[sectionName]) {
        html += aiFbs[sectionName];
      }
      
      html += `<br/>`;
    });

    // Additional Feedback (Section 9)
    const additionalObs = (state.allObservations || []).find(r => r.title.includes('Additional Feedback'));
    const additionalRecs = (state.allRecommendations || []).find(r => r.title.includes('Additional Feedback'));
    const additional = additionalRecs || additionalObs;

    html += `<h3 style="color: #154734;">Additional Feedback</h3>`;
    
    const standardQuestions = [
      "Did the class session meet the instructor's goal or objective?",
      "Other Comments or Recommendations"
    ];

    standardQuestions.forEach(qText => {
      const opt = additional?.options?.find(o => o.description.includes(qText.split(' ')[0])); 
      const answer = opt?.feedbackText?.trim();
      
      // h4 already has the "gray block + green border" style in CSS
      html += `<h4>${qText}</h4>`;
      if (answer) {
        html += `<p style="color: #374151; line-height: 1.6; padding-left: 5px; margin-bottom: 20px;">${answer}</p>`;
      } else {
        html += `<p style="color: #6b7280; font-style: italic; padding-left: 5px; margin-bottom: 20px;">No additional feedback provided.</p>`;
      }
    });
    
    return html;
  }, [state, user]);

  // Load report data if we only have reportId
  useEffect(() => {
    const fetchReportInfo = async () => {
      if (state.reportId && !evaluationId) {
        try {
          const reports = await reportApi.fetchReports();
          const myReport = reports.find(r => r.report_id === state.reportId);
          if (myReport) {
            setEvaluationId(myReport.evaluation?.evaluation_id);
            setClassId(myReport.evaluation?.className?.class_id);
          }
        } catch (err) {
          console.error("Failed to fetch report info:", err);
        }
      }
    };
    fetchReportInfo();
  }, [state.reportId, evaluationId]);

  // Initial Content Setup
  useEffect(() => {
    if (!evaluationId && !state.reportId) { navigate('/obs-home'); return; }
    if (editor && !classData && (state.allObservations?.length > 0)) {
        const initialContent = constructFullReport(null, {});
        editor.commands.setContent(initialContent);
    }
  }, [editor, evaluationId, state, navigate, constructFullReport, classData]);

  // Async Data Fetch
  useEffect(() => {
    const loadData = async () => {
      if (!classId) return;
      try {
        const data = await classApi.fetchClassDetails(classId);
        setClassData(data);
        if (editor) {
            editor.commands.setContent(constructFullReport(data, {}));
        }
      } catch (err) { toast.error("Error loading details."); }
      finally { setLoading(prev => ({ ...prev, init: false })); }
    };
    loadData();
  }, [classId, editor, constructFullReport]);

  const handleAiAnalysis = async () => {
    if (!genAI || !classData) return;
    setLoading(prev => ({ ...prev, ai: true }));
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const groupedForAi = {};
        canonicalSections.forEach(s => groupedForAi[s] = []);
        (state.allObservations || []).forEach(section => {
            const normalized = section.title.replace(/^\d+\.\s*/, '');
            const target = sectionMapping[normalized];
            if (target) section.options.forEach(opt => {
              if (opt.selected) groupedForAi[target].push(opt.description);
            });
        });
        
        const sectionsToAnalyze = Object.keys(groupedForAi)
          .filter(cat => groupedForAi[cat].length > 0)
          .map(cat => `${cat}: ${groupedForAi[cat].join('; ')}`)
          .join('\n\n');

        if (!sectionsToAnalyze) {
          toast.info("No observations selected for AI analysis.");
          setLoading(prev => ({ ...prev, ai: false }));
          return;
        }

        const res = await model.generateContent(`
            Perform a pedagogical analysis for the following observations from a SINGLE class session.
            
            Observations:
            ${sectionsToAnalyze}
            
            Instructions for your response:
            1. Provide a detailed analysis for EACH category provided above.
            2. For each category, start with the exact category name followed by a colon (e.g., "Specific Activities:").
            3. Produce ONLY prose paragraphs. 
            4. Do NOT use bullet points or numbered lists.
            5. Address the instructor in the SECOND PERSON (use "you", "your").
            6. Keep the tone professional, encouraging, and focused on this specific class session.
        `);

        const fullText = res.response.text();
        const newAiFeedbacks = {};
        
        canonicalSections.forEach(cat => {
            const catEscaped = cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`${catEscaped}[:\\-]?\\s*([\\s\\S]*?)(?=\\n+(?:${canonicalSections.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})[:\\-]?|$)`, 'i');
            const match = fullText.match(regex);
            if (match && match[1].trim()) {
                newAiFeedbacks[cat] = formatAiResponse(match[1].trim(), cat);
            }
        });

        editor.commands.setContent(constructFullReport(classData, newAiFeedbacks));
        toast.success("AI Analysis generated!");
    } catch (err) { 
        console.error("AI Analysis error:", err);
        toast.error("AI Analysis failed."); 
    }
    finally { setLoading(prev => ({ ...prev, ai: false })); }
  };

  const handleSaveReport = async () => {
    if (!evaluationId || !reportHtml) {
      toast.error("Evaluation ID or report content is missing.");
      return;
    }

    setLoading(prev => ({ ...prev, init: true }));
    try {
      const doc = <ReportPdfDocument htmlContent={reportHtml} />;
      const blob = await pdf(doc).toBlob();
      const file = new File([blob], `Evaluation_Report_${evaluationId}.pdf`, { type: 'application/pdf' });
      await reportApi.savePdfReport(file, evaluationId);
      toast.success("Report saved successfully!");
      navigate('/reports');
    } catch (err) {
      console.error("Failed to save report:", err);
      toast.error("Failed to save report.");
    } finally {
      setLoading(prev => ({ ...prev, init: false }));
    }
  };

  return (
    <>
      {loading.ai && (
        <div className="report-ai-overlay">
          <div className="ai-analyzing-box">
            <div className="ai-spinner-v3"></div>
            <h2 className="ai-analyzing-text">Analyzing</h2>
          </div>
        </div>
      )}
      <div id="evaluation-container-v3">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h1 className="eval-page-heading">Final Report</h1>
            <p className="eval-page-subtext">Review, Edit, and Export</p>
          </div>
          <Card className="report-card shadow-sm mb-5">
            <div className="tiptap-editor-wrapper">
                <MenuBar editor={editor} />
                <EditorContent editor={editor} />
                {loading.init && <div className="text-center p-4 text-muted small"><Spinner size="sm" animation="border" className="me-2"/> Finalizing details...</div>}
            </div>
          </Card>
          <div className="report-actions-footer">
            <Button onClick={() => navigate(-1)} className="btn-report-utility"><ArrowLeft /> BACK</Button>
            {!state.isReadOnly && <Button onClick={handleAiAnalysis} disabled={loading.ai || loading.init} className="btn-report-utility"><Robot /> AI FEEDBACK</Button>}
            {!state.isReadOnly && <Button onClick={handleSaveReport} disabled={loading.ai || loading.init} className="btn-report-save"><Save className="me-2" /> SAVE REPORT</Button>}
            {reportHtml && (
              <PDFDownloadLink document={<ReportPdfDocument htmlContent={reportHtml} />} fileName="Report.pdf" style={{ textDecoration: 'none' }}>
                {({ loading: pL }) => <Button className="btn-report-utility" disabled={pL}><FileEarmarkPdf /> PDF</Button>}
              </PDFDownloadLink>
            )}
            <Button onClick={() => generateWordReport(editor.getHTML())} className="btn-report-utility"><FileEarmarkWord /> WORD</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportViewer;
