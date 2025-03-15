/*
  # Disable Email Confirmation Requirements

  1. Changes
    - Sets default value for email_confirmed_at to now() for new users
    - Updates existing users to have confirmed emails
    - Ensures smooth authentication flow without email confirmation

  2. Security
    - Maintains secure authentication while removing confirmation step
    - Users can still verify their email later if needed
*/

-- Update auth configuration to disable email confirmation
ALTER TABLE auth.users
ALTER COLUMN email_confirmed_at
SET DEFAULT now();

-- Ensure existing users are confirmed
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- Ensure the handle_new_user function exists and is up to date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a stripe_customers record for the new user
  INSERT INTO public.stripe_customers (
    user_id,
    stripe_customer_id,
    purchase_history
  )
  VALUES (
    NEW.id,
    NEW.email || '_' || NEW.id,  -- Temporary ID until Stripe customer is created
    '[]'::jsonb
  );
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();