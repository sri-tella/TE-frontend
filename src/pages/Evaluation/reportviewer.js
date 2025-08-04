import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import Header from '../../components/Header/header';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './mainform.css';

const ViewReports = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [reportContent, setReportContent] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [backgroundInfo, setBackgroundInfo] = useState({goal: '', help: '', outline: ''});
//  console.log(localStorage);

useEffect(() => {

  // Load observer and instructor info
  const observerFirstName = localStorage.getItem('firstName') || '';
  const observerLastName = localStorage.getItem('lastName') || '';
  const selectedInstructor = JSON.parse(localStorage.getItem('selectedInstructor') || '{}');
  const classId = selectedInstructor?.classId;

  const instructorName = selectedInstructor?.instructorFirstName && selectedInstructor?.instructorLastName
    ? `${selectedInstructor.instructorFirstName} ${selectedInstructor.instructorLastName}`
    : '';

  const classTopic = selectedInstructor?.courseTitle || '';

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  //fetch background info from backend
  if(classId) {
    fetch(`https://te-backend-production.up.railway.app/api/classes/${classId}`)
      .then(res => {
        if(!res.ok) throw new Error("Failed to fetch background info");
        return res.json();
      })
      .then(data => {
        setBackgroundInfo({
          goal: data.goal,
          outline: data.outline,
          help: data.help
        });
        console.log(data);
      })
      .catch(err => console.error("Error fetching background info:", err));
      }

  // Load from state or localStorage
  const storedRecs = JSON.parse(localStorage.getItem('selectedRecommendations')) || [];
  const storedFeedbacks = JSON.parse(localStorage.getItem('selectedRecFeedbacks')) || {};
  const selectedRecommendations = location.state?.selectedRecommendations || storedRecs;
  const feedbacks = location.state?.feedbacks || storedFeedbacks;

  // Map app sections to 8 unique manual categories
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

  // 8 unique manual form questions (final order)
  const manualOrder = [
    "Introduction",
    "Organization",
    "Content",
    "Visual Aids and Technology",
    "Delivery",
    "Activities",
    "Student Behavior",
    "Conclusion"
  ];

  // Full question text
  const categoryQuestions = {
    "Introduction": "Introduction: In what ways did the introduction capture your (and students’) interest? How were the first few minutes of class related to the purpose of the class session overall?",
    "Organization": "Organization: How was the class time organized? How were materials used? Were transitions between activities or materials clear and effective?",
    "Content": "Content: How well did the instructor demonstrate thorough understanding of the content? Did the instructor support his or her points? How was the instructor’s level of content competence related to students’ learning?",
    "Visual Aids and Technology": "Visual Aids and Technology: How were visual aids used? How was technology used? Were the visual aids/technology appropriate for the lesson and context? How did the visual aids/technology enhance or improve the learning process?",
    "Delivery": "Delivery: Was the instructor’s teaching persona effective? Consider tone and volume of voice, gestures, posture, and expressions. What strengths of delivery did you observe? Any recommendations in the area of delivery?",
    "Activities": "Activities: How did the instructor encourage student participation or create the environment for students to participate? How well did these activities relate to the goal, objective, or purpose of the class session? How well did the instructor direct students’ behavior to promote learning? How did the instructor engage with or respond to student’s contributions?",
    "Student Behavior": "Student Behavior: How engaged were students in the class session? Did students seem to be aware of the learning goal, objective, or purpose of the class session? In what ways did students interact with the professor and each other? How would you describe the attitude of students?",
    "Conclusion": "Conclusion: Did the instructor end the class session effectively? Did he/she summarize key points? Leave time for questions? Tease the next topic?"
  };

  // Group selected data by final category
  const grouped = {};
  selectedRecommendations.forEach((rec) => {
    const category = sectionMapping[rec.sectionTitle] || rec.sectionTitle;
    if (!grouped[category]) grouped[category] = { observations: [], recommendations: [] };

    if (!grouped[category].observations.includes(rec.observedDescription)) {
      grouped[category].observations.push(rec.observedDescription);
    }
    if (!grouped[category].recommendations.includes(rec.description)) {
      grouped[category].recommendations.push(rec.description);
    }
  });

  // Helper for rendering lists
  const renderList = (items) =>
    items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '<p><em>No data provided.</em></p>';

  // Build full report
  let report = `
    <h2>Teaching Evaluation Report</h2>

    <h3>Observation Information</h3>
      <p><strong>Instructor:</strong> ${instructorName}</p>
      <p><strong>Date of Observation:</strong> ${formattedDate}</p>
      <p><strong>Time:</strong> ${formattedTime}</p>
      <p><strong>Class Session Topic or Course Subject:</strong> ${classTopic}</p>
      <p><strong>Observer:</strong> ${observerFirstName} ${observerLastName}</p>

      <h3>Background Information</h3>
      <p><strong>What is the learning goal or objective for todays class session?/Objective:</strong><br>${backgroundInfo.goal}</p>
      <p><strong>Please provide a brief outline or sketch of how class session will proceed?</strong><br>${backgroundInfo.outline}</p>
      <p><strong>How might the observer be particularly helpful in the observation process? Are there elements of the class session that might benefit from detailed feedback or focused attention?</strong><br>${backgroundInfo.help}</p>

    <h3>Observation</h3>
  `;

  // Numbered questions 1–8
  let sectionNumber = 1;
  manualOrder.forEach((category) => {
    const secData = grouped[category] || { observations: [], recommendations: [] };
    report += `<h4>${sectionNumber}. ${categoryQuestions[category]}</h4>`;
    sectionNumber++;
    report += `<p><strong>Observations:</strong></p>${renderList(secData.observations)}`;
    report += `<p><strong>Recommendations:</strong></p>${renderList(secData.recommendations)}`;
    if (feedbacks[category]) {
      report += `<p><strong>Additional Feedback:</strong></p><ul><li>${feedbacks[category]}</li></ul>`;
    }
  });

  // 9: Additional Feedback
  report += `<h3>Additional Feedback</h3>`;
  report += `<h4>Did the class session meet the instructor’s goal or objective (if a goal or objective was identified)? What other responses do you have regarding the class goal or objective?</h4>`;
  report += `<p>${feedbacks['Additional Feedback'] || '<em>No data provided.</em>'}</p>`;

  // 10: Other Comments
  report += `<h4>Other Comments or Recommendations</h4>`;
  report += `<p>${feedbacks['Other Comments or Recommendations'] || '<em>No data provided.</em>'}</p>`;

  setReportContent(report);
}, [location.state]);

