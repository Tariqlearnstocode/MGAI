/*
  # Add required_info column to documents table

  1. Changes
    - Add `required_info` column to `documents` table
      - Uses JSONB type to store:
        - questions: Array of questions needed for generation
        - answers: Object containing answers to questions
    - Column is nullable since not all documents need additional info

  2. Notes
    - Uses JSONB for flexible data structure
    - No changes to RLS policies needed as existing policies cover all columns
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'required_info'
  ) THEN
    ALTER TABLE documents ADD COLUMN required_info JSONB;
  END IF;
END $$;