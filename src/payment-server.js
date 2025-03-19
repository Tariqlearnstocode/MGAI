import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Configure the payment routes for Express
 * @param {Express} app - The Express app instance
 */
export function configurePaymentRoutes(app) {
  // -------------------------------------------
  // Checkout Session Creation
  // -------------------------------------------
  app.post('/api/payments/create-checkout', async (req, res) => {
    try {
      console.log('Creating checkout session with data:', JSON.stringify(req.body));
      
      const { priceId, productId, projectId, userId } = req.body;

      // Validate required fields
      if (!priceId || !productId || !userId) {
        console.error('Missing required parameters:', { priceId, productId, userId });
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required parameters. Need priceId, productId, and userId.' 
        });
      }

      // Get or create Stripe customer
      const customerData = await getOrCreateCustomer(userId);
      if (!customerData) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create or retrieve customer' 
        });
      }

      // Ensure we have proper URLs for success and cancel
      const successUrl = new URL(`/app/projects/${projectId || 'default'}/documents`, process.env.VITE_APP_URL);
      successUrl.searchParams.append('success', 'true');
      successUrl.searchParams.append('session_id', '{CHECKOUT_SESSION_ID}');
      
      const cancelUrl = new URL(`/app/projects/${projectId || 'default'}/documents`, process.env.VITE_APP_URL);
      cancelUrl.searchParams.append('canceled', 'true');

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
        success_url: successUrl.toString(),
        cancel_url: cancelUrl.toString(),
        metadata: {
          userId,
          productId,
          projectId: projectId || '',
        },
      });

      console.log(`Checkout session created: ${session.id}`);
      return res.status(200).json({ 
        success: true, 
        url: session.url 
      });
    } catch (error) {
      console.error('Error creating checkout session:', error.message);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Internal server error' 
      });
    }
  });

  // -------------------------------------------
  // Webhook Handler
  // -------------------------------------------
  app.post('/api/payments/webhook', async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    try {
      // Verify webhook signature
      if (!webhookSecret) {
        console.warn('⚠️ Webhook secret not configured');
        return res.status(500).json({ 
          success: false, 
          error: 'Webhook secret not configured' 
        });
      }
      
      // Validate the Stripe signature
      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body, 
          signature, 
          webhookSecret
        );
      } catch (err) {
        console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
        return res.status(400).json({ 
          success: false, 
          error: `Webhook Error: ${err.message}` 
        });
      }
      
      // Process the webhook based on event type
      console.log(`Received webhook event: ${event.type}`);
      
      if (event.type === 'checkout.session.completed') {
        await handleCompletedCheckout(event.data.object);
      } else {
        console.log(`Unhandled event type: ${event.type}`);
      }
      
      return res.status(200).json({ success: true, received: true });
    } catch (error) {
      console.error(`Error processing webhook: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Error processing webhook' 
      });
    }
  });

  // -------------------------------------------
  // Apply Agency Pack to Project
  // -------------------------------------------
  app.post('/api/payments/apply-pack', async (req, res) => {
    try {
      const { userId, projectId } = req.body;
      
      if (!userId || !projectId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required parameters' 
        });
      }
      
      const success = await applyAgencyPackToProject(userId, projectId);
      
      return res.status(200).json({ success });
    } catch (error) {
      console.error('Error applying agency pack:', error.message);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Error applying agency pack' 
      });
    }
  });

  // -------------------------------------------
  // Get User Purchases
  // -------------------------------------------
  app.get('/api/payments/purchases/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing user ID' 
        });
      }
      
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      return res.status(200).json({ 
        success: true, 
        purchases: data || [] 
      });
    } catch (error) {
      console.error('Error fetching purchases:', error.message);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Error fetching purchases' 
      });
    }
  });

  console.log('✅ Payment routes configured');
}

/**
 * Get an existing Stripe customer or create a new one
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The customer data or null if failed
 */
async function getOrCreateCustomer(userId) {
  try {
    // Check if user already has a customer record
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching customer:', fetchError.message);
      return null;
    }

    if (existingCustomer) {
      console.log(`Found existing Stripe customer for user ${userId}`);
      return existingCustomer;
    }

    // Try different approaches to get user data
    console.log(`Creating new customer for user ${userId}`);
    
    // First try getting data from the auth.users directly
    let email = null;
    let name = null;
    
    // 1. Try getting from auth table first
    try {
      const { data: authUser } = await supabase
        .from('auth.users')
        .select('email')
        .eq('id', userId)
        .single();
        
      if (authUser) {
        email = authUser.email;
        console.log(`Found user email from auth: ${email}`);
      }
    } catch (err) {
      console.log('Could not get user from auth table, trying profiles');
    }
    
    // 2. Try with profiles table if auth didn't work
    if (!email) {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', userId) // Try with user_id field first (common convention)
          .limit(1);
          
        if (profiles && profiles.length > 0) {
          email = profiles[0].email;
          name = profiles[0].full_name;
          console.log(`Found user data from profiles using user_id: ${email}`);
        }
      } catch (err) {
        console.log('Could not get user from profiles by user_id');
      }
    }
    
    // 3. Last attempt with profiles using id field
    if (!email) {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId) // Try with id field (alternative convention)
          .limit(1);
          
        if (profiles && profiles.length > 0) {
          email = profiles[0].email;
          name = profiles[0].full_name;
          console.log(`Found user data from profiles using id: ${email}`);
        }
      } catch (err) {
        console.log('Could not get user from profiles by id');
      }
    }
    
    // Create customer with whatever data we could find
    const customer = await stripe.customers.create({
      email: email || `user-${userId.substring(0, 8)}@placeholder.com`,
      name: name || 'Customer',
      metadata: {
        userId,
      },
    });

    console.log(`Created new Stripe customer: ${customer.id}`);

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
      console.error('Error creating customer record:', insertError.message);
      return null;
    }

    return newCustomer;
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error.message);
    
    // Last resort fallback - create a customer with minimal info
    try {
      const customer = await stripe.customers.create({
        metadata: { userId }
      });
      
      const { data: newCustomer, error: insertError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: userId,
          stripe_customer_id: customer.id,
          purchase_history: [],
        })
        .select()
        .single();
        
      if (!insertError && newCustomer) {
        console.log('Created emergency fallback customer');
        return newCustomer;
      }
    } catch (fallbackError) {
      console.error('Even fallback customer creation failed:', fallbackError.message);
    }
    
    return null;
  }
}

/**
 * Handle a completed checkout session
 * @param {Object} session - The Stripe checkout session
 */
async function handleCompletedCheckout(session) {
  try {
    console.log(`Processing completed checkout: ${session.id}`);
    
    // Extract metadata
    const { userId, productId, projectId } = session.metadata || {};
    
    // Validate required metadata
    if (!userId || !productId) {
      console.error('Missing required metadata in session:', session.id);
      return;
    }
    
    // Set product-specific values
    let remainingUses = null;
    let usedForProjects = [];
    
    // Handle agency pack
    if (productId === 'agency_pack') {
      remainingUses = 10;
      
      // If projectId is specified, use one pack for this project
      if (projectId) {
        remainingUses = 9;
        usedForProjects = [projectId];
      }
    }
    
    // Handle complete guide
    if ((productId === 'complete_guide' || productId === 'single_plan') && projectId) {
      usedForProjects = [projectId];
    }
    
    // Record the purchase
    const { data, error } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        product_id: productId,
        status: 'active',
        stripe_transaction_id: session.payment_intent,
        stripe_price_id: session.amount_total ? (session.amount_total / 100).toString() : '',
        remaining_uses: remainingUses,
        used_for_projects: usedForProjects.length > 0 ? usedForProjects : null,
      })
      .select();
    
    if (error) {
      console.error('Error recording purchase:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`Purchase recorded successfully: ${data[0].id}`);
    
    // Update purchase history
    await updatePurchaseHistory(userId, {
      product_id: productId,
      purchase_date: new Date().toISOString(),
      amount: session.amount_total ? session.amount_total / 100 : 0,
      transaction_id: session.payment_intent
    });
    
    console.log('Checkout processing completed successfully');
  } catch (error) {
    console.error('Error processing checkout completion:', error.message);
  }
}

/**
 * Update a user's purchase history
 * @param {string} userId - The user ID
 * @param {Object} purchaseInfo - Information about the purchase
 */
async function updatePurchaseHistory(userId, purchaseInfo) {
  try {
    // Get current purchase history
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('purchase_history')
      .eq('user_id', userId)
      .single();
    
    if (customerError) {
      console.error('Error fetching customer record:', customerError.message);
      return;
    }
    
    // Add new purchase to history
    const purchaseHistory = customerData.purchase_history || [];
    purchaseHistory.push(purchaseInfo);
    
    // Update the customer record
    const { error: updateError } = await supabase
      .from('stripe_customers')
      .update({ purchase_history: purchaseHistory })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('Error updating purchase history:', updateError.message);
    } else {
      console.log(`Purchase history updated for user: ${userId}`);
    }
  } catch (error) {
    console.error('Error in updatePurchaseHistory:', error.message);
  }
}

/**
 * Apply an agency pack to a specific project
 * @param {string} userId - The user ID
 * @param {string} projectId - The project ID
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function applyAgencyPackToProject(userId, projectId) {
  try {
    // Find an available agency pack
    const { data: purchases, error: fetchError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', 'agency_pack')
      .eq('status', 'active')
      .gt('remaining_uses', 0);
    
    if (fetchError) {
      console.error('Error fetching agency packs:', fetchError.message);
      return false;
    }
    
    if (!purchases || purchases.length === 0) {
      console.log('No available agency packs found');
      return false;
    }
    
    // Use the first available pack
    const pack = purchases[0];
    
    // Update used projects and remaining uses
    const usedForProjects = pack.used_for_projects || [];
    
    // Check if already used for this project
    if (usedForProjects.includes(projectId)) {
      console.log(`Project ${projectId} already uses an agency pack`);
      return true;
    }
    
    // Update the pack
    usedForProjects.push(projectId);
    const remainingUses = (pack.remaining_uses || 1) - 1;
    
    // Update in database
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        used_for_projects: usedForProjects,
        remaining_uses: remainingUses
      })
      .eq('id', pack.id);
    
    if (updateError) {
      console.error('Error updating agency pack:', updateError.message);
      return false;
    }
    
    console.log(`Agency pack applied to project ${projectId}, ${remainingUses} uses remaining`);
    return true;
  } catch (error) {
    console.error('Error in applyAgencyPackToProject:', error.message);
    return false;
  }
} 