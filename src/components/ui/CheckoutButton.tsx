import { useState } from 'react';
import { usePayment } from '@/contexts/PaymentContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckoutButtonProps {
  /**
   * The ID of the product to purchase (e.g., 'complete_guide', 'agency_pack', 'bundle')
   */
  productId: string;
  
  /**
   * The ID of the project to associate with this purchase (optional)
   */
  projectId?: string;
  
  /**
   * Text to display on the button
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS classes to apply to the button
   */
  className?: string;
  
  /**
   * Button variant (passed to the underlying Button component)
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  
  /**
   * Button size (passed to the underlying Button component)
   */
  size?: 'default' | 'sm' | 'lg';
  
  /**
   * Whether to show the arrow icon
   */
  showArrow?: boolean;
  
  /**
   * Optional callback function to run after successful checkout initiation
   */
  onCheckoutInitiated?: () => void;
}

/**
 * A reusable button component for initiating Stripe checkout
 */
export function CheckoutButton({
  productId,
  projectId = '',
  children,
  className,
  variant = 'default',
  size = 'default',
  showArrow = true,
  onCheckoutInitiated,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { initiateCheckout } = usePayment();

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      await initiateCheckout(productId, projectId);
      if (onCheckoutInitiated) {
        onCheckoutInitiated();
      }
      // Redirect will happen automatically from initiateCheckout
    } catch (error) {
      console.error('Checkout error:', error);
      setLoading(false);
    }
    // Note: we don't set loading to false in finally block because the page will redirect
  };

  return (
    <Button
      className={cn(className)}
      variant={variant}
      size={size}
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Processing...
        </>
      ) : (
        <>
          {typeof children === 'string' ? (
            <span className="flex items-center justify-center">
              {children}
              {showArrow && <ArrowRight className="ml-2 h-4 w-4" />}
            </span>
          ) : (
            children
          )}
        </>
      )}
    </Button>
  );
} 