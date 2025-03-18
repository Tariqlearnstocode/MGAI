// Vercel Serverless Function for Stripe Webhooks
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Initialize Supabase client
const supabase = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY 
  ? createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
  : null;

// Disable body parsing - need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function stripeWebhook(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(400).json({ error: 'Missing signature or webhook secret' });
    }

    // Verify the event is from Stripe
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    console.log(`Webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

// Helper function to handle checkout.session.completed event
async function handleCheckoutCompleted(session) {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return;
  }

  try {
    // Extract userId from session metadata
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error('No userId found in session metadata');
      return;
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    // Update user subscription in database
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

    if (error) {
      console.error('Error updating subscription in database:', error);
    } else {
      console.log(`Subscription updated for user: ${userId}`);
    }

    // Update user profile to track subscription status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: subscription.status,
        subscription_tier: getPlanFromPriceId(subscription.items.data[0].price.id),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile with subscription info:', profileError);
    }
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
  }
}

// Helper function to handle subscription changes
async function handleSubscriptionChange(subscription) {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return;
  }

  try {
    // Get the customer to find the associated user
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata?.userId;
    
    if (!userId) {
      // Try to find user by customer ID
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', subscription.customer)
        .single();
      
      if (userError || !userData) {
        console.error('Could not find user for customer:', subscription.customer);
        return;
      }
      
      userId = userData.id;
    }

    // Update subscription in database
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

    if (error) {
      console.error('Error updating subscription in database:', error);
    } else {
      console.log(`Subscription updated for user: ${userId}`);
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: subscription.status,
        subscription_tier: getPlanFromPriceId(subscription.items.data[0].price.id),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile with subscription info:', profileError);
    }
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

// Helper function to map price ID to plan name
function getPlanFromPriceId(priceId) {
  // Update these mappings based on your actual Stripe price IDs
  const priceToPlan = {
    'price_1R2wlkENRbwTo9Zjay4TcK5M': 'basic',
    'price_1R2wlkENRbwTo9ZjoCpZBx9c': 'pro',
    'price_1R2wlkENRbwTo9ZjmAE7ILCX': 'enterprise'
  };
  
  return priceToPlan[priceId] || 'basic';
}

export default stripeWebhook;
