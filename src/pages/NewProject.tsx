import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, ShoppingBag, Store, Laptop, Briefcase, Video, Sparkles, RefreshCw, Lightbulb, DollarSign, TrendingUp, Rocket, Building } from 'lucide-react';
import { createProject, createDocument } from '@/lib/projects';
import { MOCK_CONTENT } from '@/lib/mockContent';
import { useAuth } from '@/contexts/AuthContext';
import { DOCUMENT_TYPES } from '@/lib/documents';
import type { DocumentContent } from './ProjectDocuments';

const BUSINESS_TYPES = [
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Online retail and digital product sales',
    icon: ShoppingBag
  },
  {
    id: 'local_business',
    name: 'Local Business',
    description: 'Physical stores and service providers',
    icon: Store
  },
  {
    id: 'saas',
    name: 'SaaS',
    description: 'Software as a Service products',
    icon: Laptop
  },
  {
    id: 'professional_services',
    name: 'Professional Services',
    description: 'Consulting and expert services',
    icon: Briefcase
  },
  {
    id: 'content_creator',
    name: 'Content Creator',
    description: 'Digital content and media',
    icon: Video
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create a custom marketing plan',
    icon: Sparkles
  }
];

const BUDGET_OPTIONS = [
  {
    id: '0-500',
    name: '$0 - $500',
    description: 'Perfect for startups and small businesses taking their first marketing steps',
    icon: DollarSign
  },
  {
    id: '501-1000',
    name: '$501 - $1,000',
    description: 'Ideal for businesses ready to expand their digital presence',
    icon: TrendingUp
  },
  {
    id: '1001-5000',
    name: '$1,001 - $5,000',
    description: 'For growing businesses seeking comprehensive marketing coverage',
    icon: Rocket
  },
  {
    id: '10000+',
    name: '$10,000+',
    description: 'Enterprise-level budget for maximum market impact',
    icon: Building
  }
];

const SUGGESTIONS = {
  description: [
    "We create innovative software solutions for modern businesses",
    "A boutique fitness studio focused on personalized training",
    "Handcrafted organic skincare products for conscious consumers",
    "Digital marketing agency helping businesses grow online"
  ],
  name: [
    "TechFlow Solutions",
    "Green Earth Organics",
    "Peak Performance Fitness",
    "Digital Growth Agency"
  ],
  target_audience: [
    "Small business owners looking to digitize operations",
    "Health-conscious urban professionals aged 25-45",
    "Tech startups in the growth phase",
    "Local retailers seeking online presence"
  ],
  goals: [
    "Increase online sales by 50% within 6 months",
    "Build brand awareness in local community",
    "Generate qualified B2B leads",
    "Launch successful digital marketing campaign"
  ],
  budget: [
    "$1,000 - $3,000 per month",
    "$5,000 - $10,000 per month",
    "$500 - $1,000 per month",
    "Under $500 per month"
  ],
  challenges: [
    "Limited marketing budget and resources",
    "High competition in digital space",
    "Building trust with potential customers",
    "Converting website visitors to paying customers"
  ]
};

interface TextInputWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  suggestions?: string[];
}

