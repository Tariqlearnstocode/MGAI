/*
  # Document Types Table

  1. New Table
    - `document_types`
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)
      - `prompt_template` (text)
      - `required_info` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on the table
    - Add policies for admin users to manage document types
    - Allow all authenticated users to read document types
*/

-- Just to make this empty so it doesn't conflict
-- The table was already created by the previous migration

-- Create document_types table
CREATE TABLE IF NOT EXISTS document_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  prompt_template text NOT NULL,
  required_info jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

-- Create policies safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'document_types' AND policyname = 'Anyone can read document types'
    ) THEN
        EXECUTE 'CREATE POLICY "Anyone can read document types"
          ON document_types
          FOR SELECT
          TO authenticated
          USING (true)';
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'document_types' AND policyname = 'Only admins can modify document types'
    ) THEN
        EXECUTE 'CREATE POLICY "Only admins can modify document types"
          ON document_types
          USING (auth.jwt() ->> ''role'' = ''admin'')
          WITH CHECK (auth.jwt() ->> ''role'' = ''admin'')';
    END IF;
END $$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger 
DROP TRIGGER IF EXISTS document_types_updated_at ON document_types;
CREATE TRIGGER document_types_updated_at
  BEFORE UPDATE ON document_types
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert initial document types from code
-- This will be handled by a seed script or application startup code 