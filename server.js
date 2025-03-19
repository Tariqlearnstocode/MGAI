import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import OpenAI from 'openai';

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

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

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

// Stripe webhook endpoint (raw body for signature verification)
app.use('/api/webhook/stripe', bodyParser.raw({ type: 'application/json' }));

// Webhook endpoint for Stripe events
app.post('/api/webhook', async (request, response) => {
  const event = request.body;

  // Handle the event
  switch (event.type) {
    case 'checkout.session.async_payment_failed':
      const checkoutSessionAsyncPaymentFailed = event.data.object;
      // Handle the event checkout.session.async_payment_failed
      break;
    case 'checkout.session.async_payment_succeeded':
      const checkoutSessionAsyncPaymentSucceeded = event.data.object;
      // Handle the event checkout.session.async_payment_succeeded
      break;
    case 'checkout.session.completed':
      const checkoutSessionCompleted = event.data.object;
      // Handle the event checkout.session.completed
      break;
    case 'checkout.session.expired':
      const checkoutSessionExpired = event.data.object;
      // Handle the event checkout.session.expired
      break;
    case 'customer.created':
      const customerCreated = event.data.object;
      // Handle the event customer.created
      break;
    case 'customer.deleted':
      const customerDeleted = event.data.object;
      // Handle the event customer.deleted
      break;
    case 'refund.created':
      const refundCreated = event.data.object;
      // Handle the event refund.created
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
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

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, productId, projectId, userId } = req.body;

    if (!priceId || !productId || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get user's Stripe customer ID or create one
    let customerData = await getOrCreateStripeCustomer(userId);
    
    if (!customerData) {
      return res.status(500).json({ error: 'Failed to get or create customer' });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerData.stripe_customer_id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VITE_APP_URL}/app/projects/${projectId}/documents?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL}/app/projects/${projectId}/documents?canceled=true`,
      metadata: {
        userId,
        productId,
        projectId: projectId || '',
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Stripe webhook handler
app.post('/api/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;

  try {
    if (!endpointSecret) {
      console.warn('Webhook secret not found');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle specific events
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// Helper to get or create Stripe customer
async function getOrCreateStripeCustomer(userId) {
  // Check if user already has a customer record
  const { data: existingCustomer, error: fetchError } = await supabase
    .from('stripe_customers')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching customer:', fetchError);
    return null;
  }

  if (existingCustomer) {
    return existingCustomer;
  }

  // Get user details from profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return null;
  }

  // Create new customer in Stripe
  const customer = await stripe.customers.create({
    email: profile.email,
    name: profile.full_name,
    metadata: {
      userId,
    },
  });

  // Save customer to database
  const { data: newCustomer, error: insertError } = await supabase
    .from('stripe_customers')
    .insert({
      user_id: userId,
      stripe_customer_id: customer.id,
      purchase_history: [],
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating customer record:', insertError);
    return null;
  }

  return newCustomer;
}

// Helper function to handle checkout.session.completed event
async function handleCheckoutCompleted(session) {
  const { userId, productId, projectId } = session.metadata || {};
  
  if (!userId || !productId) {
    console.error('Missing required metadata in checkout session');
    return;
  }

  // Default values based on product
  let remainingUses = null;
  let usedForProjects = [];
  
  // For agency pack, set initial values
  if (productId === 'agency_pack') {
    remainingUses = 10;
    
    // If projectId is specified, use one pack for this project
    if (projectId) {
      remainingUses = 9;
      usedForProjects = [projectId];
    }
  }
  
  // For complete_guide, add the specific project
  if (productId === 'complete_guide' && projectId) {
    usedForProjects = [projectId];
  }

  // Record the purchase in the database
  const { error } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      product_id: productId,
      status: 'active',
      stripe_transaction_id: session.payment_intent,
      stripe_price_id: session.amount_total ? (session.amount_total / 100).toString() : '',
      remaining_uses: remainingUses,
      used_for_projects: usedForProjects.length > 0 ? usedForProjects : null,
    });

  if (error) {
    console.error('Error recording purchase:', error);
    throw new Error(`Error recording purchase: ${error.message}`);
  }

  // Update purchase history in the customer record
  const { data: customerData, error: customerError } = await supabase
    .from('stripe_customers')
    .select('purchase_history')
    .eq('user_id', userId)
    .single();

  if (customerError) {
    console.error('Error fetching customer record:', customerError);
    return;
  }

  // Add the new purchase to purchase history
  const purchaseHistory = customerData.purchase_history || [];
  purchaseHistory.push({
    product_id: productId,
    purchase_date: new Date().toISOString(),
    amount: session.amount_total ? session.amount_total / 100 : 0,
    transaction_id: session.payment_intent
  });

  // Update the customer record
  const { error: updateError } = await supabase
    .from('stripe_customers')
    .update({ purchase_history: purchaseHistory })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error updating customer record:', updateError);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 