import { useState } from 'react';
import { usePayment } from '@/contexts/PaymentContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, Shield, Users, ArrowRight, Sparkles } from 'lucide-react';

interface DocumentPaywallProps {
  projectId: string;
  documentType: string;
}

export default function DocumentPaywall({ projectId }: DocumentPaywallProps) {
  const { loadingProducts, initiateCheckout, applyAgencyPackToProject } = usePayment();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          'Access to marketing plan for this project',
          'One-time payment',
          'Includes future updates to this document'
        ];
      case 'complete_guide':
        return [
          'Full access to ALL documents for this project',
          'One-time payment per project',
          'Includes future updates and new document types'
        ];
      case 'agency_pack':
        return [
          'Use for up to 10 different client projects',
          'Full access to ALL documents for each project',
          'Best value for agencies and consultants'
        ];
      default:
        return [];
    }
  };

  if (loadingProducts) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Unlock Full Document</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose a plan below to access the complete document and take your marketing strategy to the next level.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6 text-green-600">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Single Document Plan */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-6 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">Single Document</h3>
                <p className="text-gray-500 text-sm">For individual documents</p>
              </div>
              <Shield className="h-6 w-6 text-blue-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold">$19</span>
            </div>
            <ul className="mt-4 space-y-2">
              {getProductFeatures('single_plan').map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full mt-6"
              onClick={() => handleCheckout('single_plan')}
              disabled={loading !== null}
            >
              {loading === 'single_plan' ? 'Processing...' : 'Get Started'}
            </Button>
          </div>
        </div>

        {/* Complete Guide */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-b from-blue-50 to-white relative">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded-bl-lg">
              RECOMMENDED
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">Complete Guide</h3>
                <p className="text-gray-500 text-sm">Full access for this project</p>
              </div>
              <Sparkles className="h-6 w-6 text-blue-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold">$49</span>
            </div>
            <ul className="mt-4 space-y-2">
              {getProductFeatures('complete_guide').map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
              onClick={() => handleCheckout('complete_guide')}
              disabled={loading !== null}
            >
              {loading === 'complete_guide' ? 'Processing...' : 'Best Value'}
            </Button>
          </div>
        </div>

        {/* Agency Pack */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-6 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">Agency Pack</h3>
                <p className="text-gray-500 text-sm">For agencies & consultants</p>
              </div>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold">$199</span>
              <span className="text-sm text-gray-500 ml-1">/ 10 projects</span>
            </div>
            <ul className="mt-4 space-y-2">
              {getProductFeatures('agency_pack').map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full mt-6"
              onClick={() => handleCheckout('agency_pack')}
              disabled={loading !== null}
            >
              {loading === 'agency_pack' ? 'Processing...' : 'Purchase Pack'}
            </Button>
            <Button
              variant="link"
              className="w-full mt-2 text-blue-600"
              onClick={() => handleCheckout('agency_pack_apply')}
              disabled={loading !== null}
            >
              {loading === 'agency_pack_apply' ? 'Applying...' : 'Use existing pack'}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 