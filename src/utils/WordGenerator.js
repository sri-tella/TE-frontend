import { Document, Packer, Paragraph, TextRun, AlignmentType, Footer, PageNumber, BorderStyle, Table, TableRow, TableCell, WidthType, NumberFormat } from "docx";
import { saveAs } from "file-saver";

export const generateWordReport = async (htmlContent) => {
    const parser = new DOMParser();
    const docHtml = parser.parseFromString(htmlContent, 'text/html');
    const nodes = Array.from(docHtml.body.childNodes);

    const FONT_FAMILY = "Cambria";
    const PRIMARY_COLOR = "004C4C";
    const SECONDARY_COLOR = "3B6058";
    const BORDER_COLOR = "000000";

    const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" };
    const THIN_BORDER = { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR };

    const processTextNode = (node, options = {}) => {
        const textRuns = [];
        node.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent;
                if (text) {
                    textRuns.push(new TextRun({ 
                        text, 
                        color: options.isRed ? "FF0000" : (options.color || undefined),
                        font: FONT_FAMILY,
                        bold: options.bold || false,
                        italics: options.italics || false,
                        underline: options.underline ? {} : undefined,
                        size: options.size || 22,
                    }));
                }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const tag = child.nodeName.toLowerCase();
                const style = child.getAttribute('style') || '';
                const childClasses = child.classList;
                
                const newOptions = { ...options };
                if (tag === 'strong' || tag === 'b') newOptions.bold = true;
                if (tag === 'em' || tag === 'i' || childClasses.contains('instruction-text') || childClasses.contains('normal-italic')) newOptions.italics = true;
                if (tag === 'u') newOptions.underline = true;
                if (style.includes('color: red') || style.includes('color: #FF0000') || childClasses.contains('red-bullets')) newOptions.isRed = true;
                if (tag === 'span' && style.includes('color: #888888')) newOptions.color = "888888";

                textRuns.push(...processTextNode(child, newOptions));
            }
        });
        return textRuns;
    };

    const cellToParagraphs = (cellNode) => {
        const paras = [];
        cellNode.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent.trim();
                if (text) paras.push(new Paragraph({ children: [new TextRun({ text, font: FONT_FAMILY })], spacing: { before: 40, after: 40 } }));
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const t = child.nodeName.toLowerCase();
                if (t === 'p') {
                    const runs = processTextNode(child);
                    if (child.textContent.trim()) {
                        paras.push(new Paragraph({ spacing: { before: 60, after: 60 }, children: runs }));
                    }
                } else if (t === 'ul' || t === 'ol') {
                    const isRed = child.classList.contains('red-bullets');
                    child.querySelectorAll('li').forEach(li => {
                        paras.push(new Paragraph({ children: processTextNode(li, isRed), bullet: { level: 0 }, spacing: { before: 40, after: 40 } }));
                    });
                }
            }
        });
        if (paras.length === 0) paras.push(new Paragraph({ children: [] }));
        return paras;
    };

    const tableNodeToDocx = (tableNode) => {
        const rows = Array.from(tableNode.querySelectorAll('tr'));
        if (!rows.length) return null;
        const tableRows = rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (!cells.length) return null;
            return new TableRow({
                children: cells.map(cell => {
                    const colspan = parseInt(cell.getAttribute('colspan') || '1');
                    const isHeader = cell.nodeName.toLowerCase() === 'th';
                    return new TableCell({
                        columnSpan: colspan > 1 ? colspan : undefined,
                        shading: isHeader ? { fill: "E8E8E8" } : undefined,
                        borders: CELL_BORDER,
                        margins: { top: 80, bottom: 80, left: 120, right: 120 },
                        children: cellToParagraphs(cell),
                    });
                }),
            });
        }).filter(Boolean);
        return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows });
    };

    const CELL_BORDER = {
        top:    { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        left:   { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        right:  { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    };

    const BLOCK_TAGS = new Set(['div', 'ul', 'ol', 'p', 'table']);

    // Recursively push block-level HTML nodes as docx paragraphs into target array
    const pushBlockNode = (node, target, extraIndent = 0) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const t = node.nodeName.toLowerCase();
        const cls = node.classList;
        const marginPx = node.style?.marginLeft ? parseInt(node.style.marginLeft) : 0;
        const indent = extraIndent + Math.round(marginPx * 15);

        if (t === 'p') {
            const runs = processTextNode(node);
            if (node.textContent.trim()) {
                target.push(new Paragraph({
                    children: runs,
                    spacing: { before: 60, after: 60 },
                    indent: indent ? { left: indent } : undefined,
                }));
            }
        } else if (t === 'ul' || t === 'ol') {
            const isRed = cls.contains('red-bullets');
            Array.from(node.children).filter(c => c.tagName?.toLowerCase() === 'li').forEach((li, i) => {
                const inlineRuns = [];
                const subBlocks = [];
                Array.from(li.childNodes).forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE) {
                        if (child.textContent.trim()) inlineRuns.push(new TextRun({ text: child.textContent, font: FONT_FAMILY, size: 22, color: isRed ? 'FF0000' : undefined }));
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        const cTag = child.nodeName.toLowerCase();
                        // <p> inside <li> is treated as inline — TipTap wraps li content in <p>
                        if (cTag === 'p' || !BLOCK_TAGS.has(cTag)) {
                            inlineRuns.push(...processTextNode(child, { isRed: isRed }));
                        } else {
                            subBlocks.push(child);
                        }
                    }
                });
                const bulletRun = new TextRun({ text: t === 'ol' ? `${i + 1}. ` : '• ', font: FONT_FAMILY, size: 22, color: isRed ? 'FF0000' : undefined });
                target.push(new Paragraph({
                    children: [bulletRun, ...inlineRuns],
                    spacing: { before: 80, after: 80 },
                    indent: { left: 720 + indent, hanging: 360 },
                }));
                subBlocks.forEach(child => pushBlockNode(child, target, indent));
            });
        } else if (t === 'div') {
            Array.from(node.childNodes).forEach(child => pushBlockNode(child, target, indent));
        }
    };

    const docChildren = [];

    for (const node of nodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const tag = node.nodeName.toLowerCase();
        const classes = node.classList;
        const text = node.textContent.trim();

        // ── H1 TITLE ──
        if (tag === 'h1') {
            docChildren.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 400 },
                children: [new TextRun({ text, bold: true, size: 36, font: FONT_FAMILY, color: "000000" })]
            }));
            continue;
        }

        // ── SECTION HEADER ──
        if (classes.contains('section-header')) {
            docChildren.push(new Paragraph({
                shading: { fill: "E2E6E6" },
                border: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
                spacing: { before: 400, after: 200 },
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: " " + text, color: SECONDARY_COLOR, bold: true, size: 24, font: FONT_FAMILY })]
            }));
            continue;
        }

        // ── FORM ROWS ──
        if (classes.contains('form-row') || classes.contains('indent-row')) {
            const labelEl = node.querySelector('.form-label, .indent-label');
            const label = labelEl ? labelEl.textContent.trim() : '';
            const value = node.textContent.replace(label, '').trim();

            docChildren.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: classes.contains('indent-row') ? 40 : 20, type: WidthType.PERCENTAGE },
                                children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: FONT_FAMILY, size: 22 })] })],
                            }),
                            new TableCell({
                                width: { size: classes.contains('indent-row') ? 60 : 80, type: WidthType.PERCENTAGE },
                                children: [new Paragraph({ children: [new TextRun({ text: value, font: FONT_FAMILY, size: 22 })] })],
                            }),
                        ],
                    }),
                ],
            }));
            continue;
        }

        // ── LISTS ──
        if (tag === 'ul' || tag === 'ol') {
            const isRedList = classes.contains('red-bullets');
            const directLis = Array.from(node.children).filter(c => c.tagName?.toLowerCase() === 'li');
            directLis.forEach((li) => {
                const inlineRuns = [];
                const subBlocks = [];
                Array.from(li.childNodes).forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE) {
                        if (child.textContent.trim()) inlineRuns.push(new TextRun({ text: child.textContent, font: FONT_FAMILY, size: 22, color: isRedList ? 'FF0000' : undefined }));
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        const cTag = child.nodeName.toLowerCase();
                        // <p> inside <li> is treated as inline — TipTap wraps li content in <p>
                        if (cTag === 'p' || !BLOCK_TAGS.has(cTag)) {
                            inlineRuns.push(...processTextNode(child, { isRed: isRedList }));
                        } else {
                            subBlocks.push(child);
                        }
                    }
                });
                docChildren.push(new Paragraph({
                    children: inlineRuns,
                    bullet: tag === 'ul' ? { level: 0 } : undefined,
                    numbering: tag === 'ol' ? { reference: "main-numbering", level: 0 } : undefined,
                    spacing: { before: 100, after: 100 },
                    indent: { left: 720, hanging: 360 },
                }));
                subBlocks.forEach(child => pushBlockNode(child, docChildren, 360));
            });
            continue;
        }

        // ── AI ANALYSIS BLOCK ──
        if (classes.contains('ai-analysis-block')) {
            docChildren.push(new Paragraph({
                shading: { fill: "F0F7FF" },
                border: { left: { style: BorderStyle.SINGLE, size: 18, color: PRIMARY_COLOR } },
                spacing: { before: 200, after: 200 },
                children: processTextNode(node)
            }));
            continue;
        }

        // ── AI SUB BLOCK (Observations AI / Recommendations AI) ──
        if (classes.contains('ai-sub-block')) {
            const labelNode = node.querySelector('strong');
            const labelText = labelNode?.textContent?.trim() || '';
            const bodyText = node.textContent.replace(labelText, '').trim();
            const runs = [];
            if (labelText) runs.push(new TextRun({ text: labelText + ' ', bold: true, font: FONT_FAMILY, size: 20 }));
            if (bodyText) runs.push(new TextRun({ text: bodyText, font: FONT_FAMILY, size: 20 }));
            docChildren.push(new Paragraph({
                shading: { fill: "F5F9FF" },
                border: { left: { style: BorderStyle.SINGLE, size: 12, color: "2DD4BF" } },
                indent: { left: 360 },
                spacing: { before: 100, after: 100 },
                children: runs,
            }));
            continue;
        }

        // ── PARAGRAPHS ──
        if (tag === 'p' || (tag === 'div' && text)) {
            docChildren.push(new Paragraph({
                spacing: { before: 120, after: 120 },
                children: processTextNode(node)
            }));
        } else if (tag === 'div' && classes.contains('question-space')) {
            docChildren.push(new Paragraph({ spacing: { before: 600 } }));
        }

        if (tag === 'hr') {
            docChildren.push(new Paragraph({
                border: { bottom: { color: "EEEEEE", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                spacing: { before: 200, after: 200 }
            }));
        }

        if (tag === 'table') {
            const tbl = tableNodeToDocx(node);
            if (tbl) {
                docChildren.push(tbl);
                docChildren.push(new Paragraph({ children: [] }));
            }
        }
    }

    const doc = new Document({
        numbering: {
            config: [{
                reference: "main-numbering",
                levels: [{
                    level: 0,
                    format: NumberFormat.DECIMAL,
                    text: "%1.",
                    alignment: AlignmentType.LEFT,
                }]
            }]
        },
        styles: {
            default: {
                document: {
                    run: { font: FONT_FAMILY, size: 22 },
                },
            },
        },
        sections: [{
            properties: {
                page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            tabStops: [{ type: "right", position: 9360 }],
                            children: [
                                new TextRun({ text: "Academy for Teaching & Learning", color: "999999", size: 18, font: FONT_FAMILY }),
                                new TextRun({ text: "", break: 1 }),
                                new TextRun({ text: "Teaching Observation", color: "999999", size: 18, font: FONT_FAMILY }),
                                new TextRun({ text: "\t", color: "999999", size: 18, font: FONT_FAMILY }),
                                new TextRun({ children: [PageNumber.CURRENT], color: "999999", size: 18, font: FONT_FAMILY }),
                                new TextRun({ text: " of ", color: "999999", size: 18, font: FONT_FAMILY }),
                                new TextRun({ children: [PageNumber.TOTAL_PAGES], color: "999999", size: 18, font: FONT_FAMILY }),
                            ],
                        }),
                    ],
                }),
            },
            children: docChildren,
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Teaching_Evaluation_Report.docx");
};
