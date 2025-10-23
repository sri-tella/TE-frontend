import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import Header from '../../components/Header/header';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './mainform.css';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

const ViewReports = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [reportContent, setReportContent] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [backgroundInfo, setBackgroundInfo] = useState({ goal: '', help: '', outline: '' });
    const [structuredData, setStructuredData] = useState(null);
    const [aiFeedbacks, setAiFeedbacks] = useState({});
    const [isAiLoading, setIsAiLoading] = useState(false);

    const genAI = useMemo(() => {
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set in environment variables');
            return null;
        }
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

        const sectionMapping = { "Introduction": "Introduction", "Organization": "Organization", "Content": "Content", "Visuals & PPT": "Visual Aids and Technology", "Pacing": "Delivery", "Affect": "Delivery", "Speech & Delivery": "Delivery", "Specific Activities": "Activities", "Student-Instructor Interactions": "Activities", "Expectations for Student Behavior": "Student Behavior", "Conclusion": "Conclusion" };
        const manualOrder = [ "Introduction", "Organization", "Content", "Visual Aids and Technology", "Delivery", "Activities", "Student Behavior", "Conclusion" ];
        const categoryQuestions = { "Introduction": "Introduction: In what ways did the introduction capture your (and students') interest? How were the first few minutes of class related to the purpose of the class session overall?", "Organization": "Organization: How was the class time organized? How were materials used? Were transitions between activities or materials clear and effective?", "Content": "Content: How well did the instructor demonstrate thorough understanding of the content? Did the instructor support his or her points? How was the instructor's level of content competence related to students' learning?", "Visual Aids and Technology": "Visual Aids and Technology: How were visual aids used? How was technology used? Were the visual aids/technology appropriate for the lesson and context? How did the visual aids/technology enhance or improve the learning process?", "Delivery": "Delivery: Was the instructor's teaching persona effective? Consider tone and volume of voice, gestures, posture, and expressions. What strengths of delivery did you observe? Any recommendations in the area of delivery?", "Activities": "Activities: How did the instructor encourage student participation or create the environment for students to participate? How well did these activities relate to the goal, objective, or purpose of the class session? How well did the instructor direct students' behavior to promote learning? How did the instructor engage with or respond to student's contributions?", "Student Behavior": "Student Behavior: How engaged were students in the class session? Did students seem to be aware of the learning goal, objective, or purpose of the class session? In what ways did students interact with the professor and each other? How would you describe the attitude of students?", "Conclusion": "Conclusion: Did the instructor end the class session effectively? Did he/she summarize key points? Leave time for questions? Tease the next topic?" };

        const renderListWithFeedback = (items) => {
            if (!items || items.length === 0) return '<p><em>No data provided.</em></p>';
            return `<ul>${items.map(item => {
                let content = item.description || item;
                let comment = item.feedbackText ? `<br/><em><small>&nbsp;&nbsp;(Comment: ${item.feedbackText})</small></em>` : '';
                return `<li>${content}${comment}</li>`;
            }).join('')}</ul>`;
        };

        let report = `<h2>Teaching Evaluation Report</h2><h3>Observation Information</h3><p><strong>Instructor:</strong> ${instructorName}</p><p><strong>Date of Observation:</strong> ${formattedDate}</p><p><strong>Time:</strong> ${formattedTime}</p><p><strong>Class Session Topic or Course Subject:</strong> ${classTopic}</p><p><strong>Observer:</strong> ${observerFirstName} ${observerLastName}</p><h3>Background Information</h3><p><strong>What is the learning goal or objective for todays class session?/Objective:</strong><br>${bgInfo.goal || 'N/A'}</p><p><strong>Please provide a brief outline or sketch of how class session will proceed?</strong><br>${bgInfo.outline || 'N/A'}</p><p><strong>How might the observer be particularly helpful in the observation process? Are there elements of the class session that might benefit from detailed feedback or focused attention?</strong><br>${bgInfo.help || 'N/A'}</p><h3>Observation</h3>`;
        manualOrder.forEach((category, index) => {
            const secData = sections[category] || { observations: [], recommendations: [] };
            report += `<h4>${index + 1}. ${categoryQuestions[category]}</h4>`;
            report += `<p><strong>Observations:</strong></p><ul>${secData.observations.map(obs => `<li>${obs}</li>`).join('') || '<li><em>No observations recorded.</em></li>'}</ul>`;
            report += `<p><strong>Recommendations:</strong></p>${renderListWithFeedback(secData.recommendations)}`;
            const sectionAiAssistance = aiFbs[category];
            if (sectionAiAssistance && sectionAiAssistance.trim()) {
                report += `<div style="padding-left: 30px;"><div style="margin-top: 10px; padding: 15px; background-color: #f0f7ff; border-left: 5px solid #007bff; border-radius: 4px; font-family: sans-serif;"><span style="margin: 0 0 10px 0; font-size: 25px !important; color: #0056b3;"><strong>🤖 AI Assistance:</strong></span><div>${sectionAiAssistance}</div></div></div>`;
            }
        });
        report += `<h3>Additional Feedback</h3><h4>Did the class session meet the instructor's goal or objective (if a goal or objective was identified)? What other responses do you have regarding the class goal or objective?</h4><p>${(feedbacks && feedbacks['Additional Feedback']) || '<em>No data provided.</em>'}</p>`;
        const additionalAiAssistance = aiFbs['Additional Feedback'];
        if (additionalAiAssistance) {
            report += `<div style="padding-left: 30px;"><div style="margin-top: 10px; padding: 15px; background-color: #f0f7ff; border-left: 5px solid #007bff; border-radius: 4px; font-family: sans-serif;"><span style="margin: 0 0 10px 0; font-size: 20px !important; color: #0056b3;"><strong>🤖 AI Assistance:</strong></span><div>${additionalAiAssistance}</div></div></div>`;
        }
        report += `<h4>Other Comments or Recommendations</h4><p>${(feedbacks && feedbacks['Other Comments or Recommendations']) || '<em>No data provided.</em>'}</p>`;
        
        return report.replace(/<p><br><\/p>/g, '');
    }, []);
    
    useEffect(() => {
        if (!location.state) { navigate('/reports'); return; }
        const storedRecs = JSON.parse(localStorage.getItem('selectedRecommendations') || '[]');
        const storedFeedbacks = JSON.parse(localStorage.getItem('selectedRecFeedbacks') || '{}');
        const selectedRecommendations = location.state?.selectedRecommendations || storedRecs;
        const feedbacks = location.state?.feedbacks || storedFeedbacks;
        if (!Array.isArray(selectedRecommendations) || selectedRecommendations.length === 0) { setSuccessMessage('No recommendations data found.'); return; }
        const sectionMapping = { "Introduction": "Introduction", "Organization": "Organization", "Content": "Content", "Visuals & PPT": "Visual Aids and Technology", "Pacing": "Delivery", "Affect": "Delivery", "Speech & Delivery": "Delivery", "Specific Activities": "Activities", "Student-Instructor Interactions": "Activities", "Expectations for Student Behavior": "Student Behavior", "Conclusion": "Conclusion" };
        const groupedBySection = {};
        selectedRecommendations.forEach((rec) => {
            if (!rec || !rec.sectionTitle) return;
            const category = sectionMapping[rec.sectionTitle] || rec.sectionTitle;
            if (!groupedBySection[category]) groupedBySection[category] = { observations: [], recommendations: [] };
            if (rec.observedDescription && !groupedBySection[category].observations.includes(rec.observedDescription)) {
                groupedBySection[category].observations.push(rec.observedDescription);
            }
            groupedBySection[category].recommendations.push(rec);
        });
        setStructuredData({ sections: groupedBySection, feedbacks });
        const selectedInstructor = JSON.parse(localStorage.getItem('selectedInstructor') || '{}');
        const classId = selectedInstructor?.classId;
        if (classId) {
            fetch(`https://teachingeval.netlify.app/api/classes/${classId}`)
                .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch"))
                .then(data => setBackgroundInfo({ goal: data.goal || '', outline: data.outline || '', help: data.help || '' }))
                .catch(err => { console.error("Error fetching background info:", err); setBackgroundInfo({ goal: 'N/A', outline: 'N/A', help: 'N/A' }); });
        }
    }, [location.state, navigate]);

    useEffect(() => {
        if (structuredData) {
            const report = generateReportContent(structuredData, aiFeedbacks, backgroundInfo);
            setReportContent(report);
        }
    }, [structuredData, aiFeedbacks, backgroundInfo, generateReportContent]);

    const generatePdf = async () => {
    const pdf = new jsPDF('p', 'in', 'letter');
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 8.5 in
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 11 in
    const margin = 1; // in
    const contentWidth = pdfWidth - 2 * margin; // 6.5 in
    const availableHeight = pdfHeight - margin - 1.5; // Увеличил буфер до 1.5 для большего отступа снизу и избежания пересечения с футером

    // Global style (добавил margin: 0 и padding: 0 для body, чтобы избежать лишних отступов сверху)
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
            width: `${contentWidth * 72}pt`, // Precision: 1in = 72pt
            backgroundColor: 'white',
            fontFamily: 'Times New Roman, serif',
            fontSize: '12pt',
            lineHeight: '1.4',
            margin: '0',
            padding: '0' // Добавил padding: 0 для избежания лишних отступов
        });
        tempContainer.appendChild(style.cloneNode(true));
        tempContainer.appendChild(block);
        document.body.appendChild(tempContainer);

        try {
            const scale = 4; // High res for quality
            const canvas = await html2canvas(tempContainer, {
                scale: scale,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgWidthPdf = contentWidth;
            const imgAspect = canvas.height / canvas.width;
            const imgFullHeightPdf = imgWidthPdf * imgAspect;

            // Проверяем, нужно ли разбивать блок (если блок больше страницы)
            const needSplit = imgFullHeightPdf > availableHeight;

            if (!needSplit) {
                // Если блок помещается на страницу целиком, проверяем пространство на текущей странице
                let spaceOnPage = availableHeight - currentY;
                let positionY = margin + currentY;
                if (imgFullHeightPdf > spaceOnPage) {
                    pdf.addPage();
                    pageCount++;
                    currentY = 0;
                    positionY = margin + currentY;
                }
                pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', margin, positionY, imgWidthPdf, imgFullHeightPdf);
                currentY += imgFullHeightPdf;
            } else {
                // Если блок слишком большой, разбиваем с клиппингом (как раньше, но с большим буфером)
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

                    // Create clipped canvas
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

    // Add page numbers (переместил футер чуть ниже для большего буфера)
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(
            `Page ${i} of ${pageCount}`,
            pdfWidth / 2,
            pdfHeight - 0.5, // Переместил футер ближе к底 (0.5in от низа вместо 0.75)
            { align: 'center' }
        );
    }

    return pdf;
};  

    const handleDownloadDoc = () => {
        try {
            const cleanContent = cleanHtmlForWord(reportContent);
            
            const header = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                      xmlns:w='urn:schemas-microsoft-com:office:word' 
                      xmlns='http://www.w3.org/TR/REC-html40'
                      xmlns:v='urn:schemas-microsoft-com:vml'
                      xmlns:wx='urn:schemas-microsoft-com:office:word'>
                <head>
                    <meta charset='utf-8'>
                    <title>Teaching Evaluation Report</title>
                    <!--[if gte mso 9]><xml>
                        <w:WordDocument>
                            <w:View>Print</w:View>
                            <w:DoNotOptimizeForBrowser/>
                        </w:WordDocument>
                    </xml><![endif]-->
                    <style>
                        @page WordSection1 {
                            size: 8.5in 11.0in;
                            margin: 1.0in 1.0in 1.0in 1.0in;
                            mso-header-margin: 0.5in;
                            mso-footer-margin: 0.5in;
                            mso-footer: f1;
                            mso-paper-source:0;
                        }
                        div.WordSection1 {
                            page: WordSection1;
                        }
                        p.MsoFooter, li.MsoFooter, div.MsoFooter {
                            margin: 0in;
                            font-size: 10.0pt;
                            font-family: "Times New Roman", serif;
                            text-align: center;
                        }
                        p.MsoHeader, li.MsoHeader, div.MsoHeader {
                            margin: 0in;
                            font-size: 10.0pt;
                            font-family: "Times New Roman", serif;
                        }
                        ul, ol {
                            margin-left: 0.5in;
                            margin-top: 0.1in;
                            margin-bottom: 0.1in;
                        }
                        li {
                            margin-bottom: 0.05in;
                        }
                        h2, h3, h4 {
                            margin-top: 0.2in;
                            margin-bottom: 0.1in;
                        }
                        p {
                            margin: 0.05in 0in;
                        }
                    </style>
                </head>
                <body>
                    <div class="WordSection1">
            `;
            
            const footerDiv = `
                    </div>
                    <div style='mso-element:footer' id='f1'>
                        <p class="MsoFooter">
                            Page <span style='mso-field-code:"PAGE \\* MERGEFORMAT"'></span> of <span style='mso-field-code:"NUMPAGES \\* MERGEFORMAT"'></span>
                        </p>
                    </div>
                </body>
                </html>
            `;

            const fullHTML = header + cleanContent + footerDiv;

            const blob = new Blob(['\ufeff', fullHTML], { 
                type: 'application/msword' 
            });
            
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
        }
    };

    // --- УЛУЧШЕННАЯ ОЧИСТКА HTML ДЛЯ WORD (без изменений) ---
    const cleanHtmlForWord = (html) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Удаляем все атрибуты стилей
        const elements = tempDiv.getElementsByTagName('*');
        for (let i = 0; i < elements.length; i++) {
            elements[i].removeAttribute('style');
            elements[i].removeAttribute('class');
        }

        // Заменяем Quill-списки на стандартные
        const quillLists = tempDiv.querySelectorAll('[class*="ql-indent"]');
        quillLists.forEach(list => {
            const newList = document.createElement(list.tagName.toLowerCase());
            Array.from(list.children).forEach(li => {
                newList.appendChild(li.cloneNode(true));
            });
            list.parentNode.replaceChild(newList, list);
        });

        return tempDiv.innerHTML;
    };

    const handleDownloadPDF = async () => {
        try {
            const pdf = await generatePdf();
            pdf.save('Teaching_Evaluation_Report.pdf');
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert(`Failed to generate PDF: ${error.message}.`);
        }
    };

    // Остальной код (AI support, save evaluation) остается без изменений
    const handleAiSupportForAllSections = async () => {
        if (!genAI) {
            alert('AI Service is not initialized. Please check your API key in .env file.');
            return;
        }
        if (!structuredData || isAiLoading) {
            return;
        }

        setIsAiLoading(true);
        try {
            const facultySpecialistRole = `You are a faculty development specialist with two decades of experience and an expert in effective teaching strategies. You are also a faculty member yourself, with empathy and understanding for the full context, rewards, and challenges of teaching in higher education.`;
            const { sections, feedbacks } = structuredData;
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                systemInstruction: facultySpecialistRole,
            });
            const sectionTitles = Object.keys(sections);

            if (feedbacks && feedbacks['Additional Feedback']) {
                sectionTitles.push('Additional Feedback');
            }

            if (sectionTitles.length === 0) {
                alert('No sections with data found to generate AI feedback.');
                setIsAiLoading(false);
                return;
            }

            const promises = sectionTitles.map(async (sectionTitle) => {
                let promptContent = '';
                if (sectionTitle === 'Additional Feedback') {
                    promptContent = feedbacks['Additional Feedback'] || '';
                } else if (sections[sectionTitle]) {
                    const sectionData = sections[sectionTitle];
                    if (sectionData.observations && sectionData.observations.length > 0) {
                        promptContent += `Observations: ${sectionData.observations.join('. ')}\n`;
                    }
                    const recommendationsText = sectionData.recommendations.map(rec => {
                        let text = rec.description;
                        if (rec.feedbackText) {
                            text += ` (Comment: ${rec.feedbackText})`;
                        }
                        return text;
                    }).join('. ');
                    if (recommendationsText.trim()) {
                        promptContent += `Recommendations: ${recommendationsText}\n`;
                    }
                    
                    if (feedbacks && feedbacks[sectionTitle]) {
                        promptContent += `\nInstructor's own feedback for this section: ${feedbacks[sectionTitle]}`;
                    }
                }

                if (!promptContent.trim()) {
                    return { sectionTitle, content: null };
                }

                const userPrompt = `Convert these notes to full prose, with complete sentences and paragraphs. Keep observations (what was observed) separate from recommendations (what to suggest for improvement). Provide rationale for recommendations. Use markdown for formatting, specifically "##" for headings and "**" for bold text.
                    Here are the notes for the section "${sectionTitle}":
                    ${promptContent}`;
                try {
                    const result = await model.generateContent(userPrompt);
                    const rawText = result.response.text();
                    const formattedContent = formatAiResponse(rawText);
                    return { sectionTitle, content: formattedContent || null };
                } catch (error) {
                    console.error(`Error generating content for ${sectionTitle}:`, error);
                    return { sectionTitle, content: null, error };
                }
            });

            const results = await Promise.all(promises);
            const newAiFeedbacks = { ...aiFeedbacks };
            let generatedCount = 0;

            results.forEach(result => {
                if (result && result.content) {
                    newAiFeedbacks[result.sectionTitle] = result.content;
                    generatedCount++;
                }
            });

            setAiFeedbacks(newAiFeedbacks);

            if (generatedCount > 0) {
                // setSuccessMessage(`AI feedback generated successfully for ${generatedCount} sections!`);
                // setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                alert('Could not generate AI feedback for any section. Check console for details.');
            }
        } catch (error) {
            console.error('Detailed error in AI support handler:', error);
            alert(`Failed to get AI assistance: ${error.message}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSaveEvaluation = async () => {
        if (!location.state) {
            alert('Missing evaluation data. Please go back and try again.');
            return;
        }

        try {
            const currentDate = new Date().toISOString().split('T')[0];
            const { selectedRecommendations, evaluationId, observerId, instructorId, classId } = location.state;

            if (!selectedRecommendations || !observerId || !instructorId || !classId) {
                throw new Error('Missing required evaluation data');
            }

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

            const response = await fetch(`https://teachingeval.netlify.app/api/evaluations/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(evaluationData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const input = document.getElementById('printable-report');
            if (!input) {
                throw new Error('Report element not found');
            }

            const canvas = await html2canvas(input);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const imgWidth = 190;
            const pageHeight = pdf.internal.pageSize.height;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const pdfBlob = pdf.output('blob');
            const formData = new FormData();
            formData.append('file', pdfBlob, 'report.pdf');
            formData.append('evaluationId', evaluationId || '1');

            const pdfResponse = await fetch(`https://teachingeval.netlify.app/api/reports/save-pdf`, {
                method: 'POST',
                body: formData,
            });

            if (!pdfResponse.ok) {
                const errorText = await pdfResponse.text();
                throw new Error(`PDF save error: ${pdfResponse.status} - ${errorText}`);
            }

            localStorage.removeItem('selectedRecommendations');
            localStorage.removeItem('selectedRecFeedbacks');
            localStorage.removeItem('evaluateFeedbacks');
            localStorage.removeItem('selectedOptions');

            setSuccessMessage('Report saved successfully!');
            setTimeout(() => setSuccessMessage(''), 5000);

        } catch (error) {
            console.error('Error saving evaluation or PDF:', error);
            setSuccessMessage(`Failed to save the report: ${error.message}`);
            setTimeout(() => setSuccessMessage(''), 5000);
        }
    };

    return (
        <>
            <Header />
            <div className="container mt-4">
                <h4>Final Report</h4>
                <div id="report-content">
                    <ReactQuill
                        value={reportContent}
                        onChange={setReportContent}
                        theme="snow"
                        modules={{ toolbar: [ [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['bold', 'italic', 'underline', 'strike', 'blockquote'], [{ 'align': [] }], ['link', 'image'], ['clean'] ]}}
                        formats={[ 'header', 'font', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'list', 'bullet', 'link', 'image', 'align' ]}
                        style={{ minHeight: '300px', backgroundColor: '#fff', marginBottom: '5rem' }}
                    />
                </div>

                <div className="mt-3">
                    <Button onClick={() => navigate('/SelectedRecommendations')} className="button-custom mr-2">Go Back</Button>
                    <Button onClick={handleAiSupportForAllSections} className="button-custom mr-2 mb-2" disabled={isAiLoading || !genAI || Object.keys(aiFeedbacks).length > 0}>
                        {isAiLoading ? 'Generating...' : Object.keys(aiFeedbacks).length > 0 ? 'AI Feedback Generated' : 'Generate AI Feedback'}
                    </Button>
                    <Button onClick={handleSaveEvaluation} className="button-custom mr-2">Save Report</Button>
                    <Button onClick={handleDownloadPDF} className="button-custom mr-2">Download PDF</Button>
                    <Button onClick={handleDownloadDoc} className="button-custom mr-2">Download Word Doc</Button>
                    {successMessage && (<div className={`mt-2 ${successMessage.includes('Failed') ? 'text-danger' : 'text-success'}`}>{successMessage}</div>)}
                </div>
            </div>
        </>
    );
};

export default ViewReports;