//  console.log("location.state:", location.state);

  const handleSaveEvaluation = async () => {
    const currentDate = new Date().toISOString().split('T')[0];
    const { selectedRecommendations, evaluationId, observerId, instructorId, classId, feedbacks } = location.state;

    const evaluationData = {
      date: currentDate,
      observerId,
      instructorId,
      classId,
      recommendations: selectedRecommendations.map(rec => ({
        description: rec.description,
        sectionTitle: rec.sectionTitle,
        feedback: location.state.feedbacks?.[rec.sectionTitle] || '',
        selected: true
      }))
    };

    console.log("Saving evaluationData:", evaluationData);

    try {
      const response = await fetch('https://te-backend-production.up.railway.app/api/evaluations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluationData),
      });

      if (!response.ok) throw new Error('Failed to save evaluation');

      const input = document.getElementById('printable-report');
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
      formData.append('evaluationId', evaluationId || 1);

      const pdfResponse = await fetch('https://te-backend-production.up.railway.app/api/reports/save-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!pdfResponse.ok) throw new Error('Failed to save PDF');
      localStorage.removeItem('selectedRecommendations');
      localStorage.removeItem('selectedRecFeedbacks');
      localStorage.removeItem('evaluateFeedbacks');
      localStorage.removeItem('selectedOptions');

      setSuccessMessage('Report saved successfully!');

    } catch (error) {
      console.error('Error saving evaluation or PDF:', error);
      setSuccessMessage('Failed to save the report.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const input = document.getElementById('printable-report');
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
      //Clearing saved evaluation data from localStorage after PDF is downloaded
      localStorage.removeItem('selectedRecommendations');
      localStorage.removeItem('selectedRecFeedbacks');
      localStorage.removeItem('selectedOptions');
      localStorage.removeItem('evaluateFeedbacks');
      setTimeout(() => {
        navigate('/reports');
      }, 10000);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleDownloadDoc = () => {
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

    // Clear localStorage after saving as DOC
    localStorage.removeItem('selectedRecommendations');
    localStorage.removeItem('selectedRecFeedbacks');
    localStorage.removeItem('selectedOptions');
    localStorage.removeItem('evaluateFeedbacks');

    setTimeout(() => {
      navigate('/reports');
    }, 3000);
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
                [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{'align': []}],
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
          visibility: 'visible',
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
          <Button onClick={handleSaveEvaluation} className="button-custom mr-2">
            Save Report
          </Button>
          <Button onClick={handleDownloadDoc} className="button-custom mr-2">
            Download Word Doc
          </Button>
          {successMessage && (
            <div className="text-success-custom">
              {successMessage}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewReports;

