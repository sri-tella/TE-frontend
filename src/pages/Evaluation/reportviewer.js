import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';
import Header from '../../components/Header/header';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './mainform.css';
import './tiptapStyle.css';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_BASE_URL } from '../../constants';

const formatAiResponse = (text) => {
    if (!text) return '';
    const formatContent = (content) => {
        content = content.trim();
        const lines = content.split('\n').filter(line => line.trim() !== '');
        return lines.join('<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    };
    const recommendationHeader = '## Recommendations for Improvement';
    const parts = text.split(recommendationHeader);
    let observationsHtml = '';
    if (parts[0]) {
        let contentPart = parts[0].replace(/^## (.*$)/gim, '').trim();
        let headerPart = parts[0].match(/^## (.*$)/im);
        observationsHtml = headerPart ? `<h5 style="font-weight: bold; margin-top: 5px; margin-bottom: 10px;">${headerPart[1]}</h5>` : '';
        observationsHtml += formatContent(contentPart);
    }
    let recommendationsHtml = '';
    if (parts.length > 1 && parts[1]) {
        const recommendationsContent = formatContent(parts[1]);
        recommendationsHtml = `<div style="color: #0d47a1;"><h5 style="font-weight: bold; margin-top: 15px; margin-bottom: 10px; color: #0d47a1;">Recommendations for Improvement</h5>${recommendationsContent}</div>`;
    }
    return observationsHtml + recommendationsHtml;
};

const MenuBar = ({ editor }) => {
    if (!editor) return null;

    return (
        <div className="tiptap-menubar">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'is-active' : ''}
                type="button"
            >
                <strong>B</strong>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
                type="button"
            >
                <em>I</em>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={editor.isActive('underline') ? 'is-active' : ''}
                type="button"
            >
                <u>U</u>
            </button>
            <span className="divider" />
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                type="button"
            >
                H2
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                type="button"
            >
                H3
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                className={editor.isActive('heading', { level: 4 }) ? 'is-active' : ''}
                type="button"
            >
                H4
            </button>
            <span className="divider" />
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'is-active' : ''}
                type="button"
            >
                • List
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'is-active' : ''}
                type="button"
            >
                1. List
            </button>
            <span className="divider" />
            <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
                type="button"
            >
                ← Left
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
                type="button"
            >
                ↔ Center
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
                type="button"
            >
                → Right
            </button>
        </div>
    );
};

const ViewReports = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [reportContent, setReportContent] = useState('');
    const editorRef = useRef(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [backgroundInfo, setBackgroundInfo] = useState({ goal: '', help: '', outline: '' });
    const [structuredData, setStructuredData] = useState(null);
    const [aiFeedbacks, setAiFeedbacks] = useState({});

    const [loading, setLoading] = useState({
        ai: false,
        save: false,
        pdf: false,
        doc: false,
        aiProgress: ''
    });

    let loadingText = '';
    if (loading.ai) loadingText = `Generating AI Feedback ${loading.aiProgress}, please wait...`;
    else if (loading.save) loadingText = 'Saving Report, please wait...';
    else if (loading.pdf) loadingText = 'Generating PDF (1-2 mins), please wait...';
    else if (loading.doc) loadingText = 'Generating Word Doc (1-2 mins), please wait...';

    const isBusy = !!loadingText;

    const setLoadingState = (key, value) => {
        setLoading(prev => ({ ...prev, [key]: value }));
    };

    const genAI = useMemo(() => {
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) return null;
        return new GoogleGenerativeAI(apiKey);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Link.configure({
                openOnClick: false,
            }),
            TextStyle,
            Color,
        ],
        content: reportContent,
        onUpdate: ({ editor }) => {
            setReportContent(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor-content',
            },
        },
    });

    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    const generateReportContent = useCallback((data, aiFbs, bgInfo) => {
        if (!data) return '';
        const { sections, feedbacks } = data;
        const observerFirstName = localStorage.getItem('firstName') || '';
        const observerLastName = localStorage.getItem('lastName') || '';
        const selectedInstructor = JSON.parse(localStorage.getItem('selectedInstructor') || '{}');
        const instructorName = `${selectedInstructor.instructorFirstName || ''} ${selectedInstructor.instructorLastName || ''}`.trim();
        const classTopic = selectedInstructor?.courseTitle || '';
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

        let report = `<h2>Teaching Evaluation Report</h2><h3>Observation Information</h3><p><strong>Instructor:</strong> ${instructorName}</p><p><strong>Date of Observation:</strong> ${formattedDate}</p><p><strong>Time:</strong> ${formattedTime}</p><p><strong>Class Session Topic or Course Subject:</strong> ${classTopic}</p><p><strong>Observer:</strong> ${observerFirstName} ${observerLastName}</p><h3>Background Information</h3><p><strong>What is the learning goal or objective for today's class session?/Objective:</strong><br>${bgInfo.goal || 'N/A'}</p><p><strong>Please provide a brief outline or sketch of how class session will proceed?</strong><br>${bgInfo.outline || 'N/A'}</p><p><strong>How might the observer be particularly helpful in the observation process? Are there elements of the class session that might benefit from detailed feedback or focused attention?</strong><br>${bgInfo.help || 'N/A'}</p><h3>Observation</h3>`;

        manualOrder.forEach((category, index) => {
            const secData = sections[category] || { observations: [], recommendations: [] };
            report += `<h4>${index + 1}. ${categoryQuestions[category]}</h4>`;
            const obsContent = secData.observations.length > 0 ? `<ul>${secData.observations.map(obs => `<li>${obs}</li>`).join('')}</ul>` : '<p><em>No observations recorded.</em></p>';
            report += `<p><strong>Observations:</strong></p>${obsContent}`;
            report += `<p><strong>Recommendations:</strong></p>${renderListWithFeedback(secData.recommendations)}`;
            const sectionAiAssistance = aiFbs[category];
            if (sectionAiAssistance && sectionAiAssistance.trim()) {
                report += `<div style="padding-left: 30px;"><div style="margin-top: 10px; padding: 15px; background-color: #f0f7ff; border-left: 5px solid #007bff; border-radius: 4px; font-family: sans-serif;"><span style="margin: 0 0 10px 0; font-size: 25px !important; color: #0056b3;"><strong> AI Assistance:</strong></span><div>${sectionAiAssistance}</div></div></div>`;
            }
        });

        report += `<h3>Additional Feedback</h3><h4>Did the class session meet the instructor's goal or objective?</h4><p>${(feedbacks && feedbacks['Additional Feedback']) || '<em>No additional feedback provided.</em>'}</p>`;
        const additionalAiAssistance = aiFbs['Additional Feedback'];
        if (additionalAiAssistance) {
            report += `<div style="padding-left: 30px;"><div style="margin-top: 10px; padding: 15px; background-color: #f0f7ff; border-left: 5px solid #007bff; border-radius: 4px; font-family: sans-serif;"><span style="margin: 0 0 10px 0; font-size: 20px !important; color: #0056b3;"><strong> AI Assistance:</strong></span><div>${additionalAiAssistance}</div></div></div>`;
        }
        report += `<h4>Other Comments or Recommendations</h4><p>${(feedbacks && feedbacks['Other Comments or Recommendations']) || '<em>No other comments.</em>'}</p>`;

        return report.replace(/<p><br><\/p>/g, '');
    }, []);

    useEffect(() => {
        if (!location.state) {
            navigate('/reports');
            return;
        }

        const storedRecs = JSON.parse(localStorage.getItem('selectedRecommendations') || '[]');
        const storedFeedbacks = JSON.parse(localStorage.getItem('selectedRecFeedbacks') || '{}');
        const selectedRecommendations = location.state?.selectedRecommendations || storedRecs;
        const feedbacks = location.state?.feedbacks || storedFeedbacks;

        const sectionMapping = {
            "Introduction": "Introduction",
            "Organization": "Organization",
            "Content": "Content",
            "Visuals & PPT": "Visual Aids and Technology",
            "Pacing": "Delivery",
            "Affect": "Delivery",
            "Speech & Delivery": "Delivery",
            "Specific Activities": "Activities",
            "Student-Instructor Interactions": "Activities",
            "Expectations for Student Behavior": "Student Behavior",
            "Conclusion": "Conclusion"
        };
        const groupedBySection = {};

        if (Array.isArray(selectedRecommendations)) {
            selectedRecommendations.forEach((rec) => {
                if (!rec || !rec.sectionTitle) return;
                const category = sectionMapping[rec.sectionTitle] || rec.sectionTitle;
                if (!groupedBySection[category]) groupedBySection[category] = { observations: [], recommendations: [] };
                if (rec.observedDescription && !groupedBySection[category].observations.includes(rec.observedDescription)) {
                    groupedBySection[category].observations.push(rec.observedDescription);
                }
                groupedBySection[category].recommendations.push(rec);
            });
        }

        setStructuredData({ sections: groupedBySection, feedbacks });

        const selectedInstructor = JSON.parse(localStorage.getItem('selectedInstructor') || '{}');
        if (selectedInstructor?.classId) {
            fetch(`${API_BASE_URL}/api/classes/${selectedInstructor.classId}`)
                .then(res => res.ok ? res.json() : Promise.reject())
                .then(data => setBackgroundInfo({ goal: data.goal || '', outline: data.outline || '', help: data.help || '' }))
                .catch(() => setBackgroundInfo({ goal: 'N/A', outline: 'N/A', help: 'N/A' }));
        }
    }, [location.state, navigate]);

    useEffect(() => {
        if (structuredData && editor && !editor.isDestroyed) {
            const content = generateReportContent(structuredData, aiFeedbacks, backgroundInfo);
            editor.commands.setContent(content);
            setReportContent(content);
        }
    }, [structuredData, aiFeedbacks, backgroundInfo, generateReportContent, editor]);

    const generatePdf = async () => {
        const pdf = new jsPDF('p', 'in', 'letter');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 1;
        const contentWidth = pdfWidth - 2 * margin;

        const style = document.createElement('style');
        style.textContent = `
            .pdf-content * { font-family: 'Times New Roman', serif !important; }
            .pdf-content h2 { font-size: 18pt; margin-bottom: 12pt; }
            .pdf-content h3 { font-size: 14pt; margin-top: 10pt; margin-bottom: 8pt; }
            .pdf-content h4 { font-size: 12pt; margin-top: 8pt; margin-bottom: 6pt; }
            .pdf-content p { font-size: 11pt; margin-bottom: 6pt; line-height: 1.4; }
            .pdf-content ul, .pdf-content ol { margin-left: 20pt; }
            .pdf-content li { font-size: 11pt; margin-bottom: 4pt; }
        `;
        document.head.appendChild(style);

        const tempDiv = document.createElement('div');
        tempDiv.className = 'pdf-content';
        tempDiv.style.cssText = 'position: absolute; left: -9999px; width: 8.5in; padding: 1in;';
        tempDiv.innerHTML = reportContent;
        document.body.appendChild(tempDiv);

        const elements = Array.from(tempDiv.children);
        let currentY = margin;

        for (const element of elements) {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * contentWidth) / canvas.width;

            if (currentY + imgHeight > pdfHeight - 1.5) {
                pdf.addPage();
                currentY = margin;
            }

            pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
            currentY += imgHeight + 0.1;
        }

        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            const footerText = `Page ${i} of ${totalPages}`;
            pdf.text(footerText, pdfWidth / 2, pdfHeight - 0.5, { align: 'center' });
        }

        document.body.removeChild(tempDiv);
        document.head.removeChild(style);
        pdf.save('Teaching_Evaluation_Report.pdf');
    };

    const handleDownloadPDF = async () => {
        setLoadingState('pdf', true);
        try {
            await generatePdf();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setLoadingState('pdf', false);
        }
    };

    const handleDownloadDoc = async () => {
        setLoadingState('doc', true);
        try {
            const header = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                      xmlns:w='urn:schemas-microsoft-com:office:word' 
                      xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset="utf-8">
                    <style>
                        @page WordSection1 {
                            size: 8.5in 11.0in;
                            margin: 1.0in 1.0in 1.0in 1.0in;
                            mso-header-margin: .5in;
                            mso-footer-margin: .5in;
                            mso-footer: f1;
                        }
                        div.WordSection1 { page: WordSection1; }
                        table#hrdftrtbl { margin: 0in 0in 0in 9in; }
                        p.MsoFooter, li.MsoFooter, div.MsoFooter {
                            margin: 0in;
                            margin-bottom: .0001pt;
                            mso-pagination: widow-orphan;
                            tab-stops: center 3.0in right 6.0in;
                            font-size: 10.0pt;
                            font-family: "Arial", sans-serif;
                            color: #999999;
                        }
                    </style>
                </head>
                <body>
                    <div class="WordSection1">
                        ${reportContent}
                        <table id="hrdftrtbl" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <td>
                                    <div style='mso-element:footer' id=f1>
                                        <p class=MsoFooter>
                                            <span style='mso-tab-count:1'></span>
                                            Page <span style='mso-field-code: " PAGE "'></span> of <span style='mso-field-code: " NUMPAGES "'></span>
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                </body>
                </html>`;

            const blob = new Blob([header], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'Teaching_Evaluation_Report.doc';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating Word document:', error);
            alert('Failed to generate Word document.');
        } finally {
            setLoadingState('doc', false);
        }
    };

    const handleAiSupportForAllSections = async () => {
        if (!genAI) {
            alert('AI service not available. Please check your API configuration.');
            return;
        }
        if (!structuredData) {
            alert('No report data available.');
            return;
        }

        setLoadingState('ai', true);

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const newAiFeedbacks = {};
            const { sections, feedbacks } = structuredData;
            const manualOrder = ["Introduction", "Organization", "Content", "Visual Aids and Technology", "Delivery", "Activities", "Student Behavior", "Conclusion"];
            const totalSections = manualOrder.length + 1;
            let completed = 0;

            for (let i = 0; i < manualOrder.length; i++) {
                const category = manualOrder[i];
                const sectionData = sections[category];
                if (!sectionData) continue;
                const { observations, recommendations } = sectionData;
                if (observations.length === 0 && recommendations.length === 0) continue;

                const observationsText = observations.length > 0 ? observations.join('; ') : 'None';
                const recommendationsText = recommendations.length > 0 ? recommendations.map(r => r.description).join('; ') : 'None';

                const sectionPrompt = `
                You are a teaching evaluation assistant. Based on the following classroom observations and recommendations for the "${category}" section, provide:
                1. A brief summary of key observations (2-3 sentences)
                2. Specific, actionable recommendations for improvement (2-3 bullet points)

                Observations: ${observationsText}
                Recommendations: ${recommendationsText}

                Format your response with clear headers:
                ## Key Observations
                [your observations here]

                ## Recommendations for Improvement
                [your recommendations here]
                `.trim();

                let attempts = 0;
                while (attempts < 3) {
                    try {
                        const result = await model.generateContent(sectionPrompt);
                        const response = await result.response;
                        newAiFeedbacks[category] = formatAiResponse(response.text());
                        completed++;
                        setLoading(prev => ({ ...prev, aiProgress: `(${completed}/${totalSections})` }));
                        break;
                    } catch (error) {
                        if (error.message.includes('429') || error.message.includes('503')) {
                            attempts++;
                            await new Promise(resolve => setTimeout(resolve, 5000 * attempts));
                        } else break;
                    }
                }
                if (i < manualOrder.length - 1) await new Promise(resolve => setTimeout(resolve, 4000));
            }

            const additionalFeedbackText = feedbacks['Additional Feedback'];
            if (additionalFeedbackText && additionalFeedbackText.trim()) {
                const additionalPrompt = `
                You are a teaching evaluation assistant. Based on the following feedback about whether the class session met the instructor's goals, provide:
                1. A brief analysis of the feedback (2-3 sentences)
                2. Suggestions for improvement or reinforcement (2-3 bullet points)
                Feedback: ${additionalFeedbackText}
                Format your response with clear headers:
                ## Analysis
                [your analysis here]
                ## Recommendations for Improvement
                [your recommendations here]
                `.trim();

                let attempts = 0;
                while (attempts < 3) {
                    try {
                        const result = await model.generateContent(additionalPrompt);
                        const response = await result.response;
                        newAiFeedbacks['Additional Feedback'] = formatAiResponse(response.text());
                        completed++;
                        setLoading(prev => ({ ...prev, aiProgress: `(${completed}/${totalSections})` }));
                        break;
                    } catch (error) {
                        if (error.message.includes('429') || error.message.includes('503')) {
                            attempts++;
                            await new Promise(resolve => setTimeout(resolve, 5000 * attempts));
                        } else break;
                    }
                }
            }
            setAiFeedbacks(newAiFeedbacks);
        } catch (error) {
            console.error('Error in AI handler:', error);
            alert(`Failed to get AI assistance: ${error.message}`);
        } finally {
            setLoadingState('ai', false);
            setLoading(prev => ({ ...prev, aiProgress: '' }));
        }
    };

    const handleSaveEvaluation = async () => {
        if (!location.state) return;
        setLoadingState('save', true);
        try {
            const currentDate = new Date().toISOString().split('T')[0];
            const { selectedRecommendations, observerId, instructorId, classId } = location.state;
            const evaluationData = {
                date: currentDate,
                observerId,
                instructorId,
                classId,
                recommendations: selectedRecommendations.map(rec => ({
                    description: rec.description || '',
                    sectionTitle: rec.sectionTitle || '',
                    feedback: rec.feedbackText || '',
                    selected: true
                }))
            };
            const response = await fetch(`${API_BASE_URL}/api/evaluations/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(evaluationData),
            });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            setSuccessMessage('Report saved successfully!');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            console.error('Error saving:', error);
            setSuccessMessage(`Failed to save: ${error.message}`);
        } finally {
            setLoadingState('save', false);
        }
    };

    return (
        <>
            <Header />
            <div className="main-form-page">
                <div className="main-form-card">
                    <div className="form-header-row">
                        <div className="form-instructions">
                            <h4>Final Report</h4>
                            <p>Review the generated report below. You can edit the text directly before saving or downloading.</p>
                        </div>
                    </div>
                    <div id="report-content" className="tiptap-editor-wrapper">
                        <MenuBar editor={editor} />
                        <EditorContent editor={editor} />
                    </div>
                    <div className="form-footer-actions">
                        <Button onClick={() => navigate('/SelectedRecommendations')} className="btn-baylor-secondary">Go Back</Button>
                        <Button onClick={handleAiSupportForAllSections} className="btn-baylor-secondary" disabled={loading.ai || !genAI}>
                            {loading.ai ? 'Generating AI...' : 'Generate AI Feedback'}
                        </Button>
                        <Button onClick={handleSaveEvaluation} className="btn-baylor-save" disabled={loading.save}>
                            {loading.save ? 'Saving...' : 'Save Report'}
                        </Button>
                        <Button onClick={handleDownloadPDF} className="btn-baylor-secondary" disabled={loading.pdf}>Download PDF</Button>
                        <Button onClick={handleDownloadDoc} className="btn-baylor-secondary" disabled={loading.doc}>Download Word</Button>
                    </div>
                    {successMessage && (
                        <div className={`mt-3 alert ${successMessage.includes('Failed') ? 'alert-danger' : 'alert-success'}`}>
                            {successMessage}
                        </div>
                    )}
                </div>
            </div>
            {isBusy && (
                <div className="loading-overlay">
                    <Spinner animation="border" role="status" variant="light" style={{ width: '3rem', height: '3rem' }} />
                    <h5 className="mt-3 text-white">{loadingText}</h5>
                </div>
            )}
        </>
    );
};

export default ViewReports;