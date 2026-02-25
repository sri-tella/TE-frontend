import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert } from 'react-bootstrap';
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
import { classService } from '../../services/apiService';
import ReportPdfDocument from './ReportPdfDocument';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { generateWordReport } from './WordGenerator';

// Хелпер для предотвращения мелькания (минимум 800мс на выполнение)
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
    // Clean markdown and unwanted markers/headers
    let cleanRaw = text.replace(/\*\*/g, '').replace(/##/g, '').replace(/^\s*\* /gm, '');
    
    // Remove "Institutional AI Analysis" variations
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
        <div style="margin: 15px 0; padding: 5px 0; border-top: 1px solid #eee;">
            <div style="margin-bottom: 8px;">
                <strong style="color: #154734; font-size: 10.5pt; display: block; margin-bottom: 4px;">Observations</strong>
                <div style="font-size: 10.5pt; color: #444; line-height: 1.4;">${obsPart}</div>
            </div>
            ${recPart ? `
            <div style="margin-top: 10px;">
                <strong style="color: #154734; font-size: 10.5pt; display: block; margin-bottom: 4px;">Recommendations</strong>
                <div style="font-size: 10.5pt; color: #444; line-height: 1.4;">${recPart}</div>
            </div>` : ''}
        </div>
    `;
};

const MenuBar = ({ editor }) => {
    if (!editor) return null;
    return (
        <div className="tiptap-menubar">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} type="button"><strong>B</strong></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} type="button"><em>I</em></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''} type="button"><u>U</u></button>
            <span className="divider" />
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} type="button">H2</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''} type="button">H3</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} className={editor.isActive('heading', { level: 4 }) ? 'is-active' : ''} type="button">H4</button>
            <span className="divider" />
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} type="button">• List</button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} type="button">1. List</button>
            <span className="divider" />
            <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''} type="button">← Left</button>
            <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''} type="button">↔ Center</button>
            <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''} type="button">→ Right</button>
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
    const [loading, setLoading] = useState({ ai: false, save: false, pdf: false, doc: false });

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
        if (!data) return '';
        const { sections, feedbacks } = data;
        const observerName = `${localStorage.getItem('firstName') || ''} ${localStorage.getItem('lastName') || ''}`.trim();
        const instructor = JSON.parse(localStorage.getItem('selectedInstructor') || '{}');
        const instructorName = `${instructor.instructorFirstName || ''} ${instructor.instructorLastName || ''}`.trim();
        const classTopic = instructor?.courseTitle || '';
        const now = new Date();
        const formattedDate = now.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const manualOrder = ["Introduction", "Organization", "Content", "Visual Aids and Technology", "Delivery", "Activities", "Student Behavior", "Conclusion"];
        const categoryQuestions = {
            "Introduction": "Introduction: In what ways did the introduction capture your (and students') interest? How were the first few minutes of class related to the purpose of the class session overall?",
            "Organization": "Organization: How was the class time organized? How were materials used? Were transitions between activities or materials clear and effective?",
            "Content": "Content: How well did the instructor demonstrate thorough understanding of the content? Did the instructor support his or her points? How was the instructor's level of content competence related to students' learning?",
            "Visual Aids and Technology": "Visual Aids and Technology: How were visual aids used? How was technology used? Were the visual aids/technology appropriate for the lesson and context? How did the visual aids/technology enhance or improve the learning process?",
            "Delivery": "Delivery: Was the instructor's teaching persona effective? Consider tone and volume of voice, gestures, posture, and expressions. What strengths of delivery did you observe? Any recommendations in the area of delivery?",
            "Activities": "Activities: How did the instructor encourage student participation or create the environment for students to participate? How well did these activities relate to the goal, objective, or purpose of the class session? How well did the instructor direct students' behavior to promote learning? How did the instructor engage with or respond to student's contributions?",
            "Student Behavior": "Student Behavior: How engaged were students in the class session? Did students seem to be aware of the learning goal, objective, or purpose of the class session? In what ways did students interact with the professor and each other? How would you describe the attitude of students?",
            "Conclusion": "Conclusion: Did the instructor end the class session effectively? Did he/she summarize key points? Leave time for questions? Tease the next topic?"
        };

        const renderListWithFeedback = (items) => {
            if (!items || items.length === 0) return '<p><em>No observations recorded.</em></p>';
            return `<ul>${items.map(item => {
                let content = item.description || item;
                let comment = item.feedbackText ? `<br/><em><small>&nbsp;&nbsp;(Comment: ${item.feedbackText})</small></em>` : '';
                return `<li>${content}${comment}</li>`;
            }).join('')}</ul>`;
        };

        let report = `<h2>Teaching Evaluation Report</h2><h3>Observation Information</h3><p><strong>Instructor:</strong> ${instructorName}</p><p><strong>Date:</strong> ${formattedDate}</p><p><strong>Time:</strong> ${formattedTime}</p><p><strong>Class Topic:</strong> ${classTopic}</p><p><strong>Observer:</strong> ${observerName}</p><h3>Background Information</h3><p><strong>Learning Goal/Objective:</strong><br>${bgInfo.goal || 'N/A'}</p><p><strong>Outline:</strong><br>${bgInfo.outline || 'N/A'}</p><h3>Observation</h3>`;

        manualOrder.forEach((category, index) => {
            const secData = sections[category] || { observations: [], recommendations: [] };
            report += `<h4>${index + 1}. ${categoryQuestions[category]}</h4>`;
            const obsContent = secData.observations.length > 0 ? `<ul>${secData.observations.map(obs => `<li>${obs}</li>`).join('')}</ul>` : '<p><em>No observations recorded.</em></p>';
            report += `<p><strong>Observations:</strong></p>${obsContent}`;
            report += `<p><strong>Recommendations:</strong></p>${renderListWithFeedback(secData.recommendations)}`;
            if (aiFbs[category]) {
                report += aiFbs[category];
            }
        });

        report += `<h3>Additional Feedback</h3><h4>Did the class session meet the instructor's goal or objective?</h4><p>${feedbacks['Additional Feedback'] || '<em>No additional feedback provided.</em>'}</p>`;
        report += `<h4>Other Comments or Recommendations</h4><p>${feedbacks['Other Comments or Recommendations'] || '<em>No other comments.</em>'}</p>`;
        return report.replace(/<p><br><\/p>/g, '');
    }, []);

    useEffect(() => {
        if (!location.state) { navigate('/reports'); return; }
        const { selectedRecommendations, feedbacks } = location.state;
        const sectionMapping = { "Visuals & PPT": "Visual Aids and Technology", "Pacing": "Delivery", "Affect": "Delivery", "Speech & Delivery": "Delivery", "Specific Activities": "Activities", "Student-Instructor Interactions": "Activities", "Expectations for Student Behavior": "Student Behavior" };
        const grouped = {};
        (selectedRecommendations || []).forEach(rec => {
            const cat = sectionMapping[rec.sectionTitle] || rec.sectionTitle;
            if (!grouped[cat]) grouped[cat] = { observations: [], recommendations: [] };
            if (rec.observedDescription && !grouped[cat].observations.includes(rec.observedDescription)) grouped[cat].observations.push(rec.observedDescription);
            grouped[cat].recommendations.push(rec);
        });
        setStructuredData({ sections: grouped, feedbacks });
        const instructor = JSON.parse(localStorage.getItem('selectedInstructor') || '{}');
        if (instructor?.classId) {
            classService.fetchClassDetails(instructor.classId)
                .then(data => setBackgroundInfo({ goal: data.goal, outline: data.outline, help: data.help }))
                .catch(() => setBackgroundInfo({ goal: 'N/A', outline: 'N/A', help: 'N/A' }));
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

                const prompt = `You are a pedagogical consultant. Analyze observations and provide Institutional AI Analysis for EACH section. Structure your response: [Section Name] ## Key Observations (text) ## Recommendations for Improvement (text). Sections: ${sectionsToAnalyze}`;

                const res = await model.generateContent(prompt);
                const fullText = res.response.text();

                const newAiFeedbacks = {};
                Object.keys(structuredData.sections).forEach(cat => {
                    const regex = new RegExp(`${cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n\\n[A-Z]|$)`, 'i');
                    const sectionMatch = fullText.match(regex);
                    if (sectionMatch) newAiFeedbacks[cat] = formatAiResponse(sectionMatch[0]);
                });
                setAiFeedbacks(newAiFeedbacks);
            }, 1200); // Для AI чуть дольше, чтобы не моргало
        } catch (e) {
            const msg = e.message?.includes('429') ? "Quota exceeded (20 requests/day). Use another key or wait." : "AI Error: " + e.message;
            setErrorMessage(msg);
        } finally {
            setLoadingState('ai', false);
        }
    };

    const handleSaveEvaluation = async () => {
        if (!location.state) return;
        setLoadingState('save', true);
        try {
            await withMinDelay(async () => {
                const evaluationData = {
                    date: new Date().toISOString().split('T')[0],
                    observerId: location.state.observerId, instructorId: location.state.instructorId, classId: location.state.classId,
                    recommendations: location.state.selectedRecommendations.map(rec => ({ ...rec, selected: true }))
                };
                await fetch(`${API_BASE_URL}/api/evaluations/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evaluationData) });
            });
            setSuccessMessage('Report saved successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch { setSuccessMessage('Failed to save report.'); }
        finally { setLoadingState('save', false); }
    };

    const isBusy = loading.ai || loading.save || loading.doc;

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
            <div className="main-form-page">
                <div className="main-form-card">
                    <div className="form-header-row">
                        <div className="form-instructions">
                            <h4>Final Report</h4>
                            <p>Review the generated report below.</p>
                        </div>
                    </div>

                    {errorMessage && <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible className="mb-4">{errorMessage}</Alert>}

                    <div className="tiptap-editor-wrapper">
                        <MenuBar editor={editor} />
                        <EditorContent editor={editor} />
                    </div>

                    <div className="form-footer-actions">
                        <Button onClick={() => navigate(-1)} className="btn-baylor-secondary">GO BACK</Button>
                        <Button onClick={handleAiSupportForAllSections} className="btn-baylor-secondary" disabled={loading.ai}>GENERATE AI FEEDBACK</Button>
                        <Button onClick={handleSaveEvaluation} className="btn-baylor-save" disabled={loading.save}>SAVE REPORT</Button>

                        {structuredData && (
                            <PDFDownloadLink 
                                document={<ReportPdfDocument data={structuredData} aiFeedbacks={aiFeedbacks} backgroundInfo={backgroundInfo} />} 
                                fileName="Teaching_Evaluation_Report.pdf"
                                className="btn btn-baylor-secondary"
                            >
                                {({ loading }) => (loading ? 'PREPARING...' : 'DOWNLOAD PDF')}
                            </PDFDownloadLink>
                        )}
                        <Button onClick={handleDownloadDoc} className="btn-baylor-secondary" disabled={loading.doc}>DOWNLOAD WORD</Button>
                    </div>
                    {successMessage && <div className={`mt-3 alert ${successMessage.includes('Failed') ? 'alert-danger' : 'alert-success'}`}>{successMessage}</div>}
                </div>
            </div>
            {isBusy && (
                <div className="loading-overlay" style={{ animation: 'fadeIn 0.3s' }}>
                    <Spinner animation="border" variant="light" />
                    <h5 className="mt-3">Processing...</h5>
                </div>
            )}
        </>
    );
};

export default ReportViewer;