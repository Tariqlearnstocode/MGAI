/*
  # Add Admin Role to User

  1. Purpose
    - Adds admin role to a specific user by email
    - Sets up initial admin access for the application
    - Updates user metadata to include role:admin

  2. Security
    - Only updates specific user(s)
    - Maintains existing security model
    - Uses email as identifier to ensure correct user is updated
*/

-- Update a specific user by email to have admin role
-- Replace 'admin@example.com' with the email of the user you want to make an admin
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('role', 'admin')
    ELSE jsonb_set(raw_user_meta_data, '{role}', '"admin"')
  END
WHERE email = 'admin@example.com';

-- You can add multiple users if needed by adding more conditions
-- For example:
/*
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('role', 'admin')
    ELSE jsonb_set(raw_user_meta_data, '{role}', '"admin"')
  END
WHERE email IN ('admin@example.com', 'another.admin@example.com');
*/ 