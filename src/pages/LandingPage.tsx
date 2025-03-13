import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, BarChart3, Target, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

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

      {/* Hero Section */}
      <main className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 mb-8">
            <span className="text-sm font-medium">✨ AI-Powered Marketing Plans</span>
            <ArrowRight className="h-4 w-4" />
          </div>
          
          <h1 className="mx-auto max-w-4xl text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]">
            Your AI Companion To<br />
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Create Marketing Plans
            </span>
          </h1>
          
          <p className="mx-auto mt-8 max-w-2xl text-xl leading-8 text-gray-600">
            Generate comprehensive, customized marketing strategies in minutes. 
            Powered by AI, tailored to your business.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')} 
              className="text-lg px-8 py-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Creating Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/auth')} 
              className="text-lg px-8 py-6 rounded-2xl border-blue-200 hover:bg-blue-50 text-blue-700"
            >
              View Sample Plan
            </Button>
          </div>

          {/* Benefits */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-8 rounded-2xl border border-blue-100 shadow-sm">
              <div className="rounded-xl bg-blue-100 p-3 w-fit">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">AI-Powered Strategy</h3>
              <p className="mt-2 text-gray-600">
                Get data-driven marketing plans customized for your business goals and industry.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Market analysis
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Competitor insights
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-blue-100 shadow-sm">
              <div className="rounded-xl bg-blue-100 p-3 w-fit">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Audience Targeting</h3>
              <p className="mt-2 text-gray-600">
                Identify and understand your ideal customers with detailed persona analysis.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Customer personas
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Behavior analysis
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-blue-100 shadow-sm">
              <div className="rounded-xl bg-blue-100 p-3 w-fit">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Growth Metrics</h3>
              <p className="mt-2 text-gray-600">
                Track your success with clear KPIs and performance indicators.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  ROI tracking
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Growth analytics
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}