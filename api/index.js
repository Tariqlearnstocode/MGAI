import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import OpenAI from 'openai';

// Create Express app
const app = express();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Initialize OpenAI with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Stripe webhook endpoint (raw body for signature verification)
app.use('/api/webhook/stripe', bodyParser.raw({ type: 'application/json' }));

// OpenAI completion endpoint
app.post('/api/generate-content', async (req, res) => {
  try {
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
      completionOptions.max_tokens = max_tokens;
    }

    const completion = await openai.chat.completions.create(completionOptions);

    return res.status(200).json({ 
      result: completion.choices[0].message.content,
      usage: completion.usage
    });
  } catch (error) {
    console.error('Error generating content with OpenAI:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

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
      allow_promotion_codes: true,
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

// Handler for checkout.session.completed events
async function handleCheckoutCompleted(session) {
  try {
    // Extract relevant data from the session
    const { userId, productId } = session.metadata;
    const priceId = session.line_items?.data[0]?.price?.id || '';
    
    if (!userId) {
      console.error('Missing userId in checkout session:', session.id);
      return;
    }
    
    console.log(`Processing checkout completion for user ${userId}, product ${productId}, price ${priceId}`);
    
    // Set credits based on price ID
    let creditsToAdd = 0;
    
    // Map of price IDs to credits
    const priceIdMap = {
      'price_1R5DUrCzMzSr3Qh4lVAm3SMv': 1,  // Complete Guide price ID
      'price_1R5DUoCzMzSr3Qh4N1Pqqcnd': 10, // Agency Pack/Bundle price ID
    };
    
    // Check if we have a direct match in our price map
    if (priceIdMap[priceId]) {
      creditsToAdd = priceIdMap[priceId];
      console.log(`Matched price ID ${priceId}, adding ${creditsToAdd} credits`);
    } 
    // Fallback to string matching (keeping for backward compatibility)
    else if (priceId.includes('complete') && !priceId.includes('bundle')) {
      creditsToAdd = 1; // Complete Guide
      console.log(`Complete Guide detected from price ID (${priceId}), adding 1 credit`);
    } else if (priceId.includes('agency') || priceId.includes('bundle')) {
      creditsToAdd = 10; // Bundle
      console.log(`Agency Pack/Bundle detected from price ID (${priceId}), adding 10 credits`);
    } else {
      console.log(`Non-credit product purchased (${priceId}), no credits added`);
      return;
    }
    
    if (creditsToAdd > 0) {
      // Get the current user record
      const { data: customer, error: fetchError } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching customer record:', fetchError);
        return;
      }
      
      // Update the purchase_history to include credits
      let purchaseHistory = customer.purchase_history || [];
      
      // Add the new purchase with credit information
      purchaseHistory.push({
        id: session.id,
        date: new Date().toISOString(),
        amount: session.amount_total,
        currency: session.currency,
        product: productId,
        price: priceId,
        credits_added: creditsToAdd,
        status: 'completed'
      });
      
      // Calculate total credits purchased (lifetime total)
      let totalCreditsPurchased = (customer.credits_purchased || 0) + creditsToAdd;
      
      // Update the credits_purchased column
      const { error: updateError } = await supabase
        .from('stripe_customers')
        .update({
          purchase_history: purchaseHistory,
          credits_purchased: totalCreditsPurchased
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error updating customer credits:', updateError);
      } else {
        console.log(`Successfully updated credits purchased for user ${userId}: ${totalCreditsPurchased} total credits purchased`);
      }
    }
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
  }
}

// Export the Express API
export default app; 