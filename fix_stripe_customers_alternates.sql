-- Try different paths to extract customer data from webhooks

-- Attempt 1: Standard path for 'object'->metadata->userId
WITH customer_data AS (
  SELECT 
    we.id,
    we.type,
    we.data->'object'->'metadata'->>'userId' as user_id,
    we.data->'object'->>'id' as stripe_customer_id
  FROM 
    public.stripe_webhook_events we
  WHERE 
    we.type = 'customer.created'
    AND we.data->'object'->'metadata'->>'userId' IS NOT NULL
    AND we.data->'object'->>'id' IS NOT NULL
)
UPDATE public.stripe_customers sc
SET 
  stripe_customer_id = cd.stripe_customer_id,
  needs_stripe_customer = FALSE,
  updated_at = NOW()
FROM customer_data cd
WHERE sc.user_id::text = cd.user_id
AND (sc.stripe_customer_id IS NULL OR sc.needs_stripe_customer = TRUE);

-- Attempt 2: Alternative path for 'data'->'object'->metadata->userId
WITH customer_data AS (
  SELECT 
    we.id,
    we.type,
    we.data->'data'->'object'->'metadata'->>'userId' as user_id,
    we.data->'data'->'object'->>'id' as stripe_customer_id
  FROM 
    public.stripe_webhook_events we
  WHERE 
    we.type = 'customer.created'
    AND we.data->'data'->'object'->'metadata'->>'userId' IS NOT NULL
    AND we.data->'data'->'object'->>'id' IS NOT NULL
)
UPDATE public.stripe_customers sc
SET 
  stripe_customer_id = cd.stripe_customer_id,
  needs_stripe_customer = FALSE,
  updated_at = NOW()
FROM customer_data cd
WHERE sc.user_id::text = cd.user_id
AND (sc.stripe_customer_id IS NULL OR sc.needs_stripe_customer = TRUE);

-- Look at the full data structure of a webhook to understand the correct path
SELECT 
  id, 
  type, 
  jsonb_pretty(data) AS pretty_data
FROM 
  public.stripe_webhook_events
WHERE 
  type = 'customer.created'
ORDER BY created_at DESC
LIMIT 1;

-- Create a view to help diagnose webhook data structure
CREATE OR REPLACE VIEW webhook_data_paths AS
SELECT
  id,
  type,
  created_at,
  data->'object'->>'id' AS object_id,
  data->'data'->'object'->>'id' AS data_object_id,
  data->'object'->'metadata'->>'userId' AS object_userId,
  data->'data'->'object'->'metadata'->>'userId' AS data_object_userId,
  data ? 'object' AS has_object_key,
  data ? 'data' AS has_data_key,
  (data->'object') ? 'metadata' AS object_has_metadata,
  (data->'data') ? 'object' AS data_has_object
FROM
  public.stripe_webhook_events
WHERE
  type = 'customer.created'
ORDER BY
  created_at DESC;

-- Query the diagnostic view
SELECT * FROM webhook_data_paths LIMIT 5;

-- For users created through the API, check if their Stripe customer IDs
-- are directly available in the logs or response data
-- This assumes you stored the response from the Stripe API in a log table
-- Adapt this query based on your actual implementation
SELECT 
  we.created_at,
  we.type,
  we.data->'object'->>'id' AS customer_id,
  we.data->'object'->'metadata'->>'userId' AS user_id
FROM 
  public.stripe_webhook_events we
WHERE 
  we.type = 'customer.created'
ORDER BY 
  we.created_at DESC
LIMIT 10;

-- Create a trigger function that processes customer.created webhooks automatically
CREATE OR REPLACE FUNCTION process_stripe_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process customer.created events
  IF NEW.type = 'customer.created' THEN
    -- Update stripe_customers with the customer ID from the webhook
    UPDATE public.stripe_customers
    SET 
      stripe_customer_id = NEW.data->'object'->>'id',
      needs_stripe_customer = FALSE
    WHERE 
      user_id::text = NEW.data->'object'->'metadata'->>'userId'
    AND 
      NEW.data->'object'->>'id' IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that fires when new webhook events are inserted
DROP TRIGGER IF EXISTS auto_process_stripe_webhook ON public.stripe_webhook_events;
CREATE TRIGGER auto_process_stripe_webhook
  AFTER INSERT ON public.stripe_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION process_stripe_webhook(); 