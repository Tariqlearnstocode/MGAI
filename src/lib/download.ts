import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkToRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize from 'rehype-sanitize';

interface DocumentSection {
  title: string;
  content: string;
}

// Function to convert markdown to HTML
async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const result = await unified()
      .use(remarkParse)
      .use(remarkToRehype)
      .use(rehypeSanitize)
      .use(rehypeStringify)
      .process(markdown);
    
    return String(result);
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    return markdown; // Fall back to original text
  }
}

// Function to strip simple markdown for plain text use (PDF)
function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/#{1,6}\s+/g, '') // Remove headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .replace(/^\s*[-*+]\s+/gm, '• ') // Convert list items to bullets
    .replace(/^\s*\d+\.\s+/gm, '• ') // Convert numbered lists to bullets
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1'); // Remove code blocks
}

function createPDF(sections: DocumentSection[]): jsPDF {
  const doc = new jsPDF();
  let yOffset = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  sections.forEach((section, index) => {
    // Add title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(section.title, 20, yOffset);
    yOffset += 10;

    // Process content to handle markdown
    const plainTextContent = stripMarkdown(section.content);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(plainTextContent, pageWidth - 40);
    
    // Check if we need a new page
    if (yOffset + (splitText.length * 7) > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yOffset = 20;
    }
    
    doc.text(splitText, 20, yOffset);
    yOffset += (splitText.length * 7) + 20;

    // Add new page for next section if needed
    if (index < sections.length - 1 && yOffset > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yOffset = 20;
    }
  });

  return doc;
}

function createDOCX(sections: DocumentSection[]): Document {
  // Simple markdown formatting detection for DOCX
  const processParagraph = (text: string) => {
    // Check for basic formatting
    const isBold = text.includes('**');
    const isItalic = text.includes('*') && !isBold;
    
    if (isBold || isItalic) {
      // For simplicity, just apply the style to the whole paragraph
      return new Paragraph({
        children: [
          new TextRun({
            text: stripMarkdown(text),
            bold: isBold,
            italics: isItalic
          })
        ],
        spacing: { after: 200 }
      });
    }
    
    return new Paragraph({
      text: stripMarkdown(text),
      spacing: { after: 200 }
    });
  };
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: sections.flatMap(section => [
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_1,
          spacing: {
            before: 400,
            after: 200
          }
        }),
        // Split content into paragraphs and process each
        ...section.content.split('\n\n').map(processParagraph)
      ])
    }]
  });

  return doc;
}

export async function downloadDocument(
  sections: DocumentSection[],
  format: 'pdf' | 'docx' = 'pdf',
  filename: string = 'document'
): Promise<void> {
  try {
    if (format === 'pdf') {
      const doc = createPDF(sections);
      doc.save(`${filename}.pdf`);
    } else {
      const doc = createDOCX(sections);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${filename}.docx`);
    }
  } catch (error) {
    console.error('Error generating document:', error);
    alert('Failed to generate document. Please try again.');
  }
}