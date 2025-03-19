import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bodyParser from 'body-parser';

// Initialize router
const router = express.Router();

// Configure middleware
router.use(bodyParser.json());

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Credit values for different products
const PRODUCT_CREDIT_VALUES = {
  'complete_guide': 1,   // Complete Guide = 1 credit
  'agency_pack': 10      // Agency Pack/Bundle = 10 credits
};

/**
 * Configure credit system routes for Express
 * @param {Express} app - The Express app instance
 */
export function configureCreditRoutes(app) {
  // Add the credit routes to the app
  app.use('/api/payments', router);
  
  console.log('✅ Credit system routes configured');
}

/**
 * Function to add credits after a successful payment
 * This will be called from the main payment webhook
 */
export async function handleSuccessfulPayment(session) {
  try {
    const { userId, productId } = session.metadata;
    
    if (!userId || !productId) {
      console.error('Missing userId or productId in session metadata');
      return { success: false, error: 'Missing metadata' };
    }
    
    // Get customer ID
    const customerId = session.customer;
    
    // Determine credits to add based on product
    const creditsToAdd = PRODUCT_CREDIT_VALUES[productId] || 0;
    
    if (creditsToAdd > 0) {
      // Fetch current credit balance
      const { data: customer, error: fetchError } = await supabase
        .from('stripe_customers')
        .select('credit_balance')
        .eq('customer_id', customerId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error fetching customer:', fetchError);
        return { success: false, error: fetchError.message };
      }
      
      const currentBalance = customer?.credit_balance || 0;
      const newBalance = currentBalance + creditsToAdd;
      
      // Update credit balance
      const { error: updateError } = await supabase
        .from('stripe_customers')
        .update({ credit_balance: newBalance })
        .eq('customer_id', customerId);
      
      if (updateError) {
        console.error('Error updating credit balance:', updateError);
        return { success: false, error: updateError.message };
      }
      
      console.log(`Added ${creditsToAdd} credits to customer ${customerId}. New balance: ${newBalance}`);
      
      // If the product is 'complete_guide' and has a projectId, unlock that project
      if (productId === 'complete_guide' && session.metadata.projectId) {
        await unlockProject(session.metadata.projectId);
      }
      
      return { success: true, creditBalance: newBalance };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error processing payment for credits:', error);
    return { success: false, error: error.message };
  }
}

// Define our API routes
router.get('/credits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    // Get customer
    const { data: customer, error } = await supabase
      .from('stripe_customers')
      .select('credit_balance, customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching customer:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    if (!customer) {
      return res.json({ creditBalance: 0 });
    }
    
    res.json({ creditBalance: customer.credit_balance || 0, customerId: customer.customer_id });
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Apply a credit to unlock a project
 */
router.post('/apply-credit', async (req, res) => {
  try {
    const { customerId, projectId } = req.body;
    
    if (!customerId || !projectId) {
      return res.status(400).json({ success: false, error: 'Customer ID and Project ID are required' });
    }
    
    // Get customer's credit balance
    const { data: customer, error: fetchError } = await supabase
      .from('stripe_customers')
      .select('credit_balance')
      .eq('customer_id', customerId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      return res.status(500).json({ success: false, error: fetchError.message });
    }
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    const creditBalance = customer.credit_balance || 0;
    
    // Check if customer has enough credits
    if (creditBalance < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient credits', 
        creditBalance 
      });
    }
    
    // Begin transaction to update credit balance and unlock project
    const newBalance = creditBalance - 1;
    
    // Update credit balance
    const { error: updateError } = await supabase
      .from('stripe_customers')
      .update({ credit_balance: newBalance })
      .eq('customer_id', customerId);
    
    if (updateError) {
      console.error('Error updating credit balance:', updateError);
      return res.status(500).json({ success: false, error: updateError.message });
    }
    
    // Unlock the project
    const unlockResult = await unlockProject(projectId);
    
    if (!unlockResult.success) {
      // Revert credit balance change if project update fails
      await supabase
        .from('stripe_customers')
        .update({ credit_balance: creditBalance })
        .eq('customer_id', customerId);
      
      return res.status(500).json({ success: false, error: unlockResult.error });
    }
    
    res.json({ 
      success: true, 
      creditBalance: newBalance, 
      message: 'Project unlocked successfully' 
    });
  } catch (error) {
    console.error('Error applying credit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Check if a project is unlocked
 */
router.get('/access/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }
    
    // Check if project is unlocked
    const { data: project, error } = await supabase
      .from('projects')
      .select('is_unlocked')
      .eq('id', projectId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking project access:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    if (!project) {
      return res.json({ access: false });
    }
    
    res.json({ access: project.is_unlocked || false });
  } catch (error) {
    console.error('Error checking project access:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Helper function to unlock a project
 */
async function unlockProject(projectId) {
  try {
    // Unlock the project
    const { error } = await supabase
      .from('projects')
      .update({ is_unlocked: true })
      .eq('id', projectId);
    
    if (error) {
      console.error('Error unlocking project:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in unlockProject:', error);
    return { success: false, error: error.message };
  }
}
