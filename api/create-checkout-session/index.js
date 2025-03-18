// Vercel Serverless Function for Stripe Checkout
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import cors from 'micro-cors';

// Setup CORS middleware
const corsMiddleware = cors({
  allowMethods: ['POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Initialize Supabase client
const supabase = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY 
  ? createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
  : null;

async function createCheckoutSession(req, res) {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, priceId, successUrl, cancelUrl } = req.body;

    // Validate required parameters
    if (!userId || !priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Please provide userId, priceId, successUrl, and cancelUrl.' 
      });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(userId);
    if (!customerId) {
      return res.status(500).json({ error: 'Failed to create or retrieve Stripe customer' });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId
      }
    });

    // Return session ID to client
    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create checkout session'
    });
  }
}

// Helper function to get or create a Stripe customer
async function getOrCreateStripeCustomer(userId) {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Check if user already has a Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error(`Error fetching user data: ${userError.message}`);
    }

    // If customer ID exists, return it
    if (userData && userData.stripe_customer_id) {
      return userData.stripe_customer_id;
    }

    // If not, create a new customer
    const { data: userDetails } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: userDetails?.email || `user-${userId}@example.com`,
      name: userDetails?.full_name || `User ${userId}`,
      metadata: {
        userId: userId
      }
    });

    // Save Stripe customer ID to database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user with Stripe customer ID:', updateError);
    }

    return customer.id;
  } catch (error) {
    console.error('Error in getOrCreateStripeCustomer:', error);
    return null;
  }
}

// Apply CORS middleware to the handler
export default corsMiddleware(createCheckoutSession);
