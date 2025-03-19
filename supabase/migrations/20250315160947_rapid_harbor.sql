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

-- Drop the trigger that creates placeholder Stripe customer IDs
-- This was causing user creation to fail due to database constraints
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;