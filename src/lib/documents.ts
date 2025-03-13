import { FileText, Target, Users, BarChart3, DollarSign, ShoppingCart, Globe, Heart, Megaphone, Share2, MessageSquare, Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  promptTemplate: string;
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
    promptTemplate: `Create an outbound marketing plan for a {business_type} business targeting {target_audience}. Include:
1. Channel Strategy
2. Message Templates
3. Outreach Sequences
4. Response Handling
5. Follow-up Process
6. Performance Tracking`
  }
];