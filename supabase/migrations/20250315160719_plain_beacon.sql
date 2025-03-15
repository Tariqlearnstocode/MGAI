/*
  # Add Stripe Customer Creation on Signup

  1. New Function
    - Creates a function to handle new user registration
    - Automatically creates a Stripe customer record
    - Links the Stripe customer ID with the user

  2. Changes
    - Adds trigger to automatically create Stripe customer records
    - Uses email + user ID as temporary customer ID until first purchase
    - Ensures every new user gets a stripe_customers record

  3. Security
    - Function runs with security definer permissions
    - Only accessible through trigger
*/

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a stripe_customers record for the new user
  -- Using email + user ID as a temporary customer ID
  -- This will be replaced with real Stripe customer ID on first interaction
  INSERT INTO public.stripe_customers (
    user_id,
    stripe_customer_id,
    purchase_history
  )
  VALUES (
    NEW.id,
    NEW.email || '_' || NEW.id,
    '[]'::jsonb
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to run on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();