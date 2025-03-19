/**
 * Add this route to your server.js file
 * This endpoint will scan for users without Stripe customer IDs,
 * retrieve their Stripe customers, and update the database
 */

// Add the following API endpoint to your server.js file
app.post('/api/admin/fix-stripe-customers', async (req, res) => {
  try {
    // Check for admin API key
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    console.log('Starting Stripe customer fix operation');
    
    // Find all stripe_customers records that need customer IDs
    const { data: customersToFix, error: fetchError } = await supabase
      .from('stripe_customers')
      .select('user_id, needs_stripe_customer, stripe_customer_id')
      .or('stripe_customer_id.is.null,needs_stripe_customer.eq.true')
      .limit(100);
      
    if (fetchError) {
      console.error('Error fetching customers to fix:', fetchError);
      return res.status(500).json({ error: 'Database error fetching customers' });
    }
    
    console.log(`Found ${customersToFix.length} customers to fix`);
    
    // Get user emails for these records
    const userIds = customersToFix.map(c => c.user_id);
    
    // Try to get user emails from auth.users directly using service role
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return res.status(500).json({ error: 'Error fetching auth users' });
    }
    
    // Map users to their emails
    const userEmailMap = {};
    authUsers.users.forEach(user => {
      userEmailMap[user.id] = user.email;
    });
    
    // Results storage
    const results = {
      total: customersToFix.length,
      processed: 0,
      success: 0,
      failed: 0,
      details: []
    };
    
    // Process each customer
    for (const customer of customersToFix) {
      try {
        const userId = customer.user_id;
        const email = userEmailMap[userId];
        
        if (!email) {
          console.warn(`No email found for user ${userId}`);
          results.details.push({
            userId,
            status: 'failed',
            error: 'No email found for user'
          });
          results.failed++;
          continue;
        }
        
        console.log(`Processing user ${userId} with email ${email}`);
        
        // Check if customer already exists in Stripe
        const stripeCustomers = await stripe.customers.list({
          email,
          limit: 1
        });
        
        let stripeCustomerId;
        
        if (stripeCustomers.data.length > 0) {
          // Use existing customer
          stripeCustomerId = stripeCustomers.data[0].id;
          console.log(`Found existing Stripe customer: ${stripeCustomerId} for email ${email}`);
        } else {
          // Create new customer
          const newCustomer = await stripe.customers.create({
            email,
            metadata: {
              userId
            }
          });
          stripeCustomerId = newCustomer.id;
          console.log(`Created new Stripe customer: ${stripeCustomerId} for email ${email}`);
        }
        
        // Update the database
        const { error: updateError } = await supabase
          .from('stripe_customers')
          .update({
            stripe_customer_id: stripeCustomerId,
            needs_stripe_customer: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (updateError) {
          console.error(`Error updating stripe_customer for user ${userId}:`, updateError);
          results.details.push({
            userId,
            email,
            status: 'failed',
            error: updateError.message
          });
          results.failed++;
        } else {
          console.log(`Successfully updated user ${userId} with customer ID ${stripeCustomerId}`);
          results.details.push({
            userId,
            email,
            status: 'success',
            stripeCustomerId
          });
          results.success++;
        }
      } catch (err) {
        console.error(`Error processing user ${customer.user_id}:`, err);
        results.details.push({
          userId: customer.user_id,
          status: 'failed',
          error: err.message
        });
        results.failed++;
      }
      
      results.processed++;
    }
    
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error in fix-stripe-customers endpoint:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}); 