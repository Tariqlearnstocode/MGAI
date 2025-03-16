-- Seed document_types table with standard document types
INSERT INTO document_types (id, name, description, prompt_template, required_info, icon)
VALUES
  (
    'marketing_plan',
    'Marketing Plan',
    'Comprehensive strategy for customer acquisition, retention, and growth',
    'Create a detailed marketing plan for a {business_type} business targeting {target_audience} with a monthly budget of {budget}. The business aims to {goals} and faces challenges like {challenges}. Include:
1. Executive Summary
2. Market Analysis
3. Target Market Segmentation
4. Marketing Channels & Tactics
5. Budget Allocation
6. Implementation Timeline
7. Success Metrics',
    NULL,
    'FileText'
  ),
  (
    'brand_guidelines',
    'Brand Guidelines',
    'Visual identity, messaging, and tone guidelines for consistency',
    'Create brand guidelines for a {business_type} business targeting {target_audience}. Consider their goals to {goals}. Include:
1. Brand Story & Values
2. Voice & Tone
3. Messaging Framework
4. Visual Style Guide
5. Communication Guidelines
6. Brand Application Examples',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'primary_color',
          'question', 'What is your primary brand color?',
          'type', 'color'
        ),
        jsonb_build_object(
          'id', 'secondary_color',
          'question', 'What is your secondary brand color?',
          'type', 'color'
        ),
        jsonb_build_object(
          'id', 'brand_personality',
          'question', 'Select up to 3 traits that describe your brand personality',
          'type', 'multi-select',
          'options', jsonb_build_array(
            'Professional & Traditional',
            'Modern & Innovative',
            'Fun & Playful',
            'Luxurious & Sophisticated',
            'Friendly & Approachable',
            'Bold & Energetic',
            'Minimalist & Clean',
            'Trustworthy & Reliable'
          )
        )
      )
    ),
    'Target'
  ),
  (
    'customer_acquisition',
    'Customer Acquisition Strategy',
    'Lead generation methods, marketing channels, and sales funnels',
    'Develop a customer acquisition strategy for a {business_type} business with a {budget} monthly budget. Target audience: {target_audience}. Include:
1. Acquisition Channels
2. Lead Generation Tactics
3. Sales Funnel Design
4. Conversion Optimization
5. Cost Per Acquisition Targets
6. Channel Performance Metrics',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'primary_acquisition_channel',
          'question', 'What is your current best-performing marketing channel?',
          'type', 'text',
          'placeholder', 'e.g., Google Ads, Instagram, Email Newsletter'
        )
      )
    ),
    'ShoppingCart'
  ),
  (
    'pricing_strategy',
    'Pricing Strategy',
    'Pricing models, perceived value, and competitive positioning',
    'Create a pricing strategy for a {business_type} business considering their target market ({target_audience}) and goals ({goals}). Include:
1. Market Position Analysis
2. Pricing Models
3. Value Proposition
4. Competitor Analysis
5. Price Point Recommendations
6. Implementation Plan',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'pricing_model',
          'question', 'Select all pricing models you want to explore',
          'type', 'multi-select',
          'options', jsonb_build_array(
            'Subscription-based',
            'One-time Purchase',
            'Usage-based',
            'Tiered Pricing',
            'Freemium',
            'Value-based',
            'Dynamic Pricing',
            'Package Pricing'
          )
        )
      )
    ),
    'DollarSign'
  ),
  (
    'sales_strategy',
    'Sales Strategy & Process',
    'Sales approach, outreach, conversion, and follow-ups',
    'Design a sales strategy for a {business_type} business targeting {target_audience}. Consider their challenges: {challenges}. Include:
1. Sales Process Flow
2. Prospect Qualification
3. Outreach Templates
4. Objection Handling
5. Follow-up Sequences
6. Sales Metrics & KPIs',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'sales_approach',
          'question', 'Select all sales approaches you want to implement',
          'type', 'multi-select',
          'options', jsonb_build_array(
            'Consultative Selling',
            'Solution Selling',
            'Value-based Selling',
            'Product-led Sales',
            'Account-based Sales',
            'Social Selling',
            'Relationship Selling',
            'Inbound Sales'
          )
        )
      )
    ),
    'MessageSquare'
  ),
  (
    'audience_personas',
    'Target Audience & Buyer Personas',
    'Ideal customer profiles, pain points, and motivations',
    'Create detailed buyer personas for a {business_type} business targeting {target_audience}. Include:
1. Demographic Details
2. Psychographic Profiles
3. Pain Points & Needs
4. Decision-Making Process
5. Communication Preferences
6. Purchase Behavior',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'decision_maker_level',
          'question', 'Describe your ideal customer profile',
          'type', 'text',
          'placeholder', 'e.g., CTOs at mid-sized SaaS companies, Marketing Directors at retail brands'
        )
      )
    ),
    'Users'
  ),
  (
    'digital_presence',
    'Website & Digital Presence Strategy',
    'Website optimization, SEO, and digital assets',
    'Develop a digital presence strategy for a {business_type} business aiming to {goals}. Include:
1. Website Structure & UX
2. SEO Strategy
3. Content Strategy
4. Technical Requirements
5. Digital Asset Management
6. Performance Metrics',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'website_priority',
          'question', 'Select your top website objectives',
          'type', 'multi-select',
          'options', jsonb_build_array(
            'Lead Generation',
            'E-commerce Sales',
            'Content & Education',
            'Brand Awareness',
            'Customer Support',
            'User Community',
            'Product Documentation',
            'Thought Leadership'
          )
        )
      )
    ),
    'Globe'
  ),
  (
    'customer_retention',
    'Customer Retention & Loyalty Plan',
    'Strategies to increase customer lifetime value and reduce churn',
    'Create a customer retention plan for a {business_type} business with {target_audience} as their target market. Include:
1. Customer Journey Mapping
2. Retention Tactics
3. Loyalty Program Design
4. Communication Strategy
5. Churn Prevention
6. Success Metrics',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'retention_focus',
          'question', 'Select your key retention priorities',
          'type', 'multi-select',
          'options', jsonb_build_array(
            'Onboarding Experience',
            'Customer Support',
            'Product Education',
            'Loyalty Programs',
            'Engagement & Communication',
            'Feature Adoption',
            'Customer Feedback',
            'Success Metrics'
          )
        )
      )
    ),
    'Heart'
  ),
  (
    'kpi_tracking',
    'KPIs & Performance Tracking',
    'Key metrics to track marketing success and optimize campaigns',
    'Design a KPI tracking framework for a {business_type} business with goals to {goals}. Include:
1. Core KPIs
2. Measurement Methods
3. Reporting Framework
4. Performance Benchmarks
5. Optimization Process
6. ROI Calculations',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'primary_metric',
          'question', 'What are your current KPIs and benchmarks?',
          'type', 'text',
          'placeholder', 'e.g., CAC < $100, Conversion Rate > 3%, NPS > 50'
        )
      )
    ),
    'BarChart3'
  ),
  (
    'advertising_plan',
    'Advertising & Paid Media Plan',
    'Budget allocation, ad platforms, and campaign objectives',
    'Create an advertising plan for a {business_type} business with a {budget} monthly budget targeting {target_audience}. Include:
1. Platform Selection
2. Budget Allocation
3. Campaign Structure
4. Ad Creative Guidelines
5. Testing Strategy
6. Performance Metrics',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'ad_platform_focus',
          'question', 'Select all advertising platforms you want to explore',
          'type', 'multi-select',
          'options', jsonb_build_array(
            'Google Ads',
            'Meta Ads (Facebook/Instagram)',
            'LinkedIn Ads',
            'TikTok Ads',
            'Traditional Media',
            'YouTube Ads',
            'Programmatic Display',
            'Native Advertising'
          )
        )
      )
    ),
    'Megaphone'
  ),
  (
    'pr_awareness',
    'PR & Brand Awareness Plan',
    'Outreach efforts, press releases, and reputation management',
    'Develop a PR and brand awareness plan for a {business_type} business aiming to {goals}. Include:
1. PR Strategy
2. Media Outreach Plan
3. Content Calendar
4. Crisis Management
5. Influencer Strategy
6. Success Metrics',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'pr_focus',
          'question', 'Select your preferred PR channels',
          'type', 'multi-select',
          'options', jsonb_build_array(
            'Industry Publications',
            'Local Media',
            'National Press',
            'Social Media Influencers',
            'Trade Shows & Events',
            'Podcasts & Webinars',
            'Speaking Engagements',
            'Awards & Recognition'
          )
        )
      )
    ),
    'Share2'
  ),
  (
    'outbound_marketing',
    'Outbound Marketing Plan',
    'Cold emails, direct mail, cold calling, and LinkedIn outreach',
    'Create an outbound marketing plan for a {business_type} business targeting {target_audience}. Include:
1. Channel Strategy
2. Message Templates
3. Outreach Sequences
4. Response Handling
5. Follow-up Process
6. Performance Tracking',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'outreach_preference',
          'question', 'Select your preferred outbound channels',
          'type', 'multi-select',
          'options', jsonb_build_array(
            'Cold Email Campaigns',
            'LinkedIn Outreach',
            'Cold Calling',
            'Direct Mail',
            'Event Marketing',
            'Video Prospecting',
            'Social Selling',
            'Account-Based Marketing'
          )
        )
      )
    ),
    'Mail'
  ),
  (
    'tech_stack',
    'Tech Stack Recommendations',
    'Recommended tools, software, and technology infrastructure',
    'Create tech stack recommendations for a {business_type} business with goals to {goals} and challenges like {challenges}. Include:
1. Core Business Systems
2. Marketing Technology
3. Customer Management
4. Analytics & Reporting
5. Productivity & Collaboration
6. Implementation Roadmap',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'tech_priority',
          'question', 'Select all areas needing technology upgrades',
          'type', 'multi-select',
          'options', jsonb_build_array(
            'Marketing Automation',
            'Sales & CRM',
            'Analytics & Reporting',
            'Content Management',
            'Customer Support',
            'Project Management',
            'Email Marketing',
            'Social Media Management'
          )
        )
      )
    ),
    'Laptop'
  ),
  (
    'visual_identity',
    'Visual Identity System',
    'Complete visual design system including color palette, typography, and design elements',
    'Create a visual identity system for a {business_type} business targeting {target_audience}. Include:
1. Color System
2. Typography Hierarchy
3. Design Elements
4. Image Style Guide
5. Layout Guidelines
6. Usage Examples',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'brand_style',
          'question', 'What style best represents your brand?',
          'type', 'multi-select',
          'options', jsonb_build_array(
            'Modern & Minimal',
            'Bold & Dynamic',
            'Classic & Traditional',
            'Playful & Creative',
            'Luxury & Elegant',
            'Tech & Innovative',
            'Organic & Natural',
            'Corporate & Professional'
          )
        )
      )
    ),
    'Palette'
  ),
  (
    'growth_strategy',
    'Growth Strategy Plan',
    'Strategic roadmap for sustainable business growth and market expansion',
    'Develop a growth strategy for a {business_type} business with goals to {goals}. Include:
1. Market Opportunity Analysis
2. Growth Channels
3. Resource Requirements
4. Timeline & Milestones
5. Risk Assessment
6. Success Metrics',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'growth_focus',
          'question', 'Select your primary growth objectives',
          'type', 'multi-select',
          'options', jsonb_build_array(
            'Market Expansion',
            'Product Development',
            'Customer Acquisition',
            'Revenue Increase',
            'Brand Recognition',
            'Channel Development',
            'Partnership Growth',
            'International Expansion'
          )
        )
      )
    ),
    'Rocket'
  ),
  (
    'content_calendar',
    'Content Calendar',
    'Strategic content planning and publishing schedule',
    'Create a content calendar for a {business_type} business targeting {target_audience}. Include:
1. Content Themes
2. Publishing Schedule
3. Content Types
4. Platform Strategy
5. Engagement Goals
6. Performance Metrics',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'content_platforms',
          'question', 'Select your content distribution channels',
          'type', 'multi-select',
          'options', jsonb_build_array(
            'Blog/Website',
            'Instagram',
            'LinkedIn',
            'Twitter/X',
            'YouTube',
            'TikTok',
            'Email Newsletter',
            'Podcast'
          )
        )
      )
    ),
    'Calendar'
  ),
  (
    'social_bios',
    'Social Media Bios',
    'Professional and engaging social media profile descriptions',
    'Create social media bios for a {business_type} business targeting {target_audience}. Include:
1. Platform-Specific Bios
2. Key Value Propositions
3. Call-to-Actions
4. Keywords & Hashtags
5. Link Strategies
6. Bio Variations',
    jsonb_build_object(
      'questions', jsonb_build_array(
        jsonb_build_object(
          'id', 'social_platforms',
          'question', 'Select platforms for bio optimization',
          'type', 'multi-select',
          'options', jsonb_build_array(
            'Instagram',
            'LinkedIn',
            'Twitter/X',
            'Facebook',
            'TikTok',
            'YouTube',
            'Pinterest',
            'Medium'
          )
        )
      )
    ),
    'AtSign'
  )
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  prompt_template = EXCLUDED.prompt_template,
  required_info = EXCLUDED.required_info,
  icon = EXCLUDED.icon; 