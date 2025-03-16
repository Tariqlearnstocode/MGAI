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

// Process a section to remove its own title from the content if it appears at the beginning
function processSection(section: DocumentSection): DocumentSection {
  const { title, content } = section;
  
  // Common patterns for section title in content
  const patterns = [
    new RegExp(`^#\\s*${title}\\s*\\n`, 'i'),   // # Title
    new RegExp(`^##\\s*${title}\\s*\\n`, 'i'),  // ## Title
    new RegExp(`^${title}\\s*\\n={3,}\\n`, 'i') // Title
                                                // ====
  ];
  
  let processedContent = content;
  
  // Check if any of the patterns match at the beginning of the content
  for (const pattern of patterns) {
    if (pattern.test(processedContent)) {
      // Remove the title from the content as we'll add it separately
      processedContent = processedContent.replace(pattern, '');
      break;
    }
  }
  
  return {
    title,
    content: processedContent
  };
}

function createPDF(sections: DocumentSection[]): jsPDF {
  const doc = new jsPDF();
  let yOffset = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  sections.forEach((section, index) => {
    // Process section to avoid duplicate titles
    const processedSection = processSection(section);
    
    // Add title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(processedSection.title, 20, yOffset);
    yOffset += 10;

    // Process content to handle markdown
    const plainTextContent = stripMarkdown(processedSection.content);
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
  // Function to split content into paragraphs and handle markdown
  const processParagraphs = (content: string) => {
    // Split content by double newlines to identify paragraphs
    return content.split(/\n\n+/).filter(Boolean).map(paragraph => {
      // Check for basic formatting
      const isBold = paragraph.includes('**');
      const isItalic = paragraph.includes('*') && !isBold;
      // Check for bullet points
      const isBulletPoint = paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('• ');
      
      const cleanText = stripMarkdown(paragraph);
      
      return new Paragraph({
        children: [
          new TextRun({
            text: cleanText,
            bold: isBold,
            italics: isItalic
          })
        ],
        bullet: isBulletPoint ? { level: 0 } : undefined,
        spacing: { after: 200 }
      });
    });
  };
  
  // Build the document with sections
  const docChildren = sections.flatMap(section => {
    // Process section to avoid duplicate titles
    const processedSection = processSection(section);
    
    // Create a heading for the section
    const sectionTitle = new Paragraph({
      text: processedSection.title,
      heading: HeadingLevel.HEADING_1,
      spacing: {
        before: 400,
        after: 200
      }
    });
    
    // Process the content into paragraphs
    const contentParagraphs = processParagraphs(processedSection.content);
    
    // Return the section title followed by its content paragraphs
    return [sectionTitle, ...contentParagraphs];
  });
  
  // Create the document
  const doc = new Document({
    sections: [{
      properties: {},
      children: docChildren
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
    // First check if sections exist and are properly formatted
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      throw new Error('Document has no content sections');
    }
    
    // Extract document type from the filename to determine better document title
    let documentTitle = 'Document';
    const typeMatch = filename.match(/-([^-]+)$/);
    if (typeMatch && typeMatch[1]) {
      // Convert snake_case or kebab-case to Title Case
      documentTitle = typeMatch[1]
        .replace(/_|-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
    
    // Check if we're dealing with a single "Complete Document" section
    if (sections.length === 1 && sections[0].title === "Complete Document") {
      console.log('Detected "Complete Document" section, attempting to extract and restructure content...');
      const content = sections[0].content;
      
      // Try to extract a main title from the beginning of the content
      let mainTitle = documentTitle;
      const titleMatch = content.match(/^#\s+([^\n]+)/);
      if (titleMatch && titleMatch[1]) {
        mainTitle = titleMatch[1].trim();
        console.log(`Extracted document title: "${mainTitle}"`);
      }
      
      // Look for markdown headings to split into separate sections
      const headingMatches = [...content.matchAll(/^(#{1,3})\s+([^\n]+)/gm)];
      
      if (headingMatches.length > 0) {
        console.log(`Found ${headingMatches.length} headings in content, splitting into sections`);
        
        // Split the content into sections
        const newSections: DocumentSection[] = [];
        
        // First, add a cover/title section if there's a main title
        if (mainTitle !== documentTitle) {
          newSections.push({
            title: "Title Page",
            content: `# ${mainTitle}\n\n${documentTitle}`
          });
        }
        
        // Process each heading as a section
        for (let i = 0; i < headingMatches.length; i++) {
          const currentMatch = headingMatches[i];
          const nextMatch = headingMatches[i + 1];
          
          // Skip the first heading if it's the main title we already used
          if (i === 0 && currentMatch[2].trim() === mainTitle) {
            continue;
          }
          
          const title = currentMatch[2].trim();
          const startIndex = currentMatch.index;
          const endIndex = nextMatch ? nextMatch.index : content.length;
          
          // Extract this section's content
          const sectionContent = content.substring(startIndex, endIndex);
          
          newSections.push({ title, content: sectionContent });
        }
        
        // Only replace sections if we found any meaningful sections
        if (newSections.length > 0) {
          sections = newSections;
          console.log(`Restructured document into ${sections.length} sections`);
        }
      } else {
        // If no headings found, try to create a better title than "Complete Document"
        sections[0].title = mainTitle;
      }
    }
    
    // Check if we have a single-section document with a combined title that contains commas
    else if (sections.length === 1 && sections[0].title.includes(',')) {
      console.log('Detected combined sections in a single-section document, splitting...');
      // This might be a case where all sections were combined into one
      const originalSection = sections[0];
      
      // Only process if the content is substantial
      if (originalSection.content.length > 100) {
        // Look for markdown headings in the content
        const headingMatches = [...originalSection.content.matchAll(/#{1,2}\s+([^\n]+)/g)];
        
        if (headingMatches.length > 0) {
          console.log(`Found ${headingMatches.length} headings in content, creating separate sections`);
          
          // Split the content by headings
          const newSections: DocumentSection[] = [];
          
          for (let i = 0; i < headingMatches.length; i++) {
            const currentMatch = headingMatches[i];
            const nextMatch = headingMatches[i + 1];
            
            const title = currentMatch[1].trim();
            const startIndex = currentMatch.index;
            const endIndex = nextMatch ? nextMatch.index : originalSection.content.length;
            
            const content = originalSection.content.substring(startIndex, endIndex);
            
            newSections.push({ title, content });
          }
          
          // Use the new sections if we successfully split them
          if (newSections.length > 0) {
            sections = newSections;
          }
        }
      }
    }
    
    // Generate the document in the requested format
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