const TextInputWithSuggestions = ({ value, onChange, placeholder, suggestions }: TextInputWithSuggestionsProps) => (
  <div className="space-y-4">
    <input
      type="text"
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-16 rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 px-6 text-lg transition-all duration-200 placeholder:text-gray-400 caret-blue-500"
    />
    {suggestions && suggestions.length > 0 && (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Lightbulb className="h-5 w-5" />
          <span className="text-base">Suggestions</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 px-3 text-sm"
            onClick={() => onChange(suggestions[Math.floor(Math.random() * suggestions.length)])}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onChange(suggestion)}
              className="text-left px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-base transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

const QUESTIONS = [
  {
    id: 'business_type',
    question: 'Select your business type to get started with a tailored marketing plan.',
    component: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BUSINESS_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => onChange(type.id)}
              className={`p-8 rounded-xl border-2 transition-all text-left hover:border-blue-500 ${
                value === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Icon className={`h-10 w-10 mb-4 ${
                value === type.id ? 'text-blue-500' : 'text-gray-500'
              }`} />
              <h3 className="text-xl font-semibold mb-2">{type.name}</h3>
              <p className="text-base text-gray-600">{type.description}</p>
            </button>
          );
        })}
      </div>
    )
  },
  {
    id: 'description',
    question: 'Describe your business in a few sentences.',
    placeholder: 'e.g., We create innovative software solutions...',
    component: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
      <TextInputWithSuggestions
        value={value}
        onChange={onChange}
        placeholder="e.g., We create innovative software solutions..."
        suggestions={SUGGESTIONS.description}
      />
    )
  },
  {
    id: 'name',
    question: 'What is your business name?',
    placeholder: 'e.g., Acme Corporation, TechStart Solutions...',
    component: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
      <TextInputWithSuggestions
        value={value}
        onChange={onChange}
        placeholder="e.g., Acme Corporation, TechStart Solutions..."
        suggestions={SUGGESTIONS.name}
      />
    )
  },
  {
    id: 'target_audience',
    question: 'Who is your target audience?',
    placeholder: 'e.g., Small business owners, Young professionals...',
    component: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
      <TextInputWithSuggestions
        value={value}
        onChange={onChange}
        placeholder="e.g., Small business owners, Young professionals..."
        suggestions={SUGGESTIONS.target_audience}
      />
    )
  },
  {
    id: 'goals',
    question: 'What are your primary marketing goals?',
    placeholder: 'e.g., Increase brand awareness, Generate leads...',
    component: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
      <TextInputWithSuggestions
        value={value}
        onChange={onChange}
        placeholder="e.g., Increase brand awareness, Generate leads..."
        suggestions={SUGGESTIONS.goals}
      />
    )
  },
  {
    id: 'budget',
    question: 'What is your monthly marketing budget?',
    component: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BUDGET_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.name)}
              className={`p-8 rounded-xl border-2 transition-all text-left hover:border-blue-500 ${
                value === option.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Icon className={`h-10 w-10 mb-4 ${
                value === option.name ? 'text-blue-500' : 'text-gray-500'
              }`} />
              <h3 className="text-xl font-semibold mb-2">{option.name}</h3>
              <p className="text-base text-gray-600">{option.description}</p>
            </button>
          );
        })}
      </div>
    )
  },
  {
    id: 'challenges',
    question: 'What are your biggest marketing challenges?',
    placeholder: 'e.g., Limited resources, High competition...',
    component: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
      <TextInputWithSuggestions
        value={value}
        onChange={onChange}
        placeholder="e.g., Limited resources, High competition..."
        suggestions={SUGGESTIONS.challenges}
      />
    )
  }
];

export default function NewProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const currentQuestion = QUESTIONS[currentStep];

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    try {
      if (!user) {
        throw new Error('You must be logged in to create a project');
      }

      const project = await createProject({
        name: answers.name,
        business_type: answers.business_type,
        description: answers.description,
        target_audience: answers.target_audience,
        goals: answers.goals,
        budget: answers.budget,
        challenges: answers.challenges
      }, user);

      // Wait for documents to be initialized
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigate(`/app/projects/${project.id}/documents`);
    } catch (error) {
      console.error('Failed to create project:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/app')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-8 w-8" />
            </button>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              New Project
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-2 py-8 sm:px-4 lg:px-6">
        <div className="bg-white rounded-lg shadow-sm px-6 py-8">
          {!isGenerating ? (
            <>
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-base font-medium text-gray-500">
                    Question {currentStep + 1} of {QUESTIONS.length}
                  </span>
                  <span className="text-base font-medium text-indigo-600">
                    {Math.round(((currentStep + 1) / QUESTIONS.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentStep + 1) / QUESTIONS.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl font-semibold text-gray-900">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.component ? (
                  <currentQuestion.component
                    value={answers[currentQuestion.id] || ''}
                    onChange={(value) =>
                      setAnswers(prev => ({
                        ...prev,
                        [currentQuestion.id]: value
                      }))
                    }
                  />
                ) : (
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) =>
                      setAnswers(prev => ({
                        ...prev,
                        [currentQuestion.id]: e.target.value
                      }))
                    }
                    placeholder={currentQuestion.placeholder}
                    rows={4}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                )}
                <div className="flex justify-end">
                  <Button
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.id]}
                  >
                    {currentStep === QUESTIONS.length - 1 ? 'Generate Plan' : 'Next'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
              <h2 className="mt-6 text-2xl font-semibold text-gray-900">
                Generating Your Marketing Plan
              </h2>
              <p className="mt-3 text-base text-gray-500">
                This may take a few moments...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}