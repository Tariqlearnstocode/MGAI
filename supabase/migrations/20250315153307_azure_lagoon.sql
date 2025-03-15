/*
  # Update Stripe Integration for One-time Payments

  1. New Tables
    - `products`
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (integer)
      - `features` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Drop subscription-related columns from stripe_customers
    - Add purchase_history column to stripe_customers

  3. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create products table
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

-- Insert default products
INSERT INTO public.products (id, name, description, price, features) 
VALUES 
  ('single_plan', 'Single Marketing Plan', 'A standalone document for users who only need a core marketing plan', 1999, '["Complete marketing plan document", "Export to PDF & Word", "One-time payment"]'::jsonb),
  ('complete_guide', 'Complete Marketing Guide', 'A complete set of marketing documents for one business/project', 3999, '["Full marketing strategy", "Customer acquisition plan", "Brand guidelines", "Pricing strategy", "Sales process", "Export to PDF & Word"]'::jsonb),
  ('agency_pack', 'Marketing Guide (10-Pack)', '10 full kits that can be used for different businesses/projects', 10000, '["10 complete marketing guides", "Ideal for agencies", "Manage multiple brands", "Export to PDF & Word", "Bulk export"]'::jsonb);

-- Update stripe_customers table
ALTER TABLE public.stripe_customers 
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS subscription_tier,
  ADD COLUMN IF NOT EXISTS purchase_history jsonb DEFAULT '[]'::jsonb;

-- Create trigger for updated_at
CREATE TRIGGER handle_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();