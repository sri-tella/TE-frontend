import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 50, backgroundColor: '#fff', fontFamily: 'Helvetica' },
  h2: { fontSize: 22, color: '#003015', marginBottom: 15, fontWeight: 'bold', borderBottom: '1pt solid #FFB81C', paddingBottom: 5 },
  h3: { fontSize: 16, color: '#003015', marginTop: 20, marginBottom: 10, fontWeight: 'bold' },
  h4: { fontSize: 13, color: '#003015', marginTop: 15, marginBottom: 8, fontWeight: 'bold', backgroundColor: '#f5f5f5', padding: 5 },
  p: { fontSize: 11, marginBottom: 8, color: '#333', lineHeight: 1.5 },
  strong: { fontWeight: 'bold', color: '#000' },
  listItem: { fontSize: 11, marginBottom: 5, paddingLeft: 15, color: '#333' },
  hr: { borderBottom: '1pt solid #eee', marginVertical: 15 },
  footer: { position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#999' },
  aiBox: { marginTop: 10, padding: 10, backgroundColor: '#f0fdf4', borderLeft: '3pt solid #003015' }
});

const ReportPdfDocument = ({ htmlContent }) => {
  if (!htmlContent) return null;

  // Очистка и разбивка HTML на части для рендеринга в PDF
  const parseHtml = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const elements = Array.from(tempDiv.childNodes);
    
    return elements.map((node, index) => {
      const tag = node.nodeName.toLowerCase();
      const text = node.textContent;

      if (tag === 'h2') return <Text key={index} style={styles.h2}>{text}</Text>;
      if (tag === 'h3') return <Text key={index} style={styles.h3}>{text}</Text>;
      if (tag === 'h4') return <Text key={index} style={styles.h4}>{text}</Text>;
      if (tag === 'hr') return <View key={index} style={styles.hr} />;
      
      if (tag === 'p') {
        // Проверка на жирный текст внутри параграфа
        const hasStrong = node.querySelector('strong');
        return (
          <Text key={index} style={styles.p}>
            {Array.from(node.childNodes).map((child, i) => (
              child.nodeName.toLowerCase() === 'strong' ? 
              <Text key={i} style={styles.strong}>{child.textContent}</Text> : 
              child.textContent
            ))}
          </Text>
        );
      }

      if (tag === 'ul' || tag === 'ol') {
        return (
          <View key={index} style={{ marginBottom: 10 }}>
            {Array.from(node.querySelectorAll('li')).map((li, i) => (
              <Text key={i} style={styles.listItem}>• {li.textContent}</Text>
            ))}
          </View>
        );
      }

      // Если это блок AI (обычно div с определенными стилями)
      if (tag === 'div' && node.style?.backgroundColor === 'rgb(240, 253, 244)') {
        return (
          <View key={index} style={styles.aiBox}>
            <Text style={[styles.p, { fontWeight: 'bold' }]}>Institutional AI Analysis</Text>
            <Text style={styles.p}>{text}</Text>
          </View>
        );
      }

      return null;
    });
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {parseHtml(htmlContent)}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
};

export default ReportPdfDocument;