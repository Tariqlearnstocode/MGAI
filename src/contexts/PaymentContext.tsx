import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { 
  initiateCheckout as apiInitiateCheckout, 
  getUserPurchases, 
  applyAgencyPackToProject as apiApplyPack,
  getCreditBalance,
  applyCredit
} from '@/lib/api';
import { DocumentType, getLatestDocumentTypes } from '@/lib/documents';

// Define the Purchase type to match our database schema
export interface Purchase {
  id: string;
  user_id: string;
  product_id: 'single_plan' | 'complete_guide' | 'agency_pack';
  status: 'active' | 'cancelled';
  purchase_date: string;
  expires_at?: string;
  remaining_uses?: number;
  used_for_projects?: string[];
  stripe_transaction_id: string;
  stripe_price_id: string;
}

// Define available products and their details
export interface Product {
  id: 'single_plan' | 'complete_guide' | 'agency_pack';
  name: string;
  price: number;
  description: string;
  features: string[];
  stripe_price_id: string;
}

interface PaymentContextType {
  purchases: Purchase[];
  loadingPurchases: boolean;
  products: Product[];
  loadingProducts: boolean;
  docTypes: DocumentType[];
  loadingDocTypes: boolean;
  creditBalance: number;
  customerId: string | null;
  loadingCreditBalance: boolean;
  checkDocumentAccess: (documentType: string, projectId: string) => boolean;
  getPreviewPercentage: (documentType: string) => number;
  initiateCheckout: (productId: string, projectId?: string) => Promise<void>;
  applyAgencyPackToProject: (projectId: string) => Promise<boolean>;
  refreshPurchases: () => Promise<void>;
  applyCreditToProject: (projectId: string) => Promise<{success: boolean; message?: string}>;
  refreshCreditBalance: () => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loadingDocTypes, setLoadingDocTypes] = useState(true);

  // Load user's purchases and document types
  useEffect(() => {
    if (user) {
      fetchPurchases();
      fetchProducts();
      fetchDocumentTypes();
    } else {
      setPurchases([]);
      setLoadingPurchases(false);
    }
  }, [user]);

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

  // Fetch user's purchases from the database
  const fetchPurchases = async () => {
    if (!user) return;
    
    setLoadingPurchases(true);
    try {
      const data = await getUserPurchases(user.id);
      setPurchases(data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoadingPurchases(false);
    }
  };
  
  // Fetch available products
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');
        
      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };
  
  // Check if user has access to a specific document in a project
  // State to track unlocked projects
  const [unlockedProjects, setUnlockedProjects] = useState<Record<string, boolean>>({});

  // Check if projects are unlocked in the database when the component loads
  useEffect(() => {
    if (!user) return;

    const checkProjectsUnlocked = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, is_unlocked')
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error checking projects unlock status:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const unlocked = data.reduce((acc: Record<string, boolean>, project) => {
            acc[project.id] = project.is_unlocked;
            return acc;
          }, {});
          
          setUnlockedProjects(unlocked);
        }
      } catch (err) {
        console.error('Error checking if projects are unlocked:', err);
      }
    };

    checkProjectsUnlocked();
  }, [user]);

  const checkDocumentAccess = (documentType: string, projectId: string): boolean => {
    if (!user || loadingPurchases) return false;
    
    // Case 0: Check if project is unlocked via credits in the database
    if (unlockedProjects[projectId]) {
      console.log(`Project ${projectId} is unlocked via credits`);
      return true;
    }
    
    // Check for any completed purchase records
    if (purchases.length === 0) return false;
    
    // Case 1: User has an active 'complete_guide' purchase for this project
    const hasCompleteGuide = purchases.some((purchase: Purchase) => 
      purchase.product_id === 'complete_guide' && 
      purchase.status === 'active' &&
      (purchase.used_for_projects?.includes(projectId) || !purchase.used_for_projects)
    );
    
    if (hasCompleteGuide) return true;
    
    // Case 2: User has an active 'single_plan' purchase for this specific document
    const hasSinglePlan = purchases.some((purchase: Purchase) => 
      purchase.product_id === 'single_plan' && 
      purchase.status === 'active' &&
      purchase.used_for_projects?.includes(projectId)
    );
    
    if (hasSinglePlan) return true;
    
    // Case 3: User has an agency pack that has been applied to this project
    const hasAgencyPack = purchases.some((purchase: Purchase) => 
      purchase.product_id === 'agency_pack' && 
      purchase.status === 'active' &&
      purchase.used_for_projects?.includes(projectId)
    );
    
    if (hasAgencyPack) return true;
    
    // No valid purchase found
    return false;
  };
  
  // Get the percentage of a document that should be visible in preview mode
  const getPreviewPercentage = (documentType: string): number => {
    // Get document type from loaded document types
    const docType = docTypes.find((dt: DocumentType) => dt.id === documentType);
    
    // Document with order 1 gets 10% preview, all others get 30%
    // This is where we can change the preview percentage for each document. 
    // x ? y: z = x is document_order, y is preview percentage for x. z is default preview percentage for all other docuements.
    // Currently docuemnt 1 is set to 10% preview and all other documents are set to 0% preview.
    if (docType) {
      return docType.documentOrder === 1 ? 15 : 10;
    }
    
    // If document type can't be found, default to 0% (no preview) 
    console.warn(`Document type ${documentType} not found, defaulting to 0% preview`);
    return 0;
  };
  
  // Initialize a Stripe checkout session
  const initiateCheckout = async (productId: string, projectId?: string) => {
    if (!user) throw new Error('User must be logged in to checkout');
    
    try {
      // Get the product to find its Stripe price ID
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Invalid product');
      
      // Create a checkout session using our API
      const { url } = await apiInitiateCheckout({
        priceId: product.stripe_price_id,
        productId,
        projectId,
        userId: user.id
      });
      
      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error initiating checkout:', error);
      throw error;
    }
  };
  
  // Apply an agency pack (10-pack) to a specific project
  const applyAgencyPackToProject = async (projectId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await apiApplyPack(user.id, projectId);
      
      if (success) {
        // Refresh purchases after update
        await fetchPurchases();
      }
      
      return success;
    } catch (error) {
      console.error('Error applying agency pack:', error);
      return false;
    }
  };
  
  // Function to manually refresh purchases (useful after successful purchase)
  const refreshPurchases = async () => {
    await fetchPurchases();
  };

  // Add state for credit balance
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loadingCreditBalance, setLoadingCreditBalance] = useState<boolean>(true);

  // Fetch user's credit balance
  const fetchCreditBalance = async () => {
    if (!user) return;
    
    setLoadingCreditBalance(true);
    try {
      const result = await getCreditBalance(user.id);
      setCreditBalance(result.creditBalance);
      setCustomerId(result.customerId || null);
    } catch (error) {
      console.error('Error fetching credit balance:', error);
    } finally {
      setLoadingCreditBalance(false);
    }
  };

  // Apply a credit to a project
  const applyCreditToProject = async (projectId: string): Promise<{success: boolean; message?: string}> => {
    if (!user || !customerId) return { success: false, message: 'User not logged in or no customer ID' };
    
    try {
      const result = await applyCredit(customerId, projectId);
      
      if (result.success) {
        // Update credit balance
        if (result.creditBalance !== undefined) {
          setCreditBalance(result.creditBalance);
        }
        
        // Refresh unlocked status
        setUnlockedProjects(prev => ({
          ...prev,
          [projectId]: true
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error applying credit:', error);
      return { success: false, message: 'Error applying credit' };
    }
  };

  // Function to manually refresh credit balance
  const refreshCreditBalance = async () => {
    await fetchCreditBalance();
  };
  
  // Initialize credit balance when user changes
  useEffect(() => {
    if (user) {
      fetchCreditBalance();
    }
  }, [user]);
  
  return (
    <PaymentContext.Provider
      value={{
        purchases,
        loadingPurchases,
        products,
        loadingProducts,
        docTypes,
        loadingDocTypes,
        creditBalance,
        customerId,
        loadingCreditBalance,
        checkDocumentAccess,
        getPreviewPercentage,
        initiateCheckout,
        applyAgencyPackToProject,
        refreshPurchases,
        applyCreditToProject,
        refreshCreditBalance,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

// Hook to use the payment context
export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}; 