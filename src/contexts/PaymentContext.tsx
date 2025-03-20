import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { DocumentType, getLatestDocumentTypes } from '@/lib/documents';

// Define simplified interfaces
interface PaymentContextType {
  docTypes: DocumentType[];
  loadingDocTypes: boolean;
  loadingProducts: boolean;
  creditBalance: number;
  loadingCredits: boolean;
  refreshCreditBalance: () => Promise<void>;
  checkDocumentAccess: (documentType: string, projectId: string) => Promise<boolean>;
  getPreviewPercentage: (documentType: string) => number;
  initiateCheckout: (productId: string, projectId: string) => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loadingDocTypes, setLoadingDocTypes] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0); // Initialize with 0 instead of mock value
  const [loadingCredits, setLoadingCredits] = useState(false);
  
  // Load document types
  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  // Fetch credit balance when user changes
  useEffect(() => {
    if (user?.id) {
      fetchCreditBalance();
    }
  }, [user?.id]);

  // Fetch the user's credit balance from the database
  const fetchCreditBalance = async () => {
    if (!user?.id) return;
    
    setLoadingCredits(true);
    try {
      const { data, error } = await supabase
        .from('stripe_customers')
        .select('credit_balance')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching credit balance:', error);
        setCreditBalance(0);
        return;
      }
      
      if (data) {
        setCreditBalance(data.credit_balance || 0);
      } else {
        setCreditBalance(0);
      }
    } catch (error) {
      console.error('Error in fetchCreditBalance:', error);
      setCreditBalance(0);
    } finally {
      setLoadingCredits(false);
    }
  };

  // Function to manually refresh credit balance
  const refreshCreditBalance = async () => {
    return fetchCreditBalance();
  };

  // Fetch document types
  const fetchDocumentTypes = async () => {
    setLoadingDocTypes(true);
    try {
      const documentTypes = await getLatestDocumentTypes();
      setDocTypes(documentTypes);
    } catch (error) {
      console.error('Error fetching document types:', error);
    } finally {
      setLoadingDocTypes(false);
    }
  };
  
  // Check document access - always return false for the paywall
  const checkDocumentAccess = async (documentType: string, projectId: string): Promise<boolean> => {
    return false; // Always return false to show the paywall
  };
  
  // Get the percentage of a document that should be visible in preview mode
  const getPreviewPercentage = (documentType: string): number => {
    // Get document type from loaded document types
    const docType = docTypes.find((dt: DocumentType) => dt.id === documentType);
    
    // Document with order 1 gets 15% preview, all others get 10%
    if (docType) {
      return docType.documentOrder === 1 ? 15 : 10;
    }
    
    // If document type can't be found, default to 0% (no preview) 
    console.warn(`Document type ${documentType} not found, defaulting to 0% preview`);
    return 0;
  };

  // Mock function for initiating checkout
  const initiateCheckout = async (productId: string, projectId: string): Promise<void> => {
    setLoadingProducts(true);
    
    try {
      // Map product IDs to Stripe price IDs
      // These would need to be your actual Stripe price IDs
      const priceMap: Record<string, string> = {
        'complete_guide': 'price_1R2wrwENRbwTo9ZjYZjz1oRS', // Updated Complete Guide price ID
        'agency_pack': 'price_1R4q0AENRbwTo9ZjztVfddMv', // Example ID, replace with actual
      };
      
      const priceId = priceMap[productId];
      
      if (!priceId) {
        throw new Error(`No price found for product: ${productId}`);
      }
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          productId,
          projectId,
          userId: user.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const session = await response.json();
      
      // Redirect to checkout
      window.location.href = session.url;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    } finally {
      setLoadingProducts(false);
    }
  };

  return (
    <PaymentContext.Provider 
      value={{ 
        docTypes, 
        loadingDocTypes, 
        checkDocumentAccess, 
        getPreviewPercentage,
        loadingProducts,
        initiateCheckout,
        creditBalance,
        loadingCredits,
        refreshCreditBalance,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}; 