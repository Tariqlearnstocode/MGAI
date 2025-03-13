import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Search,
  BookOpen,
  MessageCircle,
  Sparkles,
  Mail,
  FileText,
  ArrowRight,
  Lightbulb,
  Bug,
  Loader2
} from 'lucide-react';

const FAQS = [
  {
    question: "How do I get started with MarketingGuide AI?",
    answer: "Getting started is easy! Simply create a new project from your dashboard, answer a few questions about your business, and our AI will generate a complete marketing strategy tailored to your needs."
  },
  {
    question: "What types of documents can I generate?",
    answer: "You can generate various marketing documents including marketing plans, brand guidelines, customer acquisition strategies, pricing strategies, and more. Each document is customized based on your business needs."
  },
  {
    question: "How does the AI customization work?",
    answer: "Our AI analyzes your business type, target audience, goals, and challenges to create personalized marketing strategies. It combines industry best practices with your specific needs to generate relevant recommendations."
  },
  {
    question: "Can I edit the generated documents?",
    answer: "Yes! All generated documents are fully editable. You can customize any section, add your own content, or regenerate specific parts to better match your needs."
  }
];

const GUIDES = [
  {
    title: "Quick Start Guide",
    description: "Learn the basics of using MarketingGuide AI",
    icon: BookOpen,
    link: "#"
  },
  {
    title: "Document Types",
    description: "Explore different types of marketing documents",
    icon: FileText,
    link: "#"
  },
  {
    title: "AI Features Guide",
    description: "Make the most of our AI capabilities",
    icon: Sparkles,
    link: "#"
  }
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'help' | 'contact'>('help');
  const [contactType, setContactType] = useState<'feature' | 'bug' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setContactType(null);
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Support Center</h1>
          <p className="mt-1 text-sm text-gray-500">
            Get help with MarketingGuide AI
          </p>
        </div>

        <div className="mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('help')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'help'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Help Center
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'contact'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Contact Support
            </button>
          </div>
        </div>

        {activeTab === 'help' ? (
          <>
            {/* Search */}
            <div className="max-w-2xl mb-12">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* FAQs */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {FAQS.map((faq, index) => (
                    <details
                      key={index}
                      className="group bg-white rounded-lg border border-gray-200"
                    >
                      <summary className="flex items-center justify-between cursor-pointer p-4">
                        <span className="font-medium text-gray-900">
                          {faq.question}
                        </span>
                        <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-90" />
                      </summary>
                      <div className="px-4 pb-4 text-gray-600">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              {/* Guides */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Guides & Tutorials
                </h2>
                <div className="space-y-4">
                  {GUIDES.map((guide, index) => {
                    const Icon = guide.icon;
                    return (
                      <a
                        key={index}
                        href={guide.link}
                        className="flex items-start p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
                      >
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mr-4">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {guide.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {guide.description}
                          </p>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Contact Support
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Get help from our support team
                </p>

                {!contactType ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setContactType('feature')}
                      className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors"
                    >
                      <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                        <Lightbulb className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-medium text-gray-900">
                        Feature Request
                      </h3>
                      <p className="text-sm text-gray-500 text-center mt-2">
                        Suggest new features or improvements
                      </p>
                    </button>

                    <button
                      onClick={() => setContactType('bug')}
                      className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors"
                    >
                      <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center mb-4">
                        <Bug className="h-6 w-6 text-red-600" />
                      </div>
                      <h3 className="font-medium text-gray-900">
                        Report an Issue
                      </h3>
                      <p className="text-sm text-gray-500 text-center mt-2">
                        Let us know if something's not working
                      </p>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`${
                          contactType === 'feature'
                            ? 'Brief description of the feature'
                            : 'Brief description of the issue'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`${
                          contactType === 'feature'
                            ? "Describe the feature you'd like to see..."
                            : 'Please provide as much detail as possible about the issue...'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Attachments
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                        <div className="space-y-1 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setContactType(null)}
                      >
                        Back
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}