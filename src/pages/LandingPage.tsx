import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, BarChart3, Target, Users, ArrowRight, CheckCircle2, Zap, MessageSquare, Clock, Plus, Minus } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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
      question: "Does MarketingGuide really fix AI marketing errors?",
      answer: "Yes! Unlike generic AI tools, MarketingGuide is specifically trained on marketing strategies and best practices. All plans are reviewed for quality and accuracy, ensuring you get reliable, actionable marketing advice every time."
    },
    
    {
      question: "Do I own the marketing plans MarketingGuide creates?",
      answer: "Absolutely! All marketing plans and documents created by MarketingGuide AI are 100% yours to use, modify, and implement. You can use them for your business or for your clients without any restrictions."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Our pricing is based on one-time payments, not subscriptions. You pay once and get lifetime access to the documents you've purchased. However, if you choose an Agency Pack, you can use those credits anytime with no expiration date."
    },
    {
      question: "What kind of marketing documents does MarketingGuide offer?",
      answer: "We offer over 15 different marketing document types including marketing plans, content strategies, social media calendars, competitor analyses, brand positioning guides, paid advertising strategies, email campaigns, SEO recommendations, and more."
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="px-4 py-6 md:px-6 lg:px-8 border-b border-blue-100">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">MarketingGuide AI</span>
          </div>
          <Button 
            onClick={() => navigate('/auth')} 
            className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white"
          >
            Get Started Today
          </Button>
        </div>
      </header>

      {/* Main Content Flow */}
      <main>
        {/* 1. Hero Section - Light theme with gradient */}
        <div className="bg-gradient-to-b from-blue-50/80 to-white relative overflow-hidden pt-32 pb-20">
          <div className="container mx-auto px-[5%] text-center relative z-10">
            <div className="inline-block px-4 py-1 rounded-full bg-yellow-400 text-yellow-900 text-sm font-medium mb-16">
              🎉 Sign Up Now for 40% Off on Yearly Plan!
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-[#0A1A2C] tracking-tight leading-tight mb-6 mx-auto max-w-4xl">
              Don't Lose Marketing<br />Opportunities, <span className="text-blue-600">Ever Again</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 mx-auto max-w-2xl">
              We're here to simplify your marketing strategy, providing a user-friendly platform that generates 
              comprehensive marketing plans in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')} 
                className="text-lg px-8 py-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                onClick={() => navigate('/demo')} 
                className="text-lg px-8 py-6 rounded-xl bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
              >
                Preview Platform
              </Button>
            </div>

            {/* Command Center Dashboard Preview */}
            <div className="relative mx-auto mt-16 max-w-[1200px] rounded-2xl bg-white shadow-xl">
              {/* Mock Dashboard UI */}
              <div className="flex min-h-[600px] overflow-hidden rounded-xl bg-gray-50">
                {/* Left Sidebar */}
                <div className="w-64 border-r border-gray-200 bg-white">
                  <div className="flex items-center space-x-2 p-4 mb-8">
                    <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">MarketingGuide</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3 rounded-lg bg-blue-50 px-3 py-2 text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      <span className="font-medium">Dashboard</span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      <span>New Project</span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                      <span>My Documents</span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 100-16 8 8 0 000 16zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <span>Support</span>
                    </div>
                  </div>
                </div>
                
                {/* Main Content */}
                <div className="flex-1 p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Marketing Command Center</h1>
                  <p className="text-gray-600 mb-8">Everything you need to create and manage your marketing strategy in one place</p>
                  
                  {/* Stats cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="text-sm font-medium text-gray-500 mb-4">Time Saved</h3>
                      <div className="text-3xl font-bold text-blue-600 mb-1">12.5 Hours</div>
                      <div className="text-sm text-gray-500">+2.5 hours from last document</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="text-sm font-medium text-gray-500 mb-4">Documents Created</h3>
                      <div className="text-3xl font-bold text-blue-600 mb-1">8</div>
                      <div className="text-sm text-gray-500">Across 3 projects</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="text-sm font-medium text-gray-500 mb-4">Projects Completed</h3>
                      <div className="text-3xl font-bold text-blue-600 mb-1">2</div>
                      <div className="text-sm text-gray-500">1 in progress</div>
                    </div>
                  </div>
                  
                  {/* Templates Section */}
                  <div className="mb-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Marketing Templates</h2>
                    <p className="text-sm text-gray-600 mb-4">Create your next marketing project</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-white p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-md w-10 h-10 flex items-center justify-center mb-3">
                          <Target className="h-5 w-5" />
                        </div>
                        <div className="font-medium">Social Media Strategy</div>
                      </div>
                      <div className="bg-white p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-md w-10 h-10 flex items-center justify-center mb-3">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <div className="font-medium">Content Calendar</div>
                      </div>
                      <div className="bg-white p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-md w-10 h-10 flex items-center justify-center mb-3">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="font-medium">Email Campaign</div>
                      </div>
                      <div className="bg-white p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-md w-10 h-10 flex items-center justify-center mb-3">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="font-medium">SEO Strategy</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Panel - Download Options */}
                <div className="hidden lg:block w-64 border-l border-gray-200 bg-white">
                  <h2 className="text-xl font-bold text-center p-4 mb-6">Download Docs</h2>
                  
                  <div className="space-y-3 px-4">
                    <Button className="w-full justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100">
                      Marketing Plan
                    </Button>
                    <Button className="w-full justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100">
                      Content Strategy
                    </Button>
                    <Button className="w-full justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100">
                      Competitor Analysis
                    </Button>
                    <Button className="w-full justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100">
                      Brand Guidelines
                    </Button>
                    <Button className="w-full justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100">
                      Budget Plan
                    </Button>
                    <Button className="w-full justify-center text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 mt-4">
                      + Add Custom Doc
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* 4. How It Works Section - Step by step */}
        <div className="bg-white py-20">
          <div className="container mx-auto px-[5%]">
            <div className="mb-4">
              <p className="text-lg font-semibold text-blue-600">How It Works</p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2">
                Built For Marketing<br />Professionals
              </h2>
            </div>
            
            {/* Step 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16 items-center">
              <div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-6xl md:text-8xl font-bold text-blue-100">01</div>
                    <h3 className="text-2xl md:text-3xl font-bold">Sign Up</h3>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Create your account in seconds. Sign up with Google or your email 
                    and get immediate access to our AI-powered marketing platform.
                  </p>
                </div>
              </div>
              <div className="bg-blue-100 p-8 rounded-xl relative overflow-hidden">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-xl font-bold">MarketingGuide AI</span>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Welcome! Please sign in to continue</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-center text-blue-700 font-medium">
                    Continue with Google
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-24 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-blue-100 p-8 rounded-xl relative overflow-hidden">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                    <h4 className="font-semibold text-lg mb-3">Answer Key Questions</h4>
                    <div className="mb-4 border-b pb-3">
                      <p className="text-sm font-medium text-gray-800 mb-1">1. What are the main objectives or goals of this campaign?</p>
                      <div className="border border-gray-200 rounded-lg p-2 text-sm bg-gray-50">Increase online sales by 30% in Q3</div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-800 mb-1">2. Who is your target audience for this campaign?</p>
                      <div className="border border-gray-200 rounded-lg p-2 text-sm bg-gray-50">Urban professionals, 25-45, health-conscious</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-6xl md:text-8xl font-bold text-blue-100">02</div>
                    <h3 className="text-2xl md:text-3xl font-bold">Answer Key Questions</h3>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Tell us about your business, goals, and target audience. Our AI uses your answers
                    to create customized marketing strategies tailored to your specific needs.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-24 items-center">
              <div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-6xl md:text-8xl font-bold text-blue-100">03</div>
                    <h3 className="text-2xl md:text-3xl font-bold">Get Marketing Plan</h3>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Within minutes, receive a comprehensive marketing plan with detailed strategies,
                    target audience insights, competitive analysis, and actionable recommendations.
                  </p>
                </div>
              </div>
              <div className="bg-blue-100 p-8 rounded-xl relative overflow-hidden">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                  <h4 className="font-semibold text-lg mb-3">Your Marketing Plan</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-800 text-sm mb-1">Executive Summary</h5>
                      <p className="text-xs text-gray-700">Comprehensive marketing strategy focused on increasing online sales through targeted campaigns.</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-800 text-sm mb-1">Market Analysis</h5>
                      <p className="text-xs text-gray-700">Current market size: $2.3B with 5.4% YoY growth. Key competitors analyzed.</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-800 text-sm mb-1">Target Audience</h5>
                      <p className="text-xs text-gray-700">Urban professionals, 25-45, health-conscious with disposable income.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-24 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-blue-100 p-8 rounded-xl relative overflow-hidden">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                    <h4 className="font-semibold text-lg mb-3">Strategy Documents</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 border border-blue-100 rounded-lg bg-blue-50 text-xs font-medium">Content Calendar</div>
                      <div className="p-2 border border-blue-100 rounded-lg bg-blue-50 text-xs font-medium">Social Media Plan</div>
                      <div className="p-2 border border-blue-100 rounded-lg bg-blue-50 text-xs font-medium">SEO Strategy</div>
                      <div className="p-2 border border-blue-100 rounded-lg bg-blue-50 text-xs font-medium">Email Campaigns</div>
                      <div className="p-2 border border-blue-100 rounded-lg bg-blue-50 text-xs font-medium">Budget Allocation</div>
                      <div className="p-2 border border-blue-100 rounded-lg bg-blue-50 text-xs font-medium">KPI Dashboard</div>
                      <div className="p-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-500">+ 9 more documents</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-6xl md:text-8xl font-bold text-blue-100">04</div>
                    <h3 className="text-2xl md:text-3xl font-bold">Create 15+ Strategy Documents</h3>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Access a complete suite of marketing materials including content calendars, 
                    social media strategies, budget planning, SEO recommendations, and more.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-24 items-center">
              <div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-6xl md:text-8xl font-bold text-blue-100">05</div>
                    <h3 className="text-2xl md:text-3xl font-bold">Download Your Docs</h3>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Download your marketing documents in multiple formats (PDF, DOCX, XLSX),
                    and use them right away with your marketing team or clients.
                  </p>
                </div>
              </div>
              <div className="bg-blue-100 p-8 rounded-xl relative overflow-hidden">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                  <h4 className="font-semibold text-lg mb-3">Download Options</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Marketing Strategy</span>
                      <div className="bg-blue-600 text-white p-1 rounded text-xs">PDF</div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Content Calendar</span>
                      <div className="bg-blue-600 text-white p-1 rounded text-xs">DOCX</div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Budget Breakdown</span>
                      <div className="bg-blue-600 text-white p-1 rounded text-xs">XLSX</div>
                    </div>
                    <div className="mt-3 text-center">
                      <div className="inline-flex items-center justify-center text-xs font-medium text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Regenerate Content
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')} 
                className="text-lg px-8 py-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start Your Marketing Plan Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* 5. Results & Features Section */}
        <div className="bg-gray-50 py-20">
          <div className="container mx-auto px-[5%]">
            <div className="text-center mb-6">
              <p className="text-lg font-semibold text-blue-600">Why MarketingGuide AI?</p>
              <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">
                Give Your Marketing Strategy a<br />Clear Blueprint with MarketingGuide
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
              {/* Left Column with Text & CTA */}
              <div className="bg-blue-500 rounded-2xl p-10 text-white">
                <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-6">
                  You Can Create Anything With Our AI. From Marketing Plans to Content Calendars, And Even Budget Plans And Campaigns
                </h3>
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="mt-4 bg-white text-blue-600 hover:bg-blue-50"
                >
                  Get Started Today
                </Button>
              </div>
              
              {/* Right Column with Icons */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-medium">Marketing Plans</span>
                  <div className="bg-blue-100 p-3 rounded-md">
                    <Target className="h-7 w-7 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-medium">Content Strategy</span>
                  <div className="bg-blue-100 p-3 rounded-md">
                    <MessageSquare className="h-7 w-7 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-medium">Budget Plans</span>
                  <div className="bg-blue-100 p-3 rounded-md">
                    <BarChart3 className="h-7 w-7 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-medium">Campaigns</span>
                  <div className="bg-blue-100 p-3 rounded-md">
                    <Users className="h-7 w-7 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Section */}
            <div className="mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-10">
                The Results Speak For Themselves
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-gray-900">5+</div>
                  <p className="text-sm text-gray-600 mt-2">hrs of planning time<br />saved per project</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-gray-900">92%</div>
                  <p className="text-sm text-gray-600 mt-2">more strategic<br />marketing campaigns</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-gray-900">3x</div>
                  <p className="text-sm text-gray-600 mt-2">faster campaign<br />implementation</p>
                </div>
              </div>
            </div>
            
            {/* Document Checklist & Action Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Marketing Strategy Document</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Brand Positioning Guidelines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Competitor Analysis Doc</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Campaign Flow Doc</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Marketing Budget Doc</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Strategic Response Templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Content Structure Doc</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-blue-500 rounded-2xl p-10 text-white">
                <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
                  Allowing You Automate The Creation of Plans, Strategies, And Documents.
                </h3>
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="mt-4 bg-white text-blue-600 hover:bg-blue-50"
                >
                  Get Started Today
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Document Contents Section */}
        <div className="bg-white py-20">
          <div className="container mx-auto px-[5%]">
            <div className="text-center mb-6">
              <p className="text-lg font-semibold text-blue-600">Document Types</p>
              <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">
                What's Included in<br />Each Document
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-blue-100 shadow-sm">
                <div className="rounded-xl bg-blue-100 p-3 w-fit mb-6">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Marketing Plan</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Executive Summary</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Market Analysis</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Target Audience Profiles</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Key Marketing Strategies</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Budget & ROI Projections</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-8 rounded-2xl border border-blue-100 shadow-sm">
                <div className="rounded-xl bg-blue-100 p-3 w-fit mb-6">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Brand Positioning</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Brand Story & Vision</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Competitive Positioning</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Brand Voice Guidelines</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Value Proposition</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Brand Personality & Tone</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-8 rounded-2xl border border-blue-100 shadow-sm">
                <div className="rounded-xl bg-blue-100 p-3 w-fit mb-6">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Advertising & Media</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Channel Strategy</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Ad Creative Guidelines</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Budget Allocation</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Campaign Timelines</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Performance Metrics & KPIs</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <p className="text-lg text-blue-600 font-medium mb-6">
                The Complete Guide includes all documents plus 15+ more templates
              </p>
              <Button 
                onClick={() => navigate('/auth')} 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                See All Document Types
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* 7. Testimonials Section */}
        <div className="bg-gray-50 py-20">
          <div className="container mx-auto px-[5%]">
            <div className="text-center mb-6">
              <p className="text-lg font-semibold text-blue-600">Testimonials</p>
              <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">
                What Our Users Say
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white p-8 rounded-2xl border border-blue-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    JD
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-medium">John Doe</h4>
                    <p className="text-gray-600 text-sm">Marketing Director, TechCorp</p>
                  </div>
                </div>
                <div className="flex space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600">
                  "MarketingGuide AI has transformed how we approach campaigns. We've seen a 40% increase in conversion rates since implementing their AI-generated strategies."
                </p>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white p-8 rounded-2xl border border-blue-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    SJ
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-medium">Sarah Johnson</h4>
                    <p className="text-gray-600 text-sm">Owner, Boutique Bliss</p>
                  </div>
                </div>
                <div className="flex space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600">
                  "As a small business owner, I was struggling with marketing. This platform gave me a clear plan that was easy to implement and actually worked for my budget."
                </p>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white p-8 rounded-2xl border border-blue-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    MS
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-medium">Michael Smith</h4>
                    <p className="text-gray-600 text-sm">CMO, GrowthLabs</p>
                  </div>
                </div>
                <div className="flex space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600">
                  "The level of detail in the marketing plans is impressive. It's like having an entire marketing team at your fingertips for a fraction of the cost."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 8. Pricing Section */}
        <div className="bg-white py-20">
          <div className="container mx-auto px-[5%]">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
              <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the plan that works best for your marketing needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Single Document Plan */}
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Single Document</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-5xl font-extrabold tracking-tight text-gray-900">$19</span>
                    <span className="ml-1 text-xl font-semibold text-gray-500">/document</span>
                  </div>
                  <p className="mt-4 text-gray-600">For individual documents</p>
                </div>

                <ul className="mb-8 space-y-4 flex-1">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">Access to this document only</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">One-time payment</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">Lifetime updates to this document</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">Download as PDF/Word</span>
                  </li>
                </ul>

                <Button 
                  onClick={() => navigate('/auth')} 
                  className="w-full bg-white hover:bg-gray-50 text-blue-600 border border-blue-200"
                  variant="outline"
                >
                  Get Started
                </Button>
              </div>

              {/* Complete Guide */}
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Complete Guide</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-5xl font-extrabold tracking-tight text-gray-900">$49</span>
                    <span className="ml-1 text-xl font-semibold text-gray-500">/project</span>
                  </div>
                  <p className="mt-4 text-gray-600">Full access for this project</p>
                </div>

                <ul className="mb-8 space-y-4 flex-1">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">Full access to ALL documents</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">Includes future updates</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">Unlimited downloads</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">Higher quality templates</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">Priority support</span>
                  </li>
                </ul>

                <Button 
                  onClick={() => navigate('/auth')} 
                  className="w-full bg-white hover:bg-gray-50 text-blue-600 border border-blue-200"
                  variant="outline"
                >
                  Best Value
                </Button>
              </div>

              {/* Agency Pack - Highlighted */}
              <div className="bg-blue-600 p-8 rounded-2xl border border-blue-700 shadow-lg flex flex-col relative -mt-4 md:-mt-8 transform md:scale-110 z-10">
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-yellow-400 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white">Agency Pack</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-5xl font-extrabold tracking-tight text-white">$99.99</span>
                    <span className="ml-1 text-xl font-semibold text-blue-200">/ 10 projects</span>
                  </div>
                  <p className="mt-4 text-blue-100">For agencies & consultants</p>
                </div>

                <ul className="mb-8 space-y-4 flex-1">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-200 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-blue-100">Use for up to 10 projects</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-200 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-blue-100">Best value for agencies</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-200 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-blue-100">Bulk download options</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-200 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-blue-100">White-label documents</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-200 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-blue-100">Team sharing capabilities</span>
                  </li>
                </ul>

                <Button 
                  onClick={() => navigate('/auth')} 
                  className="w-full bg-white hover:bg-gray-50 text-blue-600"
                >
                  Purchase Pack
                </Button>
              </div>
            </div>

            {/* Add trust badges */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Secure payment processing by Stripe
              </p>
              <p className="text-sm text-green-600 font-medium mt-1 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                30-Day Money-Back Guarantee
              </p>
            </div>
          </div>
        </div>

        {/* 9. FAQ Section */}
        <div className="bg-gray-50 py-20 relative">
          {/* Wave background */}
          <div className="absolute inset-0 overflow-hidden">
            <svg
              className="absolute bottom-0 w-full"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              style={{ height: '15vh', width: '100%' }}
            >
              <path
                fill="#fff"
                fillOpacity="1"
                d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
            <svg
              className="absolute top-0 w-full transform rotate-180"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              style={{ height: '15vh', width: '100%' }}
            >
              <path
                fill="#fff"
                fillOpacity="0.3"
                d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
          </div>
          
          <div className="container mx-auto px-[5%] relative z-10">
            <div className="text-center mb-16">
              <p className="text-lg font-semibold text-blue-600">FAQ</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
                Need Help? Find<br />Your Answers Here
              </h2>
            </div>
            
            <div className="max-w-3xl mx-auto">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="mb-5 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-8 py-5 text-left flex justify-between items-center focus:outline-none hover:bg-gray-50/50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 ml-4 flex-shrink-0 text-blue-600 transition-all duration-200">
                      {expandedFaq === index ? 
                        <Minus className="h-4 w-4" /> : 
                        <Plus className="h-4 w-4" />
                      }
                    </span>
                  </button>
                  <div 
                    className={`px-8 overflow-hidden transition-all duration-300 ${
                      expandedFaq === index ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 10. Final CTA Section */}
        <div className="bg-blue-800 py-20">
          <div className="container mx-auto px-[5%] text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Marketing?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join thousands of businesses that are creating winning marketing strategies with AI
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')} 
              className="text-lg px-8 py-6 rounded-xl bg-white hover:bg-gray-50 text-blue-700"
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Templates</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Guides</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center mr-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">MarketingGuide AI</span>
            </div>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} MarketingGuide AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}