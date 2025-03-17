import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProject, updateDocument } from '@/lib/projects';
import { generateDocumentWithAI, updateDocumentProgress } from '@/lib/openai';
import DocumentViewer from '@/components/DocumentViewer';
import DocumentSidebar from '@/components/DocumentSidebar';
import { Menu, X, ChevronDown, ChevronLeft } from 'lucide-react';
import type { Project, Document } from '@/lib/projects';
import { getLatestDocumentTypes } from '@/lib/documents';

export default function ProjectDocuments() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedDoc, setSelectedDoc] = useState('marketing_plan');
  const [project, setProject] = useState<Project & { documents: Document[] } | null>(null);
  const [autoGeneratingMarketing, setAutoGeneratingMarketing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleDocumentSelect = (docId: string) => {
    setSelectedDoc(docId);
    setDropdownOpen(false);
    // Close sidebar on mobile after selection
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Auto-generate marketing plan if it's in pending status
  useEffect(() => {
    if (project && !autoGeneratingMarketing) {
      const marketingPlan = project.documents.find(doc => doc.type === 'marketing_plan');
      
      if (marketingPlan && marketingPlan.status === 'pending') {
        // Start auto-generation of marketing plan
        const generateMarketingPlan = async () => {
          try {
            setAutoGeneratingMarketing(true);
            console.log('Auto-generating marketing plan...');
            
            // Preserve any required info
            const preservedRequiredInfo = marketingPlan.content.required_info;
            
            // Set document to generating status
            await updateDocument(marketingPlan.id, {
              status: 'generating',
              progress: {
                percent: 0,
                stage: 'Initializing...',
                message: 'Setting up document generation'
              }
            });
            
            // Update project state to reflect the change
            setProject(prevProject => {
              if (!prevProject) return null;
              return {
                ...prevProject,
                documents: prevProject.documents.map(doc => 
                  doc.id === marketingPlan.id 
                    ? {
                        ...doc,
                        status: 'generating',
                        progress: {
                          percent: 0,
                          stage: 'Initializing...',
                          message: 'Setting up document generation'
                        }
                      }
                    : doc
                )
              };
            });
            
            // Research phase
            await updateDocumentProgress(marketingPlan.id, {
              percent: 15,
              stage: 'Research Phase',
              message: 'Analyzing industry data and trends'
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Content planning phase
            await updateDocumentProgress(marketingPlan.id, {
              percent: 25,
              stage: 'Content Planning',
              message: 'Structuring document sections'
            });
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Generate content with OpenAI
            console.log('Calling OpenAI to generate marketing plan content');
            const generatedContent = await generateDocumentWithAI(marketingPlan, project);
            console.log('Successfully generated marketing plan content');
            
            // Update document with completed content
            await updateDocument(marketingPlan.id, {
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
            
            // Refresh project data to get the updated document
            const updatedProject = await getProject(id as string);
            setProject(updatedProject);
            
          } catch (error) {
            console.error('Error auto-generating marketing plan:', error);
            
            // Update document status to error
            if (marketingPlan) {
              await updateDocument(marketingPlan.id, {
                status: 'error',
                progress: {
                  percent: 0,
                  stage: 'Error',
                  message: error instanceof Error ? error.message : 'An error occurred during generation'
                }
              });
              
              // Refresh project data to get the updated document
              const updatedProject = await getProject(id as string);
              setProject(updatedProject);
            }
            
          } finally {
            setAutoGeneratingMarketing(false);
          }
        };
        
        generateMarketingPlan();
      }
    }
  }, [project, id, autoGeneratingMarketing]);

  useEffect(() => {
    async function loadProject() {
      if (!id) return;
      try {
        const data = await getProject(id);
        setProject(data);
      } catch (error) {
        console.error('Failed to load project:', error);
      }
    }

    async function loadDocumentTypes() {
      try {
        const types = await getLatestDocumentTypes();
        setDocumentTypes(types);
      } catch (error) {
        console.error('Error fetching document types:', error);
      }
    }

    loadProject();
    loadDocumentTypes();

    // Check if mobile
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    // Check on load
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Open sidebar by default on desktop
    const mobile = window.innerWidth < 768;
    setSidebarOpen(!mobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [id]);

  // Effect to keep sidebar open on desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  if (!project) {
    return null;
  }

  const selectedDocumentType = documentTypes.find(dt => dt.id === selectedDoc);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
        {/* Mobile header with document selector */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          {/* Project name */}
          <div className="border-b border-gray-100 px-3 py-2">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/app')}
                className="flex items-center text-gray-600 mr-2"
              >
                <ChevronLeft size={20} />
              </button>
              <h1 className="text-lg font-semibold text-gray-800 truncate">{project.name}</h1>
            </div>
          </div>
          
          {/* Document selector */}
          <div className="px-3 py-2">
            <div className="relative w-full">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-between w-full py-2 px-3 bg-gray-50 rounded-md text-left"
              >
                <span className="font-medium truncate">
                  {selectedDocumentType?.name || 'Select Document'}
                </span>
                <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-md z-50 max-h-64 overflow-y-auto">
                  {documentTypes
                    .sort((a, b) => a.documentOrder - b.documentOrder)
                    .map((doc) => {
                      const docStatus = project.documents.find(d => d.type === doc.id)?.status;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => handleDocumentSelect(doc.id)}
                          className={`w-full flex items-center p-3 text-left border-b border-gray-100 last:border-none 
                            ${selectedDoc === doc.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 
                            ${docStatus === 'completed' ? 'bg-green-100 text-green-600' : 
                              docStatus === 'generating' ? 'bg-blue-100 text-blue-600' : 
                              selectedDoc === doc.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {docStatus === 'completed' ? (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : docStatus === 'generating' ? (
                              <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                            ) : (
                              <doc.icon className="h-3 w-3" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-xs sm:text-sm text-gray-500 line-clamp-2 overflow-hidden">
                              {docStatus === 'generating' ? (
                                <span className="text-blue-600">
                                  {project.documents.find(d => d.type === doc.id)?.progress?.stage || 'Generating...'}
                                </span>
                              ) : (
                                <span>{doc.description}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Overlay when dropdown is open */}
        {dropdownOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setDropdownOpen(false)}
          />
        )}
        
        {/* Full width document viewer */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <DocumentViewer
            project={project}
            selectedDoc={selectedDoc}
            _onDocumentSelect={handleDocumentSelect}
          />
        </div>
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <div className="h-screen bg-gray-50 flex flex-row overflow-hidden">
      {/* Sidebar - always visible on desktop */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} h-full transition-all duration-200 overflow-hidden`}>
        <DocumentSidebar
          documents={project.documents}
          selectedDoc={selectedDoc}
          onDocumentSelect={handleDocumentSelect}
          onBack={() => navigate('/app')}
        />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Sidebar toggle button - only visible on mobile */}
        {isMobile && (
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-4 left-4 z-10 bg-white p-2 rounded-md shadow-md"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
        
        <DocumentViewer
          project={project}
          selectedDoc={selectedDoc}
          _onDocumentSelect={handleDocumentSelect}
        />
      </div>
    </div>
  );
}