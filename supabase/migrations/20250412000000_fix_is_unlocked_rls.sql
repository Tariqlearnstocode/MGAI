-- First, make sure the column exists
ALTER TABLE IF EXISTS public.projects 
ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT FALSE;

-- Drop existing RLS policies for the projects table that might be restrictive
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.projects;

-- Create a new policy that explicitly includes is_unlocked in the SELECT permissions
CREATE POLICY "Enable full read access for authenticated users" 
ON public.projects
FOR SELECT
TO authenticated
USING (true);

-- If you need to debug, you can verify the columns are accessible
COMMENT ON COLUMN public.projects.is_unlocked IS 'Flag indicating if a project has been unlocked with credits';

-- Re-enable RLS on the table if it might have been disabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Grant explicit permissions on the is_unlocked column
GRANT SELECT(is_unlocked) ON public.projects TO authenticated; 