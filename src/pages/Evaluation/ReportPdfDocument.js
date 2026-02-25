import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#fff', fontFamily: 'Helvetica' },
  header: { fontSize: 24, color: '#154734', marginBottom: 15, borderBottom: '2pt solid #FFB81C', paddingBottom: 8, textAlign: 'center', fontWeight: 'bold' },
  metaContainer: { marginBottom: 15, padding: 12, backgroundColor: '#fcfcfc', border: '1pt solid #eee' },
  subTitle: { fontSize: 15, color: '#154734', fontWeight: 'bold', marginBottom: 6 },
  text: { fontSize: 12, marginBottom: 4, color: '#212529' },
  sectionHeader: { fontSize: 13, color: '#154734', fontWeight: 'bold', backgroundColor: '#f5f5f5', padding: 8, marginTop: 15 },
  label: { fontWeight: 'bold', color: '#333' },
  contentBlock: { marginTop: 8, paddingLeft: 10 },
  listItem: { fontSize: 12, marginBottom: 4, lineHeight: 1.5 },
  aiBox: {  marginTop: 15,  padding: 15,  backgroundColor: '#ffffff',  borderLeft: '4pt solid #154734',  borderTop: '1pt solid #eee',  borderRight: '1pt solid #eee',
  borderBottom: '1pt solid #eee',},
  aiHeader: {  fontSize: 12,  color: '#154734',  fontWeight: 'bold',  textTransform: 'uppercase',  marginBottom: 10,  borderBottom: '0.5pt solid #eee',  paddingBottom: 5},
  footer: { position: 'absolute', bottom: 25, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#999' }
});

const ReportPdfDocument = ({ data, aiFeedbacks, backgroundInfo }) => {
  const { sections, feedbacks } = data;
  const instructor = JSON.parse(localStorage.getItem('selectedInstructor') || '{}');
  const instructorName = `${instructor.instructorFirstName || ''} ${instructor.instructorLastName || ''}`.trim();
  const observerName = `${localStorage.getItem('firstName') || ''} ${localStorage.getItem('lastName') || ''}`.trim();

  const categoryQuestions = {
    "Introduction": "1. Introduction: In what ways did the introduction capture interest?...",
    "Organization": "2. Organization: How was the class time organized?...",
    "Content": "3. Content: How well did the instructor demonstrate understanding?...",
    "Visual Aids and Technology": "4. Visual Aids and Technology: How was technology used?...",
    "Delivery": "5. Delivery: Was the instructor's teaching persona effective?...",
    "Activities": "6. Activities: How did the instructor encourage participation?...",
    "Student Behavior": "7. Student Behavior: How engaged were students?...",
    "Conclusion": "8. Conclusion: Did the instructor end effectively?..."
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.header}>Teaching Evaluation Report</Text>
        
        <View style={styles.metaContainer}>
          <Text style={styles.text}><Text style={styles.label}>Instructor: </Text>{instructorName}</Text>
          <Text style={styles.text}><Text style={styles.label}>Date: </Text>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          <Text style={styles.text}><Text style={styles.label}>Observer: </Text>{observerName}</Text>
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={styles.subTitle}>Background Information</Text>
          <Text style={styles.text}><Text style={styles.label}>Learning Goal/Objective: </Text>{backgroundInfo.goal || 'N/A'}</Text>
          <Text style={styles.text}><Text style={styles.label}>Outline: </Text>{backgroundInfo.outline || 'N/A'}</Text>
        </View>

        {Object.keys(categoryQuestions).map((cat) => {
          const sec = sections[cat] || { observations: [], recommendations: [] };
          return (
            <View key={cat} style={{ marginBottom: 15, paddingBottom: 10, borderBottom: '0.5pt solid #eee' }}>
              <Text style={styles.sectionHeader}>{categoryQuestions[cat]}</Text>
              <View style={styles.contentBlock}>
                <Text style={[styles.text, { fontWeight: 'bold' }]}>Observations:</Text>
                {sec.observations.length > 0 ? 
                  sec.observations.map((o, i) => <Text key={i} style={styles.listItem}>• {o}</Text>) :
                  <Text style={[styles.listItem, { fontStyle: 'italic', color: '#666' }]}>No observations recorded.</Text>
                }
                <Text style={[styles.text, { fontWeight: 'bold', marginTop: 5 }]}>Recommendations:</Text>
                {sec.recommendations.length > 0 ? 
                  sec.recommendations.map((r, i) => (
                    <Text key={i} style={styles.listItem}>
                      • {r.description || r} {r.feedbackText ? `(Comment: ${r.feedbackText})` : ''}
                    </Text>
                  )) :
                  <Text style={[styles.listItem, { fontStyle: 'italic', color: '#666' }]}>No observations recorded.</Text> 
                }
              </View>

              {aiFeedbacks[cat] && (
                <View style={{ marginTop: 10 }}>
                  {aiFeedbacks[cat]
                    .replace(/<\/div>/gi, '\n')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<[^>]*>?/gm, '')
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .map((line, i) => (
                      <Text key={i} style={[styles.text, { fontSize: 10, marginBottom: 3, lineHeight: 1.2 }]}>
                        {line.replace(/\*/g, '').replace(/##/g, '')}
                      </Text>
                    ))
                  }
                </View>
              )}
            </View>
          );
        })}

        <View wrap={false} style={{ marginTop: 20 }}>
          <Text style={[styles.subTitle, { fontSize: 16, borderBottom: '1pt solid #eee', paddingBottom: 5 }]}>Additional Feedback</Text>
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.text, { fontWeight: 'bold' }]}>Did the class session meet the instructor's goal or objective?</Text>
            <Text style={styles.text}>{feedbacks['Additional Feedback'] || 'No additional feedback provided.'}</Text>
          </View>
          <View style={{ marginTop: 15 }}>
            <Text style={[styles.text, { fontWeight: 'bold' }]}>Other Comments or Recommendations</Text>
            <Text style={styles.text}>{feedbacks['Other Comments or Recommendations'] || 'No other comments.'}</Text>
          </View>
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
};

export default ReportPdfDocument;