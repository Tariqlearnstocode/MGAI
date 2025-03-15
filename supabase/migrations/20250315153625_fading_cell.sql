/*
  # Fix Products Table and Stripe Integration

  1. Changes
    - Drop existing policy if it exists
    - Recreate policy for products table
    - Add purchase_history to stripe_customers

  2. Security
    - Maintain RLS policies
    - Ensure proper access control
*/

-- Drop existing policy if it exists
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policy
CREATE POLICY "Anyone can read products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure stripe_customers has purchase_history
DO $$ 
BEGIN
  ALTER TABLE public.stripe_customers 
    ADD COLUMN IF NOT EXISTS purchase_history jsonb DEFAULT '[]'::jsonb;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;