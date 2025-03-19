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

// IMPORTANT: Set up the webhook route with raw body handling first
// This must come BEFORE the JSON body parser
const webhookPath = '/api/stripe-webhook';
app.post(webhookPath, express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing Stripe signature' });
    }
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log(`Received Stripe webhook event: ${event.type}`);
    
    // Log the full event data for debugging
    console.log('Webhook event data:', JSON.stringify(event.data.object, null, 2));
    
    // Store the event in our database for processing by the trigger
    const { error } = await supabase
      .from('stripe_webhook_events')
      .insert({
        id: event.id,
        type: event.type,
        data: event
      });
      
    if (error) {
      console.error('Error storing webhook event:', error);
      // Still return 200 to Stripe so they don't retry
    }
    
    // For customer.created events, let's also manually handle it
    if (event.type === 'customer.created') {
      const customer = event.data.object;
      const customerId = customer.id; // e.g., "cus_RyNv6AaGvyym69"
      const userId = customer.metadata?.userId; // e.g., "07e723d7-e943-459f-ae69-2abae68c9112"
    
      console.log(`Processing customer.created for user ${userId} with Stripe customer ID: ${customerId}`);
    
      if (userId && customerId) {
        const { error } = await supabase
          .from('stripe_customers')
          .update({
            stripe_customer_id: customerId,
            needs_stripe_customer: false  // if you need to update additional columns
          })
          .eq('user_id', userId);
    
        if (error) {
          console.error('Error updating stripe_customers:', error);
          // Optionally, insert a new record if one doesn't exist:
          // const { error: insertError } = await supabase
          //   .from('stripe_customers')
          //   .insert({ user_id: userId, stripe_customer_id: customerId });
          // if (insertError) console.error('Insert also failed:', insertError);
        } else {
          console.log(`Successfully stored Stripe customer ID ${customerId} for user ${userId}`);
        }
      } else {
        console.warn(`Missing data in webhook: userId=${userId}, customerId=${customerId}`);
      }
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    
    // Always return 200 to Stripe even if we have an error
    // This prevents them from retrying the webhook unnecessarily
    res.status(200).json({ 
      received: true,
      error: 'Error processing webhook, but acknowledged receipt'
    });
  }
});

// Configure payment routes - MUST come before general JSON body parser
configurePaymentRoutes(app);

// AFTER setting up the webhook route, apply the JSON body parser to all other routes
app.use((req, res, next) => {
  // Skip body parsing for the webhook route
  if (req.originalUrl === webhookPath) {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

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
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: name || email.split('@')[0],
      metadata: { userId }
    });
    
    console.log(`Created Stripe customer: ${customer.id} for user: ${userId}`);
    
    // Update database with the Stripe customer ID
    const { error } = await supabase
      .from('stripe_customers')
      .update({ stripe_customer_id: customer.id })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Database update error:', error);
      // Still return success since Stripe customer was created
      return res.status(200).json({ 
        success: true, 
        customerId: customer.id,
        warning: 'Customer created but database update failed'
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      customerId: customer.id 
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
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