import { Document, Packer, Paragraph, TextRun, AlignmentType, Footer, PageNumber, BorderStyle, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

export const generateWordReport = async (htmlContent) => {
    const parser = new DOMParser();
    const docHtml = parser.parseFromString(htmlContent, 'text/html');
    const nodes = Array.from(docHtml.body.childNodes);

    const ATL_GREEN = "003015";
    const ATL_GOLD = "FFB81C";

    const processTextNode = (node) => {
        const textRuns = [];
        node.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                textRuns.push(new TextRun({ text: child.textContent }));
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const tag = child.nodeName.toLowerCase();
                const nestedRuns = processTextNode(child);
                nestedRuns.forEach(run => {
                    if (tag === 'strong' || tag === 'b') run.root.bold = true;
                    if (tag === 'em' || tag === 'i') run.root.italics = true;
                    if (tag === 'u') run.root.underline = {};
                    textRuns.push(run);
                });
            }
        });
        return textRuns;
    };

    const docChildren = [];

    nodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const tag = node.nodeName.toLowerCase();
        const text = node.textContent.trim();
        if (!text && tag !== 'hr') return;

        if (tag === 'h2') {
            docChildren.push(new Paragraph({
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
                border: { bottom: { color: ATL_GOLD, space: 1, style: BorderStyle.SINGLE, size: 12 } },
                children: [new TextRun({ text: text, color: ATL_GREEN, bold: true, size: 32 })]
            }));
        } else if (tag === 'h3') {
            docChildren.push(new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 150 },
                children: [new TextRun({ text: text, color: ATL_GREEN, bold: true, size: 28 })]
            }));
        } else if (tag === 'h4') {
            docChildren.push(new Paragraph({
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 },
                children: [new TextRun({ text: text, color: ATL_GREEN, bold: true, size: 24 })]
            }));
        } else if (tag === 'p') {
            docChildren.push(new Paragraph({
                spacing: { before: 120, after: 120 },
                children: processTextNode(node)
            }));
        } else if (tag === 'ul' || tag === 'ol') {
            Array.from(node.querySelectorAll('li')).forEach(li => {
                docChildren.push(new Paragraph({
                    text: li.textContent.trim(),
                    bullet: { level: 0 },
                    spacing: { before: 80, after: 80 },
                }));
            });
        } else if (tag === 'hr') {
            docChildren.push(new Paragraph({
                border: { bottom: { color: "EEEEEE", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                spacing: { before: 200, after: 200 }
            }));
        } else if (tag === 'div') {
            const isAiBox = node.style?.backgroundColor === 'rgb(240, 253, 244)' || node.classList.contains('ai-feedback');
            docChildren.push(new Paragraph({
                shading: isAiBox ? { fill: "F0FDF4" } : undefined,
                indent: isAiBox ? { left: 720 } : undefined,
                spacing: { before: 150, after: 150 },
                children: processTextNode(node)
            }));
        }
    });

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
                },
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: "Teaching Evaluation Report", color: "999999", size: 18 }),
                                new TextRun({ text: " | Page ", color: "999999", size: 18 }),
                                new TextRun({ children: [PageNumber.CURRENT], color: "999999", size: 18 }),
                                new TextRun({ text: " of ", color: "999999", size: 18 }),
                                new TextRun({ children: [PageNumber.TOTAL_PAGES], color: "999999", size: 18 }),
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
