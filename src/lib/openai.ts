import { supabase } from './supabase';
import { getLatestDocumentTypes } from './documents';
import type { Project, Document } from './projects';

// Model to use for document generation
const MODEL = import.meta.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * Determines if a document type should use section-by-section generation
 * This is used to handle different document types appropriately
 */
function requiresSectionBySection(documentType: string): boolean {
  // Add logging to debug the document type being checked
  console.log(`Checking if document type "${documentType}" requires section-by-section generation`);
  
  // List of document types that need section-by-section approach
  // Normalize the document type string to ensure consistent matching
  const normalizedType = documentType.toLowerCase().trim();
  
  // Check against all possible variations
  const sectionBySection = ['marketing_plan', 'marketingplan'].includes(normalizedType);
  
  console.log(`Document type "${documentType}" section-by-section: ${sectionBySection}`);
  return sectionBySection;
}

/**
 * Get default sections for document types that require structured sections
 */
function getDefaultSections(documentType: string): string[] {
  // Normalize document type for consistent matching
  const normalizedType = documentType.toLowerCase().trim();
  console.log(`Getting default sections for normalized type "${normalizedType}"`);
  
  if (normalizedType === 'marketing_plan' || normalizedType === 'marketingplan') {
    console.log("Returning marketing plan sections");
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
  console.log(`No specific sections for ${documentType}, using default`);
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
  
  // First approach: Look for numbered items using regex
  // This pattern matches lines that start with a number followed by a period and then text
  const numberedPattern = /^\s*(\d+)\.\s*([^\n]+)/gm;
  const matches = Array.from(promptTemplate.matchAll(numberedPattern));
  
  if (matches && matches.length > 0) {
    // Extract just the text part (group 2) from each match
    const sections = matches.map(match => match[2].trim());
    console.log(`Found ${sections.length} numbered sections directly:`, sections);
    return sections;
  }
  
  // Second approach: Try to find "Include:" followed by a list
  const includeIndex = promptTemplate.toLowerCase().indexOf('include:');
  if (includeIndex !== -1) {
    // Get the text after "Include:"
    const textAfterInclude = promptTemplate.substring(includeIndex + 8);
    
    // Look for numbered items in this text
    const includeMatches = Array.from(textAfterInclude.matchAll(numberedPattern));
    
    if (includeMatches && includeMatches.length > 0) {
      const sections = includeMatches.map(match => match[2].trim());
      console.log(`Found ${sections.length} numbered sections after "Include:":`, sections);
      return sections;
    }
  }
  
  // If we still haven't found sections, try more aggressive pattern matching
  // Look for any bullet points, numbers, or dashes
  const genericListPattern = /(?:^\s*(?:[\*\-•]|\d+\.|\([a-z\d]\))\s*)([^\n]+)/gm;
  const genericMatches = Array.from(promptTemplate.matchAll(genericListPattern));
  
  if (genericMatches && genericMatches.length > 0) {
    const sections = genericMatches.map(match => match[1].trim());
    console.log(`Found ${sections.length} generic list items:`, sections);
    return sections;
  }
  
  // If all attempts fail, return empty array, which will trigger use of default sections
  console.warn("No section format recognized in template, will use defaults");
  return [];
}

/**
 * Clean up a section title by removing non-alphanumeric characters from beginning/end
 * and ensuring it's properly formatted
 */
function cleanSectionTitle(title: string): string {
  // Trim whitespace and punctuation from start and end
  const cleaned = title.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
  console.log(`Cleaned section title: "${title}" -> "${cleaned}"`);
  return cleaned;
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
  
  // Force a check of section-by-section here to ensure it's being evaluated correctly
  const isSectionBySection = requiresSectionBySection(documentType);
  console.log(`Section-by-section check in generateSectionContent: ${isSectionBySection} for ${documentType}`);
  
  let retryCount = 0;
  const maxRetries = 2;
  
  // Determine the appropriate max tokens based on document type
  const maxTokens = isSectionBySection ? 800 : 2500;
  
  // Select the appropriate system prompt based on document type
  const systemPrompt = isSectionBySection
    ? "You are an expert marketing strategist and content creator. Generate professional, detailed, and actionable content for a SINGLE SECTION of a marketing document. Always use the specific business name provided and NEVER use placeholder text like 'brand name', 'your company', etc. Format your response using Markdown for better readability, including headings, bullet points, and emphasis where appropriate."
    : "You are an expert marketing strategist and content creator. Generate a COMPLETE, well-structured document with multiple sections. Include clear headings for each major point and organize the content logically. Always use the specific business name provided and NEVER use placeholder text. Format your response using Markdown with proper headings, subheadings, bullet points, and emphasis where appropriate. The document should be comprehensive and cover all aspects requested in the prompt.";
  
  // If we're not doing section-by-section, adjust the user prompt instruction
  const userPromptSuffix = isSectionBySection
    ? `\n\nI need detailed content for the "${section}" section. Start your response with the section title formatted as a markdown heading (e.g., "# ${section}" or "## ${section}"). Then write 2-3 paragraphs of professional marketing content tailored specifically to the business name and details provided above. Use markdown formatting to make the content more readable and structured (bullet points, emphasis, etc.).`
    : `\n\nCreate a complete, well-structured document addressing all key points. Organize it with clear headings and subheadings, and ensure the content provides specific, actionable insights tailored to the business details provided. Use markdown formatting throughout to improve readability.`;
  
  while (retryCount <= maxRetries) {
    try {
      // Create the full prompt
      const fullPrompt = `${systemPrompt}\n\n${prompt}${userPromptSuffix}`;
      console.log(`Sending prompt with length ${fullPrompt.length} chars to API for section "${section}"`);
      
      // Call the server API endpoint instead of using OpenAI directly
      const apiUrl = '/api/generate-content';
      
      console.log(`Using max_tokens: ${maxTokens} for section "${section}"`);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          model: MODEL,
          max_tokens: maxTokens
        }),
      });

      if (!response.ok) {
        console.error(`API returned status ${response.status} for section "${section}"`);
        let errorData = null;
        try {
          errorData = await response.json();
        } catch (e) {
          console.error("Failed to parse error response");
        }
        throw new Error(errorData?.error || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.result;
      
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
    
    // Add debugging for document type before checking sections
    console.log(`Document type for section handling: "${document.type}", docType id: "${docType.id}"`);
    
    // Force a check of section-by-section to ensure it's working
    const isSectionBySection = requiresSectionBySection(document.type);
    console.log(`Full document type check in generateDocumentWithAI: ${isSectionBySection} for ${document.type}`);
    
    // Handle section titles differently based on document type
    let sectionTitles: string[] = [];
    
    if (isSectionBySection) {
      // For marketing plans, directly use the default sections instead of trying to extract them
      // This ensures consistent section generation
      const normalizedType = document.type.toLowerCase().trim();
      if (normalizedType === 'marketing_plan' || normalizedType === 'marketingplan') {
        console.log("Using predefined sections for marketing plan");
        sectionTitles = [
          "Executive Summary",
          "Market Analysis",
          "Target Market Segmentation",
          "Marketing Channels & Tactics",
          "Budget Allocation",
          "Implementation Timeline",
          "Success Metrics"
        ];
      } else {
        // For other section-by-section documents, try extraction
        sectionTitles = extractSections(promptTemplate);
        console.log(`Extracted ${sectionTitles.length} raw sections for ${document.type}:`, sectionTitles);
        
        // Clean up section titles
        sectionTitles = sectionTitles.map(cleanSectionTitle);
        console.log(`Cleaned ${sectionTitles.length} sections for ${document.type}:`, sectionTitles);
        
        // If no sections were found, use default sections
        if (sectionTitles.length === 0) {
          console.warn(`No sections found in prompt template for ${document.type}, using defaults`);
          sectionTitles = getDefaultSections(document.type);
          console.log(`Using default sections for ${document.type}:`, sectionTitles);
        }
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
      
      // Log the section we're working on
      console.log(`Generating content for section ${i+1}/${sections.length}: "${section.title}"`);
      
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

/**
 * Call the server-side API for OpenAI content generation
 */
export async function callOpenAI(prompt: string, model = MODEL, max_tokens?: number): Promise<string> {
  try {
    console.log(`Calling OpenAI API with max_tokens: ${max_tokens}`);
    
    // Use relative URL that works in all environments
    const apiUrl = '/api/generate-content';
    
    // Always use the server API endpoint - never expose keys in client
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model,
        max_tokens
      }),
    });

    if (!response.ok) {
      console.error(`API returned status ${response.status}`);
      let errorData = null;
      try {
        errorData = await response.json();
      } catch (e) {
        console.error("Failed to parse error response");
      }
      throw new Error(errorData?.error || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`Got API response - token usage: ${JSON.stringify(data.usage)}`);
    return data.result;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}