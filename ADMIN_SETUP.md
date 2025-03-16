# How to assign admin privileges

## Overview

The application includes an admin portal for managing document types and templates, as well as assigning admin privileges to other users. This guide explains how to set up initial admin access.

## Setting Up Your First Admin User

By default, no users have admin access when you first set up the application. To assign admin privileges to an existing user, you need to run a Supabase SQL migration:

1. Edit the migration file at `supabase/migrations/20250315200000_add_admin_user.sql`
2. Replace `'admin@example.com'` with the email address of the user you want to make an admin
3. Run the migration:

```bash
# Navigate to your project directory
cd path/to/your/project

# Run the migration using the Supabase CLI
supabase migration up

# Or if you're using another method to apply migrations:
# - Apply through the Supabase dashboard UI
# - Run SQL directly in the SQL Editor of the Supabase dashboard
```

## Adding More Admin Users

Once you have at least one admin user, you can use the Admin Portal UI to grant admin privileges to additional users:

1. Log in with your admin account
2. Navigate to the Admin Portal at `/app/admin`
3. Use the "Admin User Management" section to add new admin users by their email addresses

## How Admin Privileges Work

Admin status is stored in the user's metadata in Supabase Auth. Specifically:

- The user role is stored in the `user_metadata` JSON field under the `role` key
- Users with `role: "admin"` have access to the Admin Portal and can manage document types
- The admin check is performed client-side by checking `user?.role === 'admin'`

## Troubleshooting

If you're having trouble assigning admin privileges:

1. Verify that the user account exists in Supabase Auth
2. Check that the email address is correct (it's case-sensitive)
3. Make sure you're applying the migration correctly
4. If using the UI, ensure you're logged in with an existing admin account

## Security Note

Admin privileges grant significant control over the application's content and user management. Only assign admin access to trusted users who require these capabilities for their role.
