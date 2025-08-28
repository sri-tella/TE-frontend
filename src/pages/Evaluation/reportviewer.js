import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import Header from '../../components/Header/header';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './mainform.css';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    useEffect(() => {
        if (!location.state) {
            console.error('No state data found in location');
            navigate('/reports');
            return;
        }

        const observerFirstName = localStorage.getItem('firstName') || '';
        const observerLastName = localStorage.getItem('lastName') || '';
        const selectedInstructor = JSON.parse(localStorage.getItem('selectedInstructor') || '{}');
        const classId = selectedInstructor?.classId;
        const instructorName = `${selectedInstructor.instructorFirstName || ''} ${selectedInstructor.instructorLastName || ''}`.trim();
        const classTopic = selectedInstructor?.courseTitle || '';

        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        if (classId) {
            fetch(`http://localhost:8080/api/classes/${classId}`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch background info");
                    return res.json();
                })
                .then(data => setBackgroundInfo({
                    goal: data.goal || '',
                    outline: data.outline || '',
                    help: data.help || ''
                }))
                .catch(err => {
                    console.error("Error fetching background info:", err);
                    setBackgroundInfo({ goal: 'N/A', outline: 'N/A', help: 'N/A' });
                });
        }

        const storedRecs = JSON.parse(localStorage.getItem('selectedRecommendations') || '[]');
        const storedFeedbacks = JSON.parse(localStorage.getItem('selectedRecFeedbacks') || '{}');
        const selectedRecommendations = location.state?.selectedRecommendations || storedRecs;
        const feedbacks = location.state?.feedbacks || storedFeedbacks;

        if (!Array.isArray(selectedRecommendations) || selectedRecommendations.length === 0) {
            setSuccessMessage('No recommendations data found. Please go back and select recommendations.');
            return;
        }

        const sectionMapping = {
            "Introduction": "Introduction", "Organization": "Organization", "Content": "Content",
            "Visuals & PPT": "Visual Aids and Technology", "Pacing": "Delivery", "Affect": "Delivery",
            "Speech & Delivery": "Delivery", "Specific Activities": "Activities",
            "Student-Instructor Interactions": "Activities", "Expectations for Student Behavior": "Student Behavior",
            "Conclusion": "Conclusion"
        };
        const manualOrder = [
            "Introduction", "Organization", "Content", "Visual Aids and Technology", "Delivery",
            "Activities", "Student Behavior", "Conclusion"
        ];
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

        const groupedBySection = {};
        selectedRecommendations.forEach((rec) => {
            if (!rec || !rec.sectionTitle) return;
            const category = sectionMapping[rec.sectionTitle] || rec.sectionTitle;
            if (!groupedBySection[category]) {
                groupedBySection[category] = { observations: [], recommendations: [] };
            }
            if (rec.observedDescription && !groupedBySection[category].observations.includes(rec.observedDescription)) {
                groupedBySection[category].observations.push(rec.observedDescription);
            }
            if (rec.description && !groupedBySection[category].recommendations.includes(rec.description)) {
                groupedBySection[category].recommendations.push(rec.description);
            }
        });

        setStructuredData({ sections: groupedBySection, feedbacks });

        const renderList = (items) => items && items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '<p><em>No data provided.</em></p>';

        let report = `
            <h2>Teaching Evaluation Report</h2>
            <h3>Observation Information</h3>
            <p><strong>Instructor:</strong> ${instructorName}</p>
            <p><strong>Date of Observation:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Class Session Topic or Course Subject:</strong> ${classTopic}</p>
            <p><strong>Observer:</strong> ${observerFirstName} ${observerLastName}</p>
            <h3>Background Information</h3>
            <p><strong>What is the learning goal or objective for todays class session?/Objective:</strong><br>${backgroundInfo.goal || 'N/A'}</p>
            <p><strong>Please provide a brief outline or sketch of how class session will proceed?</strong><br>${backgroundInfo.outline || 'N/A'}</p>
            <p><strong>How might the observer be particularly helpful in the observation process? Are there elements of the class session that might benefit from detailed feedback or focused attention?</strong><br>${backgroundInfo.help || 'N/A'}</p>
            <h3>Observation</h3>`;

        manualOrder.forEach((category, index) => {
            const secData = groupedBySection[category] || { observations: [], recommendations: [] };
            report += `<h4>${index + 1}. ${categoryQuestions[category]}</h4>`;
            report += `<p><strong>Observations:</strong></p>${renderList(secData.observations)}`;
            report += `<p><strong>Recommendations:</strong></p>${renderList(secData.recommendations)}`;
            if (feedbacks && feedbacks[category]) {
                report += `<p><strong>Additional Feedback:</strong></p><ul><li>${feedbacks[category]}</li></ul>`;
            }
            const sectionAiAssistance = aiFeedbacks[category];
            if (sectionAiAssistance && sectionAiAssistance.trim()) {
                report += `<div style="margin-top:15px; padding:10px; background-color:#f8f9fa; border-left:4px solid #007bff;"><p style="margin:0;"><strong>🤖 AI Assistance:</strong></p><p style="margin:5px 0 0 0;">${sectionAiAssistance}</p></div>`;
            }
        });

        report += `<h3>Additional Feedback</h3>`;
        report += `<h4>Did the class session meet the instructor's goal or objective (if a goal or objective was identified)? What other responses do you have regarding the class goal or objective?</h4>`;
        report += `<p>${(feedbacks && feedbacks['Additional Feedback']) || '<em>No data provided.</em>'}</p>`;
        const additionalAiAssistance = aiFeedbacks['Additional Feedback'];
        if (additionalAiAssistance) {
            report += `<div style="margin-top:15px; padding:10px; background-color:#f8f9fa; border-left:4px solid #007bff;"><p style="margin:0;"><strong>🤖 AI Assistance:</strong></p><p style="margin:5px 0 0 0;">${additionalAiAssistance}</p></div>`;
        }

        report += `<h4>Other Comments or Recommendations</h4>`;
        report += `<p>${(feedbacks && feedbacks['Other Comments or Recommendations']) || '<em>No data provided.</em>'}</p>`;

        setReportContent(report);
    }, [location.state, aiFeedbacks, backgroundInfo, navigate]);

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
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash",
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
                    if (sectionData.recommendations && sectionData.recommendations.length > 0) {
                        promptContent += `Recommendations: ${sectionData.recommendations.join('. ')}\n`;
                    }
                    if (feedbacks && feedbacks[sectionTitle]) {
                        promptContent += `\nInstructor's own feedback for this section: ${feedbacks[sectionTitle]}`;
                    }
                }

                if (!promptContent.trim()) {
                    return { sectionTitle, content: null };
                }

                const userPrompt = `Convert these notes to full prose, with complete sentences and paragraphs. Keep observations (what was observed) separate from recommendations (what to suggest for improvement). Provide rationale for recommendations.
                    Here are the notes for the section "${sectionTitle}":
                    ${promptContent}`;
                try {
                    const result = await model.generateContent(userPrompt);
                    const text = result.response.text();
                    return { sectionTitle, content: text || null };
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
                setSuccessMessage(`AI feedback generated successfully for ${generatedCount} sections!`);
                setTimeout(() => setSuccessMessage(''), 3000);
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
                    feedback: location.state.feedbacks?.[rec.sectionTitle] || '',
                    selected: true
                }))
            };

            const response = await fetch(`http://localhost:8080/api/evaluations/save`, {
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

            const pdfResponse = await fetch(`http://localhost:8080/api/reports/save-pdf`, {
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

    const handleDownloadPDF = async () => {
        try {
            const input = document.getElementById('printable-report');
            if (!input) {
                throw new Error('Report element not found');
            }

            await new Promise(resolve => setTimeout(resolve, 300));
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

            pdf.save('report.pdf');

            localStorage.removeItem('selectedRecommendations');
            localStorage.removeItem('selectedRecFeedbacks');
            localStorage.removeItem('selectedOptions');
            localStorage.removeItem('evaluateFeedbacks');

            setTimeout(() => {
                navigate('/reports');
            }, 3000);

        } catch (error) {
            console.error("PDF generation failed:", error);
            alert(`Failed to generate PDF: ${error.message}. Please try again.`);
        }
    };

    const handleDownloadDoc = () => {
        try {
            const header = `
              <html xmlns:o='urn:schemas-microsoft-com:office:office'
                    xmlns:w='urn:schemas-microsoft-com:office:word'
                    xmlns='http://www.w3.org/TR/REC-html40'>
              <head><meta charset='utf-8'><title>Document</title></head><body>`;
            const footer = `</body></html>`;
            const fullHTML = header + reportContent + footer;

            const blob = new Blob(['\ufeff', fullHTML], {
                type: 'application/msword'
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'report.doc';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            localStorage.removeItem('selectedRecommendations');
            localStorage.removeItem('selectedRecFeedbacks');
            localStorage.removeItem('selectedOptions');
            localStorage.removeItem('evaluateFeedbacks');

            setTimeout(() => {
                navigate('/reports');
            }, 3000);

        } catch (error) {
            console.error("DOC generation failed:", error);
            alert(`Failed to generate Word document: ${error.message}. Please try again.`);
        }
    };

    return (
        <>
            <Header />
            <div className="container mt-4">
                <h4>Final Report</h4>
                <div id="report-content" style={{ padding: '20px', backgroundColor: '#fff', marginBottom: '20px' }}>
                    <ReactQuill
                        value={reportContent}
                        onChange={setReportContent}
                        theme="snow"
                        modules={{
                            toolbar: [
                                [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                [{ 'align': [] }],
                                ['link', 'image'],
                                ['clean']
                            ],
                        }}
                        formats={[
                            'header', 'font',
                            'bold', 'italic', 'underline', 'strike', 'blockquote',
                            'list', 'bullet',
                            'link', 'image', 'align'
                        ]}
                        style={{ minHeight: '300px', maxHeight: 'none', marginBottom: '5rem' }}
                    />
                </div>
                <div id="printable-report" style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: '0',
                    visibility: 'hidden',
                    zIndex: -1,
                    width: '800px',
                    padding: '20px',
                    color: '#000',
                    fontSize: '14px'
                }} dangerouslySetInnerHTML={{ __html: reportContent }} />

                <div className="mt-3">
                    <Button onClick={() => navigate('/SelectedRecommendations')} className="button-custom mr-2">
                        Go Back
                    </Button>
                    <Button
                        onClick={handleAiSupportForAllSections}
                        className="button-custom mr-2 mb-2"
                        disabled={isAiLoading || !genAI || Object.keys(aiFeedbacks).length > 0}
                    >
                        {isAiLoading
                            ? 'Generating AI Feedback...'
                            : Object.keys(aiFeedbacks).length > 0
                                ? 'AI Feedback Generated'
                                : 'Generate AI Feedback'
                        }
                    </Button>
                    <Button onClick={handleSaveEvaluation} className="button-custom mr-2">
                        Save Report
                    </Button>
                    <Button onClick={handleDownloadPDF} className="button-custom mr-2">
                        Download PDF
                    </Button>
                    <Button onClick={handleDownloadDoc} className="button-custom mr-2">
                        Download Word Doc
                    </Button>
                    {successMessage && (
                        <div className={`mt-2 ${successMessage.includes('Failed') || successMessage.includes('Error') ? 'text-danger' : 'text-success'}`}>
                            {successMessage}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ViewReports;