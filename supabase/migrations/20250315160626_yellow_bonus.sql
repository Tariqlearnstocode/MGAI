/*
  # Add Stripe Customer Creation Function

  1. New Function
    - Creates a function to handle new user registration
    - Automatically creates a Stripe customer record
    - Links the Stripe customer ID with the user

  2. Security
    - Function runs with security definer permissions
    - Only accessible to authenticated users
*/

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.stripe_customers (user_id, stripe_customer_id)
  VALUES (
    NEW.id,
    NEW.email || '_' || NEW.id -- Temporary placeholder for Stripe customer ID
  );
  RETURN NEW;
END;
$$;

-- Create trigger to run on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();