import { useState, useEffect } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Download, RefreshCw, Wand2, AlertCircle, ChevronDown, FileText, File } from 'lucide-react';
import { DocumentType, getLatestDocumentTypes } from '@/lib/documents';
import { updateDocument, getDocument, getProjectBasicInfo } from '@/lib/projects';
import { useDocumentSubscription } from '@/lib/hooks/useDocumentSubscription';
import { downloadDocument } from '@/lib/download.tsx';
import { generateDocumentWithAI, updateDocumentProgress } from '@/lib/openai';
import type { Document, Project } from '@/lib/projects';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { usePayment } from '@/contexts/PaymentContext';
import PreviewOverlay from './PreviewOverlay';
import { cn } from '@/lib/utils';
import { VariantProps } from 'class-variance-authority';

interface SingleDocumentViewerProps {
  documentId: string;
  projectName: string;
}

// Use the actual ButtonProps definition that matches our ui/button.tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, 
  VariantProps<typeof buttonVariants> {
  children?: ReactNode;
}

function SingleDocumentViewer({ documentId, projectName }: SingleDocumentViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [initialDocument, setInitialDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  // Payment context for access control
  const { checkDocumentAccess, getPreviewPercentage } = usePayment();
  const [hasFullAccess, setHasFullAccess] = useState(false);

  // Subscribe to real-time updates
  const { document: liveDocument, error: subscriptionError } = useDocumentSubscription(documentId);

  // Check if mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Fetch initial document data
  useEffect(() => {
    async function fetchDocument() {
      try {
        console.log('Fetching document with ID:', documentId);
        const doc = await getDocument(documentId);
        console.log('Document fetched:', doc);
        setInitialDocument(doc);
        
        // Check if user has access to this document
        const hasAccess = checkDocumentAccess(doc.type, doc.project_id);
        setHasFullAccess(hasAccess);
        
        // Log the document order-based preview percentage
        console.log('Access check:', { 
          hasAccess, 
          previewPercentage: getPreviewPercentage(doc.type),
          documentType: doc.type, 
          projectId: doc.project_id
        });
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    }
    fetchDocument();
  }, [documentId, checkDocumentAccess, getPreviewPercentage]);

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        console.log('Fetching document types from Supabase...');
        const types = await getLatestDocumentTypes();
        console.log('Document types fetched:', types);
        setDocTypes(types);
      } catch (error) {
        console.error('Error fetching document types:', error);
      }
    };
    
    fetchDocumentTypes();
  }, []);

  // Use live document if available, otherwise use initial document
  const activeDocument = liveDocument || initialDocument;
  
  useEffect(() => {
    console.log('Active document:', activeDocument);
    console.log('Document types:', docTypes);
  }, [activeDocument, docTypes]);

  // Debug logging for paywall
  const logPaywallDebug = (doc: Document) => {
    console.log('Paywall Debug:', { 
      hasFullAccess, 
      previewPercentage: getPreviewPercentage(doc.type),
      showPaywall: !hasFullAccess,
      documentStatus: doc.status
    });
  };

  const handleRequiredInfoSubmit = async (answers: Record<string, string>) => {
    if (!activeDocument) return;
    
    try {
      await updateDocument(activeDocument.id, {
        content: {
          ...activeDocument.content,
          required_info: { 
            answers 
          } as any // Use type assertion to avoid type errors
        }
      });
      
      // Proceed with generation
      handleRegenerate();
    } catch (error) {
      console.error('Failed to save required info:', error);
      setError(error instanceof Error ? error.message : 'Failed to save required information');
    }
  };

  const handleSkipRequiredInfo = async () => {
    if (!activeDocument) return;
    
    try {
      // Set an empty required_info with a skipped flag
      await updateDocument(activeDocument.id, {
        content: {
          ...activeDocument.content,
          required_info: { 
            answers: {}, 
            skipped: true 
          } as any // Use type assertion to avoid type errors
        }
      });
      
      // Proceed with generation
      handleRegenerate();
    } catch (error) {
      console.error('Failed to process skip action:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate document');
    }
  };

  const handleRegenerate = async () => {
    if (!activeDocument) return;

    try {
      setError(null);
      setIsGenerating(true);
      
      // Get document type information
      const docType = docTypes.find(dt => dt.id === activeDocument.type);
      if (!docType) throw new Error('Document type not supported');

      // Get the full project data
      const project = await getProjectBasicInfo(activeDocument.project_id);
      if (!project) throw new Error('Project not found');

      // Initialize document with empty sections
      const sectionTitles = docType.promptTemplate.match(/Include:([\s\S]*?)(?:$|\.)/)?.[1]
        ?.split(/\n/)
        ?.map(line => line.trim())
        ?.filter(line => /^\d+\./.test(line))
        ?.map(line => line.replace(/^\d+\.\s*/, '').trim()) || [];

      const emptySections = sectionTitles.map(title => ({
        title,
        content: ''
      }));

      // Preserve the required_info if it exists
      const preservedRequiredInfo = activeDocument.content.required_info;

      // Set document status to generating with empty sections
      await updateDocument(activeDocument.id, {
        status: 'generating',
        version: activeDocument.version + 1,
        content: { 
          sections: emptySections,
          required_info: preservedRequiredInfo // Preserve any required info
        },
        progress: {
          percent: 0,
          stage: 'Initializing...',
          message: 'Setting up document generation'
        }
      });

      console.log(`Starting generation for document type: ${activeDocument.type}`);

      // Research phase
      await updateDocumentProgress(activeDocument.id, {
        percent: 15,
        stage: 'Research Phase',
        message: 'Analyzing industry data and trends'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Content planning phase
      await updateDocumentProgress(activeDocument.id, {
        percent: 25,
        stage: 'Content Planning',
        message: 'Structuring document sections'
      });

      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        // Generate content with OpenAI
        console.log(`Calling OpenAI to generate content for ${activeDocument.type}`);
        const generatedContent = await generateDocumentWithAI(activeDocument, project);
        console.log(`Successfully generated content for ${activeDocument.type}`);

        // Update document with completed content
        await updateDocument(activeDocument.id, {
          status: 'completed',
          content: {
            ...generatedContent,
            required_info: preservedRequiredInfo // Keep the required_info
          },
          progress: {
            percent: 100,
            stage: 'Complete',
            message: 'Document generation complete'
          }
        });
      } catch (generationError) {
        console.error('Error during content generation:', generationError);
        throw new Error(`Content generation failed: ${generationError instanceof Error ? generationError.message : String(generationError)}`);
      }

      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating document:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate document');
      
      // Update document status to error
      if (activeDocument) {
        await updateDocument(activeDocument.id, {
          status: 'error',
          progress: {
            percent: 0,
            stage: 'Error',
            message: error instanceof Error ? error.message : 'An error occurred during generation'
          }
        });
      }
      
      setIsGenerating(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!activeDocument?.content?.sections) return;
    
    const filename = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${activeDocument.type}`;
    await downloadDocument(activeDocument.content.sections, format, filename);
    setShowDownloadMenu(false);
  };

  // Add a function to render document content
  const renderDocumentContent = (doc: Document) => {
    if (doc.status === 'generating') {
    return (
        <div className="p-4 bg-blue-50 rounded-md mb-6">
          <div className="flex items-center">
            <div className="spinner mr-3" />
            <div>
              <h3 className="font-medium">Generating document...</h3>
              <p className="text-sm text-gray-600">
                {doc.progress?.stage || 'Starting generation...'}
                {doc.progress?.percent !== undefined && ` (${doc.progress.percent}%)`}
              </p>
              <p className="text-xs text-gray-500 mt-1">{doc.progress?.message}</p>
            </div>
          </div>
      </div>
    );
  }

    if (doc.status === 'pending') {
      const currentDocType = docTypes.find(docType => docType.id === doc.type);
      const hasRequiredQuestions = !!currentDocType?.requiredInfo?.questions?.length;

  return (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 sm:p-8">
            {hasRequiredQuestions ? (
                  <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information Needed</h2>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                      const answers: Record<string, string> = {};
                      formData.forEach((value, key) => {
                        answers[key] = typeof value === 'string' ? value : '';
                      });
                      handleRequiredInfoSubmit(answers);
                    }} className="space-y-6 sm:space-y-8">
                  {docTypes.find(docType => docType.id === doc.type)?.requiredInfo?.questions?.map((q: any) => (
                        <div key={q.id} className="space-y-2">
                          <label className="block text-lg font-medium text-gray-900">
                            {q.question}
                          </label>
                          {q.type === 'multi-select' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {q.options?.map((opt: string) => (
                                <label
                                  key={opt}
                                  className="relative flex items-start py-3 px-4 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                                >
                                  <div className="min-w-0 flex-1 text-sm">
                                    <div className="font-medium text-gray-700">
                                      {opt}
                                    </div>
                                  </div>
                                  <div className="ml-3 flex items-center h-5">
                                    <input
                                      type="checkbox"
                                      name={q.id}
                                      value={opt}
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                  </div>
                                </label>
                              ))}
                            </div>
                          ) : q.type === 'select' ? (
                            <select
                              name={q.id}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                              <option value="">Select an option</option>
                          {q.options?.map((opt: string) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : q.type === 'color' ? (
                            <div className="flex gap-3 items-center mt-1">
                              <input
                                type="color"
                                name={q.id}
                                className="h-10 w-20 p-1 rounded border border-gray-300"
                              />
                              <input
                                type="text"
                                name={`${q.id}_hex`}
                                className="flex-1 block w-full px-3 py-2 sm:text-sm border-gray-300 rounded-md"
                                placeholder="#000000"
                                pattern="^#[0-9A-Fa-f]{6}$"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              name={q.id}
                              className="mt-1 block w-full h-16 px-6 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                              placeholder={q.placeholder}
                            />
                          )}
                        </div>
                      ))}
                      <div className="flex gap-3">
                        <Button type="submit" className="flex-1">
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate with Details
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSkipRequiredInfo}
                          className="flex-1"
                        >
                          Skip & Generate
                        </Button>
                      </div>
                </form>
              </div>
            ) : (
              <div className="max-w-md mx-auto flex flex-col items-center">
                <div className="mb-6 text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Ready to Generate</h3>
                  <p className="text-base text-gray-600">
                    Click the button below to generate your {docTypes.find(docType => docType.id === doc.type)?.name}.
                  </p>
                </div>
                <Button 
                  onClick={handleRegenerate}
                  className="bg-blue-500 hover:bg-blue-600 px-8"
                  disabled={isGenerating}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Document
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // For completed documents, render the content
    return (
      <div className="relative">
        {doc.content?.sections?.map((section, index) => (
          <div key={index} className="mb-4 sm:mb-6 md:mb-8">
            <div className="markdown-content">
              <ReactMarkdown 
                rehypePlugins={[rehypeSanitize]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 md:mb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl sm:text-xl md:text-2xl font-bold mb-1.5 sm:mb-2 md:mb-3" {...props} />,
                  p: ({ node, ...props }) => {
                    // Safely check if first child starts with section title
                    const firstChild = Array.isArray(props.children) && props.children.length > 0 
                      ? props.children[0] 
                      : props.children;
                    
                    const firstChildText = typeof firstChild === 'string' ? firstChild : '';
                    const isFirstParagraph = index === 0 && firstChildText.startsWith(section.title);
                    
                    return <p className={isFirstParagraph ? 'lead text-base sm:text-base md:text-lg' : 'text-sm sm:text-sm md:text-base'} {...props} />;
                  },
                  ul: ({node, ...props}) => <ul className="text-sm sm:text-sm md:text-base list-disc pl-4 sm:pl-5 md:pl-8 mb-3 sm:mb-4" {...props} />,
                  ol: ({node, ...props}) => <ol className="text-sm sm:text-sm md:text-base list-decimal pl-4 sm:pl-5 md:pl-8 mb-3 sm:mb-4" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="pl-3 sm:pl-4 border-l-2 sm:border-l-4 border-gray-200 italic mb-3 sm:mb-4 text-sm sm:text-sm md:text-base" {...props} />
                }}
              >
                {section.content.endsWith('|') 
                  ? section.content.slice(0, -1) 
                  : section.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        
        {/* Add the PreviewOverlay directly here for completed documents */}
        {!hasFullAccess && (
          <PreviewOverlay 
            projectId={doc.project_id}
            documentType={doc.type}
            previewPercentage={getPreviewPercentage(doc.type)}
          />
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col animate-pulse">
        <header className="bg-white shadow">
          <div className="mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="h-4 sm:h-6 w-24 sm:w-32 bg-gray-200 rounded mb-3 sm:mb-4" />
            <div className="flex justify-between items-center">
              <div className="h-6 sm:h-8 w-32 sm:w-48 bg-gray-200 rounded" />
              <div className="flex gap-2 sm:gap-3">
                <div className="h-7 sm:h-9 w-20 sm:w-24 bg-gray-200 rounded" />
                <div className="h-7 sm:h-9 w-20 sm:w-24 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-white m-1 sm:m-6 rounded-lg shadow min-h-0">
          <div className="p-3 sm:p-8 space-y-6 sm:space-y-8">
            <div className="h-6 sm:h-8 w-3/4 bg-gray-200 rounded" />
            <div className="space-y-3 sm:space-y-4">
              <div className="h-3 sm:h-4 w-full bg-gray-200 rounded" />
              <div className="h-3 sm:h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-3 sm:h-4 w-4/6 bg-gray-200 rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!activeDocument || !docTypes.find(doc => doc.id === activeDocument?.type)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-4">
          <AlertCircle className="h-8 sm:h-12 w-8 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600">Document not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${isMobile ? 'pb-safe-area-bottom' : ''}`}>
      {!isMobile && (
        <header className="bg-white shadow">
          <div className="mx-auto px-12 sm:px-12 py-3 sm:py-4">
            <div className="mb-1 sm:mb-2">
              <h2 className="text-sm sm:text-lg font-medium text-gray-600 truncate">{projectName}</h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3 sm:mb-0">
                {docTypes.find(doc => doc.id === activeDocument?.type)?.name}
                {activeDocument.type === 'marketing_plan' && (
                  <span className="ml-2 inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Auto-generated
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  className="flex items-center justify-center"
                  disabled={isGenerating || activeDocument.status === 'generating'}
                >
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span className="text-xs sm:text-sm">Regenerate</span>
                </Button>
                <div className="relative w-full sm:w-auto">
                  <Button 
                    size="sm"
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="flex items-center justify-center w-full sm:w-auto"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Download</span>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                  </Button>
                  {showDownloadMenu && (
                    <div className="absolute right-0 mt-2 w-full sm:w-60 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1" role="menu">
                        <button
                          onClick={() => handleDownload('docx')}
                          className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-800 hover:bg-gray-100"
                          role="menuitem"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <File className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-blue-500" />
                              <span>Download as Word</span>
                            </div>
                            <span 
                              className="text-xs bg-green-100 text-green-800 px-1 sm:px-2 py-0.5 rounded-full font-medium cursor-help"
                              title="Word format better preserves formatting, styles, and special characters"
                            >
                              Recommended
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDownload('pdf')}
                          className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-red-500" />
                            <span>Download as PDF</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile action buttons */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 z-20 flex flex-col gap-3">
          <button 
            onClick={handleRegenerate}
            disabled={isGenerating || activeDocument.status === 'generating'}
            className="h-12 w-12 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 text-blue-600 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="h-12 w-12 bg-blue-600 rounded-full shadow-lg flex items-center justify-center"
            >
              <Download className="h-5 w-5 text-white" />
            </button>
            {showDownloadMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu">
                  <button
                    onClick={() => handleDownload('docx')}
                    className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 flex items-center"
                    role="menuitem"
                  >
                    <File className="h-4 w-4 mr-2 text-blue-500" />
                    <span>Word Document</span>
                  </button>
                  <button
                    onClick={() => handleDownload('pdf')}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    role="menuitem"
                  >
                    <FileText className="h-4 w-4 mr-2 text-red-500" />
                    <span>PDF Document</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <main className={`flex-1 overflow-y-auto ${isMobile ? 'bg-white' : 'bg-white m-1 sm:m-6 rounded-lg shadow'} min-h-0`}>
        <div className={`${isMobile ? 'px-[3%] py-4' : 'p-3 sm:p-8'} h-full overflow-y-auto`}>
          <div className="prose max-w-none">
            {error || subscriptionError ? (
              <div className="text-center py-8 sm:py-12">
                <div className="flex items-center justify-center text-red-600 mb-4">
                  <AlertCircle className="h-10 sm:h-12 w-10 sm:w-12" />
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
              <div className="text-center py-8 sm:py-12">
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {activeDocument.progress?.stage || 'Generating document...'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {activeDocument.progress?.message || 'Please wait while we process your request'}
                    </p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${activeDocument.progress?.percent || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : activeDocument.status === 'pending' ? (
              <div className="text-center py-8 sm:py-12">
                {docTypes.find(doc => doc.id === activeDocument?.type)?.requiredInfo ? (
                  <div className="max-w-lg mx-auto mt-4 sm:mt-8 px-2 sm:px-0">
                    {renderDocumentContent(activeDocument)}
                  </div>
                ) : (
                  <div className="max-w-md mx-auto flex flex-col items-center">
                    <div className="mb-6 text-center">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Ready to Generate</h3>
                      <p className="text-base text-gray-600">
                        Click the button below to generate your {docTypes.find(doc => doc.id === activeDocument?.type)?.name}.
                      </p>
                    </div>
                    <Button 
                      onClick={handleRegenerate}
                      className="bg-blue-500 hover:bg-blue-600 px-8"
                      disabled={isGenerating}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Document
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative min-h-[500px]">
                {(() => {
                  if (activeDocument) logPaywallDebug(activeDocument);
                  return renderDocumentContent(activeDocument);
                })()}
                <PreviewOverlay 
                  projectId={activeDocument.project_id}
                  documentType={activeDocument.type}
                  previewPercentage={getPreviewPercentage(activeDocument.type)}
                />
                </div>
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
  _onDocumentSelect?: (docId: string) => void;
}

export default function DocumentViewer({ project, selectedDoc }: DocumentViewerProps) {
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