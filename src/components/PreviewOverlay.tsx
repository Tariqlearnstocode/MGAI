import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import DocumentPaywall from './DocumentPaywall';

interface PreviewOverlayProps {
  projectId: string;
  documentType: string;
  previewPercentage: number;
}

export default function PreviewOverlay({ projectId, documentType, previewPercentage }: PreviewOverlayProps) {
  const [showPaywall, setShowPaywall] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Gradient overlay */}
      <div 
        className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent via-white/90 to-white z-10" 
        style={{ 
          top: `${previewPercentage}%`,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 15%, rgba(255,255,255,0.95) 40%, rgba(255,255,255,1) 100%)' 
        }}
      />
      
      {/* Lock icon and upgrade CTA */}
      <div 
        className="absolute left-0 right-0 flex flex-col items-center justify-center text-center px-4 z-20 pointer-events-auto"
        style={{ top: `${previewPercentage + 15}%` }}
      >
        <div className="bg-white/90 p-5 rounded-lg shadow-md max-w-xl">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Preview Mode</h3>
          <p className="text-gray-600 mb-4">
            You've reached the end of the preview. Unlock the full document to access all content.
          </p>
          <Button 
            onClick={() => setShowPaywall(true)}
            className="px-6"
          >
            Unlock Full Document
          </Button>
        </div>
      </div>
      
      {/* Paywall modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto pointer-events-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end p-2">
              <button 
                onClick={() => setShowPaywall(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <DocumentPaywall projectId={projectId} documentType={documentType} />
          </div>
        </div>
      )}
    </div>
  );
} 