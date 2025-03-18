# Marketing Guide AI Serverless Deployment

This document describes how to deploy Marketing Guide AI using Vercel's serverless functions for API endpoints.

## Overview

The Marketing Guide AI application uses OpenAI for content generation, which requires API keys that should not be exposed to the client. This deployment method uses:

1. Vercel serverless functions to securely handle API calls
2. Environment variables for secure credential management
3. Graceful fallbacks between environments

## Deployment Steps

### 1. Set up Vercel CLI

```bash
npm install -g vercel
```

### 2. Link to your Vercel project

```bash
vercel link
```

### 3. Set up environment variables

In the Vercel dashboard, add the following environment variables:

- `VITE_SUPABASE_URL` - Your Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - The OpenAI model to use (e.g., 'gpt-4o-mini')
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret

### 4. Deploy to Vercel

```bash
vercel --prod
```

## Local Development

When developing locally, you have two options:

1. **Run the Express Server**: The application can still use your local server on port 5001.
   ```bash
   node server.js
   ```

2. **Use Vercel Dev**: Run Vercel's development environment to test serverless functions.
   ```bash
   vercel dev
   ```

## Architecture

The application is designed to gracefully handle API calls across different environments:

- In production, API calls go directly to Vercel serverless functions
- In development, API calls first try the local path, then fall back to the deployed functions
- The architecture ensures that you don't have to run a local server to use the application

## Serverless Functions

The main serverless functions are:

- `/api/generate-content` - Handles OpenAI content generation
- Future API endpoints can be added in the `/api` directory

## Security

This implementation improves security by:

1. Never exposing API keys to the client
2. Managing environment variables through Vercel's secure environment system
3. Ensuring that all API calls are server-side

## Troubleshooting

If you encounter issues with the deployment:

1. Check the Vercel deployment logs for errors
2. Verify that all environment variables are correctly set
3. Test locally using `vercel dev` to debug any issues before deployment
