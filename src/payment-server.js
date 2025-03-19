import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import express from 'express';
import { handleSuccessfulPayment } from './credit-payment-server.js';

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
      const { priceId, productId, userId, returnUrl, projectId } = req.body;
      
      if (!priceId || !productId || !userId) {
        return res.status(400).json({
          error: 'Missing required fields: priceId, productId, userId'
        });
      }
      
      // Get the customer directly from the database
      const { data: customer, error: customerError } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();
      
      // If there's an error or no customer found, return an error
      if (customerError || !customer || !customer.stripe_customer_id) {
        console.error('Failed to retrieve Stripe customer for user:', userId);
        return res.status(500).json({
          error: 'Could not find Stripe customer'
        });
      }
      
      // Use the environment app URL
      const baseUrl = process.env.VITE_APP_URL || 'https://marketing-guide-ai.com';
      
      // Build redirect URLs
      const documentPath = projectId ? `/app/projects/${projectId}/documents` : '';
      const success_url = `${baseUrl}${documentPath}?success=true&session_id={CHECKOUT_SESSION_ID}`;
      const cancel_url = returnUrl || `${baseUrl}${documentPath}`;
      
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
        success_url,
        cancel_url,
        metadata: {
          userId,
          productId,
          projectId
        },
      });
      
      console.log(`Created checkout session: ${session.id}`);
      
      // Return the session details
      return res.json({ 
        sessionId: session.id, 
        url: session.url 
      });
    } catch (error) {
      console.error('Checkout error:', error.message);
      return res.status(500).json({
        error: error.message || 'Failed to create checkout session'
      });
    }
  });

  // -------------------------------------------
  // Webhook Handler
  // -------------------------------------------
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
      
      // Log event type for debugging
      console.log('Webhook event type:', event.type);
      console.log('Event ID:', event.id);
      
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
        // Continue processing despite storage error
      }
      
      // Process different event types
      if (event.type === 'checkout.session.completed') {
        console.log('Processing checkout.session.completed event');
        const session = event.data.object;
        console.log('Checkout session metadata:', session.metadata);
        await handleCompletedCheckout(session);
      } else if (event.type === 'customer.created') {
        const customer = event.data.object;
        const customerId = customer.id;
        const userId = customer.metadata?.userId;
      
        console.log(`Processing customer.created for user ${userId} with Stripe customer ID: ${customerId}`);
      
        if (userId && customerId) {
          const { error } = await supabase
            .from('stripe_customers')
            .update({
              stripe_customer_id: customerId,
            })
            .eq('user_id', userId);
        
          if (error) {
            console.error('Error updating stripe_customers:', error);
          } else {
            console.log(`Successfully stored Stripe customer ID ${customerId} for user ${userId}`);
          }
        }
      } else {
        console.log(`Unhandled event type: ${event.type}`);
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
 * Handle a completed checkout session
 * @param {Object} session - The Stripe checkout session
 */
async function handleCompletedCheckout(session) {
  try {
    console.log(`Processing completed checkout session: ${session.id}`);
    console.log(`Payment status: ${session.payment_status}`);
    console.log(`Customer: ${session.customer}`);
    
    // Extract metadata
    const { userId, productId, projectId } = session.metadata || {};
    
    console.log(`Purchase metadata: userId=${userId}, productId=${productId}, projectId=${projectId}`);
    
    // Validate required metadata
    if (!userId || !productId) {
      console.error('Missing required metadata in session:', session.id);
      return;
    }
    
    // First update credit balance (for complete_guide and agency_pack)
    const creditResult = await handleSuccessfulPayment(session);
    if (!creditResult.success) {
      console.error('Error updating credit balance:', creditResult.error);
      // Continue with purchase processing despite credit error
    } else if (creditResult.creditBalance !== undefined) {
      console.log(`Updated credit balance to ${creditResult.creditBalance}`);
    }
    
    // Set product-specific values
    let remainingUses = null;
    let usedForProjects = [];
    
    // Handle different product types
    switch(productId) {
      case 'agency_pack':
        console.log('Processing agency pack purchase');
        remainingUses = 10;
        
        // If projectId is specified, use one pack for this project
        if (projectId) {
          remainingUses = 9;
          usedForProjects = [projectId];
          console.log(`Agency pack applied to project ${projectId}, 9 uses remaining`);
        }
        break;
        
      case 'complete_guide':
        console.log('Processing complete guide purchase');
        if (projectId) {
          usedForProjects = [projectId];
          console.log(`Complete guide applied to project ${projectId}`);
        }
        break;
        
      case 'single_plan':
        console.log('Processing single plan purchase');
        if (projectId) {
          usedForProjects = [projectId];
          console.log(`Single plan applied to project ${projectId}`);
        }
        break;
        
      default:
        console.log(`Unknown product type: ${productId}`);
    }
    
    // Ensure we have the transaction ID
    const transactionId = session.payment_intent || session.id;
    console.log(`Transaction ID: ${transactionId}`);
    
    // Check if this purchase already exists
    const { data: existingPurchase, error: checkError } = await supabase
      .from('purchases')
      .select('id')
      .eq('stripe_transaction_id', transactionId)
      .limit(1);
      
    if (!checkError && existingPurchase && existingPurchase.length > 0) {
      console.log(`Purchase already recorded with ID: ${existingPurchase[0].id}`);
      return;
    }
    
    // Record the purchase
    const { data, error } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        product_id: productId,
        status: 'active',
        stripe_transaction_id: transactionId,
        purchase_date: new Date().toISOString(),
        stripe_price_id: session.amount_total ? (session.amount_total / 100).toString() : '',
        remaining_uses: remainingUses,
        used_for_projects: usedForProjects.length > 0 ? usedForProjects : null,
      })
      .select();
    
    if (error) {
      console.error('Error recording purchase:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`Purchase recorded successfully in purchases table: ${data[0].id}`);
    
    // Update purchase history in stripe_customers table
    await updatePurchaseHistory(userId, {
      product_id: productId,
      purchase_date: new Date().toISOString(),
      amount: session.amount_total ? session.amount_total / 100 : 0,
      transaction_id: transactionId
    });
    
    console.log('Checkout processing completed successfully');
  } catch (error) {
    console.error('Error processing checkout completion:', error);
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