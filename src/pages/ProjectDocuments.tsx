import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProject, updateDocument } from '@/lib/projects';
import { generateDocumentWithAI, updateDocumentProgress } from '@/lib/openai';
import DocumentViewer from '@/components/DocumentViewer';
import DocumentSidebar from '@/components/DocumentSidebar';
import { Menu, X } from 'lucide-react';
import type { Project, Document } from '@/lib/projects';

export default function ProjectDocuments() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedDoc, setSelectedDoc] = useState('marketing_plan');
  const [project, setProject] = useState<Project & { documents: Document[] } | null>(null);
  const [autoGeneratingMarketing, setAutoGeneratingMarketing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleDocumentSelect = (docId: string) => {
    setSelectedDoc(docId);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
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

    loadProject();

    // Set initial sidebar state based on screen size
    const checkScreenSize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    
    // Check on load
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [id]);

  if (!project) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden relative">
      {/* Mobile sidebar toggle button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-md shadow-md"
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      {/* Sidebar - hidden on mobile when closed */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        fixed md:relative w-full md:w-80 h-full z-40 md:z-auto
      `}>
        <DocumentSidebar
          documents={project.documents}
          selectedDoc={selectedDoc}
          onDocumentSelect={handleDocumentSelect}
          onBack={() => navigate('/app')}
        />
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main content area - full width when sidebar closed on mobile */}
      <div className={`
        flex-1 overflow-hidden transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'md:ml-0' : 'ml-0'}
      `}>
        <DocumentViewer
          project={project}
          selectedDoc={selectedDoc}
          _onDocumentSelect={handleDocumentSelect}
        />
      </div>
    </div>
  );
}