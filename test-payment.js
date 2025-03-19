import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Test function to simulate handling a checkout completion
async function testPaymentFlow(userId, productId, projectId) {
  console.log('=== Testing Payment Flow ===');
  console.log(`User ID: ${userId}`);
  console.log(`Product ID: ${productId}`);
  console.log(`Project ID: ${projectId || 'None'}`);
  
  try {
    // Test 1: Check if user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error: User not found', userError);
      return;
    }
    
    console.log('✓ User found:', user.email);
    
    // Test 2: Check if project exists (if projectId provided)
    if (projectId) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (projectError) {
        console.error('Error: Project not found', projectError);
        return;
      }
      
      console.log('✓ Project found:', project.name);
    }
    
    // Test 3: Simulate creating a purchase record
    console.log('Simulating purchase record creation...');
    
    // Default values based on product
    let remainingUses = null;
    let usedForProjects = [];
    
    if (productId === 'agency_pack') {
      remainingUses = 10;
      if (projectId) {
        remainingUses = 9;
        usedForProjects = [projectId];
      }
    }
    
    if ((productId === 'complete_guide' || productId === 'single_plan') && projectId) {
      usedForProjects = [projectId];
    }
    
    // Create a test purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        product_id: productId,
        status: 'active',
        stripe_transaction_id: 'test_' + Date.now(),
        stripe_price_id: 'test_price',
        remaining_uses: remainingUses,
        used_for_projects: usedForProjects.length > 0 ? usedForProjects : null,
      })
      .select();
      
    if (purchaseError) {
      console.error('Error creating test purchase:', purchaseError);
      return;
    }
    
    console.log('✓ Test purchase created:', purchase);
    
    // Test 4: Check if document access works
    if (projectId) {
      console.log('Checking document access for the project...');
      
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId);
        
      if (docsError) {
        console.error('Error fetching project documents:', docsError);
        return;
      }
      
      if (docs && docs.length > 0) {
        console.log(`✓ Project has ${docs.length} documents`);
        console.log('Based on purchase type, user should have access to:');
        
        if (productId === 'single_plan') {
          console.log('- Only the first document (marketing plan)');
        } else if (productId === 'complete_guide' || productId === 'agency_pack') {
          console.log('- All documents in the project');
        }
      } else {
        console.log('No documents found for this project');
      }
    }
    
    console.log('\nTest completed successfully!');
    console.log('\nCleanup: Delete the test purchase? (Run this SQL in Supabase SQL Editor)');
    console.log(`DELETE FROM purchases WHERE stripe_transaction_id = '${purchase[0].stripe_transaction_id}';`);
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const userId = args[0];
const productId = args[1];
const projectId = args[2];

if (!userId || !productId) {
  console.log('Usage: node test-payment.js <userId> <productId> [projectId]');
  console.log('Example: node test-payment.js 123e4567-e89b-12d3-a456-426614174000 complete_guide 123e4567-e89b-12d3-a456-426614174001');
  process.exit(1);
}

// Run the test
testPaymentFlow(userId, productId, projectId); 