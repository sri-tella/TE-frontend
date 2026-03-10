import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert, Card } from 'react-bootstrap';
import { ArrowLeft, Save, FileEarmarkPdf, FileEarmarkWord, Robot } from 'react-bootstrap-icons';
import Header from '../../components/Header/header';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import './mainform.css';
import './tiptapStyle.css';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_BASE_URL } from '../../constants';
import { classService, reportService } from '../../services/apiService';
import ReportPdfDocument from './ReportPdfDocument';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { generateWordReport } from './WordGenerator';

const withMinDelay = async (task, delay = 800) => {
    const start = Date.now();
    try {
        const result = await task();
        const elapsed = Date.now() - start;
        if (elapsed < delay) await new Promise(resolve => setTimeout(resolve, delay - elapsed));
        return result;
    } catch (error) {
        const elapsed = Date.now() - start;
        if (elapsed < delay) await new Promise(resolve => setTimeout(resolve, delay - elapsed));
        throw error;
    }
};

const formatAiResponse = (text) => {
    if (!text) return '';
    let cleanRaw = text.replace(/\*\*/g, '').replace(/##/g, '').replace(/^\s*\* /gm, '');
    cleanRaw = cleanRaw.replace(/\(?Institutional AI Analysis\)?[:\-]?/gi, '').trim();

    const sections = cleanRaw.split(/Recommendations for Improvement|Recommendations/i);
    const obsPart = sections[0]
        .replace(/Key Observations|Observations/i, '')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .join('<br/>');
        
    const recPart = sections[1]
        ?.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .join('<br/>') || '';

    return `
        <div style="margin: 15px 0; padding: 10px; border-radius: 8px; background-color: #f0fdf4; border: 1px solid #d1fae5;">
            <div style="margin-bottom: 8px;">
                <strong style="color: #003015; font-size: 11pt; display: block; margin-bottom: 4px;">Institutional AI Analysis: Observations</strong>
                <div style="font-size: 10.5pt; color: #374151; line-height: 1.5;">${obsPart}</div>
            </div>
            ${recPart ? `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #d1fae5;">
                <strong style="color: #003015; font-size: 11pt; display: block; margin-bottom: 4px;">Institutional AI Analysis: Recommendations</strong>
                <div style="font-size: 10.5pt; color: #374151; line-height: 1.5;">${recPart}</div>
            </div>` : ''}
        </div>
    `;
};

const MenuBar = ({ editor }) => {
    if (!editor) return null;
    return (
        <div className="tiptap-menubar bg-light border-bottom p-2 d-flex flex-wrap gap-1 rounded-top">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`btn btn-sm ${editor.isActive('bold') ? 'btn-dark' : 'btn-outline-secondary'}`} type="button"><strong>B</strong></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`btn btn-sm ${editor.isActive('italic') ? 'btn-dark' : 'btn-outline-secondary'}`} type="button"><em>I</em></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`btn btn-sm ${editor.isActive('underline') ? 'btn-dark' : 'btn-outline-secondary'}`} type="button"><u>U</u></button>
            <span className="mx-1 border-left" />
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`btn btn-sm ${editor.isActive('heading', { level: 2 }) ? 'btn-dark' : 'btn-outline-secondary'}`} type="button">H2</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`btn btn-sm ${editor.isActive('heading', { level: 3 }) ? 'btn-dark' : 'btn-outline-secondary'}`} type="button">H3</button>
            <span className="mx-1 border-left" />
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`btn btn-sm ${editor.isActive('bulletList') ? 'btn-dark' : 'btn-outline-secondary'}`} type="button">• List</button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`btn btn-sm ${editor.isActive('orderedList') ? 'btn-dark' : 'btn-outline-secondary'}`} type="button">1. List</button>
            <span className="mx-1 border-left" />
            <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`btn btn-sm ${editor.isActive({ textAlign: 'left' }) ? 'btn-dark' : 'btn-outline-secondary'}`} type="button">Left</button>
            <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`btn btn-sm ${editor.isActive({ textAlign: 'center' }) ? 'btn-dark' : 'btn-outline-secondary'}`} type="button">Center</button>
        </div>
    );
};

