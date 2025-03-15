/*
  # Set up Stripe Integration Schema

  1. New Tables
    - `products` - Store product information
    - `stripe_customers` - Store customer payment info
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Create products table if not exists
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  features jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Anyone can read products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

-- Create stripe_customers table if not exists
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  purchase_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create policies
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
CREATE TRIGGER handle_stripe_customers_updated_at
  BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

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