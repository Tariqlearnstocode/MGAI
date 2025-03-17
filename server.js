import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Stripe webhook endpoint (raw body for signature verification)
app.use('/api/webhook/stripe', bodyParser.raw({ type: 'application/json' }));

// Serve Vite app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
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