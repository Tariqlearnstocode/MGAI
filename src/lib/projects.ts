import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { DOCUMENT_TYPES } from './documents';
import { MOCK_CONTENT } from './mockContent';

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

function generateDocumentContent(docType: string, projectData: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  // Only marketing plan is generated automatically
  if (docType === 'marketing_plan') {
    const mockContent = MOCK_CONTENT[docType as keyof typeof MOCK_CONTENT];
    return {
      sections: mockContent?.sections || [],
      status: 'completed'
    };
  }
  
  // All other documents start as pending
  return {
    sections: [],
    status: 'pending'
  };
}

export async function createProject(
  data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  user: User
) {
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      ...data,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;

  // Create documents for the project
  const documentPromises = DOCUMENT_TYPES.map(docType => {
    const { sections, status } = generateDocumentContent(docType.id, data);
    
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
  const missingDocTypes = DOCUMENT_TYPES.filter(docType => !existingDocTypes.includes(docType.id));
  
  if (missingDocTypes.length > 0) {
    console.log(`Adding ${missingDocTypes.length} missing document types to project ${id}`);
    
    // Create missing document types
    const documentPromises = missingDocTypes.map(docType => {
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
  return document;
}