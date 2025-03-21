import { useState, useEffect } from 'react';
import { usePayment } from '@/contexts/PaymentContext';
import { Lock, CheckCircle, Sparkles, Users, ArrowRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewOverlayProps {
  projectId: string;
  documentType: string;
  previewPercentage: number;
}

export default function PreviewOverlay({ projectId, documentType, previewPercentage }: PreviewOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { 
    loadingProducts, 
    initiateCheckout,
    creditBalance,
    loadingCredits,
    applyCredit
  } = usePayment();
  
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
  });

  const handleCheckout = async (productId: string) => {
    setLoading(productId);
    setError(null);
    
    try {
      await initiateCheckout(productId, projectId);
      // We'll be redirected to Stripe checkout
    } catch (err) {
      setError('Error initiating checkout. Please try again.');
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  // Add a handler for applying credits
  const handleApplyCredit = async () => {
    setLoading('credit');
    setError(null);
    setSuccess(null);
    
    try {
      const result = await applyCredit(projectId);
      
      if (result.success) {
        setSuccess('Credit applied successfully! Refreshing...');
        // Wait a moment then reload the page to show unlocked content
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(result.message || 'Failed to apply credit');
      }
    } catch (err) {
      setError('Error applying credit. Please try again.');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const getProductFeatures = (productId: string) => {
    switch (productId) {
      case 'complete_guide':
        return [
          'Full access to ALL documents',
          'Includes future updates',
          'Unlimited downloads',
          'Higher quality templates',
          'Priority support'
        ];
      case 'agency_pack':
        return [
          'Use for up to 10 projects',
          'Best value for agencies',
          'Bulk download options',
          'White-label documents',
          'Team sharing capabilities'
        ];
      default:
        return [];
    }
  };

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
      
      {/* Paywall section */}
      <div 
        className="absolute left-0 right-0 flex flex-col items-center justify-center text-center px-2 z-20 pointer-events-auto"
        style={{ top: `${previewPercentage + 10}%` }}
      >
        <div className="mb-6 px-8 py-6 rounded-lg bg-white/95 backdrop-blur-sm shadow-lg max-w-2xl mx-auto">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Preview Mode</h3>
          <p className="text-gray-600 mb-4 text-lg">
            You've reached the end of the preview. This is a demonstration of the paywall feature.
          </p>
        </div>
        
        {/* Payment options */}
        {loadingProducts ? (
          <div className="flex justify-center items-center p-8 pointer-events-auto">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto pointer-events-auto">
            {error && (
              <div className="col-span-full bg-red-50 border border-red-200 rounded-md p-3 mb-2 text-red-600">
                {error}
              </div>
            )}
            
            {success && (
              <div className="col-span-full bg-green-50 border border-green-200 rounded-md p-3 mb-2 text-green-600">
                {success}
              </div>
            )}
            
            {/* Use Credit Option - Add before the Complete Guide section */}
            {creditBalance > 0 && (
              <div className="col-span-full bg-white rounded-lg shadow-md overflow-hidden mb-4">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">Use Available Credit</h3>
                      <p className="text-gray-500 text-sm">You have {creditBalance} credit{creditBalance !== 1 ? 's' : ''} available</p>
                    </div>
                    <CreditCard className="h-6 w-6 text-green-500" />
                  </div>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleApplyCredit}
                    disabled={loading !== null || loadingCredits}
                  >
                    {loading === 'credit' ? 'Processing...' : 'Use 1 Credit to Unlock'}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Complete Guide */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">Complete Guide</h3>
                    <p className="text-gray-500 text-sm">All project documents</p>
                  </div>
                  <Sparkles className="h-6 w-6 text-blue-500" />
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">$49</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {getProductFeatures('complete_guide').map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() => handleCheckout('complete_guide')}
                  disabled={loading !== null}
                >
                  {loading === 'complete_guide' ? 'Processing...' : 'Unlock All Docs'}
                </Button>
              </div>
            </div>

            {/* Agency Pack */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-blue-500">
              <div className="p-5 relative">
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded-bl-lg">
                  BEST VALUE
                </div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">Agency Pack</h3>
                    <p className="text-gray-500 text-sm">For consultants & agencies</p>
                  </div>
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">$199</span>
                  <span className="text-sm text-gray-500 ml-1">/ 10 projects</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {getProductFeatures('agency_pack').map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleCheckout('agency_pack')}
                  disabled={loading !== null}
                >
                  {loading === 'agency_pack' ? 'Processing...' : 'Purchase Pack'}
                </Button>
              </div>
            </div>

            {/* Secure Payment Notice */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Secure payment processing by Stripe
              </p>
              <p className="text-xs text-green-600 font-medium mt-1 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                30-Day Money-Back Guarantee
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}