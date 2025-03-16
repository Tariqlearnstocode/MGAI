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

-- Create policies
CREATE POLICY "Anyone can read document types"
  ON document_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify document types"
  ON document_types
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

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
