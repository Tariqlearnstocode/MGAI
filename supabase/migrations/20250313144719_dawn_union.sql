/*
  # Add status column to projects table

  1. Changes
    - Add `status` column to `projects` table
      - Type: text
      - Default: 'draft'
      - Values: 'draft' or 'completed'
      - Not nullable

  2. Notes
    - No changes to RLS policies needed as existing policies cover all columns
    - Status tracks overall project completion state
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'status'
  ) THEN
    ALTER TABLE projects ADD COLUMN status text NOT NULL DEFAULT 'draft';
  END IF;
END $$;