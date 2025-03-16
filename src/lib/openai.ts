import OpenAI from 'openai';
import { supabase } from './supabase';
import { getLatestDocumentTypes } from './documents';
import type { Project, Document } from './projects';

// Initialize OpenAI client using the documented approach
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Model to use for document generation
const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

/**
 * Determines if a document type should use section-by-section generation
 * This is used to handle different document types appropriately
 */
function requiresSectionBySection(documentType: string): boolean {
  // List of document types that need section-by-section approach
  return ['marketing_plan'].includes(documentType);
}

/**
 * Get default sections for document types that require structured sections
 */
function getDefaultSections(documentType: string): string[] {
  if (documentType === 'marketing_plan') {
    return [
      "Executive Summary",
      "Market Analysis",
      "Target Market Segmentation",
      "Marketing Channels & Tactics",
      "Budget Allocation",
      "Implementation Timeline",
      "Success Metrics"
    ];
  }
  
  // Default to a single section for other document types
  return ["Complete Document"];
}

/**
 * Prepare prompt template by replacing placeholders with actual project data and required info
 */
async function preparePrompt(template: string, projectData: Project, document: Document): Promise<string> {
  // Extract all available project data for reference - no fallbacks needed as these are required fields
  const projectInfo = {
    business_name: projectData.name,
    business_type: projectData.business_type,
    target_audience: projectData.target_audience,
    budget: projectData.budget,
    goals: projectData.goals,
    challenges: projectData.challenges,
  };
  
  // Add any other fields from the project that might be useful
  const otherProjectFields = Object.entries(projectData)
    .filter(([key]) => !['id', 'user_id', 'created_at', 'updated_at'].includes(key))
    .filter(([key, value]) => typeof value === 'string' && value.trim() !== '' && !Object.keys(projectInfo).includes(key))
    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`);
  
  // Replace placeholders in the template
  let prompt = template
    .replace(/{business_name}/g, projectInfo.business_name)
    .replace(/{business_type}/g, projectInfo.business_type)
    .replace(/{target_audience}/g, projectInfo.target_audience)
    .replace(/{budget}/g, projectInfo.budget)
    .replace(/{goals}/g, projectInfo.goals)
    .replace(/{challenges}/g, projectInfo.challenges);
  
  // Fetch document type
  const documentTypes = await getLatestDocumentTypes();
  const docType = documentTypes.find(dt => dt.id === document.type);
  
  // Add clear instruction about not using placeholder text
  let additionalInstructions = `\n\n===IMPORTANT INSTRUCTIONS===\n`;
  additionalInstructions += `1. USE THE EXACT BUSINESS NAME: "${projectInfo.business_name}" throughout the document. This is mandatory.\n`;
  additionalInstructions += `2. NEVER use placeholder text like "brand name", "your company", "our SaaS", etc. Always use "${projectInfo.business_name}" instead.\n`;
  additionalInstructions += `3. Customize ALL content specifically for ${projectInfo.business_name} using the information provided below.\n`;
  additionalInstructions += `4. Be specific, practical, and actionable - avoid generic marketing language.\n\n`;
  
  // Comprehensive business context section
  additionalInstructions += `===BUSINESS CONTEXT===\n`;
  additionalInstructions += `Business Name: ${projectInfo.business_name}\n`;
  additionalInstructions += `Business Type: ${projectInfo.business_type}\n`;
  additionalInstructions += `Target Audience: ${projectInfo.target_audience}\n`;
  additionalInstructions += `Budget: ${projectInfo.budget}\n`;
  additionalInstructions += `Goals: ${projectInfo.goals}\n`;
  additionalInstructions += `Challenges: ${projectInfo.challenges}\n`;
  
  if (otherProjectFields.length > 0) {
    additionalInstructions += `Additional Information:\n${otherProjectFields.join('\n')}\n`;
  }
  
  // If this document type has required info questions, add them
  if (docType?.requiredInfo) {
    const requiredInfo = document.content.required_info?.answers || {};
    const wasSkipped = document.content.required_info?.skipped || false;
    
    additionalInstructions += `\n===DOCUMENT SPECIFIC INFORMATION===\n`;
    
    if (Object.keys(requiredInfo).length > 0 && !wasSkipped) {
      // User provided some required information - include it in the prompt
      docType.requiredInfo.questions.forEach((question: any) => {
        const answer = requiredInfo[question.id];
        if (answer) {
          additionalInstructions += `${question.question} ${answer}\n`;
        } else {
          additionalInstructions += `${question.question} [Not provided]\n`;
        }
      });
    } else {
      // User skipped the required info
      additionalInstructions += `The user has chosen to skip providing specific details for this document.\n`;
      additionalInstructions += `Make smart, professional assumptions based on the business context above.\n`;
      additionalInstructions += `Focus on being specific to this business type and goals.\n`;
    }
  }
  
  // Add a final reminder
  additionalInstructions += `\n===FINAL REMINDER===\n`;
  additionalInstructions += `ALWAYS refer to the business by its actual name "${projectInfo.business_name}" and NEVER use generic placeholders.\n`;
  additionalInstructions += `Create content that feels custom-written for ${projectInfo.business_name} specifically.\n`;
  additionalInstructions += `Double-check your response to ensure "${projectInfo.business_name}" appears in every section.\n`;
  additionalInstructions += `Do not include these instructions in your response.\n`;
  
  // Add the additional context to the prompt
  prompt += additionalInstructions;
  
  return prompt;
}

/**
 * Extract section titles from the prompt template
 */
function extractSections(promptTemplate: string): string[] {
  console.log("Raw prompt template:", promptTemplate);
  
  // Try to find "Include:" followed by a list, allowing for more flexibility in formatting
  const includePattern = /Include:[\s\S]*?((?:\d+\.\s*[^\n\d]+\n?)+)/i;
  const sectionMatch = promptTemplate.match(includePattern);
  
  if (!sectionMatch || !sectionMatch[1]) {
    console.warn("No 'Include:' section with numbered items found in template, trying direct extraction of numbered list");
    
    // Fallback: Try to find any numbered list in the template
    const numberedListPattern = /((?:\d+\.\s*[^\n\d]+\n?)+)/;
    const directMatch = promptTemplate.match(numberedListPattern);
    
    if (!directMatch || !directMatch[1]) {
      console.error("No numbered list found in template at all");
      
      // Last resort: Generate default sections based on document type
      /* 
      // Commented out marketing plan fallback for testing
      if (promptTemplate.toLowerCase().includes("marketing plan")) {
        console.log("Using default sections for marketing plan");
        return [
          "Executive Summary",
          "Market Analysis",
          "Target Market Segmentation",
          "Marketing Channels & Tactics",
          "Budget Allocation",
          "Implementation Timeline",
          "Success Metrics"
        ];
      }
      */
      
      return [];
    }
    
    // Extract sections from direct numbered list
    const rawContent = directMatch[1];
    console.log("Found numbered list directly:", rawContent);
    
    // Extract the sections
    const sections = rawContent.split(/\n/)
      .map(line => line.trim())
      .filter(line => /^\d+\./.test(line))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
    
    console.log("Extracted sections:", sections);
    return sections;
  }
  
  // Extract the content after "Include:"
  const rawContent = sectionMatch[1];
  console.log("Found content after Include:", rawContent);
  
  // Extract the sections
  const sections = rawContent.split(/\n/)
    .map(line => line.trim())
    .filter(line => /^\d+\./.test(line))
    .map(line => line.replace(/^\d+\.\s*/, '').trim());
  
  console.log("Extracted sections:", sections);
  return sections;
}

/**
 * Generate content for a single section using OpenAI
 */
async function generateSectionContent(
  section: string, 
  prompt: string, 
  documentType: string
): Promise<string> {
  console.log(`Generating content for section "${section}" of document type "${documentType}"`);
  
  let retryCount = 0;
  const maxRetries = 2;
  
  // Determine the appropriate max tokens based on document type
  const maxTokens = requiresSectionBySection(documentType) ? 500 : 2500;
  
  // Select the appropriate system prompt based on document type
  const systemPrompt = requiresSectionBySection(documentType)
    ? "You are an expert marketing strategist and content creator. Generate professional, detailed, and actionable content for a SINGLE SECTION of a marketing document. Always use the specific business name provided and NEVER use placeholder text like 'brand name', 'your company', etc. Format your response using Markdown for better readability, including headings, bullet points, and emphasis where appropriate."
    : "You are an expert business strategist and content creator. Generate a COMPLETE, well-structured document with multiple subsections. Include clear headings for each major point and organize the content logically. Always use the specific business name provided and NEVER use placeholder text. Format your response using Markdown with proper headings, subheadings, bullet points, and emphasis where appropriate. The document should be comprehensive and cover all aspects requested in the prompt.";
  
  // If we're not doing section-by-section, adjust the user prompt instruction
  const userPromptSuffix = requiresSectionBySection(documentType)
    ? `\n\nI need detailed content for the "${section}" section. Start your response with the section title formatted as a markdown heading (e.g., "# ${section}" or "## ${section}"). Then write 2-3 paragraphs of professional marketing content tailored specifically to the business name and details provided above. Use markdown formatting to make the content more readable and structured (bullet points, emphasis, etc.).`
    : `\n\nCreate a complete, well-structured document addressing all key points. Organize it with clear headings and subheadings, and ensure the content provides specific, actionable insights tailored to the business details provided. Use markdown formatting throughout to improve readability.`;
  
  while (retryCount <= maxRetries) {
    try {
      // Make the API call following the documented pattern
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `${prompt}${userPromptSuffix}`
          }
        ],
        temperature: 0.7,
        max_tokens: maxTokens
      });

      // Log the response and extract the content
      const content = completion.choices[0]?.message?.content?.trim() || '';
      
      if (!content) {
        console.warn(`Empty response for section "${section}" - retrying`);
        retryCount++;
        continue;
      }
      
      console.log(`Received ${content.length} characters for section "${section}"`);
      return content;
    } catch (error) {
      retryCount++;
      
      // Detailed error logging
      console.error(`Error (attempt ${retryCount}/${maxRetries + 1}) generating content for section "${section}":`, error);
      
      if (retryCount <= maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = 1000 * Math.pow(2, retryCount);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // After all retries, return a fallback message
        return `[Content generation for "${section}" failed after ${maxRetries + 1} attempts. Please try regenerating this document.]`;
      }
    }
  }
  
  // This should never be reached due to the returns in the loop, but TypeScript needs it
  return `[Content could not be generated for "${section}"]`;
}

/**
 * Generate document content using OpenAI
 */
export async function generateDocumentWithAI(
  document: Document,
  project: Project
): Promise<{ sections: Array<{ title: string; content: string }> }> {
  console.log(`Starting document generation for type: ${document.type}`);
  
  try {
    const documentTypes = await getLatestDocumentTypes();
    const docType = documentTypes.find(dt => dt.id === document.type);
    if (!docType) {
      throw new Error(`Document type ${document.type} not found`);
    }

    // Get prompt template and prepare it
    const promptTemplate = docType.promptTemplate;
    if (!promptTemplate) {
      throw new Error(`No prompt template found for document type ${document.type}`);
    }
    
    console.log(`Found prompt template for ${document.type}`);
    const prompt = await preparePrompt(promptTemplate, project, document);
    
    // Handle section titles differently based on document type
    let sectionTitles: string[] = [];
    
    if (requiresSectionBySection(document.type)) {
      // For section-by-section documents like marketing_plan:
      // Extract section titles from the prompt template
      sectionTitles = extractSections(promptTemplate);
      console.log(`Extracted ${sectionTitles.length} sections for ${document.type}: ${sectionTitles.join(', ')}`);
      
      // If no sections were found, use default sections
      if (sectionTitles.length === 0) {
        console.warn(`No sections found in prompt template for ${document.type}, using defaults`);
        sectionTitles = getDefaultSections(document.type);
        console.log(`Using default sections for ${document.type}: ${sectionTitles.join(', ')}`);
      }
    } else {
      // For other document types: use a single section
      sectionTitles = ["Complete Document"];
      console.log(`Using single section approach for ${document.type}`);
    }
    
    // Create empty sections to start with
    const sections = sectionTitles.map(title => ({
      title,
      content: ''
    }));

    // Generate content for each section
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // Report progress
      await updateDocumentProgress(document.id, {
        percent: 25 + (i * 75 / sections.length),
        stage: `Generating ${section.title}`,
        message: `Creating content for section ${i + 1} of ${sections.length}`
      });

      // Generate content for this section
      try {
        section.content = await generateSectionContent(section.title, prompt, document.type);
      } catch (sectionError) {
        console.error(`Error in section "${section.title}":`, sectionError);
        section.content = `[Error generating content: ${sectionError instanceof Error ? sectionError.message : String(sectionError)}]`;
      }
    }

    return { sections };
  } catch (error) {
    console.error(`Error generating document with AI for document type ${document.type}:`, error);
    
    // Extract and log more specific error information
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'object' && error !== null && 'message' in error 
        ? String((error as any).message)
        : 'Unknown error';
        
    console.error(`Detailed error for ${document.type}: ${errorMessage}`);
    
    // Include document type in the error for easier debugging
    throw new Error(`Failed to generate content for document type '${document.type}': ${errorMessage}`);
  }
}

/**
 * Update document progress in the database
 */
export async function updateDocumentProgress(
  documentId: string,
  progress: {
    percent: number;
    stage: string;
    message?: string;
  }
) {
  try {
    const { error } = await supabase
      .from('documents')
      .update({ progress })
      .eq('id', documentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating document progress:', error);
  }
}

export async function expandDocument(document: any) {
  try {
    // ... existing code ...
    
    const documentTypes = await getLatestDocumentTypes();
    const docType = documentTypes.find(dt => dt.id === document.type);
    if (!docType) {
      throw new Error(`Document type ${document.type} not found`);
    }
    
    // ... existing code ...
  } catch (error) {
    // ... existing code ...
  }
}