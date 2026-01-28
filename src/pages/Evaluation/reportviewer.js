import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';
import Header from '../../components/Header/header';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './mainform.css'; 
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
    };
    let recommendationsHtml = '';
    if (parts.length > 1 && parts[1]) {
        const recommendationsContent = formatContent(parts[1]);
        recommendationsHtml = `<div style="color: #0d47a1;"><h5 style="font-weight: bold; margin-top: 15px; margin-bottom: 10px; color: #0d47a1;">Recommendations for Improvement</h5>${recommendationsContent}</div>`;
    }
    return observationsHtml + recommendationsHtml;
};

const ViewReports = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [reportContent, setReportContent] = useState('');
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
        
        const manualOrder = [ "Introduction", "Organization", "Content", "Visual Aids and Technology", "Delivery", "Activities", "Student Behavior", "Conclusion" ];
        const categoryQuestions = { "Introduction": "Introduction: In what ways did the introduction capture your (and students') interest? How were the first few minutes of class related to the purpose of the class session overall?", "Organization": "Organization: How was the class time organized? How were materials used? Were transitions between activities or materials clear and effective?", "Content": "Content: How well did the instructor demonstrate thorough understanding of the content? Did the instructor support his or her points? How was the instructor's level of content competence related to students' learning?", "Visual Aids and Technology": "Visual Aids and Technology: How were visual aids used? How was technology used? Were the visual aids/technology appropriate for the lesson and context? How did the visual aids/technology enhance or improve the learning process?", "Delivery": "Delivery: Was the instructor's teaching persona effective? Consider tone and volume of voice, gestures, posture, and expressions. What strengths of delivery did you observe? Any recommendations in the area of delivery?", "Activities": "Activities: How did the instructor encourage student participation or create the environment for students to participate? How well did these activities relate to the goal, objective, or purpose of the class session? How well did the instructor direct students' behavior to promote learning? How did the instructor engage with or respond to student's contributions?", "Student Behavior": "Student Behavior: How engaged were students in the class session? Did students seem to be aware of the learning goal, objective, or purpose of the class session? In what ways did students interact with the professor and each other? How would you describe the attitude of students?", "Conclusion": "Conclusion: Did the instructor end the class session effectively? Did he/she summarize key points? Leave time for questions? Tease the next topic?" };

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
        if (!location.state) { navigate('/reports'); return; }
        
        const storedRecs = JSON.parse(localStorage.getItem('selectedRecommendations') || '[]');
        const storedFeedbacks = JSON.parse(localStorage.getItem('selectedRecFeedbacks') || '{}');
        const selectedRecommendations = location.state?.selectedRecommendations || storedRecs;
        const feedbacks = location.state?.feedbacks || storedFeedbacks;
        
        const sectionMapping = { "Introduction": "Introduction", "Organization": "Organization", "Content": "Content", "Visuals & PPT": "Visual Aids and Technology", "Pacing": "Delivery", "Affect": "Delivery", "Speech & Delivery": "Delivery", "Specific Activities": "Activities", "Student-Instructor Interactions": "Activities", "Expectations for Student Behavior": "Student Behavior", "Conclusion": "Conclusion" };
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
        if (structuredData) {
            setReportContent(generateReportContent(structuredData, aiFeedbacks, backgroundInfo));
        }
    }, [structuredData, aiFeedbacks, backgroundInfo, generateReportContent]);

    const generatePdf = async () => { 
        const pdf = new jsPDF('p', 'in', 'letter');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 1;
        const contentWidth = pdfWidth - 2 * margin;
        const availableHeight = pdfHeight - margin - 1.5;

        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
            }
            body {
                margin: 0 !important;
                padding: 0 !important;
                font-family: 'Times New Roman', serif !important;
                font-size: 12pt !important;
                line-height: 1.4 !important;
            }
            ul, ol { 
                list-style-type: disc !important; 
                padding-left: 20px !important; 
                margin: 10px 0 !important;
            } 
            li { 
                list-style-position: outside !important; 
                margin-bottom: 5px !important;
            }
            h2, h3, h4, h5, h6 {
                margin: 15px 0 10px 0 !important;
            }
            p {
                margin: 8px 0 !important;
            }
        `;

        const parserContainer = document.createElement('div');
        parserContainer.innerHTML = reportContent;
        const children = Array.from(parserContainer.children);

        const blocks = [];
        children.forEach((child) => {
            const currentBlock = document.createElement('div');
            currentBlock.appendChild(child.cloneNode(true));
            blocks.push(currentBlock);
        });

        let currentY = 0;
        let pageCount = 1;

        for (const block of blocks) {
            const tempContainer = document.createElement('div');
            Object.assign(tempContainer.style, {
                position: 'absolute',
                left: '-9999px',
                top: '0',
                width: `${contentWidth * 72}pt`,
                backgroundColor: 'white',
                fontFamily: 'Times New Roman, serif',
                fontSize: '12pt',
                lineHeight: '1.4',
                margin: '0',
                padding: '0'
            });
            tempContainer.appendChild(style.cloneNode(true));
            tempContainer.appendChild(block);
            document.body.appendChild(tempContainer);

            try {
                const scale = 2;
                const canvas = await html2canvas(tempContainer, {
                    scale: scale,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                const imgWidthPdf = contentWidth;
                const imgAspect = canvas.height / canvas.width;
                const imgFullHeightPdf = imgWidthPdf * imgAspect;

                const needSplit = imgFullHeightPdf > availableHeight;

                if (!needSplit) {
                    let spaceOnPage = availableHeight - currentY;
                    let positionY = margin + currentY;
                    if (imgFullHeightPdf > spaceOnPage) {
                        pdf.addPage();
                        pageCount++;
                        currentY = 0;
                        positionY = margin + currentY;
                    }
                    pdf.addImage(canvas.toDataURL('image/jpeg', 0.8), 'jpeg', margin, positionY, imgWidthPdf, imgFullHeightPdf);
                    currentY += imgFullHeightPdf;
                } else {
                    let blockRemaining = imgFullHeightPdf;
                    let srcOffset = 0;
                    while (blockRemaining > 0) {
                        let spaceOnPage = availableHeight - currentY;
                        if (spaceOnPage <= 0.1) {
                            pdf.addPage();
                            pageCount++;
                            currentY = 0;
                            spaceOnPage = availableHeight;
                        }
                        const addH = Math.min(spaceOnPage, blockRemaining);
                        const srcH = (addH / imgFullHeightPdf) * canvas.height;

                        const clipCanvas = document.createElement('canvas');
                        clipCanvas.width = canvas.width;
                        clipCanvas.height = srcH;
                        const ctx = clipCanvas.getContext('2d');
                        ctx.drawImage(canvas, 0, srcOffset, canvas.width, srcH, 0, 0, canvas.width, srcH);

                        pdf.addImage(clipCanvas.toDataURL('image/png', 1.0), 'PNG', margin, margin + currentY, imgWidthPdf, addH);

                        currentY += addH;
                        srcOffset += srcH;
                        blockRemaining -= addH;
                    }
                }
            } finally {
                document.body.removeChild(tempContainer);
            }
        }

        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(100);
            pdf.text(
                `Page ${i} of ${pageCount}`,
                pdfWidth / 2,
                pdfHeight - 0.5,
                { align: 'center' }
            );
        }

        return pdf;
    };

    const handleDownloadDoc = async () => {
        setLoadingState('doc', true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const cleanContent = cleanHtmlForWord(reportContent);
            const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Teaching Evaluation Report</title></head><body>`;
            const footer = `</body></html>`;
            const fullHTML = header + cleanContent + footer;
            const blob = new Blob(['\ufeff', fullHTML], { type: 'application/msword' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Teaching_Evaluation_Report.doc';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
        } catch (error) {
            console.error("DOC generation failed:", error);
            alert(`Failed to generate Word document: ${error.message}.`);
        } finally {
            setLoadingState('doc', false);
        }
    };

    const cleanHtmlForWord = (html) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        // Simple cleanup if needed
        return tempDiv.innerHTML;
    };

    const handleDownloadPDF = async () => { 
        setLoadingState('pdf', true);
        await new Promise(resolve => setTimeout(resolve, 100));
        try {
            const pdf = await generatePdf();
            pdf.save('Teaching_Evaluation_Report.pdf');
            setLoadingState('pdf', false);
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert(`Failed to generate PDF: ${error.message}.`);
            setLoadingState('pdf', false);
        }
    };

    const handleAiSupportForAllSections = async () => {
        if (!genAI) {
            alert('AI Service is not initialized. Please check your API key.');
            return;
        }
        if (!structuredData || loading.ai) return;

        setLoadingState('ai', true);
        setLoading(prev => ({ ...prev, aiProgress: '(starting...)' }));

        try {
            // Updated Role and Instructions
            const facultySpecialistRole = `You are a faculty development specialist and an expert in effective teaching strategies.`;
            const { sections, feedbacks } = structuredData;
            
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const sectionTitles = Object.keys(sections);
            if (feedbacks && feedbacks['Additional Feedback']) {
                sectionTitles.push('Additional Feedback');
            }

            if (sectionTitles.length === 0) {
                 if (backgroundInfo.goal || backgroundInfo.outline) {
                    sectionTitles.push('Introduction'); 
                 } else {
                     console.log('No data found for AI.');
                     setLoadingState('ai', false);
                     return;
                 }
            }

            const newAiFeedbacks = { ...aiFeedbacks };
            const totalSections = sectionTitles.length;
            let generatedCount = 0;

            for (let i = 0; i < totalSections; i++) {
                const sectionTitle = sectionTitles[i];
                setLoading(prev => ({ ...prev, aiProgress: `(${i + 1}/${totalSections})` }));

                let promptContent = '';

                // Сборка контента
                if (sectionTitle === 'Additional Feedback') {
                    promptContent = feedbacks['Additional Feedback'] || '';
                } else if (sections[sectionTitle]) {
                    const sectionData = sections[sectionTitle];
                    if (sectionData.observations?.length) promptContent += `Raw Observations Notes: ${sectionData.observations.join('. ')}\n`;
                    
                    const recommendationsText = sectionData.recommendations
                        .map(rec => rec.description + (rec.feedbackText ? ` (Comment: ${rec.feedbackText})` : ''))
                        .join('. ');
                    
                    if (recommendationsText) promptContent += `Raw Recommendations Notes: ${recommendationsText}\n`;
                    if (feedbacks?.[sectionTitle]) promptContent += `Instructor feedback context: ${feedbacks[sectionTitle]}`;
                } else if (sectionTitle === 'Introduction' && !sections['Introduction']) {
                    promptContent = `Goal: ${backgroundInfo.goal}. Outline: ${backgroundInfo.outline}.`;
                }

                if (!promptContent.trim()) continue;

                // --- NEW REFINED PROMPT ---
                const userPrompt = `
                ${facultySpecialistRole}

                Task: Write a formal observation report section for **"${sectionTitle}"** based on the notes below. This is for a single specific class session.

                STRICT GUIDELINES:
                1. **PAST TENSE ONLY**: Write all observations in the past tense (e.g., "The instructor asked...", "Students responded...", "The class started...").
                2. **OBJECTIVE OBSERVATIONS**: Under the "Observations" header, describe ONLY what happened. Do not evaluate, judge, or praise in this section. (Correct: "The instructor used a slide." Incorrect: "The instructor effectively used a slide.")
                3. **EVALUATIVE RECOMMENDATIONS**: Put all judgments, praise, critiques, and suggestions under the "Recommendations for Improvement" header.
                4. **NO FILLER**: Do NOT start with "As a specialist...", "Based on the notes...", or "Here is the report". Start directly with the first header.
                
                REQUIRED FORMAT:
                ## Observations
                [Write the descriptive narrative here in past tense]

                ## Recommendations for Improvement
                [Write the evaluative feedback and specific suggestions here]

                INPUT NOTES:
                ${promptContent}
                `;

                // --- ЛОГИКА ПОВТОРА (RETRY) ---
                let attempts = 0;
                let success = false;
                
                while (attempts < 3 && !success) {
                    try {
                        const result = await model.generateContent(userPrompt);
                        const response = await result.response;
                        const rawText = response.text();
                        newAiFeedbacks[sectionTitle] = formatAiResponse(rawText);
                        generatedCount++;
                        success = true;
                    } catch (error) {
                        console.error(`Attempt ${attempts + 1} failed for ${sectionTitle}:`, error);
                        
                        if (error.message.includes('429') || error.message.includes('503')) {
                            attempts++;
                            const waitTime = 5000 * attempts; 
                            console.warn(`Rate limit hit. Waiting ${waitTime / 1000}s before retry...`);
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                        } else {
                            break; 
                        }
                    }
                }

                // ВАЖНО: Пауза 4 секунды между запросами (чтобы не превысить 15 RPM)
                if (i < totalSections - 1) {
                     await new Promise(resolve => setTimeout(resolve, 4000));
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
            const { selectedRecommendations, evaluationId, observerId, instructorId, classId } = location.state;
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

                    <div id="report-content" className="report-editor-container">
                        <ReactQuill
                            value={reportContent}
                            onChange={setReportContent}
                            theme="snow"
                            className="custom-quill-editor"
                        />
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
                    <Spinner animation="border" role="status" variant="light" style={{ width: '3rem', height: '3rem' }}>
                    </Spinner>
                    <h5 className="mt-3 text-white">{loadingText}</h5>
                </div>
            )}
        </>
    );
};

export default ViewReports;