import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Users, CheckCircle2, MessageCircle, Calendar } from 'lucide-react';

const PARTNERS = [
  {
    id: 'seo',
    name: 'GrowthMasters SEO',
    category: 'SEO Agency',
    description: 'Expert SEO services to improve your search rankings and drive organic traffic',
    rating: 4.9,
    reviews: 127,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=500',
    features: [
      'Technical SEO Audits',
      'Content Strategy',
      'Link Building',
      'Local SEO'
    ]
  },
  {
    id: 'social',
    name: 'SocialPro Agency',
    category: 'Social Media Marketing',
    description: 'Full-service social media management and paid advertising campaigns',
    rating: 4.8,
    reviews: 93,
    image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80&w=500',
    features: [
      'Content Creation',
      'Community Management',
      'Paid Advertising',
      'Analytics & Reporting'
    ]
  },
  {
    id: 'paid',
    name: 'AdVantage Digital',
    category: 'Paid Advertising',
    description: 'Results-driven PPC and display advertising across all major platforms',
    rating: 4.9,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=500',
    features: [
      'Google Ads Management',
      'Facebook/Instagram Ads',
      'LinkedIn Advertising',
      'Conversion Optimization'
    ]
  },
  {
    id: 'va',
    name: 'VirtualPro Solutions',
    category: 'Virtual Assistant Agency',
    description: 'Skilled virtual assistants for marketing, admin, and business support',
    rating: 4.7,
    reviews: 84,
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=500',
    features: [
      'Social Media Management',
      'Email Management',
      'Content Research',
      'Administrative Support'
    ]
  },
  {
    id: 'bookkeeping',
    name: 'BalanceBooks Pro',
    category: 'Bookkeeping Services',
    description: 'Professional bookkeeping and financial management for growing businesses',
    rating: 4.9,
    reviews: 112,
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=500',
    features: [
      'Monthly Bookkeeping',
      'Financial Reporting',
      'Tax Preparation',
      'Payroll Services'
    ]
  }
];

export default function HireProPage() {
  return (
    <div className="min-h-full bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Hire a Pro</h1>
          <p className="mt-1 text-sm text-gray-500">
            Partner with vetted marketing agencies and service providers
          </p>
        </div>

        {/* Featured Partner */}
        <div className="mb-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl overflow-hidden">
          <div className="px-8 py-12 md:px-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-white">
              <div className="flex items-center gap-2 text-blue-100 mb-4">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-lg font-medium">Top Rated Partner</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Get Expert Marketing Help
              </h2>
              <p className="text-blue-100 mb-6">
                Our carefully selected partners are industry leaders with proven track records. Whether you need SEO, social media, paid advertising, or support services, we've got you covered.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  <Calendar className="mr-2 h-5 w-5" />
                  Schedule a Call
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=500"
                alt="Marketing Strategy"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {PARTNERS.map(partner => (
            <div
              key={partner.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-500 transition-colors group"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={partner.image}
                  alt={partner.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <span className="text-sm font-medium">
                        {partner.category}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Verified Partner
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {partner.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {partner.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {partner.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-600">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="ml-1 text-sm font-medium">{partner.rating}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Users className="h-4 w-4" />
                      <span className="ml-1 text-sm">{partner.reviews} reviews</span>
                    </div>
                  </div>
                  <Button size="sm" className="group-hover:bg-blue-600">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact
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