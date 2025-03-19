/*
  # Fix User Authentication Triggers

  1. Problem
    - Multiple conflicting triggers with the same name
    - Database error when saving new users
    - Stripe customer creation interfering with basic auth

  2. Solution
    - Drop all existing auth triggers
    - Create a single consolidated trigger that:
      - Creates the profile record (essential)
      - Does NOT create a Stripe customer (will be done via API)
*/

-- Drop all existing auth triggers to clean up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a single function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create the profile record (essential for auth to work)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- We will NOT create a Stripe customer here
  -- Stripe customers will be created via the API after signup
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a single trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
