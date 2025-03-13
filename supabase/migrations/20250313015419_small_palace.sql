/*
  # Add progress tracking to documents table

  1. Changes
    - Add `progress` column to `documents` table to track generation status
      - Uses JSONB type to store:
        - percent: Progress percentage (0-100)
        - stage: Current generation stage
        - message: Optional status message

  2. Notes
    - Column is nullable since not all documents will have progress info
    - Uses JSONB for flexible progress data structure
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'progress'
  ) THEN
    ALTER TABLE documents ADD COLUMN progress JSONB;
  END IF;
END $$;