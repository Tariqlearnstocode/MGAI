/*
  # Stripe Integration Setup

  1. New Tables
    - `products` table for storing available products/plans
    - `stripe_customers` table for storing customer data and purchase history

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users and service role
    - Ensure proper data access controls

  3. Data
    - Insert default product offerings
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
  DROP POLICY IF EXISTS "Users can read own stripe customer data" ON public.stripe_customers;
  DROP POLICY IF EXISTS "Service role can manage all stripe customer data" ON public.stripe_customers;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create or update products table
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  features jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create or update stripe_customers table
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  purchase_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read own stripe customer data"
  ON public.stripe_customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all stripe customer data"
  ON public.stripe_customers
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create triggers for updated_at
DO $$
BEGIN
  CREATE TRIGGER handle_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER handle_stripe_customers_updated_at
    BEFORE UPDATE ON public.stripe_customers
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Insert default products
INSERT INTO public.products (id, name, description, price, features) 
VALUES 
  ('single_plan', 'Single Marketing Plan', 'A standalone document for users who only need a core marketing plan', 1999, '["Complete marketing plan document", "Export to PDF & Word", "One-time payment"]'::jsonb),
  ('complete_guide', 'Complete Marketing Guide', 'A complete set of marketing documents for one business/project', 3999, '["Full marketing strategy", "Customer acquisition plan", "Brand guidelines", "Pricing strategy", "Sales process", "Export to PDF & Word"]'::jsonb),
  ('agency_pack', 'Marketing Guide (10-Pack)', '10 full kits that can be used for different businesses/projects', 10000, '["10 complete marketing guides", "Ideal for agencies", "Manage multiple brands", "Export to PDF & Word", "Bulk export"]'::jsonb)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features;