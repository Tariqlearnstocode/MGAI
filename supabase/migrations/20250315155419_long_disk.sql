/*
  # Fix Products Table and Policies

  1. Changes
    - Drop existing policy if exists
    - Recreate products table with proper structure
    - Add new policy for authenticated users
    - Insert default products
  
  2. Security
    - Enable RLS
    - Add policy for read access
*/

-- Drop existing policy if it exists
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Recreate products table if it doesn't exist
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

-- Create new policy
CREATE POLICY "Anyone can read products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert or update default products
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

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  CREATE TRIGGER handle_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;