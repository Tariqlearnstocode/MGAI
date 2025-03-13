/*
  # Fix RLS policies for projects table

  1. Security
    - Enable RLS on projects table if not already enabled
    - Add policies for authenticated users to:
      - Create their own projects
      - Read their own projects
      - Update their own projects
      - Delete their own projects
    
  Note: Uses DO blocks to check for existing policies before creating
*/

-- Enable RLS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'projects' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'projects' 
    AND policyname = 'Users can create their own projects'
  ) THEN
    CREATE POLICY "Users can create their own projects"
    ON projects FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'projects' 
    AND policyname = 'Users can view their own projects'
  ) THEN
    CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'projects' 
    AND policyname = 'Users can update their own projects'
  ) THEN
    CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'projects' 
    AND policyname = 'Users can delete their own projects'
  ) THEN
    CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE 
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;