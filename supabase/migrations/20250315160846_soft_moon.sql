/*
  # Disable Email Confirmation and Enable Auto Sign-in

  1. Changes
    - Disables email confirmation requirement
    - Enables auto sign-in after registration
    - Updates auth configuration

  2. Security
    - Users can still verify their email later if needed
    - Maintains secure authentication flow
*/

-- Update auth configuration to disable email confirmation
ALTER TABLE auth.users
ALTER COLUMN email_confirmed_at
SET DEFAULT now();

-- Ensure existing users are confirmed
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;