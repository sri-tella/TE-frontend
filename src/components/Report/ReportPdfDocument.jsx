import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 50, backgroundColor: '#fff', fontFamily: 'Times-Roman', fontSize: 11 },
  h1: { fontSize: 16, textAlign: 'center', marginBottom: 20, fontFamily: 'Times-Bold' },
  h2: { fontSize: 14, color: '#004c4c', marginBottom: 12, fontFamily: 'Times-Bold' },
  h3: { fontSize: 12, color: '#004c4c', marginTop: 16, marginBottom: 8, fontFamily: 'Times-Bold' },
  p: { fontSize: 11, marginBottom: 6, color: '#000', lineHeight: 1.3 },
  listItem: { fontSize: 11, width: 22, color: '#000' },
  redListItem: { fontSize: 11, width: 22, color: '#FF0000' },
  hr: { borderBottom: '1pt solid #eee', marginTop: 10, marginBottom: 10 },
  footer: { position: 'absolute', bottom: 24, left: 50, right: 50, flexDirection: 'row', alignItems: 'flex-end' },
  footerLeft: { flex: 1, fontSize: 9, color: '#999' },
  footerRight: { fontSize: 9, color: '#999' },
  aiBox: { marginTop: 8, padding: 10, backgroundColor: '#f0f7ff', borderLeft: '3pt solid #1a2535' },
  aiSubBox: { marginTop: 6, marginLeft: 20, padding: '6 10', backgroundColor: '#f5f9ff', borderLeft: '2pt solid #2dd4bf' },
  
  // Logo
  logoSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoBu: { fontSize: 42, fontFamily: 'Times-Bold', color: '#004c4c', marginRight: 12 },
  logoTextContainer: { borderLeftWidth: 1, borderLeftColor: '#004c4c', paddingLeft: 12 },
  logoTitle: { fontSize: 24, color: '#004c4c', fontFamily: 'Times-Roman' },
  logoSubtitle: { fontSize: 10, fontFamily: 'Times-Bold', color: '#004c4c', letterSpacing: 0.5 },

  // Sections
  sectionHeader: {
    backgroundColor: '#e2e6e6',
    borderWidth: 1,
    borderColor: '#000',
    padding: '8 12 6 12',
    fontFamily: 'Times-Bold',
    fontSize: 12,
    color: '#3b6058',
    marginTop: 25,
    marginBottom: 15,
    textAlign: 'left',
  },
  
  // Form rows
  formRow: { flexDirection: 'row', marginBottom: 10, fontSize: 11 },
  formLabel: { width: 120, fontFamily: 'Times-Bold' },
  indentGroup: { marginLeft: 30 },
  indentRow: { flexDirection: 'row', marginBottom: 8, fontSize: 11 },
  indentLabel: { width: 220 },

  // Table
  tableWrapper: { marginBottom: 10, borderWidth: 1, borderColor: '#000', borderStyle: 'solid' },
  tableRow: { flexDirection: 'row' },
  tableCell: { flex: 1, padding: 5 },
  tableCellText: { fontSize: 10, color: '#000' },
  tableCellBold: { fontSize: 10, color: '#000', fontFamily: 'Times-Bold' },
});

