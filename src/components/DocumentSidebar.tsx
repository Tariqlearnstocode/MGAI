import { ArrowLeft } from 'lucide-react';
import { getLatestDocumentTypes, DocumentType } from '@/lib/documents';
import type { Document } from '@/lib/projects';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface DocumentSidebarProps {
  documents: Document[];
  selectedDoc: string;
  onDocumentSelect: (docId: string) => void;
  onBack: () => void;
}

export default function DocumentSidebar({ documents, selectedDoc, onDocumentSelect, onBack }: DocumentSidebarProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        const types = await getLatestDocumentTypes();
        setDocumentTypes(types);
      } catch (error) {
        console.error('Error fetching document types:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocumentTypes();
  }, []);

  return (
    <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
          <span className="text-sm sm:text-base">Back to Projects</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-3 sm:p-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Steps</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-1 sm:space-y-2">
              {documentTypes
                .sort((a, b) => a.documentOrder - b.documentOrder)
                .map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => onDocumentSelect(doc.id)}
                    className={cn(
                      "w-full flex items-center p-2 sm:p-3 rounded-lg text-left relative",
                      "before:absolute before:left-[24px] sm:before:left-[26px] before:top-[44px] sm:before:top-[48px] before:bottom-0 before:w-[2px]",
                      selectedDoc === doc.id
                        ? 'bg-blue-50 text-blue-600 before:bg-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 before:bg-gray-200',
                      "last:before:hidden"
                    )}
                  >
                    <div className="relative">
                      <div className={cn(
                        "h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center mr-2 sm:mr-3",
                        documents.find(d => d.type === doc.id)?.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : documents.find(d => d.type === doc.id)?.status === 'generating'
                          ? 'bg-blue-100 text-blue-600'
                          : selectedDoc === doc.id
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-500'
                      )}>
                        {(() => {
                          const doc_status = documents.find(d => d.type === doc.id)?.status;
                          if (doc_status === 'completed') {
                            return (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            );
                          } else if (doc_status === 'generating') {
                            return (
                              <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                            );
                          } else if (doc_status === 'error') {
                            return (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            );
                          } else {
                            return <doc.icon className="h-4 w-4" />;
                          }
                        })()}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm sm:text-base">{doc.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {documents.find(d => d.type === doc.id)?.status === 'generating' ? (
                          <span className="text-blue-600">
                            {documents.find(d => d.type === doc.id)?.progress?.stage || 'Generating...'}
                          </span>
                        ) : (
                          doc.description
                        )}
                      </div>
                    </div>
                    {documents.find(d => d.type === doc.id)?.status === 'generating' && (
                      <div className="absolute bottom-2 left-12 right-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                          style={{ 
                            width: `${documents.find(d => d.type === doc.id)?.progress?.percent || 0}%` 
                          }}
                        />
                      </div>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}