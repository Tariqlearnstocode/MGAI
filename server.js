import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import OpenAI from 'openai';
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

// Use express.json for ALL routes EXCEPT the webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe-webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Use raw body parser ONLY for the webhook route
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
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
              // if you need to update additional columns
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
    
    // For checkout.session.completed events, update credits if it's a Complete Guide or Bundle purchase
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const productId = session.metadata?.productId;
      
      // Access the line items directly from the event
      // Note: For webhook events, we need to retrieve line items separately
      const priceId = session.line_items?.data?.[0]?.price?.id || '';

      // If line_items is not available in the webhook payload, use the priceId from metadata
      const effectivePriceId = priceId || session.metadata?.priceId || '';
      
      console.log(`Processing checkout.session.completed for user ${userId}, product ${productId}, price ID: ${effectivePriceId}`);
      
      if (userId) {
        // Set credits based on the price ID
        let creditsToAdd = 0;
        
        // Map of price IDs to credits - add your actual price IDs here
        const priceIdMap = {
          'price_1R4q0AENRbwTo9ZjztVfddMv': 1,  // Complete Guide price ID
          'price_1R2wrwENRbwTo9ZjYZjz1oRS': 10, // Agency Pack/Bundle price ID
          // Add any other price IDs here
        };
        
        // Fallback to product name check if priceId matching fails
        if (priceIdMap[effectivePriceId]) {
          creditsToAdd = priceIdMap[effectivePriceId];
          console.log(`Matched price ID ${effectivePriceId}, adding ${creditsToAdd} credits`);
        } else if (productId) {
          // Fallback to the product name check (keeping your existing logic as backup)
          if (productId.toLowerCase().includes('complete') && !productId.toLowerCase().includes('agency') && !productId.toLowerCase().includes('bundle')) {
            creditsToAdd = 1; // Complete Guide = 1 credit
            console.log(`Complete Guide detected from product name, adding 1 credit for user ${userId}`);
          } else if (productId.toLowerCase().includes('agency') || productId.toLowerCase().includes('bundle')) {
            creditsToAdd = 10; // Agency Pack/Bundle = 10 credits
            console.log(`Agency Pack detected from product name, adding 10 credits for user ${userId}`);
          }
        }
        
        if (creditsToAdd > 0) {
          // Get current customer record
          const { data: customer, error: fetchError } = await supabase
            .from('stripe_customers')
            .select('*')
            .eq('user_id', userId)
            .single();
            
          if (fetchError) {
            console.error('Error fetching customer record:', fetchError);
          } else {
            // Calculate new credits_purchased value
            const currentCredits = customer.credits_purchased || 0;
            const totalCredits = currentCredits + creditsToAdd;
            
            // Update the purchase_history
            let purchaseHistory = customer.purchase_history || [];
            purchaseHistory.push({
              id: session.id,
              date: new Date().toISOString(),
              amount: session.amount_total,
              currency: session.currency,
              product: productId,
              price_id: effectivePriceId,
              credits_added: creditsToAdd,
              status: 'completed'
            });
            
            // Update the customer record
            const { error: updateError } = await supabase
              .from('stripe_customers')
              .update({
                purchase_history: purchaseHistory,
                credits_purchased: totalCredits
              })
              .eq('user_id', userId);
              
            if (updateError) {
              console.error('Error updating credits for customer:', updateError);
            } else {
              console.log(`Successfully updated credits for user ${userId}: added ${creditsToAdd}, total ${totalCredits}`);
            }
          }
        } else {
          console.log(`No credits to add for this purchase (product: ${productId}, price: ${effectivePriceId})`);
        }
      } else {
        console.warn(`Missing userId in checkout session metadata`);
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

// REMOVED: Configure payment routes
// REMOVED: configureCreditRoutes(app);

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

// Create checkout session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, productId, projectId, userId } = req.body;

    if (!priceId || !productId || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get Stripe customer ID for the user
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (customerError || !customerData?.stripe_customer_id) {
      console.error('Error fetching Stripe customer:', customerError);
      return res.status(500).json({ error: 'Failed to retrieve customer data' });
    }

    // Create Stripe checkout session
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