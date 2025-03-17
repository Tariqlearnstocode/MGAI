import { useState } from 'react';
import { usePayment } from '@/contexts/PaymentContext';
import { Button } from '@/components/ui/button';
import { Lock, CheckCircle, Shield, Users, ArrowRight, Sparkles } from 'lucide-react';

interface PreviewOverlayProps {
  projectId: string;
  documentType: string;
  previewPercentage: number;
}

export default function PreviewOverlay({ projectId, documentType, previewPercentage }: PreviewOverlayProps) {
  const { loadingProducts, initiateCheckout, applyAgencyPackToProject } = usePayment();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile
  useState(() => {
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
      if (productId === 'agency_pack_apply') {
        // Apply an existing agency pack
        const result = await applyAgencyPackToProject(projectId);
        if (result) {
          setSuccess('Agency pack applied successfully! Refresh the page to see your full document.');
        } else {
          setError('Failed to apply agency pack. Do you have any available packs?');
        }
      } else {
        // Start a checkout process
        await initiateCheckout(productId, projectId);
      }
    } catch (err) {
      setError('Error processing your request. Please try again.');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const getProductFeatures = (productId: string) => {
    switch (productId) {
      case 'single_plan':
        return [
          'Access to this document only',
          'One-time payment',
          'Lifetime updates to this document',
          'Download as PDF/Word',
          'AI-powered content'
        ];
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
        <div className="mb-6 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm inline-block mx-auto">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Preview Mode</h3>
          <p className="text-gray-600 mb-0 max-w-2xl mx-auto">
            You've reached the end of the preview. Upgrade to get access to all content.
          </p>
        </div>
        
        {/* Payment options directly embedded */}
        {loadingProducts ? (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <div className="max-w-5xl w-full">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-red-600 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4 text-green-600 text-sm">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Single Document Plan */}
              <div className="border rounded-lg overflow-hidden bg-white shadow-sm h-full">
                <div className="p-5 bg-white h-full flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">Single Document</h3>
                      <p className="text-gray-500 text-sm">For individual documents</p>
                    </div>
                    <Shield className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">$19</span>
                  </div>
                  <ul className="space-y-2 mb-5 flex-grow">
                    {getProductFeatures('single_plan').map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full text-sm py-2 px-2 font-medium"
                    onClick={() => handleCheckout('single_plan')}
                    disabled={loading !== null}
                    size="sm"
                  >
                    {loading === 'single_plan' ? 'Processing...' : 'Get Access'}
                  </Button>
                </div>
              </div>

              {/* Complete Guide */}
              <div className="border rounded-lg overflow-hidden bg-white shadow-sm h-full">
                <div className="p-5 bg-white h-full flex flex-col">
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
                  <ul className="space-y-2 mb-5 flex-grow">
                    {getProductFeatures('complete_guide').map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full text-sm py-2 px-2 font-medium"
                    onClick={() => handleCheckout('complete_guide')}
                    disabled={loading !== null}
                    size="sm"
                  >
                    {loading === 'complete_guide' ? 'Processing...' : 'Unlock All Docs'}
                  </Button>
                </div>
              </div>

              {/* Agency Pack */}
              <div className="border-2 border-blue-500 rounded-lg overflow-hidden bg-white shadow-md h-full">
                <div className="p-5 bg-gradient-to-b from-blue-50 to-white relative h-full flex flex-col">
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold py-0.5 px-2 rounded-bl-lg">
                    BEST VALUE
                  </div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">Complete Guide Bundle</h3>
                      <p className="text-gray-500 text-sm">For agencies & consultants</p>
                    </div>
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">$199</span>
                    <span className="text-sm text-gray-500 ml-1">/ 10 projects</span>
                  </div>
                  <ul className="space-y-2 mb-5 flex-grow">
                    {getProductFeatures('agency_pack').map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    <Button
                      className="w-full text-sm py-2 px-2 bg-blue-600 hover:bg-blue-700 font-medium"
                      onClick={() => handleCheckout('agency_pack')}
                      disabled={loading !== null}
                      size="sm"
                    >
                      {loading === 'agency_pack' ? 'Processing...' : 'Purchase Pack'}
                    </Button>
                    <Button
                      variant="link"
                      className="w-full text-sm py-1 h-8 text-blue-600"
                      onClick={() => handleCheckout('agency_pack_apply')}
                      disabled={loading !== null}
                      size="sm"
                    >
                      {loading === 'agency_pack_apply' ? 'Applying...' : 'Use existing pack'}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
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

            {/* Testimonials Section */}
            <div className="mt-10 bg-white/90 rounded-lg p-4 shadow-sm">
              <h3 className="text-center text-lg font-semibold mb-4">What Our Customers Say</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs italic mb-2">"The marketing documents saved me hours of work. Best investment for my small business this year!"</p>
                  <p className="text-xs font-semibold">— Sarah T., Coffee Shop Owner</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs italic mb-2">"We use the agency pack for all our clients. The quality and customization options are unmatched."</p>
                  <p className="text-xs font-semibold">— Michael R., Marketing Agency</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs italic mb-2">"The complete guide gave us everything we needed to launch our product. Worth every penny!"</p>
                  <p className="text-xs font-semibold">— Jessica L., Startup Founder</p>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-6 bg-white/90 rounded-lg p-4 shadow-sm">
              <h3 className="text-center text-lg font-semibold mb-4">Frequently Asked Questions</h3>
              
              <div className="space-y-3">
                <div className="border-b pb-2">
                  <p className="text-sm font-medium">What's included in the documents?</p>
                  <p className="text-xs text-gray-600 mt-1">Each document contains professionally crafted content tailored to your specific project. All content is AI-generated and human-reviewed for quality.</p>
                </div>
                
                <div className="border-b pb-2">
                  <p className="text-sm font-medium">How do I access my purchased documents?</p>
                  <p className="text-xs text-gray-600 mt-1">Once purchased, you'll have immediate access to the full document. Simply refresh the page and the content will be unlocked.</p>
                </div>
                
                <div className="border-b pb-2">
                  <p className="text-sm font-medium">Can I use these documents for my clients?</p>
                  <p className="text-xs text-gray-600 mt-1">Yes! The Agency Pack is specifically designed for using with multiple clients. Each document can be customized and white-labeled.</p>
                </div>
                
                <div className="border-b pb-2">
                  <p className="text-sm font-medium">What if I'm not satisfied with the document?</p>
                  <p className="text-xs text-gray-600 mt-1">We offer a 7-day satisfaction guarantee. If you're not happy with the quality, contact our support team for a full refund.</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Do I get future updates?</p>
                  <p className="text-xs text-gray-600 mt-1">Yes! All purchases include updates to the purchased documents. The Complete Guide package includes access to all new document types we add in the future.</p>
                </div>
              </div>
            </div>

            {/* Document Contents Section */}
            <div className="mt-6 bg-white/90 rounded-lg p-4 shadow-sm">
              <h3 className="text-center text-lg font-semibold mb-4">What's Included in Each Document</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border rounded-lg p-4 bg-blue-50/50">
                  <h4 className="text-base font-medium text-blue-700 border-b pb-2 mb-3">Marketing Plan</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Executive Summary</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Market Analysis</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Target Audience Profiles</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Key Marketing Strategies</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Budget & ROI Projections</span>
                    </li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4 bg-blue-50/50">
                  <h4 className="text-base font-medium text-blue-700 border-b pb-2 mb-3">Brand Positioning & Identity</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Brand Story & Vision</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Competitive Positioning</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Brand Voice Guidelines</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Value Proposition</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Brand Personality & Tone</span>
                    </li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4 bg-blue-50/50">
                  <h4 className="text-base font-medium text-blue-700 border-b pb-2 mb-3">Advertising & Paid Media</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Channel Strategy</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Ad Creative Guidelines</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Budget Allocation</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Campaign Timelines</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Performance Metrics & KPIs</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-sm text-blue-600 font-medium">
                  The Complete Guide includes all documents plus 15+ more templates
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}