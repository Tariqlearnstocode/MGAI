import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkToRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize from 'rehype-sanitize';
import { Document as PDFDocument, Page, Text, View, StyleSheet, PDFViewer, pdf } from '@react-pdf/renderer';
import ReactDOM from 'react-dom';
import React from 'react';

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
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers but keep the content
    .replace(/\*\*\*\*(.*?)\*\*\*\*/g, '$1') // Handle cases with double bold markup
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1') // Handle cases with triple asterisks
    .replace(/__(.*?)__/g, '$1') // Handle underscore-style bold
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic
    .replace(/_(.*?)_/g, '$1')     // Remove underscore italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Remove code blocks
    .replace(/[\u{1F300}-\u{1F6FF}|\u{1F900}-\u{1F9FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, ''); // Remove emojis
}

// Enhanced version to detect and preserve bullet points
function processBulletPoints(text: string): {text: string, isBullet: boolean, indentLevel: number} {
  // Check for bullet points in various formats
  const bulletMatch = text.match(/^(\s*)[-*+•]\s+(.*)$/);
  const numberedMatch = text.match(/^(\s*)\d+\.\s+(.*)$/);
  
  if (bulletMatch) {
    const indentLevel = Math.floor(bulletMatch[1].length / 2); // 2 spaces = 1 indent level
    return {
      text: bulletMatch[2],
      isBullet: true,
      indentLevel: indentLevel
    };
  } else if (numberedMatch) {
    const indentLevel = Math.floor(numberedMatch[1].length / 2);
    return {
      text: numberedMatch[2],
      isBullet: true, 
      indentLevel: indentLevel
    };
  }
  
  return {
    text,
    isBullet: false,
    indentLevel: 0
  };
}

// Process a section to remove its own title from the content if it appears at the beginning
function processSection(section: DocumentSection): DocumentSection {
  const { title, content } = section;
  
  // Escape special characters in the title for regex
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Common patterns for section title in content
  const patterns = [
    new RegExp(`^\\s*#\\s*${escapedTitle}\\s*(?:\\n|$)`, 'i'),             // # Title
    new RegExp(`^\\s*##\\s*${escapedTitle}\\s*(?:\\n|$)`, 'i'),            // ## Title
    new RegExp(`^\\s*###\\s*${escapedTitle}\\s*(?:\\n|$)`, 'i'),           // ### Title
    new RegExp(`^\\s*${escapedTitle}\\s*\\n[=]+\\s*(?:\\n|$)`, 'i'),       // Title
                                                                            // =====
    new RegExp(`^\\s*${escapedTitle}\\s*\\n[-]+\\s*(?:\\n|$)`, 'i'),       // Title
                                                                            // -----
    new RegExp(`^\\s*(?:[*_]\\s*){1,2}${escapedTitle}(?:[*_]\\s*){1,2}\\s*(?:\\n|$)`, 'i'), // *Title* or **Title**
  ];
  
  let processedContent = content;
  
  // Check if any of the patterns match at the beginning of the content
  for (const pattern of patterns) {
    if (pattern.test(processedContent)) {
      // Remove the title from the content as we'll add it separately
      processedContent = processedContent.replace(pattern, '');
      console.log(`Removed duplicate title "${title}" from content.`);
      break;
    }
  }
  
  // Remove leading whitespace and empty lines after title removal
  processedContent = processedContent.replace(/^\s+/, '');
  
  return {
    title,
    content: processedContent
  };
}

// Styles for PDF document
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  content: {
    fontSize: 12,
    lineHeight: 1.5,
  },
  bullet: {
    marginLeft: 20,
    flexDirection: 'row',
  },
  bulletPoint: {
    width: 10,
    marginRight: 5,
  },
  bulletText: {
    flex: 1,
  },
});

// Create PDF Document component
const PDFDocumentComponent: React.FC<{ sections: DocumentSection[] }> = ({ sections }) => (
  <PDFDocument>
    <Page size="A4" style={styles.page}>
      {sections.map((section, index) => {
        const processedSection = processSection(section);
        const lines = processedSection.content.split('\n');

        return (
          <View key={index} style={styles.section}>
            <Text style={styles.title}>{processedSection.title}</Text>
            {lines.map((line, lineIndex) => {
              const { text, isBullet, indentLevel } = processBulletPoints(line.trim());
              const { text: processedText } = detectTextFormatting(text);

              if (!processedText.trim()) return null;

              if (isBullet) {
                return (
                  <View key={lineIndex} style={[styles.bullet, { marginLeft: indentLevel * 10 }]}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>{processedText}</Text>
                  </View>
                );
              }

              return (
                <Text key={lineIndex} style={styles.content}>
                  {processedText}
                </Text>
              );
            })}
          </View>
        );
      })}
    </Page>
  </PDFDocument>
);

// Function to create and download PDF
async function createPDF(sections: DocumentSection[]): Promise<Blob> {
  return await pdf(<PDFDocumentComponent sections={sections} />).toBlob();
}

// Function to download PDF
export async function downloadPDF(sections: DocumentSection[], filename: string) {
  try {
    const blob = await createPDF(sections);
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Improved function to detect bold text for DOCX
function detectTextFormatting(text: string): { 
  text: string; 
  isBold: boolean; 
  isItalic: boolean;
} {
  // Detect bold formatting
  const boldPattern1 = /\*\*(.*?)\*\*/;
  const boldPattern2 = /__(.*?)__/;
  let isBold = boldPattern1.test(text) || boldPattern2.test(text);
  
  // Detect italic formatting
  const italicPattern1 = /(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/;
  const italicPattern2 = /(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/;
  let isItalic = italicPattern1.test(text) || italicPattern2.test(text);
  
  // Clean the text of markdown
  let cleanedText = stripMarkdown(text);
  
  return { 
    text: cleanedText, 
    isBold, 
    isItalic 
  };
}

// Update the createDOCX function to use the improved text formatting detection
function createDOCX(sections: DocumentSection[]): Document {
  // Enhanced function to process paragraphs with better bold handling
  const processParagraphs = (content: string) => {
    // Split content by newlines to identify paragraphs and handle bullets properly
    return content.split(/\n/).filter(Boolean).map(paragraph => {
      // Process for bullet points
      const { text, isBullet, indentLevel } = processBulletPoints(paragraph);
      
      // Process for text formatting
      const { text: cleanedText, isBold, isItalic } = detectTextFormatting(text);
      
      return new Paragraph({
        children: [
          new TextRun({
            text: cleanedText,
            bold: isBold,
            italics: isItalic
          })
        ],
        bullet: isBullet ? { level: indentLevel } : undefined,
        spacing: { after: 200 }
      });
    });
  };

  // Create sections array for the document
  const docSections = sections.map(section => {
    // Process section to avoid duplicate titles
    const processedSection = processSection(section);
    
    return {
      properties: {},
      children: [
        new Paragraph({
          text: processedSection.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        }),
        ...processParagraphs(processedSection.content)
      ]
    };
  });

  return new Document({
    sections: docSections
  });
}

export async function downloadDOCX(sections: DocumentSection[], filename: string) {
  const doc = createDOCX(sections);
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

export async function downloadDocument(
  sections: DocumentSection[],
  format: 'pdf' | 'docx',
  filename: string
) {
  if (format === 'pdf') {
    await downloadPDF(sections, `${filename}.pdf`);
  } else {
    await downloadDOCX(sections, `${filename}.docx`);
  }
}