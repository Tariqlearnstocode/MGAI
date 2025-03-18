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

1. Go to your project in the Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Name | Value | Description |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `your-supabase-url` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `your-supabase-anon-key` | Your Supabase anonymous key |
| `OPENAI_API_KEY` | `your-openai-api-key` | Your OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | The OpenAI model to use |
| `STRIPE_SECRET_KEY` | `your-stripe-secret-key` | Your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | `your-stripe-webhook-secret` | Your Stripe webhook secret |

4. Click **Save** to apply the environment variables
5. Redeploy your application

### 4. Deploy to Vercel

```bash
vercel --prod
```

## Local Development

### Using Vercel Dev

For local development, use Vercel's development environment to test serverless functions:

```bash
vercel dev
```

This will run a local development server that mimics the Vercel production environment, allowing you to test your serverless functions locally without having to deploy them first.

## Architecture

The application is designed to handle API calls consistently across environments:

- API calls are always made to Vercel serverless functions
- In development, relative paths ('/api/...') are used
- In production, absolute paths to the Vercel deployment are used
- This architecture eliminates the need for a local Express server

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
