# Admin Portal Implementation

This document explains how the admin portal and document types persistence have been implemented.

## Overview

The admin portal allows administrators to:
1. View all document types
2. Edit document names, descriptions, and prompt templates
3. Save changes persistently to the database

## Architecture

The implementation uses several key components:

### 1. Database Layer
- A `document_types` table in Supabase stores all document types
- Row-level security policies ensure only admins can modify document types
- Triggers maintain the `updated_at` timestamp

### 2. Context API
- `DocumentTypesContext` provides document types throughout the application
- Handles fetching document types from the database
- Seeds the database with default types if none exist
- Provides functions to update document types

### 3. Admin API
- `admin.ts` contains functions for administrative tasks
- `updateDocumentType` function updates document types in the database

### 4. UI Components
- `AdminPage` component provides the interface for managing document types
- Uses password authentication for admin access
- Provides UI for viewing and editing document types

## How It Works

1. When the application loads, `DocumentTypesProvider` fetches document types from the database
2. If the database has no types, it seeds them from the hardcoded `DOCUMENT_TYPES`
3. The admin can access the admin portal at `/app/admin` and enter the password
4. After authentication, they can view and edit document types
5. When changes are saved:
   - The `updateDocumentType` function is called
   - Changes are saved to the database
   - The UI is updated to reflect the changes
6. Document types displayed throughout the application use the database values
   
## Setup

To set up the document_types table in the database:

1. Run migrations: `npx supabase migration up`
2. Start the application to seed the table
3. Access the admin portal at `/app/admin`
4. Use the password "marketingguide2024" to log in

## Security Considerations

In a production environment:
1. Store the admin password as an environment variable
2. Implement proper user role management
3. Secure database access with appropriate RLS policies
4. Add audit logging for document type changes 