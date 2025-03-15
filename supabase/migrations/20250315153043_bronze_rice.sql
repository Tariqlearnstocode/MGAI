/*
  # Add Stripe Customer Integration

  1. New Tables
    - `stripe_customers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `stripe_customer_id` (text)
      - `subscription_status` (text)
      - `subscription_tier` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `stripe_customers` table
    - Add policies for authenticated users to read their own data
    - Add policies for service role to manage all data
*/

-- Create the stripe_customers table
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  subscription_status text NOT NULL DEFAULT 'inactive',
  subscription_tier text,
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

-- Create updated_at trigger
CREATE TRIGGER handle_stripe_customers_updated_at
  BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();