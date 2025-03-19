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
      throw new Error(errorData.error?.message || 'Failed to create checkout session');
    }

    const data = await response.json();
    
    if (!data.url) {
      throw new Error('Invalid response from checkout endpoint');
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

/**
 * Gets a user's credit balance
 * @param userId The user ID
 * @returns The credit balance and customer ID
 */
export async function getCreditBalance(userId: string): Promise<{creditBalance: number, customerId?: string}> {
  try {
    console.log(`Fetching credit balance for user: ${userId}`);
    const response = await fetch(`/api/payments/credits/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from credits API:', errorData);
      throw new Error(errorData.error || 'Failed to fetch credit balance');
    }

    const data = await response.json();
    console.log('Credit balance API response:', data);
    
    return { 
      creditBalance: data.creditBalance || 0,
      customerId: data.customerId
    };
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    return { creditBalance: 0 };
  }
}

/**
 * Applies a credit to unlock a project
 * @param customerId The customer ID
 * @param projectId The project ID
 * @returns Object indicating success and new credit balance
 */
export async function applyCredit(customerId: string, projectId: string): Promise<{success: boolean, creditBalance?: number, message?: string}> {
  try {
    const response = await fetch('/api/payments/apply-credit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId, projectId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        message: data.message || data.error || 'Failed to apply credit',
        creditBalance: data.creditBalance
      };
    }

    return { 
      success: data.success, 
      creditBalance: data.creditBalance,
      message: data.message
    };
  } catch (error) {
    console.error('Error applying credit:', error);
    return { success: false, message: 'Error applying credit' };
  }
}

/**
 * Checks if a project is unlocked
 * @param projectId The project ID
 * @returns Boolean indicating if project is unlocked
 */
export async function checkProjectAccess(projectId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/payments/access/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check project access');
    }

    const data = await response.json();
    return data.access || false;
  } catch (error) {
    console.error('Error checking project access:', error);
    return false;
  }
}