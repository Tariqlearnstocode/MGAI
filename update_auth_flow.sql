-- 1. First, make stripe_customer_id nullable to allow for a two-step process
ALTER TABLE public.stripe_customers 
  ALTER COLUMN stripe_customer_id DROP NOT NULL;

-- 2. Drop all existing auth triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Drop any conflicting functions
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Create new function to insert into stripe_customers instead of profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert directly into stripe_customers with a NULL stripe_customer_id
  -- The actual Stripe customer ID will be set by the API endpoint
  INSERT INTO public.stripe_customers (
    user_id,
    stripe_customer_id,
    purchase_history
  )
  VALUES (
    NEW.id,
    NULL,  -- Will be updated by the API
    '[]'::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a new trigger for user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Add a flag to identify which users need a Stripe customer
ALTER TABLE public.stripe_customers 
  ADD COLUMN IF NOT EXISTS needs_stripe_customer BOOLEAN DEFAULT TRUE;

-- 7. List all triggers on auth.users after our changes
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass::oid; 