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
    
    // First check if a stripe_customers record exists for this user
    const { data: existingCustomer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
    
    if (customerError && customerError.code !== 'PGRST116') {
      console.error('Error fetching customer record:', customerError);
      return res.status(500).json({ error: 'Database error fetching customer record' });
    }
    
    // If there's already a Stripe customer ID, return it
    if (existingCustomer && existingCustomer.stripe_customer_id) {
      console.log(`Found existing Stripe customer: ${existingCustomer.stripe_customer_id} for user: ${userId}`);
      return res.status(200).json({ 
        success: true,
        customerId: existingCustomer.stripe_customer_id,
        existing: true
      });
    }
    
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: name || email.split('@')[0],
      metadata: {
        userId  // Important: Include userId in metadata for webhook processing
      }
    });
    
    console.log(`Created Stripe customer: ${customer.id} for user: ${userId}`);
    
    // Update the database record with the actual Stripe customer ID
    const { error: updateError } = await supabase
      .from('stripe_customers')
      .update({
        stripe_customer_id: customer.id,
        needs_stripe_customer: false
      })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('Error updating Stripe customer in database:', updateError);
      
      // If the direct update fails, try using the helper function
      try {
        const { data, error: fnError } = await supabase
          .rpc('process_stripe_customer_creation', {
            customer_id: customer.id,
            user_id: userId
          });
          
        if (fnError) {
          console.error('Helper function also failed:', fnError);
        } else if (data) {
          console.log('Successfully updated via helper function');
        }
      } catch (helperError) {
        console.error('Error calling helper function:', helperError);
      }
      
      // Even if DB update fails, return success with warning since the Stripe customer was created
      return res.status(200).json({ 
        success: true,
        customerId: customer.id,
        warning: 'Created Stripe customer but faced challenges updating the database'
      });
    }
    
    return res.status(200).json({ 
      success: true,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('Stripe API error:', error.response.data);
    }
    
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Stripe webhook handler - this should be raw data not JSON parsed
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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
      const userId = customer.metadata?.userId;
      
      if (userId) {
        console.log(`Processing customer.created for user ${userId}`);
        
        // Update the stripe_customers record
        const { error: updateError } = await supabase
          .from('stripe_customers')
          .update({
            stripe_customer_id: customer.id,
            needs_stripe_customer: false
          })
          .eq('user_id', userId);
          
        if (updateError) {
          console.error('Error updating customer from webhook:', updateError);
        }
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