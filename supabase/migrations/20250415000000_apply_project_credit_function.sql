-- Function to apply a credit to unlock a project
CREATE OR REPLACE FUNCTION apply_project_credit(
  user_id UUID,
  project_id UUID
) RETURNS JSONB AS $$
DECLARE
  available_credits INTEGER;
  result JSONB;
BEGIN
  -- Start transaction
  BEGIN
    -- Check if user has available credits
    SELECT (credits_purchased - COALESCE(credits_used, 0)) INTO available_credits
    FROM stripe_customers
    WHERE stripe_customers.user_id = $1;
    
    -- Validate credits and project
    IF available_credits IS NULL THEN
      RETURN json_build_object('success', false, 'message', 'User not found');
    END IF;
    
    IF available_credits < 1 THEN
      RETURN json_build_object('success', false, 'message', 'Insufficient credits');
    END IF;
    
    -- Check if project exists
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = $2) THEN
      RETURN json_build_object('success', false, 'message', 'Project not found');
    END IF;
    
    -- Check if project is already unlocked
    IF EXISTS (SELECT 1 FROM projects WHERE id = $2 AND is_unlocked = TRUE) THEN
      RETURN json_build_object('success', false, 'message', 'Project already unlocked');
    END IF;
    
    -- Update credits_used in stripe_customers
    UPDATE stripe_customers
    SET credits_used = COALESCE(credits_used, 0) + 1
    WHERE stripe_customers.user_id = $1;
    
    -- Unlock the project
    UPDATE projects
    SET is_unlocked = TRUE
    WHERE id = $2;
    
    RETURN json_build_object('success', true, 'message', 'Credit applied successfully');
  EXCEPTION WHEN OTHERS THEN
    -- Handle any errors
    RETURN json_build_object('success', false, 'message', SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION apply_project_credit TO authenticated; 