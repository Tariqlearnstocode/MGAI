import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';

interface DocumentSection {
  title: string;
  content: string;
}

function createPDF(sections: DocumentSection[]): void {
  const doc = new jsPDF();
  let yOffset = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  sections.forEach((section, index) => {
    // Add title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(section.title, 20, yOffset);
    yOffset += 10;

    // Add content with word wrapping
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(section.content, pageWidth - 40);
    
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
        new Paragraph({
          text: section.content,
          spacing: {
            after: 200
          }
        })
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
  if (format === 'pdf') {
    const doc = createPDF(sections);
    doc.save(`${filename}.pdf`);
  } else {
    const doc = createDOCX(sections);
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
  }
}