import { Document, Packer, Paragraph, TextRun, AlignmentType, Footer, PageNumber } from "docx";
import { saveAs } from "file-saver";

export const generateWordReport = async (htmlContent) => {
    const cleanText = (html) => {
        return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
    };

    // Разбиваем контент на блоки. 
    // Если после очистки тегов блок пустой, заменяем его на текст-заполнитель
    const lines = htmlContent.split(/<\/h[1-4]>|<\/p>|<li>/).map(line => {
        const text = cleanText(line);
        if (line.includes('<em>No observations recorded.</em>') || (line.trim().length > 0 && text === '')) {
            return "No observations recorded.";
        }
        return line.trim();
    }).filter(line => line.length > 0);

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
                                new TextRun("Page "),
                                new TextRun({ children: [PageNumber.CURRENT] }),
                                new TextRun(" of "),
                                new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
                            ],
                        }),
                    ],
                }),
            },
            children: lines.map((line, index) => {
                const isMainHeading = line.includes('<h2');
                const isSubHeading = line.includes('<h3') || line.includes('<h4');
                const isPlaceholder = line === "No observations recorded.";
                
                return new Paragraph({
                    spacing: { before: 240, after: 120 },
                    pageBreakBefore: isMainHeading && index > 0, 
                    children: [
                        new TextRun({
                            text: isPlaceholder ? line : cleanText(line),
                            size: isMainHeading ? 32 : (isSubHeading ? 28 : 24), 
                            bold: isMainHeading || isSubHeading,
                            italics: isPlaceholder,
                            color: isMainHeading || isSubHeading ? "154734" : (isPlaceholder ? "666666" : "000000"),
                        }),
                    ],
                });
            }),
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Teaching_Evaluation_Report.docx");
};