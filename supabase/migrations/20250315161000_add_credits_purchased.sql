-- Add credit tracking columns to the stripe_customers table
ALTER TABLE public.stripe_customers 
ADD COLUMN IF NOT EXISTS credits_purchased INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_balance INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN public.stripe_customers.credits_purchased IS 'Total number of credits ever purchased by the customer';
COMMENT ON COLUMN public.stripe_customers.credits_used IS 'Number of credits consumed by the customer';
COMMENT ON COLUMN public.stripe_customers.credit_balance IS 'Current available credit balance (credits_purchased - credits_used)'; 