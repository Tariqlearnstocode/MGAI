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
    const response = await fetch('/api/payments/create-checkout', {
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

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    return { url: data.url };
  } catch (error) {
    console.error('Error initiating checkout:', error);
    throw error;
  }
}

/**
 * Gets a user's purchases
 * @param userId The user ID
 * @returns Array of purchase objects
 */
export async function getUserPurchases(userId: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/payments/purchases/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch purchases');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch purchases');
    }

    return data.purchases || [];
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return [];
  }
}

/**
 * Applies an agency pack to a specific project
 * @param userId The user ID
 * @param projectId The project ID
 * @returns Boolean indicating success
 */
export async function applyAgencyPackToProject(userId: string, projectId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/payments/apply-pack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, projectId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to apply agency pack');
    }

    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error('Error applying agency pack:', error);
    return false;
  }
} 