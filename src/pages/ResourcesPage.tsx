import { Button } from '@/components/ui/button';
import { BookOpen, Video, FileText, Download, ExternalLink, PlayCircle, Clock } from 'lucide-react';

const RESOURCES = [
  {
    id: 'guide-1',
    type: 'guide',
    title: 'Marketing Strategy Fundamentals',
    description: 'Learn the core principles of effective marketing strategy',
    readTime: '15 min read',
    image: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&q=80&w=400',
    icon: BookOpen
  },
  {
    id: 'video-1',
    type: 'video',
    title: 'Customer Acquisition Masterclass',
    description: 'Step-by-step guide to acquiring and retaining customers',
    duration: '45 min',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=400',
    icon: Video
  },
  {
    id: 'template-1',
    type: 'template',
    title: 'Social Media Content Calendar',
    description: 'Ready-to-use template for planning social media content',
    format: 'Excel Template',
    image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&q=80&w=400',
    icon: FileText
  },
  {
    id: 'guide-2',
    type: 'guide',
    title: 'SEO Best Practices 2025',
    description: 'Latest SEO techniques and strategies for better rankings',
    readTime: '20 min read',
    image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80&w=400',
    icon: BookOpen
  },
  {
    id: 'video-2',
    type: 'video',
    title: 'Email Marketing Automation',
    description: 'Build effective email automation workflows',
    duration: '30 min',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400',
    icon: Video
  },
  {
    id: 'template-2',
    type: 'template',
    title: 'Marketing Budget Planner',
    description: 'Comprehensive template for marketing budget allocation',
    format: 'Excel Template',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
    icon: FileText
  }
];

export default function ResourcesPage() {
  return (
    <div className="min-h-full bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Marketing Resources</h1>
          <p className="mt-1 text-sm text-gray-500">
            Guides, templates, and tutorials to help you succeed
          </p>
        </div>

        {/* Featured Resource */}
        <div className="mb-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl overflow-hidden">
          <div className="px-8 py-12 md:px-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-white">
              <h2 className="text-3xl font-bold mb-4">
                Marketing Strategy Masterclass
              </h2>
              <p className="text-blue-100 mb-6">
                Learn how to create and execute effective marketing strategies that drive results. This comprehensive guide covers everything from market research to campaign optimization.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch Now
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400"
                alt="Marketing Strategy"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESOURCES.map(resource => {
            const Icon = resource.icon;
            return (
              <div
                key={resource.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-500 transition-colors group"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={resource.image}
                    alt={resource.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {resource.type === 'video' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="h-16 w-16 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {resource.type === 'guide' && 'Guide'}
                          {resource.type === 'video' && 'Video Tutorial'}
                          {resource.type === 'template' && 'Template'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {resource.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span className="ml-1 text-sm">
                        {resource.readTime || resource.duration || resource.format}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" className="group-hover:bg-blue-50">
                      {resource.type === 'template' ? (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </>
                      ) : (
                        <>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}