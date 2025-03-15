/*
  # Disable Email Confirmation and Update Auth Settings

  1. Changes
    - Disables email confirmation requirement
    - Updates auth configuration
    - Confirms existing unconfirmed users

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

-- Update auth settings to disable confirmation requirement
UPDATE auth.config
SET value = jsonb_set(
  value,
  '{mailer, validate_email}',
  'false'::jsonb
);