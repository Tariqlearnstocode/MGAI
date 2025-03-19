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
      console.log('Checkout request received:', req.body);
      
      // Validate required data
      const { priceId, productId, userId } = req.body;
      
      if (!priceId || !productId || !userId) {
        return res.status(400).json({
          error: {
            message: 'Missing required fields: priceId, productId, userId are all required',
          },
        });
      }
      
      // Get or create customer
      const customer = await getOrCreateCustomer(userId);
      
      if (!customer || !customer.stripe_customer_id) {
        console.error('Failed to create or retrieve Stripe customer for user:', userId);
        return res.status(500).json({
          error: {
            message: 'Could not create Stripe customer',
          },
        });
      }
      
      // Generate URLs based on environment
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://marketing-guide-ai.com' 
        : 'http://localhost:3000';
        
      const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/pricing`;
      
      // Create the checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: customer.stripe_customer_id,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          productId,
        },
      });
      
      console.log(`Created checkout session: ${session.id} for user ${userId}`);
      
      // Update the customer's status in the database
      try {
        const { error: updateError } = await supabase
          .from('stripe_customers')
          .update({
            last_checkout_session: session.id,
            last_checkout_time: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (updateError) {
          // Log but don't fail checkout if this update fails
          console.error('Error updating customer with session info:', updateError.message);
        }
      } catch (dbError) {
        console.error('Database error while updating session info:', dbError.message);
        // Continue - don't fail checkout over this
      }
      
      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error('Checkout session creation error:', error.message);
      return res.status(500).json({
        error: {
          message: 'Failed to create checkout session',
          details: error.message
        },
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
    // Check if user already has a customer record with a valid Stripe customer ID
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching customer:', fetchError.message);
      return null;
    }

    // If we found a record with a valid stripe_customer_id, return it
    if (existingCustomer && existingCustomer.stripe_customer_id) {
      console.log(`Found existing Stripe customer ${existingCustomer.stripe_customer_id} for user ${userId}`);
      return existingCustomer;
    }
    
    console.log(`No valid Stripe customer found for user ${userId}, creating one...`);
    
    // Try different methods to get the user's email
    let email = null;
    let name = null;
    
    // Method 1: Try admin API (may not work in all environments)
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (!userError && userData && userData.user) {
        email = userData.user.email;
        name = userData.user.user_metadata?.full_name || email.split('@')[0];
        console.log(`Got user data from admin API: ${email}`);
      } else {
        console.log('Admin API failed or returned no data, trying alternative methods');
      }
    } catch (adminError) {
      console.log('Admin API not available in this environment:', adminError.message);
    }
    
    // Method 2: Try fetching from profiles table if admin API failed
    if (!email) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', userId)
          .single();
          
        if (!profileError && profileData) {
          email = profileData.email;
          name = profileData.full_name || email.split('@')[0];
          console.log(`Got user data from profiles: ${email}`);
        }
      } catch (profileError) {
        console.log('Could not get user from profiles:', profileError.message);
      }
    }
    
    // Method 3: Create with minimal info if we couldn't get the email
    if (!email) {
      // Generate a placeholder email using the userId
      email = `user-${userId.substring(0, 8)}@example.com`;
      name = `User ${userId.substring(0, 6)}`;
      console.log(`Using placeholder email ${email} as we couldn't get user data`);
    }
    
    // Create the Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId }
    });
    
    console.log(`Created new Stripe customer: ${customer.id} for user ${userId}`);
    
    // Update the existing stripe_customers record or create a new one
    let updatedCustomer;
    
    if (existingCustomer) {
      // Update existing record
      const { data, error: updateError } = await supabase
        .from('stripe_customers')
        .update({
          stripe_customer_id: customer.id,
          needs_stripe_customer: false
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating customer record:', updateError.message);
        throw updateError;
      }
      
      updatedCustomer = data;
    } else {
      // Create new record
      const { data, error: insertError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: userId,
          stripe_customer_id: customer.id,
          purchase_history: []
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating customer record:', insertError.message);
        throw insertError;
      }
      
      updatedCustomer = data;
    }
    
    return updatedCustomer;
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error.message);
    
    // Last resort - return a minimal object with just the stripe customer ID
    // This allows checkout to proceed even if database updates fail
    try {
      // Create a minimal Stripe customer without DB updates
      const customer = await stripe.customers.create({
        email: `emergency-${userId.substring(0, 8)}@example.com`,
        name: 'Emergency User',
        metadata: { userId }
      });
      
      console.log(`Created emergency fallback customer: ${customer.id}`);
      
      return {
        user_id: userId,
        stripe_customer_id: customer.id
      };
    } catch (finalError) {
      console.error('Complete failure in customer creation:', finalError);
      return null;
    }
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