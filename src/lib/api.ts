import { supabase } from './supabase';

// Types
export interface CheckoutParams {
  priceId: string;
  productId: string;
  projectId?: string;
  userId: string;
}

/**
 * Initiates a checkout session with Stripe
 */
export async function initiateCheckout(params: CheckoutParams): Promise<{ url: string }> {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    return await response.json();
  } catch (error) {
    console.error('Error initiating checkout:', error);
    throw error;
  }
}

/**
 * Gets a user's active purchases from Supabase
 */
export async function getUserPurchases(userId?: string) {
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');
      
    if (error) {
      console.error('Error fetching purchases:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting user purchases:', error);
    return [];
  }
}

/**
 * Applies an agency pack to a project
 */
export async function applyAgencyPackToProject(userId: string, projectId: string): Promise<boolean> {
  try {
    // Get active purchases for this user
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', 'agency_pack')
      .eq('status', 'active')
      .gt('remaining_uses', 0);
      
    if (error) {
      console.error('Error fetching agency packs:', error);
      return false;
    }
    
    // Check if there's an available agency pack
    if (!purchases || purchases.length === 0) {
      console.error('No active agency packs available');
      return false;
    }
    
    // Use the first available agency pack
    const pack = purchases[0];
    
    // Check if this project already used a pack
    const usedFor = pack.used_for_projects || [];
    if (usedFor.includes(projectId)) {
      // Already applied to this project
      return true;
    }
    
    // Update the pack
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        remaining_uses: pack.remaining_uses - 1,
        used_for_projects: [...usedFor, projectId]
      })
      .eq('id', pack.id);
      
    if (updateError) {
      console.error('Error updating agency pack:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error applying agency pack:', error);
    return false;
  }
} 