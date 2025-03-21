import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { DocumentType, getLatestDocumentTypes } from './documents';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  business_type: string;
  target_audience: string;
  goals: string;
  budget: string;
  challenges: string;
  created_at: string;
  updated_at: string;
  status?: 'draft' | 'completed';
  description: string;
}

export interface Document {
  id: string;
  project_id: string;
  type: string;
  version: number;
  content: {
    sections: Array<{
      title: string;
      content: string;
    }>;
    required_info?: {
      answers: Record<string, string>;
      skipped?: boolean;
    };
  };
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress?: {
    percent: number;
    stage: string;
    message?: string;
  };
  created_at: string;
  updated_at: string;
}

function generateDocumentContent(_docType: string, _projectData: Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  // All documents start as pending and will be generated with OpenAI
  return {
    sections: [] as Array<{title: string, content: string}>,
    status: 'pending' as const
  };
}

export type CreateProjectPayload = {
  name: string;
  business_type: string;
  description: string;
  target_audience: string;
  goals: string;
  budget: string;
  challenges: string;
};

export const createProject = async (projectData: CreateProjectPayload, user: User): Promise<Project> => {
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      ...projectData,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;

  // Create default documents for each document type
  const documentTypes = await getLatestDocumentTypes();
  const documentPromises = documentTypes.map(docType => {
    const { sections, status } = generateDocumentContent(docType.id, projectData);
    
    return supabase
      .from('documents')
      .insert({
        project_id: project.id,
        type: docType.id,
        version: 1,
        content: { sections },
        status
      })
      .select();
  });

  await Promise.all(documentPromises);

  return project;
}

export async function getProjects() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return projects;
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string) {
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      documents (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  
  // Check if all document types exist, add any missing ones
  const existingDocTypes = project.documents.map((doc: Document) => doc.type);
  
  // Get document types and then filter them
  const documentTypes = await getLatestDocumentTypes();
  const missingDocTypes = documentTypes.filter(docType => !existingDocTypes.includes(docType.id));
  
  if (missingDocTypes.length > 0) {
    console.log(`Adding ${missingDocTypes.length} missing document types to project ${id}`);
    
    // Create missing document types
    const documentPromises = missingDocTypes.map((docType: DocumentType) => {
      const { sections, status } = generateDocumentContent(docType.id, project);
      
      return supabase
        .from('documents')
        .insert({
          project_id: project.id,
          type: docType.id,
          version: 1,
          content: { sections },
          status
        })
        .select();
    });
    
    const results = await Promise.all(documentPromises);
    
    // Add the new documents to the project data
    results.forEach((result: any) => {
      if (result.data && result.data.length > 0) {
        project.documents.push(result.data[0]);
      }
    });
  }

  return project;
}

/**
 * Get basic project data by ID without fetching associated documents
 */
export async function getProjectBasicInfo(projectId: string): Promise<Project> {
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return project;
}

export async function createDocument(data: Omit<Document, 'id' | 'created_at' | 'updated_at'>) {
  const { data: document, error } = await supabase
    .from('documents')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return document;
}

async function updateProjectStatus(projectId: string) {
  // Get all documents for the project
  const { data: documents, error: fetchError } = await supabase
    .from('documents')
    .select('status')
    .eq('project_id', projectId);

  if (fetchError) throw fetchError;

  // Check if all documents are completed
  const allCompleted = documents?.every(doc => doc.status === 'completed');

  // Update project status
  const { error: updateError } = await supabase
    .from('projects')
    .update({ status: allCompleted ? 'completed' : 'draft' })
    .eq('id', projectId);

  if (updateError) throw updateError;
}

export async function updateDocument(id: string, data: Partial<Document>) {
  const { data: document, error } = await supabase
    .from('documents')
    .update({
      // Exclude progress from the spread if it's undefined to avoid null overwrites
      ...(data.progress ? { progress: data.progress } : {}),
      ...Object.fromEntries(
        Object.entries(data).filter(([key]) => key !== 'progress')
      ),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // If the document status is being updated to completed, check project status
  if (data.status === 'completed') {
    await updateProjectStatus(document.project_id);
  }

  return document;
}

export async function getDocument(id: string) {
  const { data: document, error } = await supabase
    .from('documents')
    .select(`
      *,
      project:project_id (
        *,
        documents (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  // After calling checkDocumentAccess
  console.log('ACCESS CHECK RESULT:', {
    projectId: document.project_id,
    hasAccess: document.hasAccess,
    raw: JSON.stringify(document.hasAccess) // Show exact value
  });

  return document;
}

export const ensureUserHasAllDocumentTypes = async (projectId: string): Promise<void> => {
  // Get all documents for the project
  const { data: documents, error: fetchError } = await supabase
    .from('documents')
    .select('status, type')
    .eq('project_id', projectId);

  if (fetchError) throw fetchError;

  // Check if all documents are completed
  const allCompleted = documents?.every(doc => doc.status === 'completed');

  // Update project status
  const { error: updateError } = await supabase
    .from('projects')
    .update({ status: allCompleted ? 'completed' : 'draft' })
    .eq('id', projectId);

  if (updateError) throw updateError;

  // Check which document types exist in this project
  const existingDocTypes = documents?.map(doc => doc.type) || [];
  
  const documentTypes = await getLatestDocumentTypes();
  const missingDocTypes = documentTypes.filter(docType => !existingDocTypes.includes(docType.id));
  
  // Create documents for any missing document types
  if (missingDocTypes.length > 0) {
    console.log(`Adding ${missingDocTypes.length} missing document types to project ${projectId}`);
    
    // Create missing document types
    const documentPromises = missingDocTypes.map(docType => {
      const { sections, status } = generateDocumentContent(docType.id, {});
      
      return supabase
        .from('documents')
        .insert({
          project_id: projectId,
          type: docType.id,
          version: 1,
          content: { sections },
          status
        })
        .select();
    });
    
    const results = await Promise.all(documentPromises);
    
    // Add the new documents to the project data
    results.forEach((result: any) => {
      if (result.data && result.data.length > 0) {
        // Assuming you want to add the new document to the project's document list
        // You might want to update the project's document list to include this new document
      }
    });
  }
}