const ReportViewer = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [reportContent, setReportContent] = useState('');
    const editorRef = useRef(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [backgroundInfo, setBackgroundInfo] = useState({ goal: '', help: '', outline: '' });
    const [structuredData, setStructuredData] = useState(null);
    const [aiFeedbacks, setAiFeedbacks] = useState({});
    const [loading, setLoading] = useState({ ai: false, save: false, pdf: false, doc: false, init: true });
    
    // Состояние для данных сохранения (чтобы работало и из истории)
    const [saveData, setSaveData] = useState({
        observerId: null,
        instructorId: null,
        classId: null,
        recommendations: []
    });

    const setLoadingState = (key, value) => setLoading(prev => ({ ...prev, [key]: value }));

    const genAI = useMemo(() => {
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        return apiKey ? new GoogleGenerativeAI(apiKey) : null;
    }, []);

    const editor = useEditor({
        extensions: [StarterKit, Underline, TextAlign.configure({ types: ['heading', 'paragraph'] }), Link.configure({ openOnClick: false }), TextStyle, Color],
        content: reportContent,
        onUpdate: ({ editor }) => setReportContent(editor.getHTML()),
        editorProps: { attributes: { class: 'tiptap-editor-content' } },
    });

    useEffect(() => { editorRef.current = editor; }, [editor]);

    const generateReportContent = useCallback((data, aiFbs, bgInfo) => {
        if (!data || !data.sections) return '';
        const { sections, feedbacks = {} } = data;
        const observerName = `${localStorage.getItem('firstName') || ''} ${localStorage.getItem('lastName') || ''}`.trim();
        const instructor = JSON.parse(localStorage.getItem('selectedInstructor') || '{}');
        const instructorName = data.instructorName || `${instructor.instructorFirstName || ''} ${instructor.instructorLastName || ''}`.trim();
        const classTopic = data.courseTitle || instructor?.courseTitle || '';
        const now = new Date();
        const formattedDate = now.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const manualOrder = ["Introduction", "Organization", "Content", "Visual Aids and Technology", "Delivery", "Activities", "Student Behavior", "Conclusion"];
        const categoryQuestions = {
            "Introduction": "Introduction",
            "Organization": "Organization",
            "Content": "Content",
            "Visual Aids and Technology": "Visual Aids and Technology",
            "Delivery": "Delivery",
            "Activities": "Activities",
            "Student Behavior": "Student Behavior",
            "Conclusion": "Conclusion"
        };

        const renderRecommendationsList = (items) => {
            if (!items || items.length === 0) return '<p><em>No recommendations recorded.</em></p>';
            return `<ul>${items.map(item => {
                let content = item.description || item;
                return `<li>${content}</li>`;
            }).join('')}</ul>`;
        };

        const renderObservationsList = (items, recommendations) => {
            if (!items || items.length === 0) return '<p><em>No observations recorded.</em></p>';
            return `<ul>${items.map(obsText => {
                // Find if there's a comment for this observation in the recommendations array
                const relatedRec = recommendations.find(r => r.observedDescription === obsText);
                const comment = relatedRec?.feedbackText ? `<br/><em><small>&nbsp;&nbsp;(Comment: ${relatedRec.feedbackText})</small></em>` : '';
                return `<li>${obsText}${comment}</li>`;
            }).join('')}</ul>`;
        };

        let report = `<h2>Teaching Evaluation Report</h2><hr/><h3>Observation Information</h3><p><strong>Instructor:</strong> ${instructorName}</p><p><strong>Date:</strong> ${formattedDate}</p><p><strong>Time:</strong> ${formattedTime}</p><p><strong>Class Topic:</strong> ${classTopic}</p><p><strong>Observer:</strong> ${observerName}</p><h3>Background Information</h3><p><strong>Learning Goal/Objective:</strong><br>${bgInfo.goal || 'N/A'}</p><p><strong>Outline:</strong><br>${bgInfo.outline || 'N/A'}</p><h3>Observation Details</h3>`;

        manualOrder.forEach((category, index) => {
            const secData = sections[category] || { observations: [], recommendations: [] };
            report += `<h4>${index + 1}. ${categoryQuestions[category]}</h4>`;
            report += `<p><strong>Observations:</strong></p>${renderObservationsList(secData.observations, secData.recommendations)}`;
            report += `<p><strong>Recommendations:</strong></p>${renderRecommendationsList(secData.recommendations)}`;
            if (aiFbs[category]) {
                report += aiFbs[category];
            }
            report += '<hr/>';
        });

        report += `<h3>Additional Feedback</h3><h4>Did the class session meet the instructor's goal or objective?</h4><p>${feedbacks['Additional Feedback'] || '<em>No additional feedback provided.</em>'}</p>`;
        report += `<h4>Other Comments or Recommendations</h4><p>${feedbacks['Other Comments or Recommendations'] || '<em>No other comments.</em>'}</p>`;
        return report.replace(/<p><br><\/p>/g, '');
    }, []);

    useEffect(() => {
        if (!location.state) { navigate('/reports'); return; }
        
        const { reportId, evaluationId: stateEvalId, selectedRecommendations, feedbacks, observerId, instructorId, classId } = location.state;

        if (reportId && !selectedRecommendations) {
            reportService.fetchReportDetails(reportId)
                .then(response => {
                    const data = response.data;
                    const grouped = {};
                    const sectionMapping = { "Visuals & PPT": "Visual Aids and Technology", "Pacing": "Delivery", "Affect": "Delivery", "Speech & Delivery": "Delivery", "Specific Activities": "Activities", "Student-Instructor Interactions": "Activities", "Expectations for Student Behavior": "Student Behavior" };
                    
                    (data.recommendations || []).forEach(rec => {
                        const cat = sectionMapping[rec.sectionTitle] || rec.sectionTitle;
                        if (!grouped[cat]) grouped[cat] = { observations: [], recommendations: [] };
                        if (rec.observedDescription && !grouped[cat].observations.includes(rec.observedDescription)) grouped[cat].observations.push(rec.observedDescription);
                        grouped[cat].recommendations.push(rec);
                    });

                    setStructuredData({ 
                        sections: grouped, 
                        feedbacks: data.feedbacks || {},
                        instructorName: data.instructorName,
                        courseTitle: data.courseTitle
                    });
                    setBackgroundInfo({ goal: data.classGoal, outline: data.classOutline, help: data.classHelp });
                    
                    setSaveData({
                        observerId: data.observerId || data.observer_id,
                        instructorId: data.instructorId || data.instructor_id,
                        classId: data.classId || data.class_id,
                        evaluationId: data.evaluationId || data.evaluation_id || stateEvalId,
                        recommendations: data.recommendations
                    });
                })
                .catch(err => {
                    console.error("Fetch report error:", err);
                    setErrorMessage("Failed to load report data.");
                })
                .finally(() => setLoadingState('init', false));
        } 
        else {
            const sectionMapping = { "Visuals & PPT": "Visual Aids and Technology", "Pacing": "Delivery", "Affect": "Delivery", "Speech & Delivery": "Delivery", "Specific Activities": "Activities", "Student-Instructor Interactions": "Activities", "Expectations for Student Behavior": "Student Behavior" };
            const grouped = {};
            (selectedRecommendations || []).forEach(rec => {
                const cat = sectionMapping[rec.sectionTitle] || rec.sectionTitle;
                if (!grouped[cat]) grouped[cat] = { observations: [], recommendations: [] };
                if (rec.observedDescription && !grouped[cat].observations.includes(rec.observedDescription)) grouped[cat].observations.push(rec.observedDescription);
                grouped[cat].recommendations.push(rec);
            });
            setStructuredData({ sections: grouped, feedbacks });
            
            setSaveData({
                observerId,
                instructorId,
                classId,
                recommendations: selectedRecommendations
            });

            const instructor = JSON.parse(localStorage.getItem('selectedInstructor') || '{}');
            if (instructor?.classId) {
                classService.fetchClassDetails(instructor.classId)
                    .then(data => setBackgroundInfo({ goal: data.goal, outline: data.outline, help: data.help }))
                    .catch(() => setBackgroundInfo({ goal: 'N/A', outline: 'N/A', help: 'N/A' }));
            }
            setLoadingState('init', false);
        }
    }, [location.state, navigate]);

    useEffect(() => {
        if (structuredData && editor && !editor.isDestroyed) {
            const content = generateReportContent(structuredData, aiFeedbacks, backgroundInfo);
            editor.commands.setContent(content);
        }
    }, [structuredData, aiFeedbacks, backgroundInfo, generateReportContent, editor]);

    const handleDownloadDoc = async () => {
        if (loading.doc) return; 
        setLoadingState('doc', true);
        try {
            await withMinDelay(async () => {
                const content = editor.getHTML();
                await generateWordReport(content);
            });
        } catch (error) {
            alert("Could not generate Word file.");
        } finally {
            setLoadingState('doc', false);
        }
    };

    const handleAiSupportForAllSections = async () => {
        if (!genAI || !structuredData) return;
        setLoadingState('ai', true);
        setErrorMessage('');

        try {
            await withMinDelay(async () => {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const sectionsToAnalyze = Object.keys(structuredData.sections)
                    .map(cat => `${cat}: ${structuredData.sections[cat]?.observations.join('; ')}`)
                    .join('\n\n');

                const prompt = `You are a pedagogical consultant. Analyze observations and provide Institutional AI Analysis for EACH section listed below. 
                For EACH section, use its EXACT name from the list.
                Structure your response for each section as follows:
                [Actual Section Name]
                ## Key Observations
                (your text here)
                ## Recommendations for Improvement
                (your text here)

                Sections to analyze:
                ${sectionsToAnalyze}`;

                const res = await model.generateContent(prompt);
                const fullText = res.response.text();

                const newAiFeedbacks = {};
                Object.keys(structuredData.sections).forEach(cat => {
                    const regex = new RegExp(`${cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n\\n[A-Z]|$)`, 'i');
                    const sectionMatch = fullText.match(regex);
                    if (sectionMatch) newAiFeedbacks[cat] = formatAiResponse(sectionMatch[0]);
                });
                setAiFeedbacks(newAiFeedbacks);
            }, 1200);
        } catch (e) {
            const msg = e.message?.includes('429') ? "Quota exceeded (20 requests/day). Use another key or wait." : "AI Error: " + e.message;
            setErrorMessage(msg);
        } finally {
            setLoadingState('ai', false);
        }
    };

    const handleSaveEvaluation = async () => {
        if (!saveData.instructorId) {
            alert("Instructor data is missing. Cannot save.");
            return;
        }
        setLoadingState('save', true);
        try {
            // 1. Save evaluation data
            const evaluationData = {
                date: new Date().toISOString().split('T')[0],
                observerId: saveData.observerId, 
                instructorId: saveData.instructorId, 
                classId: saveData.classId,
                recommendations: saveData.recommendations.map(rec => ({ ...rec, selected: true }))
            };
            
            let evaluationId = saveData.evaluationId;

            // If we don't have eval ID, we create a new one (though usually we should have it from history)
            if (!evaluationId) {
                const evalRes = await fetch(`${API_BASE_URL}/api/evaluations/save`, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify(evaluationData) 
                });
                const evalData = await evalRes.json();
                evaluationId = evalData.evaluation_id;
            }

            // 2. Generate PDF and save it to Reports list
            const doc = <ReportPdfDocument htmlContent={reportContent} />;
            const blob = await pdf(doc).toBlob();
            const formData = new FormData();
            formData.append('file', new File([blob], "report.pdf", { type: 'application/pdf' }));
            formData.append('evaluationId', evaluationId);

            await axios.post(`${API_BASE_URL}/api/reports/save-pdf`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSuccessMessage('Report saved successfully! A new version has been added to your history.');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err) { 
            console.error(err);
            setSuccessMessage('Failed to save report.'); 
        }
        finally { setLoadingState('save', false); }
    };

    const isBusy = loading.ai || loading.save || loading.doc || loading.init;

    useEffect(() => {
        if (isBusy) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
        return () => document.body.classList.remove('no-scroll');
    }, [isBusy]);

    return (
        <>
            <Header />
            <div id="evaluation-container-v3">
                <div className="eval-page-bg">
                    <div className="container py-5">
                        
                        <div className="eval-main-intro text-center mb-5">
                            <h1 className="eval-page-heading">Final Report</h1>
                            <p className="eval-page-subtext">Review, Edit, and Export</p>
                        </div>

                        <Card className="eval-section-card border-0 mb-5 shadow-sm overflow-hidden p-0" style={{ minHeight: '500px' }}>
                            {errorMessage && <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible className="m-3">{errorMessage}</Alert>}
                            
                            <div className="tiptap-editor-wrapper">
                                <MenuBar editor={editor} />
                                <EditorContent editor={editor} className="p-4" />
                            </div>
                        </Card>

                        {successMessage && <Alert variant={successMessage.includes('Failed') ? 'danger' : 'success'} className="mb-4 text-center">{successMessage}</Alert>}

                        <div className="eval-action-footer-container w-100 d-flex justify-content-center flex-wrap gap-3 py-4" style={{ position: 'sticky', bottom: '30px', zIndex: 1000, pointerEvents: 'none' }}>
                            <Button 
                                variant="outline-secondary" 
                                onClick={() => navigate(-1)} 
                                className="eval-btn-secondary-v3 px-4 py-3 rounded-pill font-weight-bold shadow"
                                style={{ pointerEvents: 'auto' }}
                            >
                                <ArrowLeft className="mr-2" /> GO BACK
                            </Button>

                            {/* Show AI and SAVE buttons ONLY if we are NOT viewing an archived report */}
                            {!location.state?.reportId && (
                                <>
                                    <Button 
                                        variant="outline-primary" 
                                        onClick={handleAiSupportForAllSections} 
                                        className="eval-btn-secondary-v3 px-4 py-3 rounded-pill font-weight-bold shadow"
                                        disabled={loading.ai}
                                        style={{ pointerEvents: 'auto' }}
                                    >
                                        <Robot className="mr-2" /> {loading.ai ? 'ANALYZING...' : 'AI FEEDBACK'}
                                    </Button>

                                    <Button 
                                        onClick={handleSaveEvaluation} 
                                        className="eval-submit-btn-v3 px-5 py-3 rounded-pill font-weight-bold shadow w-auto" 
                                        disabled={loading.save}
                                        style={{ pointerEvents: 'auto' }}
                                    >
                                        <Save className="mr-2" /> {loading.save ? 'SAVING...' : 'SAVE REPORT'}
                                    </Button>
                                </>
                            )}

                            {reportContent && (
                                <PDFDownloadLink 
                                    document={<ReportPdfDocument htmlContent={reportContent} />} 
                                    fileName="Teaching_Evaluation_Report.pdf"
                                    style={{ textDecoration: 'none', pointerEvents: 'auto' }}
                                >
                                    {({ loading: pdfLoading }) => (
                                        <Button className="eval-btn-secondary-v3 px-4 py-3 rounded-pill font-weight-bold shadow" disabled={pdfLoading}>
                                            <FileEarmarkPdf className="mr-2" /> {pdfLoading ? '...' : 'PDF'}
                                        </Button>
                                    )}
                                </PDFDownloadLink>
                            )}

                            <Button 
                                onClick={handleDownloadDoc} 
                                className="eval-btn-secondary-v3 px-4 py-3 rounded-pill font-weight-bold shadow" 
                                disabled={loading.doc}
                                style={{ pointerEvents: 'auto' }}
                            >
                                <FileEarmarkWord className="mr-2" /> WORD
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {isBusy && (
                <div className="loading-overlay">
                    <Spinner animation="border" variant="light" />
                    <h5 className="mt-3 text-white">Processing Report...</h5>
                </div>
            )}
        </>
    );
};

export default ReportViewer;