const ReportPdfDocument = ({ htmlContent }) => {
  if (!htmlContent) return null;

  const parseHtml = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const elements = Array.from(tempDiv.childNodes);

    const renderNode = (node, index) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return null;
      const tag = node.nodeName.toLowerCase();
      const text = node.textContent.trim();
      const classes = node.classList;

      if (tag === 'h1') return <Text key={index} style={styles.h1}>{text}</Text>;
      if (tag === 'h2') return <Text key={index} style={styles.h2}>{text}</Text>;
      if (tag === 'h3') return <Text key={index} style={styles.h3}>{text}</Text>;
      if (tag === 'hr') return <View key={index} style={styles.hr} />;

      if (tag === 'table') return renderTable(node, index);

      // Section Header
      if (classes.contains('section-header')) {
        return <Text key={index} style={styles.sectionHeader}>{text}</Text>;
      }

      // Form Row
      if (classes.contains('form-row')) {
        const label = node.querySelector('.form-label')?.textContent || '';
        const value = node.textContent.replace(label, '').trim();
        return (
          <View key={index} style={styles.formRow}>
            <Text style={styles.formLabel}>{label}</Text>
            <Text style={{ flex: 1 }}>{value}</Text>
          </View>
        );
      }

      // Indent Group
      if (classes.contains('indent-group')) {
        return (
          <View key={index} style={styles.indentGroup}>
            {Array.from(node.childNodes).map((child, i) => renderNode(child, i))}
          </View>
        );
      }

      // Indent Row
      if (classes.contains('indent-row')) {
        return (
          <View key={index} style={styles.indentRow}>
            {Array.from(node.childNodes).map((child, i) => {
                if (child.nodeType !== Node.ELEMENT_NODE) return null;
                const cText = child.textContent.trim();
                if (child.classList.contains('indent-label')) {
                    return <Text key={i} style={styles.indentLabel}>{cText}</Text>;
                }
                return <Text key={i}>{cText}</Text>;
            })}
          </View>
        );
      }

      if (tag === 'p') {
        return (
          <Text key={index} style={styles.p}>
            {Array.from(node.childNodes).map((child, i) => {
              if (child.nodeName.toLowerCase() === 'strong' || child.nodeName.toLowerCase() === 'b') {
                return <Text key={i} style={{ fontFamily: 'Times-Bold' }}>{child.textContent}</Text>;
              }
              if (child.nodeName.toLowerCase() === 'u') {
                  return <Text key={i} style={{ textDecoration: 'underline' }}>{child.textContent}</Text>;
              }
              if (child.nodeName.toLowerCase() === 'em' || child.nodeName.toLowerCase() === 'i') {
                  return <Text key={i} style={{ fontFamily: 'Times-Italic' }}>{child.textContent}</Text>;
              }
              return child.textContent;
            })}
          </Text>
        );
      }

      if (tag === 'ul' || tag === 'ol') {
        const isRedList = classes.contains('red-bullets');
        const directLis = Array.from(node.children).filter(c => c.tagName?.toLowerCase() === 'li');
        return (
          <View key={index} style={{ marginBottom: 10, marginLeft: tag === 'ol' ? 10 : 0 }}>
            {directLis.map((li, i) => (
              <View key={i} style={{ marginBottom: 5 }}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={isRedList ? styles.redListItem : styles.listItem}>{tag === 'ol' ? `${i + 1}. ` : '• '}</Text>
                  <View style={{ flex: 1 }}>
                    {Array.from(li.childNodes).map((child, j) => {
                      if (child.nodeType === Node.TEXT_NODE) {
                        const t = child.textContent;
                        if (!t.trim()) return null;
                        return <Text key={j} style={isRedList ? { color: '#FF0000' } : styles.p}>{t}</Text>;
                      }
                      if (child.nodeType === Node.ELEMENT_NODE) {
                        const cTag = child.nodeName.toLowerCase();
                        // <p> inside <li>: render inline as Text, not as a block via renderNode
                        if (cTag === 'p') {
                          return (
                            <Text key={j} style={isRedList ? { color: '#FF0000' } : styles.p}>
                              {Array.from(child.childNodes).map((c, k) => {
                                if (c.nodeType === Node.TEXT_NODE) return c.textContent;
                                const ct = c.nodeName.toLowerCase();
                                const isBold = ct === 'strong' || ct === 'b';
                                const isItalic = ct === 'em' || ct === 'i';
                                let s = isRedList ? { color: '#FF0000' } : {};
                                if (ct === 'span') { const nc = c.style?.color; if (nc === 'red' || nc === '#FF0000') s.color = '#FF0000'; else if (nc) s.color = nc; }
                                if (isBold && isItalic) s.fontFamily = 'Times-BoldItalic';
                                else if (isBold) s.fontFamily = 'Times-Bold';
                                else if (isItalic) s.fontFamily = 'Times-Italic';
                                return <Text key={k} style={s}>{c.textContent}</Text>;
                              })}
                            </Text>
                          );
                        }
                        if (['div', 'ul', 'ol'].includes(cTag)) return renderNode(child, j);
                        const isBold = cTag === 'strong' || cTag === 'b';
                        const isItalic = cTag === 'em' || cTag === 'i';
                        const isUnderline = cTag === 'u';
                        let style = { ...styles.p };
                        if (isRedList) style.color = '#FF0000';
                        if (isBold && isItalic) style.fontFamily = 'Times-BoldItalic';
                        else if (isBold) style.fontFamily = 'Times-Bold';
                        else if (isItalic) style.fontFamily = 'Times-Italic';
                        if (isUnderline) style.textDecoration = 'underline';
                        if (cTag === 'span') {
                          const nodeColor = child.style?.color;
                          if (nodeColor === 'red' || nodeColor === '#FF0000') style.color = '#FF0000';
                          else if (nodeColor) style.color = nodeColor;
                        }
                        return <Text key={j} style={style}>{child.textContent}</Text>;
                      }
                      return null;
                    })}
                  </View>
                </View>
              </View>
            ))}
          </View>
        );
      }

      if (tag === 'div' && classes.contains('ai-analysis-block')) {
        return (
          <View key={index} style={styles.aiBox}>
            <Text style={[styles.p, { fontFamily: 'Times-Bold', color: '#1a2535' }]}>AI Analysis</Text>
            <Text style={styles.p}>{text}</Text>
          </View>
        );
      }

      if (tag === 'div' && classes.contains('ai-sub-block')) {
        const labelNode = node.querySelector('strong');
        const labelText = labelNode?.textContent?.trim() || '';
        const bodyText = text.replace(labelText, '').trim();
        return (
          <View key={index} style={styles.aiSubBox}>
            {labelText ? <Text style={[styles.p, { fontFamily: 'Times-Bold', fontSize: 10, color: '#1a2535' }]}>{labelText}</Text> : null}
            <Text style={[styles.p, { fontSize: 10 }]}>{bodyText}</Text>
          </View>
        );
      }

      // Default for other divs
      if (tag === 'div') {
        const isInstruction = classes.contains('instruction-text');
        if (isInstruction) {
          return <Text key={index} style={[styles.p, { fontFamily: 'Times-BoldItalic' }]}>{text}</Text>;
        }
        const marginLeft = node.style?.marginLeft ? parseInt(node.style.marginLeft) : 0;
        const childViews = Array.from(node.childNodes).map((child, i) => renderNode(child, i)).filter(Boolean);
        if (childViews.length > 0) {
          return <View key={index} style={marginLeft ? { marginLeft } : {}}>{childViews}</View>;
        }
        return text ? <Text key={index} style={styles.p}>{text}</Text> : null;
      }

      return null;
    };

    return elements.map((node, index) => renderNode(node, index));
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {parseHtml(htmlContent)}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <Text>Academy for Teaching & Learning</Text>
            <Text>Teaching Observation</Text>
          </View>
          <Text style={styles.footerRight} render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export default ReportPdfDocument;
