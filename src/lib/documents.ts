import { FileText, Target, Users, BarChart3, DollarSign, ShoppingCart, Globe, Heart, Megaphone, Share2, MessageSquare, Mail, Laptop,
  Palette, Rocket, Calendar, AtSign } from 'lucide-react';

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  promptTemplate: string;
  requiredInfo?: {
    questions: Array<{
      id: string;
      question: string;
      type: 'text' | 'color' | 'image' | 'select' | 'multi-select';
      options?: string[];
      placeholder?: string;
    }>;
  };
}

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'marketing_plan',
    name: 'Marketing Plan',
    description: 'Comprehensive strategy for customer acquisition, retention, and growth',
    icon: FileText,
    promptTemplate: `Create a detailed marketing plan for a {business_type} business targeting {target_audience} with a monthly budget of {budget}. The business aims to {goals} and faces challenges like {challenges}. Include:
1. Executive Summary
2. Market Analysis
3. Target Market Segmentation
4. Marketing Channels & Tactics
5. Budget Allocation
6. Implementation Timeline
7. Success Metrics`
  },
  {
    id: 'brand_guidelines',
    name: 'Brand Guidelines',
    description: 'Visual identity, messaging, and tone guidelines for consistency',
    icon: Target,
    requiredInfo: {
      questions: [
        {
          id: 'primary_color',
          question: 'What is your primary brand color?',
          type: 'color'
        },
        {
          id: 'secondary_color',
          question: 'What is your secondary brand color?',
          type: 'color'
        },
        {
          id: 'brand_personality',
          question: 'Select up to 3 traits that describe your brand personality',
          type: 'multi-select',
          options: [
            'Professional & Traditional',
            'Modern & Innovative',
            'Fun & Playful',
            'Luxurious & Sophisticated',
            'Friendly & Approachable',
            'Bold & Energetic',
            'Minimalist & Clean',
            'Trustworthy & Reliable'
          ]
        }
      ]
    },
    promptTemplate: `Create brand guidelines for a {business_type} business targeting {target_audience}. Consider their goals to {goals}. Include:
1. Brand Story & Values
2. Voice & Tone
3. Messaging Framework
4. Visual Style Guide
5. Communication Guidelines
6. Brand Application Examples`
  },
  {
    id: 'customer_acquisition',
    name: 'Customer Acquisition Strategy',
    description: 'Lead generation methods, marketing channels, and sales funnels',
    icon: ShoppingCart,
    requiredInfo: {
      questions: [
        {
          id: 'primary_acquisition_channel',
          question: 'What is your current best-performing marketing channel?',
          type: 'text',
          placeholder: 'e.g., Google Ads, Instagram, Email Newsletter'
        }
      ]
    },
    promptTemplate: `Develop a customer acquisition strategy for a {business_type} business with a {budget} monthly budget. Target audience: {target_audience}. Include:
1. Acquisition Channels
2. Lead Generation Tactics
3. Sales Funnel Design
4. Conversion Optimization
5. Cost Per Acquisition Targets
6. Channel Performance Metrics`
  },
  {
    id: 'pricing_strategy',
    name: 'Pricing Strategy',
    description: 'Pricing models, perceived value, and competitive positioning',
    icon: DollarSign,
    requiredInfo: {
      questions: [
        {
          id: 'pricing_model',
          question: 'Select all pricing models you want to explore',
          type: 'multi-select',
          options: [
            'Subscription-based',
            'One-time Purchase',
            'Usage-based',
            'Tiered Pricing',
            'Freemium',
            'Value-based',
            'Dynamic Pricing',
            'Package Pricing'
          ]
        }
      ]
    },
    promptTemplate: `Create a pricing strategy for a {business_type} business considering their target market ({target_audience}) and goals ({goals}). Include:
1. Market Position Analysis
2. Pricing Models
3. Value Proposition
4. Competitor Analysis
5. Price Point Recommendations
6. Implementation Plan`
  },
  {
    id: 'sales_strategy',
    name: 'Sales Strategy & Process',
    description: 'Sales approach, outreach, conversion, and follow-ups',
    icon: MessageSquare,
    requiredInfo: {
      questions: [
        {
          id: 'sales_approach',
          question: 'Select all sales approaches you want to implement',
          type: 'multi-select',
          options: [
            'Consultative Selling',
            'Solution Selling',
            'Value-based Selling',
            'Product-led Sales',
            'Account-based Sales',
            'Social Selling',
            'Relationship Selling',
            'Inbound Sales'
          ]
        }
      ]
    },
    promptTemplate: `Design a sales strategy for a {business_type} business targeting {target_audience}. Consider their challenges: {challenges}. Include:
1. Sales Process Flow
2. Prospect Qualification
3. Outreach Templates
4. Objection Handling
5. Follow-up Sequences
6. Sales Metrics & KPIs`
  },
  {
    id: 'audience_personas',
    name: 'Target Audience & Buyer Personas',
    description: 'Ideal customer profiles, pain points, and motivations',
    icon: Users,
    requiredInfo: {
      questions: [
        {
          id: 'decision_maker_level',
          question: 'Describe your ideal customer profile',
          type: 'text',
          placeholder: 'e.g., CTOs at mid-sized SaaS companies, Marketing Directors at retail brands'
        }
      ]
    },
    promptTemplate: `Create detailed buyer personas for a {business_type} business targeting {target_audience}. Include:
1. Demographic Details
2. Psychographic Profiles
3. Pain Points & Needs
4. Decision-Making Process
5. Communication Preferences
6. Purchase Behavior`
  },
  {
    id: 'digital_presence',
    name: 'Website & Digital Presence Strategy',
    description: 'Website optimization, SEO, and digital assets',
    icon: Globe,
    requiredInfo: {
      questions: [
        {
          id: 'website_priority',
          question: 'Select your top website objectives',
          type: 'multi-select',
          options: [
            'Lead Generation',
            'E-commerce Sales',
            'Content & Education',
            'Brand Awareness',
            'Customer Support',
            'User Community',
            'Product Documentation',
            'Thought Leadership'
          ]
        }
      ]
    },
    promptTemplate: `Develop a digital presence strategy for a {business_type} business aiming to {goals}. Include:
1. Website Structure & UX
2. SEO Strategy
3. Content Strategy
4. Technical Requirements
5. Digital Asset Management
6. Performance Metrics`
  },
  {
    id: 'customer_retention',
    name: 'Customer Retention & Loyalty Plan',
    description: 'Strategies to increase customer lifetime value and reduce churn',
    icon: Heart,
    requiredInfo: {
      questions: [
        {
          id: 'retention_focus',
          question: 'Select your key retention priorities',
          type: 'multi-select',
          options: [
            'Onboarding Experience',
            'Customer Support',
            'Product Education',
            'Loyalty Programs',
            'Engagement & Communication',
            'Feature Adoption',
            'Customer Feedback',
            'Success Metrics'
          ]
        }
      ]
    },
    promptTemplate: `Create a customer retention plan for a {business_type} business with {target_audience} as their target market. Include:
1. Customer Journey Mapping
2. Retention Tactics
3. Loyalty Program Design
4. Communication Strategy
5. Churn Prevention
6. Success Metrics`
  },
  {
    id: 'kpi_tracking',
    name: 'KPIs & Performance Tracking',
    description: 'Key metrics to track marketing success and optimize campaigns',
    icon: BarChart3,
    requiredInfo: {
      questions: [
        {
          id: 'primary_metric',
          question: 'What are your current KPIs and benchmarks?',
          type: 'text',
          placeholder: 'e.g., CAC < $100, Conversion Rate > 3%, NPS > 50'
        }
      ]
    },
    promptTemplate: `Design a KPI tracking framework for a {business_type} business with goals to {goals}. Include:
1. Core KPIs
2. Measurement Methods
3. Reporting Framework
4. Performance Benchmarks
5. Optimization Process
6. ROI Calculations`
  },
  {
    id: 'advertising_plan',
    name: 'Advertising & Paid Media Plan',
    description: 'Budget allocation, ad platforms, and campaign objectives',
    icon: Megaphone,
    requiredInfo: {
      questions: [
        {
          id: 'ad_platform_focus',
          question: 'Select all advertising platforms you want to explore',
          type: 'multi-select',
          options: [
            'Google Ads',
            'Meta Ads (Facebook/Instagram)',
            'LinkedIn Ads',
            'TikTok Ads',
            'Traditional Media',
            'YouTube Ads',
            'Programmatic Display',
            'Native Advertising'
          ]
        }
      ]
    },
    promptTemplate: `Create an advertising plan for a {business_type} business with a {budget} monthly budget targeting {target_audience}. Include:
1. Platform Selection
2. Budget Allocation
3. Campaign Structure
4. Ad Creative Guidelines
5. Testing Strategy
6. Performance Metrics`
  },
  {
    id: 'pr_awareness',
    name: 'PR & Brand Awareness Plan',
    description: 'Outreach efforts, press releases, and reputation management',
    icon: Share2,
    requiredInfo: {
      questions: [
        {
          id: 'pr_focus',
          question: 'Select your preferred PR channels',
          type: 'multi-select',
          options: [
            'Industry Publications',
            'Local Media',
            'National Press',
            'Social Media Influencers',
            'Trade Shows & Events',
            'Podcasts & Webinars',
            'Speaking Engagements',
            'Awards & Recognition'
          ]
        }
      ]
    },
    promptTemplate: `Develop a PR and brand awareness plan for a {business_type} business aiming to {goals}. Include:
1. PR Strategy
2. Media Outreach Plan
3. Content Calendar
4. Crisis Management
5. Influencer Strategy
6. Success Metrics`
  },
  {
    id: 'outbound_marketing',
    name: 'Outbound Marketing Plan',
    description: 'Cold emails, direct mail, cold calling, and LinkedIn outreach',
    icon: Mail,
    requiredInfo: {
      questions: [
        {
          id: 'outreach_preference',
          question: 'Select your preferred outbound channels',
          type: 'multi-select',
          options: [
            'Cold Email Campaigns',
            'LinkedIn Outreach',
            'Cold Calling',
            'Direct Mail',
            'Event Marketing',
            'Video Prospecting',
            'Social Selling',
            'Account-Based Marketing'
          ]
        }
      ]
    },
    promptTemplate: `Create an outbound marketing plan for a {business_type} business targeting {target_audience}. Include:
1. Channel Strategy
2. Message Templates
3. Outreach Sequences
4. Response Handling
5. Follow-up Process
6. Performance Tracking`
  },
  {
    id: 'tech_stack',
    name: 'Tech Stack Recommendations',
    description: 'Recommended tools, software, and technology infrastructure',
    icon: Laptop,
    requiredInfo: {
      questions: [
        {
          id: 'tech_priority',
          question: 'Select all areas needing technology upgrades',
          type: 'multi-select',
          options: [
            'Marketing Automation',
            'Sales & CRM',
            'Analytics & Reporting',
            'Content Management',
            'Customer Support',
            'Project Management',
            'Email Marketing',
            'Social Media Management'
          ]
        }
      ]
    },
    promptTemplate: `Create tech stack recommendations for a {business_type} business with goals to {goals} and challenges like {challenges}. Include:
1. Core Business Systems
2. Marketing Technology
3. Customer Management
4. Analytics & Reporting
5. Productivity & Collaboration
6. Implementation Roadmap`
  },
  {
    id: 'visual_identity',
    name: 'Visual Identity System',
    description: 'Complete visual design system including color palette, typography, and design elements',
    icon: Palette,
    requiredInfo: {
      questions: [
        {
          id: 'brand_style',
          question: 'What style best represents your brand?',
          type: 'multi-select',
          options: [
            'Modern & Minimal',
            'Bold & Dynamic',
            'Classic & Traditional',
            'Playful & Creative',
            'Luxury & Elegant',
            'Tech & Innovative',
            'Organic & Natural',
            'Corporate & Professional'
          ]
        }
      ]
    },
    promptTemplate: `Create a visual identity system for a {business_type} business targeting {target_audience}. Include:
1. Color System
2. Typography Hierarchy
3. Design Elements
4. Image Style Guide
5. Layout Guidelines
6. Usage Examples`
  },
  {
    id: 'growth_strategy',
    name: 'Growth Strategy Plan',
    description: 'Strategic roadmap for sustainable business growth and market expansion',
    icon: Rocket,
    requiredInfo: {
      questions: [
        {
          id: 'growth_focus',
          question: 'Select your primary growth objectives',
          type: 'multi-select',
          options: [
            'Market Expansion',
            'Product Development',
            'Customer Acquisition',
            'Revenue Increase',
            'Brand Recognition',
            'Channel Development',
            'Partnership Growth',
            'International Expansion'
          ]
        }
      ]
    },
    promptTemplate: `Develop a growth strategy for a {business_type} business with goals to {goals}. Include:
1. Market Opportunity Analysis
2. Growth Channels
3. Resource Requirements
4. Timeline & Milestones
5. Risk Assessment
6. Success Metrics`
  },
  {
    id: 'content_calendar',
    name: 'Content Calendar',
    description: 'Strategic content planning and publishing schedule',
    icon: Calendar,
    requiredInfo: {
      questions: [
        {
          id: 'content_platforms',
          question: 'Select your content distribution channels',
          type: 'multi-select',
          options: [
            'Blog/Website',
            'Instagram',
            'LinkedIn',
            'Twitter/X',
            'YouTube',
            'TikTok',
            'Email Newsletter',
            'Podcast'
          ]
        }
      ]
    },
    promptTemplate: `Create a content calendar for a {business_type} business targeting {target_audience}. Include:
1. Content Themes
2. Publishing Schedule
3. Content Types
4. Platform Strategy
5. Engagement Goals
6. Performance Metrics`
  },
  {
    id: 'social_bios',
    name: 'Social Media Bios',
    description: 'Professional and engaging social media profile descriptions',
    icon: AtSign,
    requiredInfo: {
      questions: [
        {
          id: 'social_platforms',
          question: 'Select platforms for bio optimization',
          type: 'multi-select',
          options: [
            'Instagram',
            'LinkedIn',
            'Twitter/X',
            'Facebook',
            'TikTok',
            'YouTube',
            'Pinterest',
            'Medium'
          ]
        }
      ]
    },
    promptTemplate: `Create social media bios for a {business_type} business targeting {target_audience}. Include:
1. Platform-Specific Bios
2. Key Value Propositions
3. Call-to-Actions
4. Keywords & Hashtags
5. Link Strategies
6. Bio Variations`
  }
];