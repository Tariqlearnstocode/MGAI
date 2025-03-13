import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Wand2, AlertCircle } from 'lucide-react';
import { DOCUMENT_TYPES } from '@/lib/documents';
import { MOCK_CONTENT } from '@/lib/mockContent';
import { updateDocument, getDocument } from '@/lib/projects';
import { useDocumentSubscription } from '@/lib/hooks/useDocumentSubscription';
import type { Document, Project } from '@/lib/projects';

interface SingleDocumentViewerProps {
  documentId: string;
  projectName: string;
}

function SingleDocumentViewer({ documentId, projectName }: SingleDocumentViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialDocument, setInitialDocument] = useState<Document | null>(null);

  // Subscribe to real-time updates
  const { document: liveDocument, error: subscriptionError } = useDocumentSubscription(documentId);

  // Fetch initial document data
  useEffect(() => {
    async function fetchDocument() {
      try {
        const doc = await getDocument(documentId);
        setInitialDocument(doc);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
      }
    }
    fetchDocument();
  }, [documentId]);

  // Use live document if available, otherwise use initial document
  const activeDocument = liveDocument || initialDocument;
  const docType = DOCUMENT_TYPES.find(doc => doc.id === activeDocument?.type);

  const handleRegenerate = async () => {
    if (!activeDocument) return;

    try {
      setError(null);
      setIsGenerating(true);
      
      const mockContent = MOCK_CONTENT[activeDocument.type as keyof typeof MOCK_CONTENT];
      if (!mockContent) throw new Error('Document type not supported');

      // Initialize progress
      await updateDocument(activeDocument.id, {
        status: 'generating',
        version: activeDocument.version + 1,
        content: { sections: mockContent.sections.map(s => ({ title: s.title, content: '' })) },
        progress: {
          percent: 0,
          stage: 'Initializing...',
          message: 'Setting up document generation'
        }
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate research phase
      await updateDocument(activeDocument.id, {
        progress: {
          percent: 15,
          stage: 'Research Phase',
          message: 'Analyzing industry data and trends'
        }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate content planning
      await updateDocument(activeDocument.id, {
        progress: {
          percent: 30,
          stage: 'Content Planning',
          message: 'Structuring document sections'
        }
      });

      await new Promise(resolve => setTimeout(resolve, 800));

      const sections = mockContent.sections.map(section => ({
        title: section.title,
        content: ''
      }));

      let totalProgress = 35;
      const progressPerSection = 55 / mockContent.sections.length;
      
      for (let i = 0; i < mockContent.sections.length; i++) {
        const content = mockContent.sections[i].content;
        const words = content.split(' ');
        const progressPerWord = progressPerSection / words.length;
        
        for (let j = 0; j < words.length; j += 3) {
          const partialContent = words.slice(0, j + 3).join(' ');
          sections[i].content = partialContent + (j + 3 < words.length ? '|' : '');
          
          totalProgress += progressPerWord * 3;
          await updateDocument(activeDocument.id, {
            content: { sections },
            progress: {
              percent: Math.min(90, Math.round(totalProgress)),
              stage: `Generating ${mockContent.sections[i].title}`,
              message: 'Writing content...'
            }
          });

          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Final polish phase
      await updateDocument(activeDocument.id, {
        progress: {
          percent: 95,
          stage: 'Final Polish',
          message: 'Reviewing and formatting'
        }
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Complete
      await updateDocument(activeDocument.id, {
        status: 'completed',
        content: { sections: mockContent.sections },
        progress: {
          percent: 100,
          stage: 'Complete',
          message: 'Document ready'
        }
      });
      
    } catch (error) {
      console.error('Failed to regenerate document:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      
      try {
        await updateDocument(activeDocument.id, {
          status: 'error',
          progress: {
            percent: 0,
            stage: 'Error',
            message: error instanceof Error ? error.message : 'An error occurred'
          }
        });
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!activeDocument || !docType) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Document not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="bg-white shadow">
        <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-2">
            <h2 className="text-lg font-medium text-gray-600">{projectName}</h2>
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {docType.name}
              {activeDocument.type === 'marketing_plan' && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Auto-generated
                </span>
              )}
            </h1>
            <div className="flex gap-3">
              {activeDocument.status === 'pending' && (
                <Button 
                  size="sm" 
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={activeDocument.status === 'pending' || isGenerating}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-white m-6 rounded-lg shadow min-h-0">
        <div className="p-8">
          <div className="prose max-w-none">
            {error || subscriptionError ? (
              <div className="text-center py-12">
                <div className="flex items-center justify-center text-red-600 mb-4">
                  <AlertCircle className="h-12 w-12" />
                </div>
                <p className="text-lg text-red-600">Generation failed</p>
                <p className="text-sm text-gray-500 mt-2">{error || subscriptionError}</p>
                <Button
                  onClick={handleRegenerate}
                  variant="outline"
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            ) : isGenerating || activeDocument.status === 'generating' ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full border-4 border-blue-100 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                        <span className="text-lg font-semibold text-blue-600">
                          {activeDocument.progress?.percent || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {activeDocument.progress?.stage || 'Generating document...'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {activeDocument.progress?.message || 'Please wait while we process your request'}
                  </p>
                  <div className="mt-6 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${activeDocument.progress?.percent || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : activeDocument.status === 'pending' ? (
              <div className="text-center py-12 text-gray-500">
                This document hasn't been generated yet.
                {activeDocument.type === 'marketing_plan' ? (
                  <p>Auto-generating your marketing plan...</p>
                ) : (
                  <p>Click "Generate" to create it.</p>
                )}
              </div>
            ) : (
              activeDocument.content.sections.map((section, index) => (
                <div key={index} className="mb-8">
                  {index === 0 ? (
                    <h1>{section.title}</h1>
                  ) : (
                    <h2>{section.title}</h2>
                  )}
                  <p className={index === 0 ? 'lead' : ''}>
                    {section.content.endsWith('|') ? (
                      section.content.slice(0, -1)
                    ) : section.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

interface DocumentViewerProps {
  project: Project & { documents: Document[] };
  selectedDoc: string;
  onDocumentSelect: (docId: string) => void;
}

export default function DocumentViewer({ project, selectedDoc, onDocumentSelect }: DocumentViewerProps) {
  const currentDocument = project.documents.find(doc => doc.type === selectedDoc);

  if (!currentDocument) {
    return null;
  }

  return (
    <SingleDocumentViewer
      key={currentDocument.id}
      documentId={currentDocument.id}
      projectName={project.name}
    />
  );
}