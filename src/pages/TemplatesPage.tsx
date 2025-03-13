import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Filter, ArrowRight, Star, Clock, Users, Sparkles } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'ecommerce',
    name: 'E-commerce Marketing Kit',
    description: 'Complete marketing strategy for online stores',
    category: 'Retail',
    popularity: 4.8,
    usageCount: '2.3k',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'saas',
    name: 'SaaS Growth Bundle',
    description: 'B2B marketing plan for software companies',
    category: 'Technology',
    popularity: 4.9,
    usageCount: '1.8k',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'local',
    name: 'Local Business Starter',
    description: 'Marketing essentials for brick-and-mortar stores',
    category: 'Small Business',
    popularity: 4.7,
    usageCount: '3.1k',
    image: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'startup',
    name: 'Startup Launch Pack',
    description: 'Marketing toolkit for new ventures',
    category: 'Startup',
    popularity: 4.6,
    usageCount: '1.5k',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'influencer',
    name: 'Creator Growth Kit',
    description: 'Marketing strategy for content creators',
    category: 'Social Media',
    popularity: 4.8,
    usageCount: '2.7k',
    image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'agency',
    name: 'Agency Scale-Up',
    description: 'Marketing blueprint for service agencies',
    category: 'Professional Services',
    popularity: 4.7,
    usageCount: '1.9k',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=400'
  }
];

const CATEGORIES = [
  'All Categories',
  'Retail',
  'Technology',
  'Small Business',
  'Startup',
  'Social Media',
  'Professional Services'
];

const SORT_OPTIONS = [
  'Most Popular',
  'Newest',
  'Most Used'
];

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('Most Popular');

  return (
    <div className="min-h-full bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Marketing Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Start with a pre-built template to accelerate your marketing strategy
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-white pl-3 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CATEGORIES.map(category => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white pl-3 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map(template => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-500 transition-colors group"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={template.image}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {template.category}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="ml-1 text-sm font-medium">{template.popularity}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Users className="h-4 w-4" />
                      <span className="ml-1 text-sm">{template.usageCount} uses</span>
                    </div>
                  </div>
                  <Button size="sm" className="group-hover:bg-blue-600">
                    Use Template
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}