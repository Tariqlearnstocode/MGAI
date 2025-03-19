import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { configurePaymentRoutes } from './src/payment-server.js';
import Stripe from 'stripe';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

// Middleware for CORS
app.use(cors());

// Middleware for JSON parsing - needs to come after the webhook raw body handler
app.use(bodyParser.json());

// Configure payment routes - MUST come before general JSON body parser
// This will set up the special webhooks with raw body handling
configurePaymentRoutes(app);

// OpenAI endpoint for content generation
app.post('/api/generate-content', async (req, res) => {
  try {
    console.log("Received OpenAI request with params:", JSON.stringify({
      prompt_length: req.body.prompt?.length,
      model: req.body.model,
      max_tokens: req.body.max_tokens
    }));
    
    const { prompt, model = process.env.OPENAI_MODEL || 'gpt-4o-mini', max_tokens } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt parameter' });
    }

    const completionOptions = {
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    };

    // Add max_tokens if specified
    if (max_tokens) {
      console.log(`Setting max_tokens to ${max_tokens}`);
      completionOptions.max_tokens = parseInt(max_tokens);
    }

    console.log("Calling OpenAI with options:", JSON.stringify(completionOptions, null, 2));
    const completion = await openai.chat.completions.create(completionOptions);
    console.log("OpenAI response received with tokens:", completion.usage);

    return res.status(200).json({ 
      result: completion.choices[0].message.content,
      usage: completion.usage
    });
  } catch (error) {
    console.error('Error generating content with OpenAI:', error);
    if (error.response) {
      console.error('API Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Create Stripe customer endpoint
app.post('/api/create-stripe-customer', async (req, res) => {
  try {
    const { userId, email, name } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing required parameters: userId and email are required' });
    }
    
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: name || email.split('@')[0],
      metadata: {
        userId
      }
    });
    
    console.log(`Created Stripe customer: ${customer.id} for user: ${userId}`);
    
    // Store in Supabase
    const { error } = await supabase
      .from('stripe_customers')
      .upsert({
        user_id: userId,
        stripe_customer_id: customer.id,
        purchase_history: []
      });
    
    if (error) {
      console.error('Error storing Stripe customer in database:', error);
      return res.status(500).json({ error: 'Failed to store customer in database' });
    }
    
    return res.status(200).json({ 
      success: true,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Add a simple test endpoint for healthcheck
app.get('/api/test', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Serve Vite app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the dist directory
  app.use(express.static('dist'));

  // Handle SPA routing - serve index.html for any non-API routes
  app.get('*', (req, res) => {
    // Skip for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // For all other routes, serve the SPA's index.html
    res.sendFile('dist/index.html', { root: '.' });
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 