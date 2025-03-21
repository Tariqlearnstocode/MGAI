import { useState, useEffect } from 'react';
import { usePayment } from '@/contexts/PaymentContext';
import { Lock, CheckCircle, Sparkles, Users, ArrowRight, CreditCard, MessageSquare, BarChart3, Target, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

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
  const [projectIsUnlocked, setProjectIsUnlocked] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  const { 
    loadingProducts, 
    initiateCheckout,
    creditBalance,
    loadingCredits,
    applyCredit
  } = usePayment();
  
  // Check if project is already unlocked
  useEffect(() => {
    const checkProjectStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('is_unlocked')
          .eq('id', projectId)
          .single();
          
        if (error) {
          console.error('Error checking project status:', error);
          return;
        }
        
        setProjectIsUnlocked(data?.is_unlocked === true);
      } catch (err) {
        console.error('Error in checkProjectStatus:', err);
      }
    };
    
    checkProjectStatus();
  }, [projectId]);
  
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

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "What is MarketingGuide AI?",
      answer: "MarketingGuide AI is an AI-powered platform that helps you create comprehensive marketing plans and strategy documents in minutes. Our technology analyzes your business goals and target audience to generate customized marketing strategies."
    },
    {
      question: "What if I have no marketing experience?",
      answer: "No problem! MarketingGuide AI is designed for businesses of all sizes, even if you have no prior marketing experience. Our platform asks simple questions and guides you through the entire process, making marketing accessible to everyone."
    },
    {
      question: "What kind of marketing documents does MarketingGuide offer?",
      answer: "We offer over 15 different marketing document types including marketing plans, content strategies, social media calendars, competitor analyses, brand positioning guides, paid advertising strategies, email campaigns, SEO recommendations, and more."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Our pricing is based on one-time payments, not subscriptions. You pay once and get lifetime access to the documents you've purchased. However, if you choose an Agency Pack, you can use those credits anytime with no expiration date."
    },
    {
      question: "Does MarketingGuide really fix AI marketing errors?",
      answer: "Yes! Unlike generic AI tools, MarketingGuide is specifically trained on marketing strategies and best practices. All plans are reviewed for quality and accuracy, ensuring you get reliable, actionable marketing advice every time."
    },
    {
      question: "Do I own the marketing plans MarketingGuide creates?",
      answer: "Absolutely! All marketing plans and documents created by MarketingGuide AI are 100% yours to use, modify, and implement. You can use them for your business or for your clients without any restrictions."
    },
    {
      question: "Is my data secure with MarketingGuide?",
      answer: "Yes, your data security is our top priority. We use industry-standard encryption and security protocols to protect your information. We never share your business data or marketing plans with third parties."
    },
    {
      question: "Does MarketingGuide provide support for marketing questions?",
      answer: "Yes! While our AI generates comprehensive marketing documents, our support team is available to help with any questions about using the platform or implementing your marketing plans. Premium plans include priority support."
    },
    {
      question: "What if I need to switch marketing tools in the middle of a project?",
      answer: "No problem! Our platform is flexible and allows you to regenerate sections of your marketing plan if your strategy changes. You can adapt your documents at any time to reflect new tools, platforms, or marketing approaches."
    }
  ];

  const testimonials = [
    {
      name: "John Doe",
      role: "Marketing Director, TechCorp",
      initials: "JD",
      content: "MarketingGuide AI has transformed how we approach campaigns. We've seen a 40% increase in conversion rates since implementing their AI-generated strategies."
    },
    {
      name: "Sarah Johnson",
      role: "Owner, Boutique Bliss",
      initials: "SJ",
      content: "As a small business owner, I was struggling with marketing. This platform gave me a clear plan that was easy to implement and actually worked for my budget."
    },
    {
      name: "Michael Chen",
      role: "CMO, StartupVision",
      initials: "MC",
      content: "The quality of the marketing documents exceeded my expectations. The AI understood our industry perfectly and delivered actionable strategies we implemented right away."
    }
  ];

  const documentTypes = [
    {
      title: "Brand Positioning",
      icon: Users,
      features: [
        "Brand Story & Vision",
        "Competitive Positioning",
        "Brand Voice Guidelines",
        "Value Proposition",
        "Brand Personality & Tone"
      ]
    },
    {
      title: "Advertising & Media",
      icon: BarChart3,
      features: [
        "Channel Strategy",
        "Ad Creative Guidelines",
        "Budget Allocation",
        "Campaign Timelines",
        "Performance Metrics & KPIs"
      ]
    }
  ];

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
        className="absolute left-0 right-0 flex flex-col items-center justify-center text-center px-0 z-20 pointer-events-auto w-full"
        style={{ top: `${previewPercentage + 10}%` }}
      >
        <div className="mb-6 text-center w-full max-w-5xl mx-auto">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold mb-3">
            {creditBalance > 0 && !projectIsUnlocked 
              ? "Unlock All Project Documents" 
              : "Preview Mode"}
          </h3>
          <p className="text-gray-600 mb-4 text-lg max-w-md mx-auto">
            {creditBalance > 0 && !projectIsUnlocked
              ? "You've reached the end of the preview. Use one of your available credits to unlock the full document."
              : "You've reached the end of the preview. This is a demonstration of the paywall feature."}
          </p>
        </div>
        
        {/* Payment options */}
        {loadingProducts ? (
          <div className="flex justify-center items-center p-8 pointer-events-auto">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <div className="w-full max-w-6xl mx-auto px-4 pointer-events-auto" style={{ paddingLeft: "5%", paddingRight: "5%" }}>
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
            
            {/* Use Credit Option - Simplified */}
            {creditBalance > 0 && !projectIsUnlocked && (
              <div className="col-span-full bg-white rounded-lg shadow-md overflow-hidden mb-4">
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-lg font-medium">
                        {creditBalance} credit{creditBalance !== 1 ? 's' : ''} available
                      </span>
                    </div>
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
            
            {/* Purchase options - Only show when user has no credits or project is already unlocked */}
            {(creditBalance === 0 || projectIsUnlocked) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {/* Complete Guide */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">Complete Guide</h3>
                    <p className="text-gray-500 text-sm">All project documents</p>
                  </div>
                  <Sparkles className="h-7 w-7 text-blue-500" />
                </div>
                <div className="mb-5">
                  <span className="text-4xl font-bold">$49</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {getProductFeatures('complete_guide').map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full py-4 text-base"
                  onClick={() => handleCheckout('complete_guide')}
                  disabled={loading !== null}
                >
                  {loading === 'complete_guide' ? 'Processing...' : 'Unlock All Docs'}
                </Button>
              </div>
            </div>

            {/* Agency Pack */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-blue-500">
              <div className="p-8 relative">
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded-bl-lg">
                  BEST VALUE
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">Agency Pack</h3>
                    <p className="text-gray-500 text-sm">For consultants & agencies</p>
                  </div>
                  <Users className="h-7 w-7 text-blue-500" />
                </div>
                <div className="mb-5">
                  <span className="text-4xl font-bold">$199</span>
                  <span className="text-sm text-gray-500 ml-1">/ 10 projects</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {getProductFeatures('agency_pack').map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 py-4 text-base"
                  onClick={() => handleCheckout('agency_pack')}
                  disabled={loading !== null}
                >
                  {loading === 'agency_pack' ? 'Processing...' : (
                    <span className="flex items-center justify-center">
                      Get Agency Pack
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
            </div>
            )}

            {/* Secure Payment Notice */}
            {(creditBalance === 0 || projectIsUnlocked) && (
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
            )}
            
            {/* Additional sections - Only show for users without credits or with unlocked projects */}
            {(creditBalance === 0 || projectIsUnlocked) && (
            <>
            {/* Visual Separator */}
            <div className="my-16 flex items-center justify-center">
              <div className="h-px bg-gray-200 w-1/4"></div>
              <div className="mx-4">
                <Sparkles className="h-5 w-5 text-blue-400" />
              </div>
              <div className="h-px bg-gray-200 w-1/4"></div>
            </div>
            
            {/* Document Types Section */}
            <div className="py-12 px-4 bg-gradient-to-b from-white to-blue-50 rounded-xl">
              <p className="text-lg font-semibold text-blue-600 mb-2">Document Types</p>
              <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">
                What's Included in Each Document
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {documentTypes.map((docType, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300">
                    <div className="rounded-xl bg-blue-100 p-3 w-fit mb-4 mx-auto">
                      <docType.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">{docType.title}</h4>
                    <ul className="space-y-3">
                      {docType.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-gray-600 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-sm text-blue-600 font-medium mt-8 bg-blue-50 p-3 rounded-full inline-block">
                The Complete Guide includes all documents plus 15+ more templates
              </p>
            </div>
            
            {/* Visual Separator */}
            <div className="my-12 flex items-center justify-center">
              <div className="h-px bg-gray-200 w-1/4"></div>
              <div className="mx-4">
                <MessageSquare className="h-5 w-5 text-blue-400" />
              </div>
              <div className="h-px bg-gray-200 w-1/4"></div>
            </div>
            
            {/* Testimonials Section */}
            <div className="py-12 px-4">
              <p className="text-lg font-semibold text-blue-600 mb-2">Testimonials</p>
              <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">
                What Our Users Say
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shadow-inner">
                        {testimonial.initials}
                      </div>
                      <div className="text-left">
                        <h4 className="text-gray-900 font-medium text-sm">{testimonial.name}</h4>
                        <p className="text-gray-600 text-xs">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1 mb-3 justify-center">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm italic">
                      "{testimonial.content}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visual Separator */}
            <div className="my-12 flex items-center justify-center">
              <div className="h-px bg-gray-200 w-1/4"></div>
              <div className="mx-4">
                <Target className="h-5 w-5 text-blue-400" />
              </div>
              <div className="h-px bg-gray-200 w-1/4"></div>
            </div>
            
            {/* FAQ Section */}
            <div className="mb-16 py-12 px-4 bg-gradient-to-b from-white to-blue-50 rounded-xl">
              <p className="text-lg font-semibold text-blue-600 mb-2">FAQ</p>
              <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">
                Need Help? Find Your Answers Here
              </h2>
              
              <div className="max-w-3xl mx-auto">
                {faqs.map((faq, index) => (
                  <div 
                    key={index}
                    className="mb-4 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:border-blue-200 transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none hover:bg-blue-50/50 transition-colors"
                    >
                      <span className="font-medium text-gray-900 text-sm">{faq.question}</span>
                      <span className={`flex items-center justify-center h-6 w-6 rounded-full ml-4 flex-shrink-0 transition-all duration-300 ${
                        expandedFaq === index ? 'bg-blue-100 text-blue-600 rotate-180' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {expandedFaq === index ? 
                          <Minus className="h-3 w-3" /> : 
                          <Plus className="h-3 w-3" />
                        }
                      </span>
                    </button>
                    <div 
                      className={`px-6 overflow-hidden transition-all duration-300 ${
                        expandedFaq === index ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="text-gray-600 text-sm border-t border-gray-100 pt-4">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}