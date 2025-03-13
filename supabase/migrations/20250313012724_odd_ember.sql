/*
  # Add description field to projects table

  1. Changes
    - Add `description` column to `projects` table
    - Make it required (NOT NULL)
    - Add it after the `business_type` column for logical grouping

  2. Security
    - No changes to RLS policies needed as existing policies cover all columns
*/

ALTER TABLE projects
ADD COLUMN description text NOT NULL;