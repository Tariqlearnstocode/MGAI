import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProject } from '@/lib/projects';
import DocumentViewer from '@/components/DocumentViewer';
import DocumentSidebar from '@/components/DocumentSidebar';
import type { Project, Document } from '@/lib/projects';

export default function ProjectDocuments() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedDoc, setSelectedDoc] = useState('marketing_plan');
  const [project, setProject] = useState<Project & { documents: Document[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDocumentSelect = (docId: string) => {
    setSelectedDoc(docId);
  };

  useEffect(() => {
    async function loadProject() {
      if (!id) return;
      try {
        const data = await getProject(id);
        setProject(data);
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [id]);

  if (!project) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <DocumentSidebar
        documents={project.documents}
        selectedDoc={selectedDoc}
        onDocumentSelect={handleDocumentSelect}
        onBack={() => navigate('/app')}
      />
      <div className="flex-1 overflow-hidden">
        <DocumentViewer
          project={project}
          selectedDoc={selectedDoc}
          onDocumentSelect={handleDocumentSelect}
        />
      </div>
    </div>
  );
}