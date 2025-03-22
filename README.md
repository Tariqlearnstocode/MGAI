# MarketingGuide AI

A modern SaaS platform that empowers marketing professionals to create comprehensive marketing plans and strategy documents efficiently.

![MarketingGuide AI](https://via.placeholder.com/1200x630?text=MarketingGuide+AI)

## Overview

MarketingGuide AI automates and streamlines the creation of marketing materials, saving users time while ensuring quality output. The platform uses artificial intelligence to generate marketing strategies tailored to each user's specific business needs.

## Features

- **AI-Powered Document Generation**: Create comprehensive marketing plans in minutes
- **Project Management**: Organize marketing initiatives into projects
- **Marketing Templates**: Access pre-built templates for various marketing strategies:
  - Social Media Strategy
  - Content Calendar
  - Email Campaigns
  - SEO Strategy
  - Brand Guidelines
  - Budget Plans
- **Credit System**: Pay-as-you-go or subscription model
- **Document Export**: Download and share marketing documents
- **Dashboard Analytics**: Track time saved, documents created, and projects completed

## Tech Stack

### Frontend
- React with TypeScript
- React Router v6
- Tailwind CSS for styling
- Lucide React for icons
- React Context API for state management

### Backend
- Supabase (PostgreSQL database)
- RESTful API endpoints
- Node.js

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Git

### Installation

1. Clone the repository
   ```
   git clone https://github.com/Tariqlearnstocode/MGAI.git
   cd MGAI-2
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file with your Supabase credentials and other required variables.

4. Start the development server
   ```
   npm run dev
   ```

## Project Structure

```
src/
├── components/        # Reusable UI components
├── contexts/          # React contexts (e.g., PaymentContext)
├── pages/             # Page components
├── utils/             # Utility functions
├── hooks/             # Custom React hooks
├── types/             # TypeScript types and interfaces
├── App.tsx            # Main App component with routes
└── index.tsx          # Entry point
```

## Key Features Implementation

### Error Handling

The application implements a comprehensive error handling system:
- Error boundary for catching runtime errors
- Dedicated error pages (404, 500, etc.)
- Utility functions for consistent error handling

### Authentication & Authorization

User authentication is handled through Supabase Auth with private routes ensuring protected content.

### Payment Processing

The application includes:
- Credit-based system for document generation
- Secure checkout process
- Support for different payment plans (including yearly subscription with 40% discount)

## Deployment

The application can be built for production using:

```
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software.

## Contact

Project Link: [https://github.com/Tariqlearnstocode/MGAI](https://github.com/Tariqlearnstocode/MGAI)
